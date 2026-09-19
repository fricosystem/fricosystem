import { 
  doc, 
  updateDoc, 
  serverTimestamp,
  Timestamp,
  getDoc
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { addPendingAction, cacheData, generateOfflineId } from "@/lib/offlineDB";
import { toast } from "sonner";

// Helper para criar timestamp offline
const createOfflineTimestamp = () => ({
  _isOfflineTimestamp: true,
  value: Date.now()
});

// Verificar se está online
const isOnline = () => navigator.onLine;

// Iniciar tarefa com suporte offline
export const iniciarTarefaOffline = async (tarefaId: string, usuarioEmail: string): Promise<boolean> => {
  const updateData = {
    status: "em_andamento",
    dataInicio: isOnline() ? serverTimestamp() : createOfflineTimestamp(),
    iniciadoPor: usuarioEmail,
    atualizadoEm: isOnline() ? serverTimestamp() : createOfflineTimestamp()
  };

  if (isOnline()) {
    try {
      await updateDoc(doc(db, "tarefas_manutencao", tarefaId), updateData);
      return true;
    } catch (error) {
      console.error("Erro ao iniciar tarefa:", error);
      throw error;
    }
  } else {
    // Salvar ação para sincronizar depois
    await addPendingAction("tarefas_manutencao", tarefaId, "update", updateData);
    toast.info("Tarefa iniciada offline - será sincronizada quando voltar online");
    return true;
  }
};

// Registrar execução de tarefa com suporte offline
export const registrarExecucaoTarefaOffline = async (
  tarefaId: string,
  tarefa: TarefaManutencao,
  tempoRealizado: number, 
  observacoes?: string,
  checklist?: any[],
  materiaisUtilizados?: any[],
  problemasEncontrados?: string,
  requerAcompanhamento?: boolean,
  observacoesAcompanhamento?: string
): Promise<{ success: boolean; proximaExecucao: string }> => {
  const hoje = new Date();
  
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
  
  // Dados de atualização da tarefa
  const tarefaUpdateData: Record<string, any> = {
    ultimaExecucao: isOnline() ? serverTimestamp() : createOfflineTimestamp(),
    proximaExecucao: proximaExecucaoStr,
    tempoRealizado,
    status: "pendente",
    dataFim: isOnline() ? serverTimestamp() : createOfflineTimestamp(),
    manutentorId: tarefa.manutentorId,
    manutentorNome: tarefa.manutentorNome,
    manutentorEmail: tarefa.manutentorEmail,
    historicoManutentores: tarefa.historicoManutentores || [],
    execucoesAnteriores: (tarefa.execucoesAnteriores || 0) + 1,
    atualizadoEm: isOnline() ? serverTimestamp() : createOfflineTimestamp()
  };
  
  if (novaDataHoraAgendada !== undefined) tarefaUpdateData.dataHoraAgendada = novaDataHoraAgendada;
  if (checklist !== undefined) tarefaUpdateData.checklist = checklist;
  if (materiaisUtilizados !== undefined) tarefaUpdateData.materiaisUtilizados = materiaisUtilizados;
  if (problemasEncontrados !== undefined) tarefaUpdateData.problemasEncontrados = problemasEncontrados;
  if (requerAcompanhamento !== undefined) tarefaUpdateData.requerAcompanhamento = requerAcompanhamento;
  if (observacoesAcompanhamento !== undefined) tarefaUpdateData.observacoesAcompanhamento = observacoesAcompanhamento;

  // Dados do histórico de execução
  const historicoId = generateOfflineId();
  const historicoData = {
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
    dataExecucao: isOnline() ? Timestamp.now() : createOfflineTimestamp(),
    tempoEstimado: tarefa.tempoEstimado,
    tempoRealizado,
    observacoes,
    problemasEncontrados,
    materiaisUtilizados,
    periodo: tarefa.periodo,
    periodoLabel: tarefa.periodoLabel,
    criadoEm: isOnline() ? serverTimestamp() : createOfflineTimestamp()
  };

  if (isOnline()) {
    try {
      // Atualizar tarefa
      await updateDoc(doc(db, "tarefas_manutencao", tarefaId), tarefaUpdateData);
      
      // Registrar histórico
      const { registrarHistoricoExecucao } = await import("@/services/historicoExecucoes");
      await registrarHistoricoExecucao({
        ...historicoData,
        dataExecucao: Timestamp.now()
      } as any);
      
      return { success: true, proximaExecucao: proximaExecucaoStr };
    } catch (error) {
      console.error("Erro ao registrar execução:", error);
      throw error;
    }
  } else {
    // Salvar ações para sincronizar depois
    await addPendingAction("tarefas_manutencao", tarefaId, "update", tarefaUpdateData);
    await addPendingAction("historico_execucoes", historicoId, "create", historicoData);
    
    // Atualizar cache local
    const tarefaAtualizada = { ...tarefa, ...tarefaUpdateData, id: tarefaId };
    await cacheData("tarefas_manutencao", tarefaId, tarefaAtualizada);
    
    toast.info("Execução registrada offline - será sincronizada quando voltar online");
    
    return { success: true, proximaExecucao: proximaExecucaoStr };
  }
};

// Buscar tarefa (do cache se offline)
export const getTarefaOffline = async (tarefaId: string): Promise<TarefaManutencao | null> => {
  if (isOnline()) {
    try {
      const tarefaDoc = await getDoc(doc(db, "tarefas_manutencao", tarefaId));
      if (tarefaDoc.exists()) {
        const tarefa = { id: tarefaDoc.id, ...tarefaDoc.data() } as TarefaManutencao;
        // Atualizar cache
        await cacheData("tarefas_manutencao", tarefaId, tarefa);
        return tarefa;
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar tarefa:", error);
      throw error;
    }
  } else {
    // Buscar do cache
    const { getCachedData } = await import("@/lib/offlineDB");
    return getCachedData("tarefas_manutencao", tarefaId);
  }
};
