// Motor de fluxo industrial do módulo CQ.
// Regras de conformidade, geração automática de NC, máquinas de estado e assinatura digital.
// Nenhum dado fictício: tudo é derivado de documentos reais do Firestore.

import { serverTimestamp } from "firebase/firestore";
import { CQService, listDocs } from "./CQService";
import {
  CQ_COLLECTIONS,
  type CQAcaoCorretiva,
  type CQAgendamento,
  type CQCampoModelo,
  type CQExecucao,
  type CQLote,
  type CQModeloPlanilha,
  type CQNaoConformidade,
  type CQRespostaCampo,
  type DisposicaoNC,
  type GravidadeNC,
  type ResultadoExecucao,
  type StatusAcao,
  type StatusAgendamento,
  type StatusLote,
  type StatusNC,
} from "@/types/typesCQ";

export interface CQUsuarioContexto {
  uid: string;
  nome: string;
}

/* ------------------------------------------------------------------ */
/* 1. Avaliação de conformidade                                        */
/* ------------------------------------------------------------------ */

/** Avalia um valor informado contra os limites do campo do modelo. */
export function avaliarCampo(
  campo: CQCampoModelo,
  valor: string | number | boolean | null,
): boolean {
  const vazio = valor === null || valor === undefined || valor === "";

  if (vazio) return !campo.obrigatorio;

  switch (campo.tipo) {
    case "numerico": {
      const num = typeof valor === "number" ? valor : Number(valor);
      if (Number.isNaN(num)) return false;
      const tol = campo.tolerancia ?? 0;
      if (campo.limite_min !== null && campo.limite_min !== undefined && num < campo.limite_min - tol) {
        return false;
      }
      if (campo.limite_max !== null && campo.limite_max !== undefined && num > campo.limite_max + tol) {
        return false;
      }
      return true;
    }
    case "sim_nao": {
      if (campo.valor_esperado === null || campo.valor_esperado === undefined) return true;
      const esperado =
        typeof campo.valor_esperado === "boolean"
          ? campo.valor_esperado
          : String(campo.valor_esperado).toLowerCase() === "sim";
      const atual = typeof valor === "boolean" ? valor : String(valor).toLowerCase() === "sim";
      return atual === esperado;
    }
    case "selecao":
    case "texto": {
      if (campo.valor_esperado === null || campo.valor_esperado === undefined) return true;
      return String(valor).trim().toLowerCase() === String(campo.valor_esperado).trim().toLowerCase();
    }
    default:
      return true;
  }
}

/** Monta as respostas avaliadas a partir do modelo e dos valores informados. */
export function montarRespostas(
  modelo: CQModeloPlanilha,
  valores: Record<string, string | number | boolean | null>,
  extras: Record<string, { observacao?: string; foto_url?: string }> = {},
): CQRespostaCampo[] {
  return (modelo.campos || [])
    .slice()
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((campo) => ({
      campo_id: campo.id,
      label: campo.label,
      tipo: campo.tipo,
      valor: valores[campo.id] ?? null,
      conforme: avaliarCampo(campo, valores[campo.id] ?? null),
      observacao: extras[campo.id]?.observacao,
      foto_url: extras[campo.id]?.foto_url,
    }));
}

export function resultadoDaExecucao(respostas: CQRespostaCampo[]): ResultadoExecucao {
  if (!respostas.length) return "conforme";
  const naoConformes = respostas.filter((r) => !r.conforme).length;
  if (naoConformes === 0) return "conforme";
  if (naoConformes === respostas.length) return "nao_conforme";
  return "parcial";
}

/** Gravidade derivada do desvio percentual em relação ao limite violado. */
export function calcularGravidade(campo: CQCampoModelo | undefined, valor: unknown): GravidadeNC {
  if (!campo || campo.tipo !== "numerico") return "media";
  const num = Number(valor);
  if (Number.isNaN(num)) return "media";

  const min = campo.limite_min ?? null;
  const max = campo.limite_max ?? null;
  let desvio = 0;
  if (min !== null && num < min) desvio = Math.abs((min - num) / (min || 1));
  if (max !== null && num > max) desvio = Math.max(desvio, Math.abs((num - max) / (max || 1)));

  if (desvio >= 0.5) return "critica";
  if (desvio >= 0.2) return "alta";
  if (desvio > 0) return "media";
  return "baixa";
}

