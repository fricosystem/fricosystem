import { Timestamp } from "firebase/firestore";

export interface UserInfo {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
}

export interface ProductVersionData {
  codigo_estoque: string;
  codigo_material: string;
  nome: string;
  quantidade: number;
  quantidade_minima: number;
  valor_unitario: number;
  unidade_de_medida: string;
  deposito: string;
  prateleira: string;
  unidade: string;
  detalhes: string;
  imagem: string;
  data_criacao: string;
  data_vencimento: string;
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  fornecedor_cnpj: string | null;
}

export type TipoAlteracao = 'criacao' | 'edicao' | 'desativacao' | 'restauracao';

export interface ProductVersion {
  id: string;
  produto_id: string;
  versao: number;
  tipo_alteracao: TipoAlteracao;
  motivo_alteracao: string;
  dados: ProductVersionData;
  criado_em: Timestamp;
  criado_por: UserInfo;
  campos_alterados?: string[];
}

export interface VersionComparison {
  versao_antiga: number;
  versao_nova: number;
  campos_alterados: {
    campo: string;
    valor_antigo: any;
    valor_novo: any;
  }[];
  dados_versao_antiga: ProductVersionData;
  dados_versao_nova: ProductVersionData;
}

export interface ProductWithVersion extends ProductVersionData {
  id: string;
  versao_atual: number;
  versao_criada_em: Timestamp;
  versao_criada_por: UserInfo;
  esta_ativo: boolean;
  data_desativacao?: Timestamp;
  total_versoes?: number;
}
