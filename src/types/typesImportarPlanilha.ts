import { Timestamp } from "firebase/firestore";

export interface UserData {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  cargo: string;
  tema: string;
  data_registro: Timestamp;
  ultimo_login: Timestamp;
  imagem_perfil: string;
  ativo: string;
  centro_de_custo: string;
  online: string; 
  unidade: string;
}

export interface SpreadsheetRow {
  "CODIGO ESTOQUE": string | number;
  "TEXTO BREVE": string;
  "QUANTIDADE": number;
  "U.M": string;
  "DESCRICAO": string;
}

export interface ImportedProduct {
  codigo_estoque: string;
  nome: string;
  quantidade: number;
  unidade_de_medida: string;
  detalhes: string;
  valor_unitario: number;
  quantidade_minima: number;
  codigo_material: string;
}

export type ImportedEquipment = {
  patrimonio: string;
  equipamento: string;
  setor: string;
  tag: string;
};

export type ImportedParadaRealizada = {
  setor: string;
  patrimonio: string;
  equipamento: string;
  tipoManutencao: string;
  dataProgramada: string;
  dataConclusao: string;
  hrInicial: string;
  hrFinal: string;
  manutentorI: string;
  manutentorII: string;
  manutentorIII: string;
  manutentorIIII: string;
  tipoFalha: string;
  descricaoMotivo: string;
  resolucao: string;
};