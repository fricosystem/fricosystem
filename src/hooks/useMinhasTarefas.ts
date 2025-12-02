import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { useAuth } from "@/contexts/AuthContext";

export function useMinhasTarefas() {
  const { userData } = useAuth();
  const [tarefas, setTarefas] = useState<TarefaManutencao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.email) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "tarefas_manutencao"),
      where("manutentorEmail", "==", userData.email),
      orderBy("proximaExecucao", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tarefasData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TarefaManutencao[];

        setTarefas(tarefasData);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao buscar tarefas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
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

  const tarefasConcluidas = tarefas.filter((t) => t.status === "concluida");
  const tarefasEmAndamento = tarefas.filter((t) => t.status === "em_andamento");

  return {
    tarefas,
    loading,
    stats: {
      hoje: tarefasHoje.length,
      atrasadas: tarefasAtrasadas.length,
      concluidas: tarefasConcluidas.length,
      emAndamento: tarefasEmAndamento.length,
      disponiveis: tarefasDisponiveis.length,
      total: tarefas.length,
    },
    tarefasHoje,
    tarefasAtrasadas,
    tarefasConcluidas,
    tarefasEmAndamento,
    tarefasDisponiveis,
  };
}
