/**
 * Serviço de Histórico de Execuções
 * Registra todas as execuções de tarefas de manutenção
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  Timestamp,
  limit
} from "firebase/firestore";
import { db } from "@/firebase/firebase";

export interface HistoricoExecucao {
  id: string;
  tarefaId: string;
  tarefaDescricao: string;
  maquinaId: string;
  maquinaNome: string;
  manutentorId: string;
  manutentorNome: string;
  manutentorEmail: string;
  tipo: string;
  sistema?: string;
  componente?: string;
  dataExecucao: Timestamp;
  tempoEstimado: number;
  tempoRealizado: number;
  observacoes?: string;
  problemasEncontrados?: string;
  materiaisUtilizados?: any[];
  periodo: number;
  periodoLabel: string;
  criadoEm: Timestamp;
}

/**
 * Registra uma execução no histórico
 */
export async function registrarHistoricoExecucao(
  dados: Omit<HistoricoExecucao, "id" | "criadoEm">
): Promise<string> {
  const docRef = await addDoc(collection(db, "historico_execucoes"), {
    ...dados,
    criadoEm: serverTimestamp()
  });
  return docRef.id;
}

/**
 * Busca histórico por manutentor
 */
export async function getHistoricoPorManutentor(
  manutentorId: string,
  limitResults: number = 50
): Promise<HistoricoExecucao[]> {
  const q = query(
    collection(db, "historico_execucoes"),
    where("manutentorId", "==", manutentorId),
    orderBy("dataExecucao", "desc"),
    limit(limitResults)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as HistoricoExecucao[];
}

/**
 * Busca histórico por máquina
 */
export async function getHistoricoPorMaquina(
  maquinaId: string,
  limitResults: number = 50
): Promise<HistoricoExecucao[]> {
  const q = query(
    collection(db, "historico_execucoes"),
    where("maquinaId", "==", maquinaId),
    orderBy("dataExecucao", "desc"),
    limit(limitResults)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as HistoricoExecucao[];
}

/**
 * Busca histórico por período
 */
export async function getHistoricoPorPeriodo(
  dataInicio: Date,
  dataFim: Date
): Promise<HistoricoExecucao[]> {
  const q = query(
    collection(db, "historico_execucoes"),
    orderBy("dataExecucao", "desc")
  );
  
  const snapshot = await getDocs(q);
  
  // Filtrar por data no cliente
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as HistoricoExecucao)
    .filter(h => {
      const dataExec = h.dataExecucao.toDate();
      return dataExec >= dataInicio && dataExec <= dataFim;
    });
}

/**
 * Calcula estatísticas de execução
 */
export async function calcularEstatisticasExecucao(
  manutentorId?: string
): Promise<{
  totalExecucoes: number;
  tempoMedioExecucao: number;
  desvioTempoEstimado: number;
  tarefasPorTipo: Record<string, number>;
}> {
  let q;
  if (manutentorId) {
    q = query(
      collection(db, "historico_execucoes"),
      where("manutentorId", "==", manutentorId)
    );
  } else {
    q = query(collection(db, "historico_execucoes"));
  }
  
  const snapshot = await getDocs(q);
  const historicos = snapshot.docs.map(doc => doc.data() as HistoricoExecucao);
  
  const totalExecucoes = historicos.length;
  
  const tempoMedioExecucao = totalExecucoes > 0
    ? historicos.reduce((sum, h) => sum + h.tempoRealizado, 0) / totalExecucoes
    : 0;
  
  // Calcular desvio médio do tempo estimado
  const desvios = historicos
    .filter(h => h.tempoEstimado > 0)
    .map(h => ((h.tempoRealizado - h.tempoEstimado) / h.tempoEstimado) * 100);
  
  const desvioTempoEstimado = desvios.length > 0
    ? desvios.reduce((sum, d) => sum + Math.abs(d), 0) / desvios.length
    : 0;
  
  // Contar por tipo
  const tarefasPorTipo: Record<string, number> = {};
  historicos.forEach(h => {
    tarefasPorTipo[h.tipo] = (tarefasPorTipo[h.tipo] || 0) + 1;
  });
  
  return {
    totalExecucoes,
    tempoMedioExecucao,
    desvioTempoEstimado,
    tarefasPorTipo
  };
}
