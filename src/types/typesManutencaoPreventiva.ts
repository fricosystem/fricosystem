import { Timestamp } from "firebase/firestore";

export interface Manutentor {
  id: string;
  usuarioId: string; // referência ao usuário da coleção "usuarios"
  nome: string;
  email: string;
  funcao: TipoManutencao;
  competencias?: string[]; // tipos de manutenção que pode executar
  ordemPrioridade?: number; // ordem de prioridade para rodízio (1, 2, 3...)
  capacidadeDiaria?: number; // máximo de tarefas por dia
  ativo: boolean;
  criadoEm: Timestamp;
}

export type TipoManutencao = string; // Agora é customizável

export type PeriodoManutencao = string; // Agora é customizável

export type StatusTarefa = "pendente" | "em_andamento" | "concluida" | "cancelado";

export interface TarefaManutencao {
  id: string;
  ordemId?: string; // formato OS-YYYYMMDD-XXXX
  setor?: string; // setor da máquina/tarefa
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
  manutentorEmail: string;
  tempoEstimado: number; // minutos
  tempoRealizado?: number; // minutos
  ultimaExecucao?: Timestamp;
  proximaExecucao: string; // YYYY-MM-DD
  dataHoraAgendada?: string; // ISO string completo com data e hora
  status: StatusTarefa;
  dataInicio?: Timestamp;
  dataFim?: Timestamp;
  iniciadoPor?: string;
  checklist?: ChecklistItemTarefa[];
  materiaisUtilizados?: MaterialUtilizado[];
  problemasEncontrados?: string;
  requerAcompanhamento?: boolean;
  observacoesAcompanhamento?: string;
  anexos?: AnexoTarefa[];
  prioridade?: "baixa" | "media" | "alta" | "critica";
  selecaoAutomatica?: boolean; // se usa rodízio automático
  historicoManutentores?: string[]; // IDs dos manutentores anteriores
  execucoesAnteriores?: number; // contador de execuções
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export interface ChecklistItemTarefa {
  id: string;
  descricao: string;
  concluido: boolean;
}

export interface MaterialUtilizado {
  id: string;
  nome: string;
  quantidade: number;
  valorUnitario?: number;
}

export interface AnexoTarefa {
  id: string;
  nome: string;
  url: string;
  tipo: string;
  dataUpload: Timestamp;
}

export interface ExecucaoTarefa {
  tarefaId: string;
  tempoRealizado: number;
  observacoes?: string;
  data: Timestamp;
}

export interface TarefaManutencaoMaquina extends TarefaManutencao {
  subcomponente?: string;
  dataHora?: string; // ISO string com data e hora
}

// Novos tipos para configurações customizadas
export interface ConfiguracaoEmpresa {
  id: string;
  tiposManutencao: TipoManutencaoCustom[];
  periodosCustomizados: PeriodoCustomizado[];
  categoriasEquipamento: CategoriaEquipamento[];
  checklistsPadrao: ChecklistPadrao[];
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export interface TipoManutencaoCustom {
  id: string;
  nome: string;
  cor: string;
  icone?: string;
  descricao?: string;
  checklistPadraoId?: string;
  ativo: boolean;
}

export interface PeriodoCustomizado {
  id: string;
  nome: string;
  dias: number;
  baseHoras?: boolean; // se true, o período é baseado em horas de operação
  baseCiclos?: boolean; // se true, o período é baseado em ciclos
  ativo: boolean;
}

export interface CategoriaEquipamento {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
}

export interface ChecklistPadrao {
  id: string;
  nome: string;
  tipoManutencao: string;
  itens: ChecklistItemPadrao[];
  ativo: boolean;
}

export interface ChecklistItemPadrao {
  id: string;
  descricao: string;
  obrigatorio: boolean;
  ordem: number;
}

// KPIs e Estatísticas
export interface KPIsManutencao {
  mtbf: number; // Mean Time Between Failures (horas)
  mttr: number; // Mean Time To Repair (horas)
  taxaConclusao: number; // percentual
  custosTotal: number;
  custosPorMaquina: { [maquinaId: string]: number };
  maquinasCriticas: MaquinaCritica[];
  eficienciaManutentores: EficienciaManutentor[];
}

export interface MaquinaCritica {
  maquinaId: string;
  maquinaNome: string;
  numeroFalhas: number;
  tempoParadaTotal: number; // minutos
  custoTotal: number;
}

export interface EficienciaManutentor {
  manutentorId: string;
  manutentorNome: string;
  tarefasConcluidas: number;
  tempoMedioExecucao: number; // minutos
  desvioTempoEstimado: number; // percentual
  taxaSucesso: number; // percentual
}

// Valores padrão (mantidos para compatibilidade)
export const TIPOS_MANUTENCAO_PADRAO: string[] = [
  "Elétrica",
  "Mecânica",
  "Hidráulica",
  "Pneumática",
  "Lubrificação",
  "Calibração",
  "Inspeção"
];

export const PERIODOS_DIAS: Record<string, number> = {
  "Diário": 1,
  "Semanal": 7,
  "Quinzenal": 15,
  "Mensal": 30,
  "Bimestral": 60,
  "Trimestral": 90,
  "Semestral": 180,
  "Anual": 365
};
