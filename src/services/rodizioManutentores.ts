/**
 * Serviço de Rodízio Inteligente de Manutentores
 * Distribui tarefas equilibradamente entre manutentores da mesma função
 * com base na menor carga, evitando repetição consecutiva
 */

import { collection, query, where, getDocs, Timestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Manutentor, TarefaManutencao } from "@/types/typesManutencaoPreventiva";

export interface ManutentorComCarga extends Manutentor {
  cargaAtual: number;
  tarefasPendentes: number;
  tarefasConcluidas: number;
  ultimoTipoTarefa?: string;
  motivoSelecao?: string;
  nivelCarga: "baixa" | "media" | "alta";
}

export interface ResultadoSelecao {
  manutentor: Manutentor | null;
  motivo: string;
  alternativas?: ManutentorComCarga[];
}

/**
 * Determina o nível de carga visual
 */
export function getNivelCarga(tarefasPendentes: number): "baixa" | "media" | "alta" {
  if (tarefasPendentes <= 3) return "baixa";
  if (tarefasPendentes <= 6) return "media";
  return "alta";
}

/**
 * Retorna a cor do indicador de carga
 */
export function getCorCarga(nivel: "baixa" | "media" | "alta"): string {
  switch (nivel) {
    case "baixa": return "bg-green-500";
    case "media": return "bg-yellow-500";
    case "alta": return "bg-red-500";
  }
}

/**
 * Busca manutentores ativos por função
 */
