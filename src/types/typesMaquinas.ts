import { ConfiguracaoManutencao, HistoricoManutencao } from "./typesOrdemServico";

export interface SubPeca {
  id: string;
  nome: string;
  codigo: string;
  status: "Normal" | "Atenção" | "Crítico";
  emEstoque: number;
  estoqueMinimo: number;
  pecaId: string;
  valorUnitario: number;
  fornecedor: string;
  descricao: string;
  
  // Campos de manutenção preventiva
  ultimaManutencao?: string;
  proximaManutencao?: string;
  vidaUtil?: number;
  vidaUtilRestante?: number;
  configuracaoManutencao?: ConfiguracaoManutencao;
  historicoManutencoes?: string[]; // IDs das ordens
}

export interface Peca {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  categoria: "Mecânica" | "Elétrica" | "Hidráulica" | "Pneumática" | "Eletrônica" | "Estrutural" | "Rolamentos" | "Vedação" | "Lubrificação" | "Transmissão" | "Instrumentação" | "Refrigeração" | "Controle";
  status: "Normal" | "Atenção" | "Crítico";
  equipamentoId: string;
  vidaUtil: number;
  vidaUtilRestante: number;
  ultimaManutencao: string;
  proximaManutencao: string;
  custoManutencao: number;
  emEstoque: number;
  estoqueMinimo: number;
  fornecedor: string;
  tempoCritico: number;
  valorUnitario: number;
  dataUltimaCompra: string;
  x: number;
  y: number;
  subPecas?: SubPeca[];
  
  // Campos de manutenção preventiva
  configuracaoManutencao?: ConfiguracaoManutencao;
  historicoManutencoes?: string[]; // IDs das ordens
}

export interface Sistema {
  id: string;
  nome: string;
  descricao: string;
  x: number;
  y: number;
  pecas?: Peca[];
  
  // Manutenção geral do sistema
  intervaloManutencaoGeral?: number;
  proximaRevisao?: string;
}

export interface Equipamento {
  id: string;
  patrimonio: string;
  equipamento: string;
  setor: string;
  tag: string;
  sistemas?: Sistema[];
}
