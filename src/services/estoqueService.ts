import { 
  collection, 
  doc, 
  getDoc, 
  writeBatch, 
  serverTimestamp,
  addDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { MaterialUtilizado } from "@/types/typesManutencaoPreventiva";

/**
 * Interface para produto no estoque
 */
interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  estoqueMinimo?: number;
  valorUnitario?: number;
}

/**
 * Interface para movimentação de estoque
 */
interface MovimentacaoEstoque {
  produtoId: string;
  produtoNome: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  motivo: string;
  ordemId?: string;
  tarefaId?: string;
  usuarioId?: string;
  observacao?: string;
  criadoEm: any;
}

/**
 * Realiza a baixa automática de materiais do estoque
 * @param materiais - Array de materiais utilizados na manutenção
 * @param ordemId - ID da ordem de serviço
 * @param tarefaId - ID da tarefa de manutenção
 * @returns Promise<void>
 */
export async function baixarEstoque(
  materiais: MaterialUtilizado[],
  ordemId?: string,
  tarefaId?: string
): Promise<{ success: boolean; alertas: string[] }> {
  const batch = writeBatch(db);
  const alertas: string[] = [];

  try {
    for (const material of materiais) {
      if (!material.id || material.quantidade <= 0) continue;

      const produtoRef = doc(db, "produtos", material.id);
      const produtoDoc = await getDoc(produtoRef);

      if (!produtoDoc.exists()) {
        alertas.push(`Produto "${material.nome}" não encontrado no estoque`);
        continue;
      }

      const produto = { id: produtoDoc.id, ...produtoDoc.data() } as Produto;
      const novaQuantidade = (produto.quantidade || 0) - material.quantidade;

      if (novaQuantidade < 0) {
        alertas.push(
          `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.quantidade}, Necessário: ${material.quantidade}`
        );
        continue;
      }

      // Atualizar quantidade do produto
      batch.update(produtoRef, {
        quantidade: novaQuantidade,
        ultimaMovimentacao: serverTimestamp()
      });

      // Verificar estoque mínimo
      if (produto.estoqueMinimo && novaQuantidade <= produto.estoqueMinimo) {
        alertas.push(
          `⚠️ Estoque de "${produto.nome}" abaixo do mínimo! Atual: ${novaQuantidade}, Mínimo: ${produto.estoqueMinimo}`
        );
      }

      // Registrar movimentação
      const movimentacao: Omit<MovimentacaoEstoque, "id"> = {
        produtoId: material.id,
        produtoNome: material.nome,
        tipo: "saida",
        quantidade: material.quantidade,
        motivo: "Manutenção Preventiva",
        ordemId,
        tarefaId,
        observacao: `Baixa automática por conclusão de manutenção`,
        criadoEm: serverTimestamp()
      };

      const movRef = collection(db, "movimentacoes_estoque");
      const movDoc = await addDoc(movRef, movimentacao);
      
      // Não podemos usar batch.set com addDoc, então fazemos separado
      // batch já foi usado para update do produto
    }

    // Commitar todas as atualizações
    await batch.commit();

    return { success: true, alertas };
  } catch (error) {
    console.error("Erro ao baixar estoque:", error);
    throw error;
  }
}

/**
 * Registra entrada de produtos no estoque
 */
export async function entradaEstoque(
  produtoId: string,
  quantidade: number,
  motivo: string,
  observacao?: string
): Promise<void> {
  try {
    const produtoRef = doc(db, "produtos", produtoId);
    const produtoDoc = await getDoc(produtoRef);

    if (!produtoDoc.exists()) {
      throw new Error("Produto não encontrado");
    }

    const produto = produtoDoc.data() as Produto;
    const novaQuantidade = (produto.quantidade || 0) + quantidade;

    // Atualizar produto
    await updateDoc(produtoRef, {
      quantidade: novaQuantidade,
      ultimaMovimentacao: serverTimestamp()
    });

    // Registrar movimentação
    await addDoc(collection(db, "movimentacoes_estoque"), {
      produtoId,
      produtoNome: produto.nome,
      tipo: "entrada",
      quantidade,
      motivo,
      observacao,
      criadoEm: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao registrar entrada:", error);
    throw error;
  }
}

/**
 * Verifica disponibilidade de materiais no estoque
 */
export async function verificarDisponibilidade(
  materiais: MaterialUtilizado[]
): Promise<{ disponivel: boolean; mensagens: string[] }> {
  const mensagens: string[] = [];
  let disponivel = true;

  try {
    for (const material of materiais) {
      if (!material.id) continue;

      const produtoRef = doc(db, "produtos", material.id);
      const produtoDoc = await getDoc(produtoRef);

      if (!produtoDoc.exists()) {
        mensagens.push(`Produto "${material.nome}" não encontrado`);
        disponivel = false;
        continue;
      }

      const produto = produtoDoc.data() as Produto;
      if ((produto.quantidade || 0) < material.quantidade) {
        mensagens.push(
          `Estoque insuficiente para "${material.nome}". Disponível: ${produto.quantidade}, Necessário: ${material.quantidade}`
        );
        disponivel = false;
      }
    }
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    throw error;
  }

  return { disponivel, mensagens };
}
