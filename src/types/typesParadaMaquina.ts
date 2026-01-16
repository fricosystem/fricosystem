import { Timestamp } from "firebase/firestore";

// Status da parada de máquina
export type StatusParada = 
  | "aguardando"           // Criado pelo encarregado, aguardando execução
  | "em_andamento"         // Manutentor iniciou a execução
  | "aguardando_verificacao" // Manutentor finalizou, aguardando verificação do encarregado
  | "concluido"            // Encarregado verificou e aprovou
  | "nao_concluido"        // Encarregado verificou e não aprovou - volta para manutentor
  | "aguardando_verificacao_1" // Segunda tentativa do manutentor
  | "concluido_1"          // Segunda tentativa aprovada
  | "aguardando_verificacao_2" // Terceira tentativa
  | "concluido_2"          // Terceira tentativa aprovada
  | "cancelado"            // Parada cancelada
  | "nao_executada";       // Parada não foi executada no tempo previsto

// Tipos de ação para o histórico
export type TipoAcaoHistorico = 
  | "criado"
  | "iniciado"
  | "finalizado"
  | "verificado_ok"
  | "verificado_nok"
  | "cancelado"
  | "reaberto";

// Interface para o histórico de ações
export interface HistoricoAcao {
  id: string;
  acao: TipoAcaoHistorico;
  userId: string;
  userName: string;
  timestamp: Timestamp;
  observacao?: string;
  tentativa?: number;
  statusAnterior?: StatusParada;
  statusNovo?: StatusParada;
}

// Interface para origem da parada
export interface OrigemParada {
  automatizacao: boolean;
  terceiros: boolean;
  eletrica: boolean;
  mecanica: boolean;
  outro: boolean;
}

// Interface para produtos utilizados
export interface ProdutoUtilizado {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

// Interface principal de Parada de Máquina
export interface ParadaMaquina {
  id: string;
  setor: string;
  equipamento: string;
  hrInicial: string;
  hrFinal: string;
  linhaParada: string;
  descricaoMotivo: string;
  observacao: string;
  origemParada: OrigemParada | string;  // Suporta objeto (correto) ou string (legado)
  responsavelManutencao?: string;
  tipoManutencao: string;
  solucaoAplicada?: string;
  produtosUtilizados?: ProdutoUtilizado[];
  valorTotalProdutos?: number;
  
  // Campos adicionais de classificação
  tipoFalha?: string;                   // Tipo de falha selecionado
  dataProgramada?: string;              // Data programada (YYYY-MM-DD)
  
  // Campos de controle de fluxo
  status: StatusParada;
  criadoPor: string;                    // ID do encarregado que criou
  criadoEm: Timestamp;
  encarregadoId: string;                // ID do encarregado responsável pela verificação
  encarregadoNome?: string;             // Nome do encarregado
  manutentorId?: string;                // ID do manutentor que está executando
  manutentorNome?: string;              // Nome do manutentor
  
  // Horários
  horarioProgramado?: Timestamp;        // Horário programado pelo encarregado
  horarioExecucaoInicio?: Timestamp;    // Quando o manutentor iniciou
  horarioExecucaoFim?: Timestamp;       // Quando o manutentor finalizou
  
  // Métricas de tempo
  tempoTotalDecorrido?: number;         // Tempo total em segundos desde início até fim da execução
  
  // Controle de tentativas
  tentativaAtual: number;               // Número da tentativa atual (1, 2, 3...)
  atrasado?: boolean;                   // Se a execução começou após o horário programado
  
  // Histórico completo de ações
  historicoAcoes: HistoricoAcao[];
  
  // Observações do encarregado (quando não aprova)
  observacaoVerificacao?: string;
  
  // IDs para referência de peças
  pecaId?: string;
  subPecaId?: string;
  equipamentoId?: string;
  sistemaId?: string;
}

// Helper para extrair origens da parada (suporta string e objeto)
export const getOrigensParadaArray = (origens: OrigemParada | string | undefined): string[] => {
  if (!origens) return [];
  
  // Formato string (legado/novo)
  if (typeof origens === "string") {
    return origens ? [origens] : [];
  }
  
  // Formato objeto com booleans
  const tipos: string[] = [];
  if (origens.automatizacao) tipos.push("Automatização");
  if (origens.terceiros) tipos.push("Terceiros");
  if (origens.eletrica) tipos.push("Elétrica");
  if (origens.mecanica) tipos.push("Mecânica");
  if (origens.outro) tipos.push("Outro");
  return tipos;
};

// Helper para obter label do status
export const getStatusLabel = (status: StatusParada): string => {
  const labels: Record<StatusParada, string> = {
    aguardando: "Aguardando",
    em_andamento: "Em Andamento",
    aguardando_verificacao: "Aguardando Verificação",
    concluido: "Concluído",
    nao_concluido: "Não Concluído",
    aguardando_verificacao_1: "Aguardando Verificação (2ª)",
    concluido_1: "Concluído (2ª)",
    aguardando_verificacao_2: "Aguardando Verificação (3ª)",
    concluido_2: "Concluído (3ª)",
    cancelado: "Cancelado",
    nao_executada: "Não Executada"
  };
  return labels[status] || status;
};

// Helper para verificar se pode iniciar execução (5 minutos antes)
export const podeIniciarExecucao = (horarioProgramado?: Timestamp): { pode: boolean; mensagem: string } => {
  if (!horarioProgramado) {
    return { pode: true, mensagem: "" };
  }
  
  const agora = new Date();
  const programado = horarioProgramado.toDate();
  const diffMs = programado.getTime() - agora.getTime();
  const diffMinutos = diffMs / (1000 * 60);
  
  if (diffMinutos > 5) {
    const totalMinutos = Math.ceil(diffMinutos);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    const tempoFormatado = horas > 0 
      ? `${horas}h ${minutos}min` 
      : `${minutos} min`;
    return { 
      pode: false, 
      mensagem: `Aguarde ${tempoFormatado} para iniciar (liberado 5 min antes)` 
    };
  }
  
  return { pode: true, mensagem: "" };
};

// Helper para verificar se está atrasado
export const verificarAtraso = (horarioProgramado?: Timestamp): boolean => {
  if (!horarioProgramado) return false;
  const agora = new Date();
  const programado = horarioProgramado.toDate();
  return agora > programado;
};

// Helper para obter próximo status de verificação baseado na tentativa
export const getProximoStatusVerificacao = (tentativaAtual: number): StatusParada => {
  switch (tentativaAtual) {
    case 1: return "aguardando_verificacao";
    case 2: return "aguardando_verificacao_1";
    case 3: return "aguardando_verificacao_2";
    default: return "aguardando_verificacao";
  }
};

// Helper para obter status concluído baseado na tentativa
export const getStatusConcluido = (tentativaAtual: number): StatusParada => {
  switch (tentativaAtual) {
    case 1: return "concluido";
    case 2: return "concluido_1";
    case 3: return "concluido_2";
    default: return "concluido";
  }
};

// Verifica se um status indica conclusão
export const isStatusConcluido = (status: StatusParada): boolean => {
  return ["concluido", "concluido_1", "concluido_2"].includes(status);
};

// Verifica se um status indica finalização (concluído ou não executada)
export const isStatusFinalizado = (status: StatusParada): boolean => {
  return ["concluido", "concluido_1", "concluido_2", "nao_executada", "cancelado"].includes(status);
};

// Verifica se um status indica aguardando verificação
export const isStatusAguardandoVerificacao = (status: StatusParada): boolean => {
  return ["aguardando_verificacao", "aguardando_verificacao_1", "aguardando_verificacao_2"].includes(status);
};
