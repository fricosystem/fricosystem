/**
 * Serviço de Monitoramento em Tempo Real
 * Centraliza listeners do Firestore para toda a aplicação
 */

import {
  collection,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";

type Listener<T> = (data: T[]) => void;

/**
 * Monitora tarefas pendentes em tempo real
 */
export function monitorarTarefasPendentes(
  callback: Listener<TarefaManutencao>
): Unsubscribe {
  const q = query(
    collection(db, "tarefas_manutencao"),
    where("status", "==", "pendente"),
    orderBy("proximaExecucao", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tarefas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TarefaManutencao[];

      callback(tarefas);
    },
    (error) => {
      console.error("Erro ao monitorar tarefas pendentes:", error);
    }
  );
}

/**
 * Monitora tarefas de uma máquina específica
 */
export function monitorarTarefasMaquina(
  maquinaId: string,
  callback: Listener<TarefaManutencao>
): Unsubscribe {
  const q = query(
    collection(db, "tarefas_manutencao"),
    where("maquinaId", "==", maquinaId),
    orderBy("proximaExecucao", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tarefas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TarefaManutencao[];

      callback(tarefas);
    },
    (error) => {
      console.error("Erro ao monitorar tarefas da máquina:", error);
    }
  );
}

/**
 * Monitora tarefas urgentes (próximos 7 dias)
 */
export function monitorarTarefasUrgentes(
  callback: Listener<TarefaManutencao>
): Unsubscribe {
  const hoje = new Date();
  const daqui7Dias = new Date();
  daqui7Dias.setDate(hoje.getDate() + 7);

  const q = query(
    collection(db, "tarefas_manutencao"),
    where("status", "==", "pendente"),
    where("proximaExecucao", "<=", daqui7Dias.toISOString().split("T")[0]),
    orderBy("proximaExecucao", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tarefas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TarefaManutencao[];

      callback(tarefas);
    },
    (error) => {
      console.error("Erro ao monitorar tarefas urgentes:", error);
    }
  );
}

/**
 * Monitora alertas não lidos em tempo real
 */
export function monitorarAlertas(callback: (alertas: any[]) => void): Unsubscribe {
  const q = query(
    collection(db, "alertas_manutencao"),
    where("lido", "==", false),
    orderBy("criadoEm", "desc"),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const alertas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      callback(alertas);
    },
    (error) => {
      console.error("Erro ao monitorar alertas:", error);
    }
  );
}

/**
 * Monitora ordens de serviço pendentes
 */
export function monitorarOrdensPendentes(
  callback: (ordens: any[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "ordens_servicos"),
    where("status", "in", ["pendente", "em_andamento"]),
    where("geradaAutomaticamente", "==", true),
    orderBy("criadoEm", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const ordens = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      callback(ordens);
    },
    (error) => {
      console.error("Erro ao monitorar ordens:", error);
    }
  );
}

/**
 * Monitora movimentações de estoque recentes
 */
export function monitorarMovimentacoesEstoque(
  callback: (movimentacoes: any[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "movimentacoes_estoque"),
    orderBy("criadoEm", "desc"),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const movimentacoes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      callback(movimentacoes);
    },
    (error) => {
      console.error("Erro ao monitorar movimentações:", error);
    }
  );
}

/**
 * Hook para facilitar uso dos listeners
 * Retorna função de cleanup para desmontar todos os listeners
 */
export class MonitoramentoRealTime {
  private listeners: Unsubscribe[] = [];

  /**
   * Adiciona um listener à lista de monitoramento
   */
  addListener(unsubscribe: Unsubscribe) {
    this.listeners.push(unsubscribe);
  }

  /**
   * Remove todos os listeners ativos
   */
  cleanup() {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners = [];
  }

  /**
   * Inicia monitoramento completo
   */
  iniciarMonitoramentoCompleto(callbacks: {
    onTarefasPendentes?: Listener<TarefaManutencao>;
    onTarefasUrgentes?: Listener<TarefaManutencao>;
    onAlertas?: (alertas: any[]) => void;
    onOrdens?: (ordens: any[]) => void;
    onMovimentacoes?: (movimentacoes: any[]) => void;
  }) {
    if (callbacks.onTarefasPendentes) {
      this.addListener(monitorarTarefasPendentes(callbacks.onTarefasPendentes));
    }

    if (callbacks.onTarefasUrgentes) {
      this.addListener(monitorarTarefasUrgentes(callbacks.onTarefasUrgentes));
    }

    if (callbacks.onAlertas) {
      this.addListener(monitorarAlertas(callbacks.onAlertas));
    }

    if (callbacks.onOrdens) {
      this.addListener(monitorarOrdensPendentes(callbacks.onOrdens));
    }

    if (callbacks.onMovimentacoes) {
      this.addListener(monitorarMovimentacoesEstoque(callbacks.onMovimentacoes));
    }
  }
}
