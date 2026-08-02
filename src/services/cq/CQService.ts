import { db } from "@/firebase/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  serverTimestamp,
  getDoc,
  orderBy,
  limit as fsLimit,
  onSnapshot,
  writeBatch,
  QueryConstraint,
  DocumentData,
} from "firebase/firestore";
import {
  CQ_COLLECTIONS,
  type CQFiltroPeriodo,
  type CQKPIs,
  type CQExecucao,
  type CQNaoConformidade,
  type CQAcaoCorretiva,
  type CQAgendamento,
  type GravidadeNC,
} from "@/types/typesCQ";

export type StatusAtivo = "sim" | "nao";

export interface BaseCQDocument {
  id?: string;
  ativo: StatusAtivo;
  criado_em: Timestamp;
  atualizado_em: Timestamp;
  criado_por: string;
  versao: number;
  id_original_raiz?: string;
}

export interface CQQueryOptions {
  /** Filtros simples de igualdade: { status: "aberta", setor: "Corte" } */
  filtros?: Record<string, string | number | boolean | undefined | null>;
  /** Campo usado na ordenação (default: atualizado_em) */
  ordenarPor?: string;
  direcao?: "asc" | "desc";
  limite?: number;
  /** Intervalo de datas aplicado sobre `campoData` */
  inicio?: Date;
  fim?: Date;
  campoData?: string;
  /** Inclui documentos inativos (histórico) */
  incluirInativos?: boolean;
}

type WithId<T> = T & { id: string };

/** Converte Timestamp | Date | string em Date de forma segura */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  const maybe = value as { toDate?: () => Date };
  if (typeof maybe?.toDate === "function") {
    try {
      return maybe.toDate();
    } catch {
      return null;
    }
  }
  return null;
}

function buildConstraints(options: CQQueryOptions = {}): QueryConstraint[] {
  const {
    filtros = {},
    ordenarPor = "atualizado_em",
    direcao = "desc",
    limite,
    inicio,
    fim,
    campoData,
    incluirInativos = false,
  } = options;

  const constraints: QueryConstraint[] = [];

  if (!incluirInativos) constraints.push(where("ativo", "==", "sim"));

  Object.entries(filtros).forEach(([campo, valor]) => {
    if (valor === undefined || valor === null || valor === "" || valor === "todos") return;
    constraints.push(where(campo, "==", valor));
  });

  if (campoData && inicio) {
    constraints.push(where(campoData, ">=", Timestamp.fromDate(inicio)));
  }
  if (campoData && fim) {
    constraints.push(where(campoData, "<=", Timestamp.fromDate(fim)));
  }

  // Firestore exige que o primeiro orderBy seja o campo do range
  if (campoData && (inicio || fim)) {
    constraints.push(orderBy(campoData, direcao));
  } else {
    constraints.push(orderBy(ordenarPor, direcao));
  }

  if (limite) constraints.push(fsLimit(limite));

  return constraints;
}

function mapSnapshot<T>(docs: DocumentData[]): WithId<T>[] {
  return docs.map((d) => ({ id: d.id, ...d.data() })) as WithId<T>[];
}

/** Consulta documentos de uma coleção CQ aplicando filtros/ordenação/limite */
export async function listDocs<T = DocumentData>(
  colecao: string,
  options: CQQueryOptions = {},
): Promise<WithId<T>[]> {
  const q = query(collection(db, colecao), ...buildConstraints(options));
  const snapshot = await getDocs(q);
  return mapSnapshot<T>(snapshot.docs);
}