/* ------------------------------------------------------------------ */
/* 2. Registro de execução + geração automática de NCs                 */
/* ------------------------------------------------------------------ */

export interface RegistrarExecucaoInput {
  modelo: CQModeloPlanilha & { id: string };
  respostas: CQRespostaCampo[];
  agendamento_id?: string;
  lote_id?: string;
  lote_codigo?: string;
  setor?: string;
  turno?: string;
  iniciado_em?: Date;
  assinar?: boolean;
}

export interface RegistrarExecucaoResultado {
  execucaoId: string;
  resultado: ResultadoExecucao;
  ncsGeradas: string[];
}

/**
 * Grava a execução, gera automaticamente uma NC para cada campo não conforme,
 * atualiza o agendamento e vincula tudo ao lote (rastreabilidade).
 */
export async function registrarExecucao(
  input: RegistrarExecucaoInput,
  usuario: CQUsuarioContexto,
): Promise<RegistrarExecucaoResultado> {
  const { modelo, respostas } = input;

  const iniciadoEm = input.iniciado_em ?? new Date();
  const duracaoSegundos = Math.max(0, Math.round((Date.now() - iniciadoEm.getTime()) / 1000));
  const resultado = resultadoDaExecucao(respostas);
  const totalConformes = respostas.filter((r) => r.conforme).length;

  const execucaoPayload: Partial<CQExecucao> = {
    modelo_id: modelo.id,
    modelo_nome: modelo.nome,
    modelo_versao: modelo.versao ?? 1,
    agendamento_id: input.agendamento_id,
    lote_id: input.lote_id,
    lote_codigo: input.lote_codigo,
    setor: input.setor ?? modelo.setor,
    turno: input.turno,
    respostas,
    resultado,
    total_campos: respostas.length,
    total_conformes: totalConformes,
    duracao_segundos: duracaoSegundos,
    iniciado_em: iniciadoEm as unknown as CQExecucao["iniciado_em"],
    finalizado_em: serverTimestamp() as unknown as CQExecucao["finalizado_em"],
    responsavel_id: usuario.uid,
    responsavel_nome: usuario.nome,
    assinatura: input.assinar
      ? {
          nome: usuario.nome,
          uid: usuario.uid,
          assinado_em: serverTimestamp() as unknown as CQExecucao["iniciado_em"],
        }
      : null,
    sincronizado: true,
  };

  const execucaoId = await CQService.createDocument(
    CQ_COLLECTIONS.execucoes,
    execucaoPayload,
    usuario.uid,
    usuario.nome,
  );

  // NC automática por campo reprovado
  const camposPorId = new Map((modelo.campos || []).map((c) => [c.id, c]));
  const ncsGeradas: string[] = [];

  for (const resposta of respostas.filter((r) => !r.conforme)) {
    const campo = camposPorId.get(resposta.campo_id);
    const ncPayload: Partial<CQNaoConformidade> = {
      descricao: `Desvio em "${resposta.label}" (valor registrado: ${
        resposta.valor === null || resposta.valor === "" ? "não informado" : String(resposta.valor)
      })`,
      gravidade: calcularGravidade(campo, resposta.valor),
      status: "aberta",
      disposicao: "pendente",
      origem: "execucao",
      execucao_id: execucaoId,
      campo_id: resposta.campo_id,
      ponto_controle: campo?.ponto_controle_id || resposta.label,
      modelo_id: modelo.id,
      lote_id: input.lote_id,
      lote_codigo: input.lote_codigo,
      setor: input.setor ?? modelo.setor,
      turno: input.turno,
      responsavel_id: usuario.uid,
      responsavel_nome: usuario.nome,
      fotos: resposta.foto_url ? [resposta.foto_url] : [],
    };

    const ncId = await CQService.createDocument(
      CQ_COLLECTIONS.naoConformidades,
      ncPayload,
      usuario.uid,
      usuario.nome,
    );
    ncsGeradas.push(ncId);
  }

  if (ncsGeradas.length) {
    await CQService.updateDocument(
      CQ_COLLECTIONS.execucoes,
      execucaoId,
      { ncs_geradas: ncsGeradas },
      usuario.uid,
      usuario.nome,
    );
  }

  if (input.agendamento_id) {
    await CQService.updateDocument(
      CQ_COLLECTIONS.agendamentos,
      input.agendamento_id,
      { status: "concluido" satisfies StatusAgendamento, execucao_id: execucaoId },
      usuario.uid,
      usuario.nome,
    );
  }

  if (input.lote_id) {
    const lote = await CQService.getById<CQLote>(CQ_COLLECTIONS.lotes, input.lote_id);
    if (lote) {
      const execucoes = Array.from(new Set([...(lote.execucoes_ids || []), execucaoId]));
      const ncs = Array.from(new Set([...(lote.ncs_ids || []), ...ncsGeradas]));
      const novoStatus: StatusLote =
        ncsGeradas.length && lote.status !== "expedido" ? "bloqueado" : lote.status;
      await CQService.updateDocument(
        CQ_COLLECTIONS.lotes,
        input.lote_id,
        { execucoes_ids: execucoes, ncs_ids: ncs, status: novoStatus },
        usuario.uid,
        usuario.nome,
      );
    }
  }

  return { execucaoId, resultado, ncsGeradas };
}

