import { Timestamp } from "firebase/firestore";
import { TipoManutencao, PeriodoManutencao } from "./typesManutencaoPreventiva";

export interface TemplateTarefa {
  id: string;
  titulo: string;
  tipo: TipoManutencao;
  maquinaId: string;
  maquinaNome: string;
  setor?: string;
  periodo: number; // dias
  periodoLabel: PeriodoManutencao;
  sistema?: string;
  subconjunto?: string;
  componente?: string;
  descricaoTarefa: string;
  tempoEstimado: number; // minutos
  prioridade: "baixa" | "media" | "alta" | "critica";
  ativo: boolean;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export type TemplateTarefaInput = Omit<TemplateTarefa, "id" | "criadoEm" | "atualizadoEm">;