export const CQService = {
  collections: CQ_COLLECTIONS,

  /* ---------------------------------------------------------------- */
  /* Auditoria                                                         */
  /* ---------------------------------------------------------------- */
  async logAudit(data: {
    entidade_id: string;
    usuario_id: string;
    nome_usuario: string;
    tipo_operacao: "CRIAR" | "EDITAR" | "DELETAR";
    valor_antigo?: any;
    valor_novo?: any;
    colecao: string;
  }) {
    try {
      await addDoc(collection(db, CQ_COLLECTIONS.auditoria), {
        ...data,
        data_hora: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao registrar auditoria:", error);
    }
  },

  /* ---------------------------------------------------------------- */
  /* CRUD versionado                                                   */
  /* ---------------------------------------------------------------- */
  async createDocument(colecao: string, data: any, usuarioId: string, nomeUsuario: string) {
    const payload = {
      ...data,
      ativo: "sim",
      criado_em: serverTimestamp(),
      atualizado_em: serverTimestamp(),
      criado_por: usuarioId,
      versao: 1,
    };

    const docRef = await addDoc(collection(db, colecao), payload);
    await updateDoc(docRef, { id_original_raiz: docRef.id });

    await this.logAudit({
      entidade_id: docRef.id,
      usuario_id: usuarioId,
      nome_usuario: nomeUsuario,
      tipo_operacao: "CRIAR",
      valor_novo: payload,
      colecao,
    });

    return docRef.id;
  },

  /** Atualização in-place (para máquinas de estado: status, disposição, etc.) */
  async updateDocument(
    colecao: string,
    id: string,
    data: Record<string, unknown>,
    usuarioId: string,
    nomeUsuario: string,
  ) {
    const docRef = doc(db, colecao, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Documento não encontrado");
    const oldData = snap.data();

    const payload = { ...data, atualizado_em: serverTimestamp() };
    await updateDoc(docRef, payload);

    await this.logAudit({
      entidade_id: id,
      usuario_id: usuarioId,
      nome_usuario: nomeUsuario,
      tipo_operacao: "EDITAR",
      valor_antigo: oldData,
      valor_novo: { ...oldData, ...data },
      colecao,
    });

    return id;
  },

  async createNewVersion(
    colecao: string,
    originalId: string,
    newData: any,
    usuarioId: string,
    nomeUsuario: string,
  ) {
    const originalDocRef = doc(db, colecao, originalId);
    const originalSnap = await getDoc(originalDocRef);

    if (!originalSnap.exists()) throw new Error("Documento original não encontrado");

    const originalData = originalSnap.data();

    await updateDoc(originalDocRef, {
      ativo: "nao",
      atualizado_em: serverTimestamp(),
    });

    const payload = {
      ...originalData,
      ...newData,
      ativo: "sim",
      criado_em: serverTimestamp(),
      atualizado_em: serverTimestamp(),
      versao: (originalData.versao || 1) + 1,
      id_original_raiz: originalData.id_original_raiz || originalId,
    };

    const docRef = await addDoc(collection(db, colecao), payload);

    await this.logAudit({
      entidade_id: docRef.id,
      usuario_id: usuarioId,
      nome_usuario: nomeUsuario,
      tipo_operacao: "EDITAR",
      valor_antigo: originalData,
      valor_novo: payload,
      colecao,
    });

    return docRef.id;
  },

  async deactivateDocument(colecao: string, id: string, usuarioId: string, nomeUsuario: string) {
    const docRef = doc(db, colecao, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const oldData = snap.data();

    await updateDoc(docRef, {
      ativo: "nao",
      atualizado_em: serverTimestamp(),
    });

    await this.logAudit({
      entidade_id: id,
      usuario_id: usuarioId,
      nome_usuario: nomeUsuario,
      tipo_operacao: "DELETAR",
      valor_antigo: oldData,
      valor_novo: { ...oldData, ativo: "nao" },
      colecao,
    });
  },

  /* ---------------------------------------------------------------- */
  /* Leitura                                                           */
  /* ---------------------------------------------------------------- */
  async getById<T = DocumentData>(colecao: string, id: string): Promise<WithId<T> | null> {
    const snap = await getDoc(doc(db, colecao, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as T) };
  },

  async getActiveDocuments(colecao: string) {
    return listDocs(colecao);
  },

  list: listDocs,


  /** Assinatura em tempo real; retorna a função de unsubscribe */
  subscribe<T = DocumentData>(
    colecao: string,
    options: CQQueryOptions,
    onData: (items: WithId<T>[]) => void,
    onError?: (error: Error) => void,
  ) {
    const q = query(collection(db, colecao), ...buildConstraints(options));
    return onSnapshot(
      q,
      (snapshot) => onData(mapSnapshot<T>(snapshot.docs)),
      (error) => {
        console.error(`[CQService] Erro na assinatura de ${colecao}:`, error);
        onError?.(error);
      },
    );
  },

  async getVersionHistory(colecao: string, originalRootId: string) {
    const q = query(
      collection(db, colecao),
      where("id_original_raiz", "==", originalRootId),
      orderBy("versao", "desc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getAuditTrail(entidadeId: string, limite = 100) {
    const q = query(
      collection(db, CQ_COLLECTIONS.auditoria),
      where("entidade_id", "==", entidadeId),
      orderBy("data_hora", "desc"),
      fsLimit(limite),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  /* ---------------------------------------------------------------- */
  /* Operações em lote                                                 */
  /* ---------------------------------------------------------------- */
  async batchUpdate(
    colecao: string,
    ids: string[],
    data: Record<string, unknown>,
    usuarioId: string,
    nomeUsuario: string,
  ) {
    if (!ids.length) return;
    const batch = writeBatch(db);
    ids.forEach((id) => {
      batch.update(doc(db, colecao, id), { ...data, atualizado_em: serverTimestamp() });
    });
    await batch.commit();

    await Promise.all(
      ids.map((id) =>
        this.logAudit({
          entidade_id: id,
          usuario_id: usuarioId,
          nome_usuario: nomeUsuario,
          tipo_operacao: "EDITAR",
          valor_novo: data,
          colecao,
        }),
      ),
    );
  },

  /* ---------------------------------------------------------------- */
  /* KPIs                                                              */
  /* ---------------------------------------------------------------- */
  async getKPIs(filtro: CQFiltroPeriodo = {}): Promise<CQKPIs> {
    const base: CQQueryOptions = {
      filtros: { setor: filtro.setor, turno: filtro.turno, responsavel_id: filtro.responsavel_id },
      inicio: filtro.inicio,
      fim: filtro.fim,
      campoData: filtro.inicio || filtro.fim ? "criado_em" : undefined,
      ordenarPor: "criado_em",
    };

    const [execucoes, ncs, acoes, agendamentos] = await Promise.all([
      listDocs<CQExecucao>(CQ_COLLECTIONS.execucoes, base).catch(() => [] as CQExecucao[]),
      listDocs<CQNaoConformidade>(CQ_COLLECTIONS.naoConformidades, base).catch(
        () => [] as CQNaoConformidade[],
      ),
      listDocs<CQAcaoCorretiva>(CQ_COLLECTIONS.acoesCorretivas, {
        ordenarPor: "criado_em",
      }).catch(() => [] as CQAcaoCorretiva[]),
      listDocs<CQAgendamento>(CQ_COLLECTIONS.agendamentos, {
        ordenarPor: "data_prevista",
      }).catch(() => [] as CQAgendamento[]),
    ]);


    return computeKPIs({ execucoes, ncs, acoes, agendamentos });
  },
};

/* ------------------------------------------------------------------ */
/* Cálculo de KPIs (puro, testável e reutilizável nos hooks)           */
/* ------------------------------------------------------------------ */
export function computeKPIs(input: {
  execucoes: CQExecucao[];
  ncs: CQNaoConformidade[];
  acoes: CQAcaoCorretiva[];
  agendamentos: CQAgendamento[];
}): CQKPIs {
  const { execucoes, ncs, acoes, agendamentos } = input;

  const totalExecucoes = execucoes.length;
  const totalCampos = execucoes.reduce((acc, e) => acc + (e.total_campos || 0), 0);
  const totalConformes = execucoes.reduce((acc, e) => acc + (e.total_conformes || 0), 0);
  const taxaConformidade = totalCampos > 0 ? (totalConformes / totalCampos) * 100 : 0;

  const ncsAbertas = ncs.filter((n) => n.status !== "fechada").length;

  const ncsPorGravidade: Record<GravidadeNC, number> = {
    baixa: 0,
    media: 0,
    alta: 0,
    critica: 0,
  };
  ncs.forEach((n) => {
    if (n.gravidade && ncsPorGravidade[n.gravidade] !== undefined) ncsPorGravidade[n.gravidade] += 1;
  });

  const duracoes = execucoes.map((e) => e.duracao_segundos || 0).filter((d) => d > 0);
  const tempoMedioInspecaoMin =
    duracoes.length > 0 ? duracoes.reduce((a, b) => a + b, 0) / duracoes.length / 60 : 0;

  const concluidos = agendamentos.filter((a) => a.status === "concluido").length;
  const aderenciaCronograma =
    agendamentos.length > 0 ? (concluidos / agendamentos.length) * 100 : 0;

  const acoesConcluidas = acoes.filter((a) => a.concluida_em);
  const mttrAcoesHoras =
    acoesConcluidas.length > 0
      ? acoesConcluidas.reduce((acc, a) => {
          const inicio = toDate(a.criado_em);
          const fim = toDate(a.concluida_em);
          if (!inicio || !fim) return acc;
          return acc + (fim.getTime() - inicio.getTime()) / 36e5;
        }, 0) / acoesConcluidas.length
      : 0;

  const causaMap = new Map<string, number>();
  ncs.forEach((n) => {
    const causa = n.causa_raiz?.trim() || n.ponto_controle?.trim() || "Não classificada";
    causaMap.set(causa, (causaMap.get(causa) || 0) + 1);
  });
  const paretoCausas = Array.from(causaMap.entries())
    .map(([causa, total]) => ({ causa, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const tendenciaMap = new Map<string, { campos: number; conformes: number }>();
  execucoes.forEach((e) => {
    const data = toDate(e.criado_em) || toDate(e.finalizado_em);
    if (!data) return;
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(
      data.getDate(),
    ).padStart(2, "0")}`;
    const atual = tendenciaMap.get(chave) || { campos: 0, conformes: 0 };
    atual.campos += e.total_campos || 0;
    atual.conformes += e.total_conformes || 0;
    tendenciaMap.set(chave, atual);
  });
  const tendencia = Array.from(tendenciaMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, v]) => ({
      periodo,
      conformidade: v.campos > 0 ? (v.conformes / v.campos) * 100 : 0,
    }));

  return {
    totalExecucoes,
    taxaConformidade,
    ncsAbertas,
    ncsPorGravidade,
    tempoMedioInspecaoMin,
    aderenciaCronograma,
    mttrAcoesHoras,
    paretoCausas,
    tendencia,
  };
}
