import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { Manutentor, TarefaManutencao } from "@/types/typesManutencaoPreventiva";

// Operações para Manutentores
export const addManutentor = async (data: Omit<Manutentor, "id" | "criadoEm">) => {
  try {
    const docRef = await addDoc(collection(db, "manutentores"), {
      ...data,
      criadoEm: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar manutentor:", error);
    throw error;
  }
};

export const updateManutentor = async (id: string, data: Partial<Manutentor>) => {
  try {
    await updateDoc(doc(db, "manutentores", id), data);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar manutentor:", error);
    throw error;
  }
};

export const deleteManutentor = async (id: string) => {
  try {
    await deleteDoc(doc(db, "manutentores", id));
    return true;
  } catch (error) {
    console.error("Erro ao deletar manutentor:", error);
    throw error;
  }
};

// Operações para Tarefas de Manutenção
export const addTarefaManutencao = async (data: Omit<TarefaManutencao, "id" | "criadoEm" | "atualizadoEm">) => {
  try {
    const docRef = await addDoc(collection(db, "tarefas_manutencao"), {
      ...data,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar tarefa:", error);
    throw error;
  }
};

export const updateTarefaManutencao = async (id: string, data: Partial<TarefaManutencao>) => {
  try {
    await updateDoc(doc(db, "tarefas_manutencao", id), {
      ...data,
      atualizadoEm: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    throw error;
  }
};

export const deleteTarefaManutencao = async (id: string) => {
  try {
    await deleteDoc(doc(db, "tarefas_manutencao", id));
    return true;
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error);
    throw error;
  }
};

export const iniciarTarefa = async (tarefaId: string, usuarioEmail: string) => {
  try {
    await updateDoc(doc(db, "tarefas_manutencao", tarefaId), {
      status: "em_andamento",
      dataInicio: serverTimestamp(),
      iniciadoPor: usuarioEmail,
      atualizadoEm: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao iniciar tarefa:", error);
    throw error;
  }
};

export const registrarExecucaoTarefa = async (
  tarefaId: string, 
  tempoRealizado: number, 
  observacoes?: string,
  checklist?: any[],
  materiaisUtilizados?: any[],
  problemasEncontrados?: string,
  requerAcompanhamento?: boolean,
  observacoesAcompanhamento?: string
) => {
  try {
    const hoje = new Date();
    const tarefaRef = doc(db, "tarefas_manutencao", tarefaId);
    
    // Buscar a tarefa para obter o período
    const { getDoc } = await import("firebase/firestore");
    const tarefaDoc = await getDoc(tarefaRef);
    
    if (!tarefaDoc.exists()) {
      throw new Error("Tarefa não encontrada");
    }
    
    const tarefa = tarefaDoc.data() as TarefaManutencao;
    const proximaData = new Date(hoje);
    proximaData.setDate(proximaData.getDate() + tarefa.periodo);
    
    // Realizar baixa automática de estoque se houver materiais
    if (materiaisUtilizados && materiaisUtilizados.length > 0) {
      const { baixarEstoque } = await import("@/services/estoqueService");
      const resultado = await baixarEstoque(
        materiaisUtilizados, 
        tarefa.ordemId, 
        tarefaId
      );
      
      // Alertas de estoque serão tratados pela UI
      if (resultado.alertas.length > 0) {
        console.warn("Alertas de estoque:", resultado.alertas);
      }
    }
    
    await updateDoc(tarefaRef, {
      ultimaExecucao: serverTimestamp(),
      proximaExecucao: proximaData.toISOString().split('T')[0],
      tempoRealizado,
      status: "concluida",
      dataFim: serverTimestamp(),
      checklist,
      materiaisUtilizados,
      problemasEncontrados,
      requerAcompanhamento,
      observacoesAcompanhamento,
      atualizadoEm: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao registrar execução:", error);
    throw error;
  }
};

export const cancelarTarefa = async (tarefaId: string, motivo?: string) => {
  try {
    await updateDoc(doc(db, "tarefas_manutencao", tarefaId), {
      status: "cancelado",
      motivoCancelamento: motivo || "",
      atualizadoEm: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao cancelar tarefa:", error);
    throw error;
  }
};
