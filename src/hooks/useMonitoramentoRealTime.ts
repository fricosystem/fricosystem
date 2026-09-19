import { useState, useEffect } from "react";
import {
  MonitoramentoRealTime,
  monitorarTarefasPendentes,
  monitorarTarefasUrgentes,
  monitorarAlertas,
} from "@/services/monitoramentoRealTime";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";

/**
 * Hook customizado para monitoramento em tempo real de manutenções
 */
export function useMonitoramentoRealTime() {
  const [tarefasPendentes, setTarefasPendentes] = useState<TarefaManutencao[]>([]);
  const [tarefasUrgentes, setTarefasUrgentes] = useState<TarefaManutencao[]>([]);
  const [alertasNaoLidos, setAlertasNaoLidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());

  useEffect(() => {
    const monitor = new MonitoramentoRealTime();

    monitor.iniciarMonitoramentoCompleto({
      onTarefasPendentes: (tarefas) => {
        setTarefasPendentes(tarefas);
        setUltimaAtualizacao(new Date());
        setLoading(false);
      },
      onTarefasUrgentes: (tarefas) => {
        setTarefasUrgentes(tarefas);
        setUltimaAtualizacao(new Date());
      },
      onAlertas: (alertas) => {
        setAlertasNaoLidos(alertas);
        setUltimaAtualizacao(new Date());
      },
    });

    return () => {
      monitor.cleanup();
    };
  }, []);

  /**
   * Calcula estatísticas das tarefas
   */
  const estatisticas = {
    totalPendentes: tarefasPendentes.length,
    totalUrgentes: tarefasUrgentes.length,
    totalAlertas: alertasNaoLidos.length,
    tarefasHoje: tarefasPendentes.filter((t) => {
      const hoje = new Date().toISOString().split("T")[0];
      return t.proximaExecucao === hoje;
    }).length,
    tarefasAtrasadas: tarefasPendentes.filter((t) => {
      const hoje = new Date();
      const dataExecucao = new Date(t.proximaExecucao);
      return dataExecucao < hoje;
    }).length,
  };

  /**
   * Filtra tarefas por período
   */
  const getTarefasPorPeriodo = (dias: number): TarefaManutencao[] => {
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + dias);

    return tarefasPendentes.filter((t) => {
      const dataExecucao = new Date(t.proximaExecucao);
      return dataExecucao >= hoje && dataExecucao <= dataLimite;
    });
  };

  return {
    tarefasPendentes,
    tarefasUrgentes,
    alertasNaoLidos,
    estatisticas,
    loading,
    ultimaAtualizacao,
    getTarefasPorPeriodo,
  };
}
