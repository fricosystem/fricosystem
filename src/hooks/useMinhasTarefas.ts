import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { useAuth } from "@/contexts/AuthContext";
import { HistoricoExecucao } from "@/services/historicoExecucoes";

export function useMinhasTarefas() {
  const { userData } = useAuth();
  const [tarefas, setTarefas] = useState<TarefaManutencao[]>([]);
  const [historicoExecucoes, setHistoricoExecucoes] = useState<HistoricoExecucao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.email) {
      setLoading(false);
      return;
    }

    // Query tarefas do manutentor
    const qTarefas = query(
      collection(db, "tarefas_manutencao"),
      where("manutentorEmail", "==", userData.email)
    );

    // Query histórico de execuções do manutentor
    const qHistorico = query(
      collection(db, "historico_execucoes"),
      where("manutentorEmail", "==", userData.email),
      orderBy("dataExecucao", "desc"),
      limit(100)
    );

    const unsubscribeTarefas = onSnapshot(
      qTarefas,
      (snapshot) => {
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
      },
      (error) => {
        console.error("Erro ao buscar tarefas:", error);
        setLoading(false);
      }
    );

    const unsubscribeHistorico = onSnapshot(
      qHistorico,
      (snapshot) => {
        const historicoData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HistoricoExecucao[];
        setHistoricoExecucoes(historicoData);
      },
      (error) => {
        console.error("Erro ao buscar histórico:", error);
      }
    );

    return () => {
      unsubscribeTarefas();
      unsubscribeHistorico();
    };
  }, [userData?.email]);

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
  };
}
