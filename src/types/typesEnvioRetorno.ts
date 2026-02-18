export interface EnvioRetorno {
  id: string;
  produto: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  motivoEnvio: string;
  fornecedor: string;
  contatoFornecedor: string;
  fotosEnvio: string[];
  fotosRetorno: string[];
  status: 'aguardando_envio' | 'enviado' | 'retornou';
  dataCadastro: Date;
  dataEnvio?: Date;
  dataRetorno?: Date;
  observacoes?: string;
  criadoPor: string;
  atualizadoPor: string;
  atualizadoEm: Date;
}

export interface CreateEnvioRetornoData {
  produto: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  motivoEnvio: string;
  fornecedor: string;
  contatoFornecedor: string;
  fotosEnvio: string[];
  observacoes?: string;
}

export interface UpdateEnvioRetornoData {
  status?: 'aguardando_envio' | 'enviado' | 'retornou';
  fotosRetorno?: string[];
  dataEnvio?: Date;
  dataRetorno?: Date;
  observacoes?: string;
  atualizadoPor: string;
  atualizadoEm: Date;
}