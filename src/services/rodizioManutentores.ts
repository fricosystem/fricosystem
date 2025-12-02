/**
 * Serviço de Rodízio Automático de Manutentores
 * Distribui tarefas equilibradamente entre manutentores da mesma função
 */

import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Manutentor, TarefaManutencao } from "@/types/typesManutencaoPreventiva";

export interface ManutentorComCarga extends Manutentor {
  cargaAtual: number;
  tarefasPendentes: number;
  tarefasConcluidas: number;
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
 * Calcula a carga de trabalho de cada manutentor
 */
export async function calcularCargaManutentores(
  manutentores: Manutentor[],
  diasAnalise: number = 30
): Promise<ManutentorComCarga[]> {
  const resultado: ManutentorComCarga[] = [];
  
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasAnalise);
  const dataLimiteStr = dataLimite.toISOString().split('T')[0];
  
  for (const manutentor of manutentores) {
    // Contar tarefas pendentes
    const qPendentes = query(
      collection(db, "tarefas_manutencao"),
      where("manutentorId", "==", manutentor.id),
      where("status", "in", ["pendente", "em_andamento"])
    );
    const pendentesSnap = await getDocs(qPendentes);
    const tarefasPendentes = pendentesSnap.size;
    
    // Contar tarefas concluídas no período
    const qConcluidas = query(
      collection(db, "tarefas_manutencao"),
      where("manutentorId", "==", manutentor.id),
      where("status", "==", "concluida")
    );
    const concluidasSnap = await getDocs(qConcluidas);
    
    // Filtrar por data no cliente (Firestore não suporta múltiplos where com orderBy em campos diferentes)
    const tarefasConcluidas = concluidasSnap.docs.filter(doc => {
      const data = doc.data();
      const dataFim = data.dataFim as Timestamp;
      if (!dataFim) return false;
      return dataFim.toDate() >= dataLimite;
    }).length;
    
    // Calcular carga: pendentes pesam mais que concluídas
    const cargaAtual = (tarefasPendentes * 2) + (tarefasConcluidas * 0.5);
    
    resultado.push({
      ...manutentor,
      cargaAtual,
      tarefasPendentes,
      tarefasConcluidas
    });
  }
  
  return resultado;
}

/**
 * Seleciona o próximo manutentor em rodízio circular por função
 * Lógica: Manutentor1 -> Manutentor2 -> Manutentor3 -> volta ao Manutentor1
 */
export async function selecionarManutentorPorRodizio(
  funcao: string
): Promise<Manutentor | null> {
  // Buscar manutentores da função
  const manutentores = await getManutentoresPorFuncao(funcao);
  
  if (manutentores.length === 0) {
    console.warn(`Nenhum manutentor ativo encontrado para a função: ${funcao}`);
    return null;
  }
  
  if (manutentores.length === 1) {
    return manutentores[0];
  }
  
  // Ordenar por ordem de prioridade para manter sequência consistente
  const manutentoresOrdenados = manutentores.sort((a, b) => {
    const prioridadeA = (a as any).ordemPrioridade || 999;
    const prioridadeB = (b as any).ordemPrioridade || 999;
    return prioridadeA - prioridadeB;
  });
  
  // Buscar a última tarefa concluída desta função para saber qual manutentor foi o último
  const qUltimaTarefa = query(
    collection(db, "tarefas_manutencao"),
    where("tipo", "==", funcao),
    where("status", "==", "concluida")
  );
  
  const ultimaTarefaSnap = await getDocs(qUltimaTarefa);
  
  if (ultimaTarefaSnap.empty) {
    // Se não há tarefas concluídas, começa pelo primeiro da lista
    return manutentoresOrdenados[0];
  }
  
  // Encontrar a tarefa mais recente
  const tarefas = ultimaTarefaSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TarefaManutencao[];
  
  const tarefaMaisRecente = tarefas.sort((a, b) => {
    const dataA = a.dataFim ? a.dataFim.toMillis() : 0;
    const dataB = b.dataFim ? b.dataFim.toMillis() : 0;
    return dataB - dataA;
  })[0];
  
  // Encontrar índice do último manutentor
  const indiceUltimoManutentor = manutentoresOrdenados.findIndex(
    m => m.id === tarefaMaisRecente.manutentorId
  );
  
  // Se o manutentor não está mais na lista (foi desativado), começa do primeiro
  if (indiceUltimoManutentor === -1) {
    return manutentoresOrdenados[0];
  }
  
  // Selecionar o próximo na sequência circular
  const proximoIndice = (indiceUltimoManutentor + 1) % manutentoresOrdenados.length;
  return manutentoresOrdenados[proximoIndice];
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
    .sort((a, b) => a.cargaAtual - b.cargaAtual);
  
  if (outrosManutentores.length === 0) {
    // Se só tem um manutentor, retorna ele mesmo
    return manutentores[0];
  }
  
  return outrosManutentores[0];
}

/**
 * Obtém estatísticas de rodízio para dashboard
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
    const snapshot = await getDocs(
      query(collection(db, "manutentores"), where("ativo", "==", true))
    );
    manutentores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Manutentor[];
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
