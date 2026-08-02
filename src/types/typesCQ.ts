// Tipos do módulo Controle de Qualidade (CQ)
// Todas as coleções seguem o padrão auditável/versionado do CQService.

import type { Timestamp, FieldValue } from "firebase/firestore";

export type CQTimestamp = Timestamp | FieldValue | null;

export type StatusAtivo = "sim" | "nao";

/** Nomes canônicos das coleções do módulo CQ */
export const CQ_COLLECTIONS = {
  cadastros: "cq_cadastros",
  modelos: "cq_modelos_planilhas",
  planosAmostragem: "cq_planos_amostragem",
  agendamentos: "cq_agendamentos",
  execucoes: "cq_execucoes",
  naoConformidades: "cq_nao_conformidades",
  acoesCorretivas: "cq_acoes_corretivas",
  melhoriaContinua: "cq_melhoria_continua",
  lotes: "cq_lotes",
  configuracoes: "cq_configuracoes",
  auditoria: "cq_auditoria",
} as const;

export type CQCollection = (typeof CQ_COLLECTIONS)[keyof typeof CQ_COLLECTIONS];

/** Campos comuns a todos os documentos versionados do CQ */
export interface CQBaseDocument {
  id?: string;
  ativo: StatusAtivo;
  versao: number;
  id_original_raiz?: string;
  criado_por: string;
  criado_em: CQTimestamp;
  atualizado_em: CQTimestamp;
}

/* ------------------------------------------------------------------ */
/* Cadastros                                                           */
/* ------------------------------------------------------------------ */

export type TipoCadastroCQ =
  | "defeito"
  | "causa"
  | "acao"
  | "produto"
  | "ponto_controle"
  | "turno";

export interface CQCadastro extends CQBaseDocument {
  tipo: TipoCadastroCQ;
  codigo?: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  unidade?: string;
  setor?: string;
}

/* ------------------------------------------------------------------ */
/* Modelos de planilha (checklists / planos de inspeção)               */
/* ------------------------------------------------------------------ */

export type TipoCampoCQ =
  | "numerico"
  | "texto"
  | "selecao"
  | "sim_nao"
  | "data"
  | "foto"
  | "assinatura";

export interface CQCampoModelo {
  id: string;
  label: string;
  tipo: TipoCampoCQ;
  obrigatorio: boolean;
  unidade?: string;
  /** Limites usados para avaliar conformidade automática */
  limite_min?: number | null;
  limite_max?: number | null;
  tolerancia?: number | null;
  valor_esperado?: string | boolean | null;
  opcoes?: string[];
  ponto_controle_id?: string;
  ordem: number;
}

export interface CQModeloPlanilha extends CQBaseDocument {
  nome: string;
  descricao?: string;
  setor?: string;
  produto_id?: string;
  categoria?: string;
  publicado: boolean;
  plano_amostragem_id?: string;
  campos: CQCampoModelo[];
}

/* ------------------------------------------------------------------ */
/* Plano de amostragem                                                 */
/* ------------------------------------------------------------------ */

export interface CQPlanoAmostragem extends CQBaseDocument {
  nome: string;
  nqa?: number;
  nivel_inspecao?: string;
  tamanho_lote_min?: number;
  tamanho_lote_max?: number;
  tamanho_amostra: number;
  frequencia?: FrequenciaCQ;
}

/* ------------------------------------------------------------------ */
/* Agendamento                                                         */
/* ------------------------------------------------------------------ */

export type FrequenciaCQ =
  | "unica"
  | "diaria"
  | "semanal"
  | "quinzenal"
  | "mensal"
  | "por_lote";

export type StatusAgendamento =
  | "agendado"
  | "em_execucao"
  | "concluido"
  | "atrasado"
  | "cancelado";

export interface CQAgendamento extends CQBaseDocument {
  modelo_id: string;
  modelo_nome: string;
  setor?: string;
  turno?: string;
  responsavel_id: string;
  responsavel_nome: string;
  data_prevista: CQTimestamp;
  frequencia: FrequenciaCQ;
  status: StatusAgendamento;
  execucao_id?: string;
  observacoes?: string;
  anexos?: string[];
}

/* ------------------------------------------------------------------ */
/* Execução (coleta)                                                   */
/* ------------------------------------------------------------------ */

export type ResultadoExecucao = "conforme" | "nao_conforme" | "parcial";

export interface CQRespostaCampo {
  campo_id: string;
  label: string;
  tipo: TipoCampoCQ;
  valor: string | number | boolean | null;
  conforme: boolean;
  observacao?: string;
  foto_url?: string;
}

export interface CQExecucao extends CQBaseDocument {
  modelo_id: string;
  modelo_nome: string;
  modelo_versao: number;
  agendamento_id?: string;
  lote_id?: string;
  lote_codigo?: string;
  setor?: string;
  turno?: string;
  respostas: CQRespostaCampo[];
  resultado: ResultadoExecucao;
  total_campos: number;
  total_conformes: number;
  duracao_segundos: number;
  iniciado_em: CQTimestamp;
  finalizado_em: CQTimestamp;
  responsavel_id: string;
  responsavel_nome: string;
  assinatura: {
    nome: string;
    uid: string;
    assinado_em: CQTimestamp;
  } | null;
  ncs_geradas?: string[];
  sincronizado?: boolean;
}