/** Assinatura digital de uma execução já registrada. */
export async function assinarExecucao(execucaoId: string, usuario: CQUsuarioContexto) {
  await CQService.updateDocument(
    CQ_COLLECTIONS.execucoes,
    execucaoId,
    {
      assinatura: {
        nome: usuario.nome,
        uid: usuario.uid,
        assinado_em: serverTimestamp(),
      },
    },
    usuario.uid,
    usuario.nome,
  );
}

/* ------------------------------------------------------------------ */
/* 3. Máquinas de estado                                               */
/* ------------------------------------------------------------------ */

export const TRANSICOES_NC: Record<StatusNC, StatusNC[]> = {
  aberta: ["em_analise", "fechada"],
  em_analise: ["acao_definida", "aberta"],
  acao_definida: ["verificacao", "em_analise"],
  verificacao: ["fechada", "acao_definida"],
  fechada: [],
};

export const TRANSICOES_ACAO: Record<StatusAcao, StatusAcao[]> = {
  planejada: ["em_andamento", "cancelada"],
  em_andamento: ["concluida", "cancelada"],
  concluida: ["verificada", "em_andamento"],
  verificada: [],
  cancelada: [],
};

export const TRANSICOES_AGENDAMENTO: Record<StatusAgendamento, StatusAgendamento[]> = {
  agendado: ["em_execucao", "cancelado", "atrasado"],
  em_execucao: ["concluido", "cancelado"],
  atrasado: ["em_execucao", "cancelado"],
  concluido: [],
  cancelado: ["agendado"],
};

export function podeTransicionar<T extends string>(
  mapa: Record<T, T[]>,
  de: T,
  para: T,
): boolean {
  return (mapa[de] || []).includes(para);
}

export async function alterarStatusNC(
  ncId: string,
  novoStatus: StatusNC,
  usuario: CQUsuarioContexto,
  extras: { causa_raiz?: string; disposicao?: DisposicaoNC } = {},
) {
  const nc = await CQService.getById<CQNaoConformidade>(CQ_COLLECTIONS.naoConformidades, ncId);
  if (!nc) throw new Error("Não conformidade não encontrada");
  if (!podeTransicionar(TRANSICOES_NC, nc.status, novoStatus)) {
    throw new Error(`Transição inválida: ${nc.status} → ${novoStatus}`);
  }
  if (novoStatus === "fechada") {
    const acoes = await listDocs<CQAcaoCorretiva>(CQ_COLLECTIONS.acoesCorretivas, {
      filtros: { nc_id: ncId },
      ordenarPor: "criado_em",
    });
    const pendentes = acoes.filter((a) => a.status !== "verificada" && a.status !== "cancelada");
    if (pendentes.length) {
      throw new Error("Existem ações corretivas pendentes de verificação para esta NC");
    }
  }

  await CQService.updateDocument(
    CQ_COLLECTIONS.naoConformidades,
    ncId,
    {
      status: novoStatus,
      ...(extras.causa_raiz !== undefined ? { causa_raiz: extras.causa_raiz } : {}),
      ...(extras.disposicao ? { disposicao: extras.disposicao } : {}),
      ...(novoStatus === "fechada" ? { fechada_em: serverTimestamp() } : {}),
    },
    usuario.uid,
    usuario.nome,
  );
}