export async function getManutentoresPorFuncao(funcao: string): Promise<Manutentor[]> {
  const q = query(
    collection(db, "manutentores"),
    where("funcao", "==", funcao),
    where("ativo", "==", true)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Manutentor[];
}

/**
 * Busca todos os manutentores ativos
 */
export async function getTodosManutentoresAtivos(): Promise<Manutentor[]> {
  const q = query(
    collection(db, "manutentores"),
    where("ativo", "==", true)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Manutentor[];
}

/**
 * Calcula a carga de trabalho de cada manutentor
 */
export async function calcularCargaManutentores(
  manutentores: Manutentor[],
  diasAnalise: number = 30
): Promise<ManutentorComCarga[]> {
  const resultado: ManutentorComCarga[] = [];
  
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasAnalise);
  
  for (const manutentor of manutentores) {
    // Contar tarefas pendentes
    const qPendentes = query(
      collection(db, "tarefas_manutencao"),
      where("manutentorId", "==", manutentor.id),
      where("status", "in", ["pendente", "em_andamento"])
    );
    const pendentesSnap = await getDocs(qPendentes);
    const tarefasPendentes = pendentesSnap.size;
    
    // Buscar última tarefa do manutentor para verificar tipo
    const tarefasPendentesData = pendentesSnap.docs.map(d => d.data()) as TarefaManutencao[];
    const ultimaTarefa = tarefasPendentesData.sort((a, b) => {
      const dataA = a.dataHoraAgendada ? new Date(a.dataHoraAgendada).getTime() : 0;
      const dataB = b.dataHoraAgendada ? new Date(b.dataHoraAgendada).getTime() : 0;
      return dataB - dataA;
    })[0];
    
    // Contar tarefas concluídas no período
    const qConcluidas = query(
      collection(db, "tarefas_manutencao"),
      where("manutentorId", "==", manutentor.id),
      where("status", "==", "concluida")
    );
    const concluidasSnap = await getDocs(qConcluidas);
    
    const tarefasConcluidas = concluidasSnap.docs.filter(doc => {
      const data = doc.data();
      const dataFim = data.dataFim as Timestamp;
      if (!dataFim) return false;
      return dataFim.toDate() >= dataLimite;
    }).length;
    
    // Calcular carga: pendentes pesam mais que concluídas
    const cargaAtual = (tarefasPendentes * 2) + (tarefasConcluidas * 0.5);
    const nivelCarga = getNivelCarga(tarefasPendentes);
    
    resultado.push({
      ...manutentor,
      cargaAtual,
      tarefasPendentes,
      tarefasConcluidas,
      ultimoTipoTarefa: ultimaTarefa?.tipo,
      nivelCarga
    });
  }
  
  return resultado;
}

/**
 * Gera o motivo de seleção do manutentor
 */
export function gerarMotivoSelecao(
  manutentor: ManutentorComCarga,
  tipoTarefa: string,
  evitouRepeticao: boolean
): string {
  const partes: string[] = [];
  
  // Motivo principal: menor carga
  partes.push(`${manutentor.tarefasPendentes} tarefa(s) pendente(s)`);
  
  // Se evitou repetição
  if (evitouRepeticao) {
    partes.push("evitando repetição consecutiva");
  }
  
  // Função compatível
  partes.push(`função: ${manutentor.funcao}`);
  
  return `Menor carga: ${partes.join(" • ")}`;
}

/**
 * NOVO: Seleciona manutentor por menor carga com anti-repetição
 * Critérios: 1) Função compatível 2) Menor carga 3) Evitar repetição 4) Desempate aleatório
 */
export async function selecionarManutentorPorMenorCarga(
  tipoTarefa: string
): Promise<ResultadoSelecao> {
  // Buscar manutentores da função
  const manutentores = await getManutentoresPorFuncao(tipoTarefa);
  
  if (manutentores.length === 0) {
    return {
      manutentor: null,
      motivo: `Nenhum manutentor ativo encontrado para ${tipoTarefa}`
    };
  }
  
  if (manutentores.length === 1) {
    const manutentorComCarga = (await calcularCargaManutentores([manutentores[0]]))[0];
    return {
      manutentor: manutentores[0],
      motivo: gerarMotivoSelecao(manutentorComCarga, tipoTarefa, false),
      alternativas: [manutentorComCarga]
    };
  }
  
  // Calcular carga de todos
  const manutentoresComCarga = await calcularCargaManutentores(manutentores);
  
  // Ordenar por menor carga
  const ordenados = [...manutentoresComCarga].sort((a, b) => {
    // Primeiro critério: menor número de tarefas pendentes
    if (a.tarefasPendentes !== b.tarefasPendentes) {
      return a.tarefasPendentes - b.tarefasPendentes;
    }
    // Segundo critério: menor carga total
    return a.cargaAtual - b.cargaAtual;
  });
  
  // Verificar anti-repetição: se o primeiro fez o mesmo tipo recentemente, pegar o segundo
  let selecionado = ordenados[0];
  let evitouRepeticao = false;
  
  if (ordenados.length > 1 && selecionado.ultimoTipoTarefa === tipoTarefa) {
    // Verificar se o segundo tem carga semelhante (diferença <= 2 tarefas)
    const segundo = ordenados[1];
    if (segundo.tarefasPendentes - selecionado.tarefasPendentes <= 2) {
      selecionado = segundo;
      evitouRepeticao = true;
    }
  }
  
  // Se houver empate na carga, adicionar aleatoriedade controlada
  const empatados = ordenados.filter(m => m.tarefasPendentes === selecionado.tarefasPendentes);
  if (empatados.length > 1 && !evitouRepeticao) {
    const indiceAleatorio = Math.floor(Math.random() * empatados.length);
    selecionado = empatados[indiceAleatorio];
  }
  
  const motivo = gerarMotivoSelecao(selecionado, tipoTarefa, evitouRepeticao);
  
  // Adicionar motivo ao manutentor selecionado
  selecionado.motivoSelecao = motivo;
  
  return {
    manutentor: selecionado,
    motivo,
    alternativas: ordenados
  };
}

/**
 * Seleciona o próximo manutentor em rodízio circular por função (mantido para compatibilidade)
 */
export async function selecionarManutentorPorRodizio(
  funcao: string
): Promise<Manutentor | null> {
  const resultado = await selecionarManutentorPorMenorCarga(funcao);
  return resultado.manutentor;
}

/**
 * Seleciona próximo manutentor diferente do atual (para reagendamento)
 */
export async function selecionarProximoManutentor(
  funcao: string,
  manutentorAtualId: string
): Promise<Manutentor | null> {
  const manutentores = await getManutentoresPorFuncao(funcao);
  
  if (manutentores.length === 0) {
    return null;
  }
  
  if (manutentores.length === 1) {
    return manutentores[0];
  }
  
  const manutentoresComCarga = await calcularCargaManutentores(manutentores);
  
  // Excluir manutentor atual e ordenar por menor carga
  const outrosManutentores = manutentoresComCarga
    .filter(m => m.id !== manutentorAtualId)
    .sort((a, b) => a.tarefasPendentes - b.tarefasPendentes);
  
  if (outrosManutentores.length === 0) {
    return manutentores[0];
  }
  
  return outrosManutentores[0];
}

/**
 * NOVO: Busca tarefas órfãs (sem manutentor atribuído)
 */
export async function buscarTarefasOrfas(): Promise<TarefaManutencao[]> {
  const qOrfas = query(
    collection(db, "tarefas_manutencao"),
    where("status", "in", ["pendente", "em_andamento"])
  );
  
  const snapshot = await getDocs(qOrfas);
  const todasTarefas = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TarefaManutencao[];
  
  // Filtrar tarefas sem manutentor
  return todasTarefas.filter(t => !t.manutentorId || t.manutentorId.trim() === "");
}

/**
 * NOVO: Atribui manutentor a uma tarefa órfã
 */
export async function atribuirManutentorATarefa(
  tarefaId: string,
  manutentor: Manutentor
): Promise<void> {
  const tarefaRef = doc(db, "tarefas_manutencao", tarefaId);
  await updateDoc(tarefaRef, {
    manutentorId: manutentor.id,
    manutentorNome: manutentor.nome,
    manutentorEmail: manutentor.email || "",
    atualizadoEm: Timestamp.now()
  });
}

/**
 * NOVO: Atribui manutentores a todas as tarefas órfãs
 * Retorna quantidade de tarefas atribuídas e detalhes
 */
export async function atribuirTarefasOrfas(): Promise<{
  totalAtribuidas: number;
  atribuicoes: Array<{
    tarefaId: string;
    tarefaTipo: string;
    manutentorNome: string;
    motivo: string;
  }>;
  erros: string[];
}> {
  const tarefasOrfas = await buscarTarefasOrfas();
  const atribuicoes: Array<{
    tarefaId: string;
    tarefaTipo: string;
    manutentorNome: string;
    motivo: string;
  }> = [];
  const erros: string[] = [];
  
  for (const tarefa of tarefasOrfas) {
    try {
      const resultado = await selecionarManutentorPorMenorCarga(tarefa.tipo);
      
      if (resultado.manutentor) {
        await atribuirManutentorATarefa(tarefa.id, resultado.manutentor);
        atribuicoes.push({
          tarefaId: tarefa.id,
          tarefaTipo: tarefa.tipo,
          manutentorNome: resultado.manutentor.nome,
          motivo: resultado.motivo
        });
      } else {
        erros.push(`Tarefa ${tarefa.descricaoTarefa}: ${resultado.motivo}`);
      }
    } catch (error) {
      erros.push(`Erro ao atribuir tarefa ${tarefa.id}: ${error}`);
    }
  }
  
  return {
    totalAtribuidas: atribuicoes.length,
    atribuicoes,
    erros
  };
}

/**
 * Obtém estatísticas de rodízio para dashboard com motivos de seleção
 */
export async function getEstatisticasRodizio(funcao?: string): Promise<{
  manutentores: ManutentorComCarga[];
  mediaCargas: number;
  desvioCargas: number;
}> {
  let manutentores: Manutentor[];
  
  if (funcao) {
    manutentores = await getManutentoresPorFuncao(funcao);
  } else {
    manutentores = await getTodosManutentoresAtivos();
  }
  
  const manutentoresComCarga = await calcularCargaManutentores(manutentores);
  
  const cargas = manutentoresComCarga.map(m => m.cargaAtual);
  const mediaCargas = cargas.length > 0 
    ? cargas.reduce((a, b) => a + b, 0) / cargas.length 
    : 0;
  
  const variancia = cargas.length > 0
    ? cargas.reduce((sum, c) => sum + Math.pow(c - mediaCargas, 2), 0) / cargas.length
    : 0;
  const desvioCargas = Math.sqrt(variancia);
  
  return {
    manutentores: manutentoresComCarga,
    mediaCargas,
    desvioCargas
  };
}

/**
 * NOVO: Obtém próximos manutentores com motivo de seleção para cada tipo
 */
export async function getProximosManutentoresComMotivo(): Promise<ManutentorComCarga[]> {
  const todosManutentores = await getTodosManutentoresAtivos();
  const manutentoresComCarga = await calcularCargaManutentores(todosManutentores);
  
  // Para cada manutentor, gerar motivo baseado na sua situação
  return manutentoresComCarga.map(m => {
    let motivo = "";
    
    if (m.tarefasPendentes === 0) {
      motivo = "Disponível: sem tarefas pendentes";
    } else if (m.nivelCarga === "baixa") {
      motivo = `Baixa carga: ${m.tarefasPendentes} tarefa(s) pendente(s)`;
    } else if (m.nivelCarga === "media") {
      motivo = `Carga moderada: ${m.tarefasPendentes} tarefa(s) pendente(s)`;
    } else {
      motivo = `⚠️ Alta carga: ${m.tarefasPendentes} tarefa(s) pendente(s)`;
    }
    
    return {
      ...m,
      motivoSelecao: motivo
    };
  }).sort((a, b) => a.tarefasPendentes - b.tarefasPendentes);
}
