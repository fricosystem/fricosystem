/**
 * Utilitários para cálculos e verificações de manutenção
 */

/**
 * Calcula a próxima data de manutenção baseada no intervalo e tipo
 */
export function calcularProximaManutencao(
  intervalo: number,
  tipo: "dias" | "horas" | "ciclos",
  dataBase?: Date
): string {
  const base = dataBase || new Date();
  
  if (tipo === "dias") {
    const proxima = new Date(base);
    proxima.setDate(proxima.getDate() + intervalo);
    return proxima.toISOString().split('T')[0];
  }
  
  // Para horas e ciclos, retornar data base + intervalo em dias (simplificado)
  // Em produção, você precisaria de um sistema de monitoramento de horas/ciclos
  const proxima = new Date(base);
  proxima.setDate(proxima.getDate() + intervalo);
  return proxima.toISOString().split('T')[0];
}

/**
 * Calcula quantos dias faltam para a próxima manutenção
 */
export function diasParaManutencao(dataProximaManutencao: string): number {
  const hoje = new Date();
  const proxima = new Date(dataProximaManutencao);
  const diff = proxima.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se uma peça está dentro do período de antecedência para manutenção
 */
export function verificarAntecedenciaManutencao(
  dataProximaManutencao: string,
  antecedenciaDias: number
): boolean {
  const dias = diasParaManutencao(dataProximaManutencao);
  return dias <= antecedenciaDias && dias >= 0;
}

/**
 * Determina o status da peça baseado na proximidade da manutenção
 */
export function determinarStatusPorManutencao(
  dataProximaManutencao: string
): "Normal" | "Atenção" | "Crítico" {
  const dias = diasParaManutencao(dataProximaManutencao);
  
  if (dias < 0) return "Crítico"; // Manutenção atrasada
  if (dias <= 7) return "Crítico"; // Manutenção urgente (7 dias)
  if (dias <= 14) return "Atenção"; // Manutenção próxima (14 dias)
  return "Normal";
}

/**
 * Formata data para exibição
 */
export function formatarDataManutencao(data: string): string {
  if (!data) return "Não definido";
  
  const dataObj = new Date(data);
  return dataObj.toLocaleDateString('pt-BR');
}

/**
 * Verifica se há ordem de serviço pendente para uma peça
 */
export function temOrdemPendente(
  pecaId: string,
  ordensServico: any[]
): boolean {
  return ordensServico.some(
    ordem => 
      (ordem.pecaId === pecaId || ordem.subPecaId === pecaId) &&
      (ordem.status === "pendente" || ordem.status === "em_andamento")
  );
}

/**
 * Calcula vida útil restante em percentual
 */
export function calcularPercentualVidaUtil(
  vidaUtil: number,
  vidaUtilRestante: number
): number {
  if (vidaUtil === 0) return 100;
  return Math.round((vidaUtilRestante / vidaUtil) * 100);
}