export async function alterarStatusAcao(
  acaoId: string,
  novoStatus: StatusAcao,
  usuario: CQUsuarioContexto,
  extras: { eficacia?: CQAcaoCorretiva["eficacia"]; observacoes?: string } = {},
) {
  const acao = await CQService.getById<CQAcaoCorretiva>(CQ_COLLECTIONS.acoesCorretivas, acaoId);
  if (!acao) throw new Error("Ação corretiva não encontrada");
  if (!podeTransicionar(TRANSICOES_ACAO, acao.status, novoStatus)) {
    throw new Error(`Transição inválida: ${acao.status} → ${novoStatus}`);
  }

  await CQService.updateDocument(
    CQ_COLLECTIONS.acoesCorretivas,
    acaoId,
    {
      status: novoStatus,
      ...(extras.observacoes !== undefined ? { observacoes: extras.observacoes } : {}),
      ...(novoStatus === "concluida" ? { concluida_em: serverTimestamp() } : {}),
      ...(novoStatus === "verificada"
        ? {
            verificado_por: usuario.nome,
            verificado_em: serverTimestamp(),
            eficacia: extras.eficacia ?? "eficaz",
          }
        : {}),
    },
    usuario.uid,
    usuario.nome,
  );
}

export async function alterarStatusAgendamento(
  agendamentoId: string,
  novoStatus: StatusAgendamento,
  usuario: CQUsuarioContexto,
) {
  const ag = await CQService.getById<CQAgendamento>(CQ_COLLECTIONS.agendamentos, agendamentoId);
  if (!ag) throw new Error("Agendamento não encontrado");
  if (!podeTransicionar(TRANSICOES_AGENDAMENTO, ag.status, novoStatus)) {
    throw new Error(`Transição inválida: ${ag.status} → ${novoStatus}`);
  }
  await CQService.updateDocument(
    CQ_COLLECTIONS.agendamentos,
    agendamentoId,
    { status: novoStatus },
    usuario.uid,
    usuario.nome,
  );
}

/** Marca como atrasados os agendamentos vencidos ainda não executados. */
export async function marcarAgendamentosAtrasados(usuario: CQUsuarioContexto) {
  const agendamentos = await listDocs<CQAgendamento>(CQ_COLLECTIONS.agendamentos, {
    filtros: { status: "agendado" },
    ordenarPor: "data_prevista",
    direcao: "asc",
  });
  const agora = Date.now();
  const vencidos = agendamentos.filter((a) => {
    const d = a.data_prevista as unknown as { toDate?: () => Date } | Date | null;
    const data = d instanceof Date ? d : d?.toDate?.();
    return data ? data.getTime() < agora : false;
  });
  if (!vencidos.length) return 0;
  await CQService.batchUpdate(
    CQ_COLLECTIONS.agendamentos,
    vencidos.map((a) => a.id),
    { status: "atrasado" },
    usuario.uid,
    usuario.nome,
  );
  return vencidos.length;
}

/* ------------------------------------------------------------------ */
/* 4. Lote / disposição                                                */
/* ------------------------------------------------------------------ */

export async function alterarStatusLote(
  loteId: string,
  novoStatus: StatusLote,
  usuario: CQUsuarioContexto,
  motivoRecall?: string,
) {
  const extras =
    novoStatus === "em_recall"
      ? {
          recall: {
            motivo: motivoRecall || "Não informado",
            aberto_por: usuario.nome,
            aberto_em: serverTimestamp(),
          },
        }
      : {};
  await CQService.updateDocument(
    CQ_COLLECTIONS.lotes,
    loteId,
    { status: novoStatus, ...extras },
    usuario.uid,
    usuario.nome,
  );
}

/** Árvore de rastreabilidade real de um lote (execuções + NCs + ações). */
export async function rastrearLote(loteId: string) {
  const lote = await CQService.getById<CQLote>(CQ_COLLECTIONS.lotes, loteId);
  if (!lote) return null;

  const [execucoes, ncs] = await Promise.all([
    listDocs<CQExecucao>(CQ_COLLECTIONS.execucoes, {
      filtros: { lote_id: loteId },
      ordenarPor: "criado_em",
    }),
    listDocs<CQNaoConformidade>(CQ_COLLECTIONS.naoConformidades, {
      filtros: { lote_id: loteId },
      ordenarPor: "criado_em",
    }),
  ]);

  const acoes = (
    await Promise.all(
      ncs.map((nc) =>
        listDocs<CQAcaoCorretiva>(CQ_COLLECTIONS.acoesCorretivas, {
          filtros: { nc_id: nc.id },
          ordenarPor: "criado_em",
        }).catch(() => []),
      ),
    )
  ).flat();

  return { lote, execucoes, ncs, acoes };
}
