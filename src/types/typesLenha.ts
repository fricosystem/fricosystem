export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  senha?: string;
  ativo: string;
}

export interface MedidaLenha {
  id?: string;
  data: Date;
  medidas: number[];
  metrosCubicos: number;
  fornecedor: string;
  nfe: string;
  responsavel: string;
  valorUnitario: number;
  valorTotal: number;
  usuario: string;
}

export interface Fornecedor {
  id?: string;
  nome: string;
  valorUnitario: number;
  dataCadastro: Date;
  usuarioCadastro: string;
}
