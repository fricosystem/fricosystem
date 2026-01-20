/**
 * Serviço para geração automática de ordens de manutenção
 * DEPRECADO: Use automacaoManutencao.ts para a versão completa
 * Mantido para compatibilidade com código existente
 */

import { executarAutomacaoCompleta } from "./automacaoManutencao";

/**
 * Função principal para gerar ordens de manutenção automaticamente
 * Redireciona para o novo sistema de automação
 */
export async function gerarOrdensManutencaoAutomaticas() {
  return await executarAutomacaoCompleta();
}

/**
 * Função auxiliar para executar manualmente (para testes)
 */
export async function executarManutencaoManual() {
  return await executarAutomacaoCompleta();
}
