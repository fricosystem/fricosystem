import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { TarefaManutencaoMaquina, StatusTarefa, PeriodoManutencao } from "@/types/typesManutencaoPreventiva";

export const useTarefasMaquina = (equipamentoId: string) => {
  const [tarefas, setTarefas] = useState<TarefaManutencaoMaquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    periodo: "todos" as PeriodoManutencao | "todos",
    status: "todos" as StatusTarefa | "todos",
    sistema: "todos",
    busca: ""
  });

  // Buscar tarefas em tempo real
  useEffect(() => {
    if (!equipamentoId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "tarefas_manutencao"),
      where("maquinaId", "==", equipamentoId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          criadoEm: docData.criadoEm as Timestamp,
          atualizadoEm: docData.atualizadoEm as Timestamp,
          ultimaExecucao: docData.ultimaExecucao as Timestamp | undefined
        } as TarefaManutencaoMaquina;
      });
      setTarefas(data);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar tarefas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [equipamentoId]);

  // Tarefas filtradas
  const tarefasFiltradas = useMemo(() => {
    let filtered = tarefas;

    if (filtros.periodo !== "todos") {
      filtered = filtered.filter(t => t.periodoLabel === filtros.periodo);
    }

    if (filtros.status !== "todos") {
      filtered = filtered.filter(t => t.status === filtros.status);
    }

    if (filtros.sistema !== "todos") {
      filtered = filtered.filter(t => t.sistema === filtros.sistema);
    }

    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      filtered = filtered.filter(t =>
        t.descricaoTarefa.toLowerCase().includes(busca) ||
        t.componente.toLowerCase().includes(busca) ||
        t.subconjunto.toLowerCase().includes(busca)
      );
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.proximaExecucao).getTime();
      const dateB = new Date(b.proximaExecucao).getTime();
      return dateA - dateB;
    });
  }, [tarefas, filtros]);

  // Estatísticas
  const stats = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const pendentes = tarefas.filter(t => t.status === "pendente");
    const atrasadas = pendentes.filter(t => new Date(t.proximaExecucao) < hoje);
    const hoje30Dias = new Date(hoje);
    hoje30Dias.setDate(hoje30Dias.getDate() + 30);
    const proximosMes = pendentes.filter(t => {
      const data = new Date(t.proximaExecucao);
      return data >= hoje && data <= hoje30Dias;
    });

    return {
      total: tarefas.length,
      pendentes: pendentes.length,
      emAndamento: tarefas.filter(t => t.status === "em_andamento").length,
      concluidas: tarefas.filter(t => t.status === "concluida").length,
      canceladas: tarefas.filter(t => t.status === "cancelado").length,
      atrasadas: atrasadas.length,
      proximosMes: proximosMes.length
    };
  }, [tarefas]);

  // Tarefas por sistema
  const tarefasPorSistema = useMemo(() => {
    const map = new Map<string, TarefaManutencaoMaquina[]>();
    tarefas.forEach(t => {
      const sistema = t.sistema;
      if (!map.has(sistema)) {
        map.set(sistema, []);
      }
      map.get(sistema)!.push(t);
    });
    return map;
  }, [tarefas]);

  // Tarefas por componente
  const tarefasPorComponente = useMemo(() => {
    const map = new Map<string, TarefaManutencaoMaquina[]>();
    tarefas.forEach(t => {
      const key = `${t.sistema}:${t.componente}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(t);
    });
    return map;
  }, [tarefas]);

  return {
    tarefas: tarefasFiltradas,
    todasTarefas: tarefas,
    loading,
    stats,
    filtros,
    setFiltros,
    tarefasPorSistema,
    tarefasPorComponente
  };
};
