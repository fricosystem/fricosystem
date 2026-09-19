export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  senha?: string;
  ativo: string;
}

export interface MedidaLenha {
  id: string;
  data: Date;
  medidas: string[];
  comprimento: number;
  largura: number;
  metrosCubicos: number;
  fornecedor: string;
  nfe?: string;
  responsavel: string;
  valorUnitario: number;
  valorTotal: number;
  usuario: string;
  status_envio?: string;
  chavePixFornecedor: string;
  contatoFornecedor: string;
  cnpjFornecedor?: string;
  centroCusto?: string;
}

export interface Fornecedor {
  id?: string;
  nome: string;
  valorUnitario: number;
  dataCadastro: Date;
  usuarioCadastro: string;
  cnpj: string;
  contato: string;
  chavePix: string;
  centroCusto?: string;
}
