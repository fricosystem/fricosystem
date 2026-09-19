import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  serverTimestamp,
  Timestamp,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { Manutentor, TarefaManutencao } from "@/types/typesManutencaoPreventiva";

// Operações para Manutentores
export const addManutentor = async (data: Omit<Manutentor, "id" | "criadoEm">) => {
  try {
    // Verificar se já existe manutentor com este email
    const { query: firestoreQuery, where: firestoreWhere, getDocs } = await import("firebase/firestore");
    const q = firestoreQuery(
      collection(db, "manutentores"),
      firestoreWhere("email", "==", data.email)
    );
    const existingDocs = await getDocs(q);
    
    if (!existingDocs.empty) {
      throw new Error("Já existe um manutentor cadastrado com este email");
    }

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
      execucoesAnteriores: 0,
      historicoManutentores: data.manutentorId ? [data.manutentorId] : [],
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
    const tarefaDoc = await getDoc(tarefaRef);
    
    if (!tarefaDoc.exists()) {
      throw new Error("Tarefa não encontrada");
    }
    
    const tarefa = tarefaDoc.data() as TarefaManutencao;
    
    // Calcular próxima data de execução baseada no período
    const proximaData = new Date(hoje);
    proximaData.setDate(proximaData.getDate() + tarefa.periodo);
    const proximaExecucaoStr = proximaData.toISOString().split('T')[0];
    
    // Calcular dataHoraAgendada mantendo o mesmo horário
    let novaDataHoraAgendada: string | undefined;
    if (tarefa.dataHoraAgendada) {
      const horaOriginal = tarefa.dataHoraAgendada.split('T')[1];
      novaDataHoraAgendada = `${proximaExecucaoStr}T${horaOriginal}`;
    }
    
    // Registrar no histórico de execuções
    try {
      const { registrarHistoricoExecucao } = await import("@/services/historicoExecucoes");
      await registrarHistoricoExecucao({
        tarefaId,
        tarefaDescricao: tarefa.descricaoTarefa,
        maquinaId: tarefa.maquinaId,
        maquinaNome: tarefa.maquinaNome,
        manutentorId: tarefa.manutentorId,
        manutentorNome: tarefa.manutentorNome,
        manutentorEmail: tarefa.manutentorEmail,
        tipo: tarefa.tipo,
        sistema: tarefa.sistema,
        componente: tarefa.componente,
        dataExecucao: Timestamp.now(),
        tempoEstimado: tarefa.tempoEstimado,
        tempoRealizado,
        observacoes,
        problemasEncontrados,
        materiaisUtilizados,
        periodo: tarefa.periodo,
        periodoLabel: tarefa.periodoLabel
      });
    } catch (historicoError) {
      console.error("Erro ao registrar histórico:", historicoError);
    }
    
    // Baixar estoque se houver materiais utilizados
    if (materiaisUtilizados && materiaisUtilizados.length > 0) {
      try {
        const { baixarEstoque } = await import("@/services/estoqueService");
        const resultado = await baixarEstoque(
          materiaisUtilizados, 
          tarefa.ordemId, 
          tarefaId
        );
        
        if (resultado.alertas.length > 0) {
          console.warn("Alertas de estoque:", resultado.alertas);
        }
      } catch (estoqueError) {
        console.error("Erro ao baixar estoque:", estoqueError);
      }
    }
    
    // Determinar próximo manutentor usando rodízio (se configurado)
    let novoManutentorId = tarefa.manutentorId;
    let novoManutentorNome = tarefa.manutentorNome;
    let novoManutentorEmail = tarefa.manutentorEmail;
    
    if (tarefa.selecaoAutomatica) {
      try {
        const { selecionarProximoManutentor } = await import("@/services/rodizioManutentores");
        const proximoManutentor = await selecionarProximoManutentor(
          tarefa.tipo,
          tarefa.manutentorId
        );
        
        if (proximoManutentor) {
          novoManutentorId = proximoManutentor.id;
          novoManutentorNome = proximoManutentor.nome;
          novoManutentorEmail = proximoManutentor.email;
        }
      } catch (rodizioError) {
        console.error("Erro ao selecionar próximo manutentor:", rodizioError);
      }
    }
    
    // Atualizar histórico de manutentores
    const historicoManutentores = tarefa.historicoManutentores || [];
    if (novoManutentorId && !historicoManutentores.includes(novoManutentorId)) {
      historicoManutentores.push(novoManutentorId);
    }
    
    // Atualizar tarefa com reagendamento e novo manutentor
    // Filtrar campos undefined para evitar erros do Firebase
    const updateData: Record<string, any> = {
      ultimaExecucao: serverTimestamp(),
      proximaExecucao: proximaExecucaoStr,
      tempoRealizado,
      status: "pendente", // Volta para pendente para próxima execução
      dataFim: serverTimestamp(),
      manutentorId: novoManutentorId,
      manutentorNome: novoManutentorNome,
      manutentorEmail: novoManutentorEmail,
      historicoManutentores,
      execucoesAnteriores: (tarefa.execucoesAnteriores || 0) + 1,
      atualizadoEm: serverTimestamp()
    };
    
    // Adicionar campos opcionais apenas se não forem undefined
    if (novaDataHoraAgendada !== undefined) updateData.dataHoraAgendada = novaDataHoraAgendada;
    if (checklist !== undefined) updateData.checklist = checklist;
    if (materiaisUtilizados !== undefined) updateData.materiaisUtilizados = materiaisUtilizados;
    if (problemasEncontrados !== undefined) updateData.problemasEncontrados = problemasEncontrados;
    if (requerAcompanhamento !== undefined) updateData.requerAcompanhamento = requerAcompanhamento;
    if (observacoesAcompanhamento !== undefined) updateData.observacoesAcompanhamento = observacoesAcompanhamento;
    
    await updateDoc(tarefaRef, updateData);
    
    return { 
      success: true, 
      proximaExecucao: proximaExecucaoStr,
      proximoManutentor: novoManutentorNome
    };
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

/**
 * Marca tarefa como apenas concluída (sem reagendamento)
 */
export const concluirTarefaSemReagendar = async (
  tarefaId: string, 
  tempoRealizado: number, 
  observacoes?: string
) => {
  try {
    const tarefaRef = doc(db, "tarefas_manutencao", tarefaId);
    const tarefaDoc = await getDoc(tarefaRef);
    
    if (!tarefaDoc.exists()) {
      throw new Error("Tarefa não encontrada");
    }
    
    const tarefa = tarefaDoc.data() as TarefaManutencao;
    
    // Registrar no histórico
    try {
      const { registrarHistoricoExecucao } = await import("@/services/historicoExecucoes");
      await registrarHistoricoExecucao({
        tarefaId,
        tarefaDescricao: tarefa.descricaoTarefa,
        maquinaId: tarefa.maquinaId,
        maquinaNome: tarefa.maquinaNome,
        manutentorId: tarefa.manutentorId,
        manutentorNome: tarefa.manutentorNome,
        manutentorEmail: tarefa.manutentorEmail,
        tipo: tarefa.tipo,
        sistema: tarefa.sistema,
        componente: tarefa.componente,
        dataExecucao: Timestamp.now(),
        tempoEstimado: tarefa.tempoEstimado,
        tempoRealizado,
        observacoes,
        periodo: tarefa.periodo,
        periodoLabel: tarefa.periodoLabel
      });
    } catch (historicoError) {
      console.error("Erro ao registrar histórico:", historicoError);
    }
    
    await updateDoc(tarefaRef, {
      ultimaExecucao: serverTimestamp(),
      tempoRealizado,
      status: "concluida",
      dataFim: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao concluir tarefa:", error);
    throw error;
  }
};
