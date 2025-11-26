import { Timestamp } from "firebase/firestore";

export interface Manutentor {
  id: string;
  nome: string;
  funcao: TipoManutencao;
  ativo: boolean;
  criadoEm: Timestamp;
}

export type TipoManutencao = 
  | "Elétrica" 
  | "Mecânica" 
  | "Hidráulica" 
  | "Pneumática" 
  | "Lubrificação" 
  | "Calibração" 
  | "Inspeção";

export type PeriodoManutencao = 
  | "Diário" 
  | "Semanal" 
  | "Quinzenal" 
  | "Mensal" 
  | "Bimestral" 
  | "Trimestral" 
  | "Semestral" 
  | "Anual";

export type StatusTarefa = "pendente" | "em_andamento" | "concluida";

export interface TarefaManutencao {
  id: string;
  tipo: TipoManutencao;
  maquinaId: string;
  maquinaNome: string;
  periodo: number; // dias
  periodoLabel: PeriodoManutencao;
  sistema: string;
  subconjunto: string;
  componente: string;
  descricaoTarefa: string;
  manutentorId: string;
  manutentorNome: string;
  tempoEstimado: number; // minutos
  tempoRealizado?: number; // minutos
  ultimaExecucao?: Timestamp;
  proximaExecucao: string; // YYYY-MM-DD
  status: StatusTarefa;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export interface ExecucaoTarefa {
  tarefaId: string;
  tempoRealizado: number;
  observacoes?: string;
  data: Timestamp;
}

export const PERIODOS_DIAS: Record<PeriodoManutencao, number> = {
  "Diário": 1,
  "Semanal": 7,
  "Quinzenal": 15,
  "Mensal": 30,
  "Bimestral": 60,
  "Trimestral": 90,
  "Semestral": 180,
  "Anual": 365
};
