export interface Usuario {
  id?: string;
  nome: string;
  email: string;
}

export interface Produto {
  id?: string;
  codigo_estoque: string;
  codigo_material: string;
  data_criacao: string;
  data_vencimento: string;
  deposito: string;
  detalhes: string;
  fornecedor_cnpj: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  imagem: string;
  nome: string;
  prateleira: string;
  quantidade: number;
  quantidade_minima: number;
  unidade: string;
  unidade_de_medida: string;
  valor_unitario: number;
}

export interface Transferencia {
  id?: string;
  data_transferencia: Date;
  usuario_id: string;
  produtos_transferidos: ProdutoTransferido[];
  origem: string;
  destino: string;
  observacoes: string;
}

export interface ProdutoTransferido {
  id: string;
  codigo_estoque: string;
  nome: string;
  quantidade: number;
  quantidadeAtual: number;
}

export const depositos = ["Depósito Principal", "Depósito A", "Depósito B", "Depósito C"];
export const unidades = ["Matriz", "Filial A", "Filial B"];
export const unidades_medida = ["UN", "KG", "GR", "MG", "LT", "ML", "CX", "PC", "MT", "CM", "MM", "M2", "M3", "PCT", "FD", "AMP", "FR", "RL", "KIT", "TN", "SC", "BL", "CT", "JG"];
