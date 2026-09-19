/**
 * Funções puras de cálculo de vida útil, cobertura de estoque e risco de parada.
 * Sem estado e sem dependência de Firestore — usadas pela árvore de componentes
 * da página /setores e pelos resumos de manutenção preventiva.
 */

export type StatusComponente = "Normal" | "Atenção" | "Crítico";
export type NivelRisco = "Normal" | "Atenção" | "Crítico";

export interface DadosVidaUtil {
  vidaUtil?: number;
  vidaUtilRestante?: number;
  proximaManutencao?: string;
  emEstoque?: number;
  estoqueMinimo?: number;
  status?: StatusComponente;
}

/** Percentual (0-100) de vida útil restante. Retorna null quando não cadastrado. */
export const percentualVidaUtil = (dados: DadosVidaUtil): number | null => {
  const total = Number(dados.vidaUtil);
  const restante = Number(dados.vidaUtilRestante);
  if (!Number.isFinite(total) || total <= 0) return null;
  if (!Number.isFinite(restante)) return null;
  return Math.max(0, Math.min(100, (restante / total) * 100));
};

/** Dias até a próxima manutenção preventiva. Negativo = vencida. */
export const diasAteProximaManutencao = (proximaManutencao?: string): number | null => {
  if (!proximaManutencao) return null;
  const data = new Date(proximaManutencao);
  if (Number.isNaN(data.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  data.setHours(0, 0, 0, 0);
  return Math.round((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
};

/** true quando o estoque disponível está abaixo do mínimo cadastrado. */
export const estoqueAbaixoDoMinimo = (emEstoque?: number, estoqueMinimo?: number): boolean => {
  const atual = Number(emEstoque);
  const minimo = Number(estoqueMinimo);
  if (!Number.isFinite(minimo) || minimo <= 0) return false;
  if (!Number.isFinite(atual)) return true;
  return atual < minimo;
};

export interface AvaliacaoComponente {
  percentualVida: number | null;
  diasParaManutencao: number | null;
  semEstoque: boolean;
  manutencaoVencida: boolean;
  manutencaoProxima: boolean;
  risco: NivelRisco;
  riscoDeParada: boolean;
  motivos: string[];
}

const LIMITE_VIDA_CRITICA = 20;
const LIMITE_VIDA_ATENCAO = 40;
const DIAS_PREVENTIVA_PROXIMA = 30;

/**
 * Combina vida útil, preventiva e cobertura de estoque num único nível de risco.
 * "Risco de parada" = componente com vida útil crítica (ou preventiva vencida)
 * E sem estoque de reposição suficiente.
 */
export const avaliarComponente = (dados: DadosVidaUtil): AvaliacaoComponente => {
  const percentualVida = percentualVidaUtil(dados);
  const diasParaManutencao = diasAteProximaManutencao(dados.proximaManutencao);
  const semEstoque = estoqueAbaixoDoMinimo(dados.emEstoque, dados.estoqueMinimo);
  const manutencaoVencida = diasParaManutencao !== null && diasParaManutencao < 0;
  const manutencaoProxima =
    diasParaManutencao !== null &&
    diasParaManutencao >= 0 &&
    diasParaManutencao <= DIAS_PREVENTIVA_PROXIMA;

  const motivos: string[] = [];
  let risco: NivelRisco = "Normal";

  if (percentualVida !== null && percentualVida <= LIMITE_VIDA_CRITICA) {
    risco = "Crítico";
    motivos.push(`Vida útil em ${percentualVida.toFixed(0)}%`);
  } else if (percentualVida !== null && percentualVida <= LIMITE_VIDA_ATENCAO) {
    risco = "Atenção";
    motivos.push(`Vida útil em ${percentualVida.toFixed(0)}%`);
  }

  if (manutencaoVencida) {
    risco = "Crítico";
    motivos.push(`Preventiva vencida há ${Math.abs(diasParaManutencao!)} dia(s)`);
  } else if (manutencaoProxima && risco === "Normal") {
    risco = "Atenção";
    motivos.push(`Preventiva em ${diasParaManutencao} dia(s)`);
  }

  if (semEstoque) {
    if (risco === "Normal") risco = "Atenção";
    motivos.push("Estoque abaixo do mínimo");
  }

  // Status manual cadastrado nunca é rebaixado pelo cálculo automático.
  if (dados.status === "Crítico") risco = "Crítico";
  else if (dados.status === "Atenção" && risco === "Normal") risco = "Atenção";

  const vidaCritica = percentualVida !== null && percentualVida <= LIMITE_VIDA_CRITICA;
  const riscoDeParada = semEstoque && (vidaCritica || manutencaoVencida || dados.status === "Crítico");

  return {
    percentualVida,
    diasParaManutencao,
    semEstoque,
    manutencaoVencida,
    manutencaoProxima,
    risco,
    riscoDeParada,
    motivos,
  };
};

const PESO_RISCO: Record<NivelRisco, number> = { Normal: 0, "Atenção": 1, "Crítico": 2 };

/** Propaga o risco do filho mais crítico para o nó pai. */
export const riscoMaisCritico = (riscos: NivelRisco[]): NivelRisco =>
  riscos.reduce<NivelRisco>(
    (acc, atual) => (PESO_RISCO[atual] > PESO_RISCO[acc] ? atual : acc),
    "Normal"
  );

/** Cor semântica da barra de vida útil. */
export const corVidaUtil = (percentual: number | null): string => {
  if (percentual === null) return "bg-muted-foreground/40";
  if (percentual <= LIMITE_VIDA_CRITICA) return "bg-destructive";
  if (percentual <= LIMITE_VIDA_ATENCAO) return "bg-yellow-500";
  return "bg-green-600";
};

export const LIMITES = {
  LIMITE_VIDA_CRITICA,
  LIMITE_VIDA_ATENCAO,
  DIAS_PREVENTIVA_PROXIMA,
};