/* ------------------------------------------------------------------ */
/* Não conformidade                                                    */
/* ------------------------------------------------------------------ */

export type GravidadeNC = "baixa" | "media" | "alta" | "critica";

export type StatusNC =
  | "aberta"
  | "em_analise"
  | "acao_definida"
  | "verificacao"
  | "fechada";

export type DisposicaoNC =
  | "retrabalho"
  | "refugo"
  | "liberacao_condicional"
  | "devolucao"
  | "pendente";

export interface CQNaoConformidade extends CQBaseDocument {
  codigo?: string;
  descricao: string;
  gravidade: GravidadeNC;
  status: StatusNC;
  disposicao: DisposicaoNC;
  origem: "execucao" | "manual" | "auditoria" | "cliente";
  execucao_id?: string;
  campo_id?: string;
  ponto_controle?: string;
  modelo_id?: string;
  lote_id?: string;
  lote_codigo?: string;
  setor?: string;
  turno?: string;
  causa_raiz?: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  prazo?: CQTimestamp;
  fechada_em?: CQTimestamp;
  acoes_ids?: string[];
  fotos?: string[];
}

/* ------------------------------------------------------------------ */
/* Ação corretiva (CAPA / 5W2H)                                        */
/* ------------------------------------------------------------------ */

export type StatusAcao =
  | "planejada"
  | "em_andamento"
  | "concluida"
  | "verificada"
  | "cancelada";

export interface CQPlano5W2H {
  what: string;
  why: string;
  where: string;
  when: string;
  who: string;
  how: string;
  how_much: string;
}

export interface CQAcaoCorretiva extends CQBaseDocument {
  nc_id: string;
  tipo: "corretiva" | "preventiva";
  plano: CQPlano5W2H;
  status: StatusAcao;
  responsavel_id: string;
  responsavel_nome: string;
  prazo: CQTimestamp;
  concluida_em?: CQTimestamp;
  eficacia?: "eficaz" | "nao_eficaz" | "pendente";
  verificado_por?: string;
  verificado_em?: CQTimestamp;
  observacoes?: string;
}

/* ------------------------------------------------------------------ */
/* Melhoria contínua (Ishikawa / análises)                             */
/* ------------------------------------------------------------------ */

export type CategoriaIshikawa =
  | "maquina"
  | "metodo"
  | "mao_de_obra"
  | "material"
  | "medicao"
  | "meio_ambiente";

export interface CQMelhoriaContinua extends CQBaseDocument {
  nc_id?: string;
  titulo: string;
  tipo: "ishikawa" | "5w2h" | "pareto" | "insight_ia";
  ishikawa?: Partial<Record<CategoriaIshikawa, string[]>>;
  plano?: CQPlano5W2H;
  conclusao?: string;
  status?: StatusAcao;
}

/* ------------------------------------------------------------------ */
/* Rastreabilidade de lotes                                            */
/* ------------------------------------------------------------------ */

export type StatusLote =
  | "em_producao"
  | "liberado"
  | "bloqueado"
  | "em_recall"
  | "expedido";

export interface CQLote extends CQBaseDocument {
  codigo: string;
  produto_id?: string;
  produto_nome: string;
  quantidade: number;
  unidade?: string;
  data_producao: CQTimestamp;
  data_validade?: CQTimestamp;
  origem?: string;
  destino?: string;
  status: StatusLote;
  recall?: {
    motivo: string;
    aberto_por: string;
    aberto_em: CQTimestamp;
    encerrado_em?: CQTimestamp;
  } | null;
  execucoes_ids?: string[];
  ncs_ids?: string[];
}

/* ------------------------------------------------------------------ */
/* Configurações do módulo                                             */
/* ------------------------------------------------------------------ */

export interface CQConfiguracoes extends CQBaseDocument {
  meta_conformidade: number;
  meta_tempo_inspecao_min: number;
  sla_nc_horas: Record<GravidadeNC, number>;
  aprovadores: string[];
  alertas_email: boolean;
  alertas_destinatarios: string[];
  bloquear_execucao_offline: boolean;
}

/* ------------------------------------------------------------------ */
/* Auditoria                                                           */
/* ------------------------------------------------------------------ */

export type TipoOperacaoCQ = "CRIAR" | "EDITAR" | "DELETAR";

export interface CQAuditoria {
  id?: string;
  entidade_id: string;
  usuario_id: string;
  nome_usuario: string;
  tipo_operacao: TipoOperacaoCQ;
  colecao: string;
  valor_antigo?: unknown;
  valor_novo?: unknown;
  data_hora: CQTimestamp;
}

/* ------------------------------------------------------------------ */
/* KPIs / filtros                                                      */
/* ------------------------------------------------------------------ */

export interface CQFiltroPeriodo {
  inicio?: Date;
  fim?: Date;
  setor?: string;
  turno?: string;
  responsavel_id?: string;
  status?: string;
}

export interface CQKPIs {
  totalExecucoes: number;
  taxaConformidade: number;
  ncsAbertas: number;
  ncsPorGravidade: Record<GravidadeNC, number>;
  tempoMedioInspecaoMin: number;
  aderenciaCronograma: number;
  mttrAcoesHoras: number;
  paretoCausas: { causa: string; total: number }[];
  tendencia: { periodo: string; conformidade: number }[];
}
