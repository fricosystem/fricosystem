import { Timestamp } from "firebase/firestore";

export interface ProdutoUtilizado {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface ChecklistItem {
  id: string;
  descricao: string;
  concluido: boolean;
  obrigatorio: boolean;
}

export interface OrdemServico {
  id: string;
  setor: string;
  equipamento: string;
  hrInicial: string;
  hrFinal: string;
  tempoParada: string;
  linhaParada: string;
  descricaoMotivo: string;
  observacao: string;
  origemParada: {
    automatizacao: boolean;
    terceiros: boolean;
    eletrica: boolean;
    mecanica: boolean;
    outro: boolean;
  };
  responsavelManutencao: string;
  tipoManutencao: string;
  solucaoAplicada: string;
  produtosUtilizados?: ProdutoUtilizado[];
  valorTotalProdutos?: number;
  criadoPor: string;
  criadoEm: Timestamp;
  status: string;
  
  // Campos para manutenção preventiva automatizada
  geradaAutomaticamente?: boolean;
  tipoOrdem?: "Manual" | "Automatica";
  dataAgendada?: string;
  equipamentoId?: string;
  sistemaId?: string;
  pecaId?: string;
  subPecaId?: string;
  pecaNome?: string;
  checklist?: ChecklistItem[];
}

export interface HistoricoManutencao {
  ordemId: string;
  data: string;
  tipo: string;
  responsavel: string;
  observacoes?: string;
}

export interface ConfiguracaoManutencao {
  intervaloManutencao: number; // em dias
  tipoIntervalo: "dias" | "horas" | "ciclos";
  gerarOrdemAutomatica: boolean;
  antecedenciaNotificacao: number; // dias antes para gerar ordem
  horasOperacao?: number; // contador de horas
  ciclosOperacao?: number; // contador de ciclos
}
