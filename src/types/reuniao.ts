export interface Reuniao {
  id: string;
  tema: string;
  detalhes: string;
  dataInicio: Date;
  dataFim: Date;
  participantes: string[]; // IDs dos usuários participantes
  criadoPor: string;
  criadoEm: Date;
}

export interface NovaReuniao {
  tema: string;
  detalhes: string;
  dataInicio: Date;
  dataFim: Date;
  participantes: string[];
}