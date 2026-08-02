import { Timestamp } from "firebase/firestore";

export type NivelUrgencia = "critico" | "alto" | "medio" | "baixo";

export interface AlertaManutencao {
  id: string;
  tarefaId: string;
  tarefaNome: string;
  maquinaId: string;
  maquinaNome: string;
  proximaExecucao: string;
  diasRestantes: number;
  urgencia: NivelUrgencia;
  lido: boolean;
  ordemServicoId?: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export interface ConfiguracaoAutomacao {
  id: string;
  ativo: boolean;
  diasAntecedencia: number;
  gerarOSAutomatica: boolean;
  horarioExecucao: string; // formato "HH:mm"
  notificarPorEmail: boolean;
  emailsNotificacao: string[];
  configuracoesPorTipo: Record<string, {
    diasAntecedencia: number;
    ativo: boolean;
  }>;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export interface LogAutomacao {
  id: string;
  tipo: "verificacao" | "geracao_os" | "notificacao" | "erro";
  descricao: string;
  tarefasVerificadas: number;
  osGeradas: number;
  alertasCriados: number;
  erro?: string;
  detalhes?: any;
  criadoEm: Timestamp;
}

export interface EstatisticasAutomacao {
  totalTarefasAutomatizadas: number;
  osGeradasMes: number;
  taxaSucesso: number;
  proximasVerificacoes: Date[];
  tarefasCriticas: number;
  tarefasProximas: number;
}
