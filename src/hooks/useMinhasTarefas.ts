import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { useAuth } from "@/contexts/AuthContext";
import { HistoricoExecucao } from "@/services/historicoExecucoes";
import { cacheBatchData, getCachedCollection } from "@/lib/offlineDB";

export function useMinhasTarefas() {
  const { userData } = useAuth();
  const [tarefas, setTarefas] = useState<TarefaManutencao[]>([]);
  const [historicoExecucoes, setHistoricoExecucoes] = useState<HistoricoExecucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Detectar status online/offline
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carregar dados do cache quando offline
  useEffect(() => {
    const loadCachedData = async () => {
      if (!userData?.email) return;
      
      try {
        const cachedTarefas = await getCachedCollection('tarefas_manutencao');
        const cachedHistorico = await getCachedCollection('historico_execucoes');
        
        if (cachedTarefas.length > 0) {
          const filteredTarefas = cachedTarefas.filter(
            (t: any) => t.manutentorEmail === userData.email
          ) as TarefaManutencao[];
          
          filteredTarefas.sort((a, b) => {
            const dateA = a.proximaExecucao || "";
            const dateB = b.proximaExecucao || "";
            return dateA.localeCompare(dateB);
          });
          
          setTarefas(filteredTarefas);
        }
        
        if (cachedHistorico.length > 0) {
          const filteredHistorico = cachedHistorico.filter(
            (h: any) => h.manutentorEmail === userData.email
          ) as HistoricoExecucao[];
          
          filteredHistorico.sort((a, b) => {
            const dateA = a.dataExecucao?.toDate?.()?.getTime() || a.dataExecucao || 0;
            const dateB = b.dataExecucao?.toDate?.()?.getTime() || b.dataExecucao || 0;
            return (dateB as number) - (dateA as number);
          });
          
          setHistoricoExecucoes(filteredHistorico);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar cache:', error);
        setLoading(false);
      }
    };

    if (isOffline) {
      loadCachedData();
    }
  }, [isOffline, userData?.email]);

  useEffect(() => {
    if (!userData?.email) {
      setLoading(false);
      return;
    }

    // Se estiver offline, não tentar conectar ao Firebase
    if (isOffline) {
      return;
    }

    // Query tarefas do manutentor
    const qTarefas = query(
      collection(db, "tarefas_manutencao"),
      where("manutentorEmail", "==", userData.email)
    );

    // Query histórico de execuções do manutentor (sem orderBy para evitar índice composto)
    const qHistorico = query(
      collection(db, "historico_execucoes"),
      where("manutentorEmail", "==", userData.email)
    );

    const unsubscribeTarefas = onSnapshot(
      qTarefas,
      async (snapshot) => {
        const tarefasData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TarefaManutencao[];

        // Ordenar no cliente por proximaExecucao
        tarefasData.sort((a, b) => {
          const dateA = a.proximaExecucao || "";
          const dateB = b.proximaExecucao || "";
          return dateA.localeCompare(dateB);
        });

        setTarefas(tarefasData);
        setLoading(false);

        // Salvar no cache para uso offline
        try {
          await cacheBatchData(
            'tarefas_manutencao',
            tarefasData.map(t => ({ id: t.id, data: t }))
          );
        } catch (error) {
          console.error('Erro ao cachear tarefas:', error);
        }
      },
      (error) => {
        console.error("Erro ao buscar tarefas:", error);
        setLoading(false);
      }
    );

    const unsubscribeHistorico = onSnapshot(
      qHistorico,
      async (snapshot) => {
        const historicoData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HistoricoExecucao[];
        
        // Ordenar no cliente por dataExecucao desc
        historicoData.sort((a, b) => {
          const dateA = a.dataExecucao?.toDate?.()?.getTime() || 0;
          const dateB = b.dataExecucao?.toDate?.()?.getTime() || 0;
          return dateB - dateA;
        });
        
        setHistoricoExecucoes(historicoData);

        // Salvar no cache para uso offline
        try {
          await cacheBatchData(
            'historico_execucoes',
            historicoData.map(h => ({ id: h.id, data: h }))
          );
        } catch (error) {
          console.error('Erro ao cachear histórico:', error);
        }
      },
      (error) => {
        console.error("Erro ao buscar histórico:", error);
      }
    );

    return () => {
      unsubscribeTarefas();
      unsubscribeHistorico();
    };
  }, [userData?.email, isOffline]);

  const agora = new Date();
  const hoje = agora.toISOString().split("T")[0];

  // Tarefas disponíveis: data/hora agendada já passou
  const tarefasDisponiveis = tarefas.filter((t) => {
    if (t.status !== "pendente") return false;
    if (t.dataHoraAgendada) {
      return new Date(t.dataHoraAgendada) <= agora;
    }
    return t.proximaExecucao <= hoje;
  });

  // Tarefas de hoje (agendadas para hoje)
  const tarefasHoje = tarefas.filter((t) => {
    return t.proximaExecucao === hoje && t.status === "pendente";
  });

  // Tarefas atrasadas
  const tarefasAtrasadas = tarefas.filter((t) => {
    return t.proximaExecucao < hoje && t.status === "pendente";
  });

  const tarefasEmAndamento = tarefas.filter((t) => t.status === "em_andamento");

  // Criar mapa de execuções por tarefa
  const execucoesPorTarefa = historicoExecucoes.reduce((acc, exec) => {
    if (exec.tarefaId) {
      acc[exec.tarefaId] = (acc[exec.tarefaId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return {
    tarefas,
    loading,
    stats: {
      hoje: tarefasHoje.length,
      atrasadas: tarefasAtrasadas.length,
      concluidas: historicoExecucoes.length,
      emAndamento: tarefasEmAndamento.length,
      disponiveis: tarefasDisponiveis.length,
      total: tarefas.length,
    },
    tarefasHoje,
    tarefasAtrasadas,
    historicoExecucoes,
    tarefasEmAndamento,
    tarefasDisponiveis,
    execucoesPorTarefa,
  };
}
