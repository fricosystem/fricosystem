/**
 * Utilitários para cálculos de manutenção
 */

/**
 * Calcula os dias restantes para a próxima manutenção
 */
export function diasParaManutencao(dataProximaManutencao: Date | string | null | undefined): number {
  if (!dataProximaManutencao) return Infinity;
  
  const data = dataProximaManutencao instanceof Date 
    ? dataProximaManutencao 
    : new Date(dataProximaManutencao);
  
  if (isNaN(data.getTime())) return Infinity;
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  data.setHours(0, 0, 0, 0);
  
  const diffTime = data.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Determina o status baseado na data da próxima manutenção
 */
export function determinarStatusPorManutencao(dataProximaManutencao: Date | string | null | undefined): "atrasada" | "hoje" | "proxima" | "ok" {
  const dias = diasParaManutencao(dataProximaManutencao);
  
  if (dias < 0) return "atrasada";
  if (dias === 0) return "hoje";
  if (dias <= 7) return "proxima";
  return "ok";
}

/**
 * Calcula a próxima data de manutenção baseado na frequência
 */
export function calcularProximaManutencao(
  ultimaManutencao: Date | string | null | undefined,
  frequenciaDias: number = 30
): Date {
  const dataBase = ultimaManutencao 
    ? (ultimaManutencao instanceof Date ? ultimaManutencao : new Date(ultimaManutencao))
    : new Date();
  
  const proximaData = new Date(dataBase);
  proximaData.setDate(proximaData.getDate() + frequenciaDias);
  
  return proximaData;
}

/**
 * Formata a exibição de dias restantes
 */
export function formatarDiasRestantes(dias: number): string {
  if (dias === Infinity) return "Não programada";
  if (dias < 0) return `${Math.abs(dias)} dia(s) atrasada`;
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `Em ${dias} dias`;
}

/**
 * Obtém a cor do badge baseado no status
 */
export function getCorStatus(status: string): "destructive" | "secondary" | "default" | "outline" {
  switch (status) {
    case "atrasada":
      return "destructive";
    case "hoje":
      return "secondary";
    case "proxima":
      return "default";
    default:
      return "outline";
  }
}
