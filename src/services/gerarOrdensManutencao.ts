/**
 * Serviço para geração automática de ordens de manutenção
 * Este arquivo deve ser adaptado para rodar como Firebase Function ou edge function
 */

import { collection, getDocs, addDoc, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { verificarAntecedenciaManutencao } from "@/utils/manutencaoUtils";

interface PecaComManutencao {
  id: string;
  equipamentoId: string;
  sistemaId?: string;
  pecaId?: string;
  nome: string;
  proximaManutencao: string;
  configuracaoManutencao: {
    gerarOrdemAutomatica: boolean;
    antecedenciaNotificacao: number;
  };
  tipo: "peca" | "subpeca";
}

/**
 * Função principal para gerar ordens de manutenção automaticamente
 * Deve ser chamada diariamente via cron job
 */
export async function gerarOrdensManutencaoAutomaticas() {
  try {
    console.log("[Manutenção Automática] Iniciando verificação...");
    
    // 1. Buscar todos os equipamentos
    const equipamentosSnapshot = await getDocs(collection(db, "equipamentos"));
    const pecasParaManutencao: PecaComManutencao[] = [];
    
    // 2. Iterar sobre equipamentos e seus sistemas/peças
    for (const equipamentoDoc of equipamentosSnapshot.docs) {
      const equipamento = equipamentoDoc.data();
      const equipamentoId = equipamentoDoc.id;
      
      if (equipamento.sistemas && Array.isArray(equipamento.sistemas)) {
        for (const sistema of equipamento.sistemas) {
          if (sistema.pecas && Array.isArray(sistema.pecas)) {
            for (const peca of sistema.pecas) {
              // Verificar se a peça tem manutenção automática ativada
              if (
                peca.configuracaoManutencao?.gerarOrdemAutomatica &&
                peca.proximaManutencao
              ) {
                const deveGerar = verificarAntecedenciaManutencao(
                  peca.proximaManutencao,
                  peca.configuracaoManutencao.antecedenciaNotificacao
                );
                
                if (deveGerar) {
                  pecasParaManutencao.push({
                    id: peca.id,
                    equipamentoId,
                    sistemaId: sistema.id,
                    pecaId: peca.id,
                    nome: peca.nome,
                    proximaManutencao: peca.proximaManutencao,
                    configuracaoManutencao: peca.configuracaoManutencao,
                    tipo: "peca",
                  });
                }
              }
              
              // Verificar sub-peças
              if (peca.subPecas && Array.isArray(peca.subPecas)) {
                for (const subPeca of peca.subPecas) {
                  if (
                    subPeca.configuracaoManutencao?.gerarOrdemAutomatica &&
                    subPeca.proximaManutencao
                  ) {
                    const deveGerar = verificarAntecedenciaManutencao(
                      subPeca.proximaManutencao,
                      subPeca.configuracaoManutencao.antecedenciaNotificacao
                    );
                    
                    if (deveGerar) {
                      pecasParaManutencao.push({
                        id: subPeca.id,
                        equipamentoId,
                        sistemaId: sistema.id,
                        pecaId: peca.id,
                        nome: subPeca.nome,
                        proximaManutencao: subPeca.proximaManutencao,
                        configuracaoManutencao: subPeca.configuracaoManutencao,
                        tipo: "subpeca",
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    console.log(`[Manutenção Automática] Encontradas ${pecasParaManutencao.length} peças para manutenção`);
    
    // 3. Para cada peça, verificar se já existe ordem pendente
    const ordensGeradas = [];
    for (const peca of pecasParaManutencao) {
      const temOrdemPendente = await verificarOrdemPendenteExistente(
        peca.equipamentoId,
        peca.id
      );
      
      if (!temOrdemPendente) {
        // Gerar nova ordem de serviço
        const novaOrdem = await criarOrdemManutencao(peca);
        ordensGeradas.push(novaOrdem);
        console.log(`[Manutenção Automática] Ordem criada para: ${peca.nome}`);
      } else {
        console.log(`[Manutenção Automática] Já existe ordem pendente para: ${peca.nome}`);
      }
    }
    
    console.log(`[Manutenção Automática] Total de ordens geradas: ${ordensGeradas.length}`);
    return {
      success: true,
      pecasVerificadas: pecasParaManutencao.length,
      ordensGeradas: ordensGeradas.length,
    };
  } catch (error) {
    console.error("[Manutenção Automática] Erro:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verifica se já existe uma ordem pendente ou em andamento para uma peça
 */
async function verificarOrdemPendenteExistente(
  equipamentoId: string,
  pecaId: string
): Promise<boolean> {
  try {
    const ordensRef = collection(db, "ordens_servicos");
    const q = query(
      ordensRef,
      where("equipamentoId", "==", equipamentoId),
      where("status", "in", ["pendente", "em_andamento"])
    );
    
    const snapshot = await getDocs(q);
    
    // Verificar se alguma ordem está vinculada à peça específica
    for (const doc of snapshot.docs) {
      const ordem = doc.data();
      if (ordem.pecaId === pecaId || ordem.subPecaId === pecaId) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Erro ao verificar ordem pendente:", error);
    return false;
  }
}

/**
 * Cria uma nova ordem de manutenção preventiva
 */
async function criarOrdemManutencao(peca: PecaComManutencao) {
  const ordemData = {
    setor: "Manutenção Preventiva",
    equipamento: peca.equipamentoId,
    equipamentoId: peca.equipamentoId,
    sistemaId: peca.sistemaId || "",
    pecaId: peca.tipo === "peca" ? peca.pecaId : "",
    subPecaId: peca.tipo === "subpeca" ? peca.id : "",
    pecaNome: peca.nome,
    hrInicial: "",
    hrFinal: "",
    tempoParada: "",
    linhaParada: "Não",
    descricaoMotivo: `Manutenção preventiva automática - ${peca.nome}`,
    observacao: `Manutenção programada para: ${new Date(peca.proximaManutencao).toLocaleDateString("pt-BR")}`,
    origemParada: {
      automatizacao: false,
      terceiros: false,
      eletrica: false,
      mecanica: true,
      outro: false,
    },
    responsavelManutencao: "",
    tipoManutencao: "Preventiva",
    solucaoAplicada: "",
    produtosUtilizados: [],
    valorTotalProdutos: 0,
    criadoPor: "Sistema Automático",
    criadoEm: Timestamp.now(),
    status: "pendente",
    geradaAutomaticamente: true,
    tipoOrdem: "Automatica",
    dataAgendada: peca.proximaManutencao,
  };
  
  const docRef = await addDoc(collection(db, "ordens_servicos"), ordemData);
  
  return {
    id: docRef.id,
    ...ordemData,
  };
}

/**
 * Função auxiliar para executar manualmente (para testes)
 * Não usar em produção - substituir por cron job
 */
export async function executarManutencaoManual() {
  console.log("Executando geração manual de ordens de manutenção...");
  return await gerarOrdensManutencaoAutomaticas();
}
