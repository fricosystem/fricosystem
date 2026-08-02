// src/firebase/firestore.ts
import { collection, addDoc, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { ImportedProduct, ImportedEquipment, ImportedParadaRealizada } from "@/types/typesImportarPlanilha";

// Função genérica para upload em lote
const uploadBatch = async <T>(
  items: T[],
  collectionName: string,
  converter: (item: T) => any
) => {
  const batch = writeBatch(db);
  const collectionRef = collection(db, collectionName);

  // Firestore limita batches a 500 operações
  const BATCH_LIMIT = 500;
  let committedOperations = 0;

  try {
    for (let i = 0; i < items.length; i++) {
      const newDocRef = doc(collectionRef);
      batch.set(newDocRef, converter(items[i]));

      // Commit batch quando atingir o limite ou for o último item
      if ((i + 1) % BATCH_LIMIT === 0 || i === items.length - 1) {
        await batch.commit();
        committedOperations += (i + 1) - committedOperations;
      }
    }
    return true;
  } catch (error) {
    console.error(`Erro no batch commit (${committedOperations} items enviados):`, error);
    throw error;
  }
};

// Operações para Produtos
export const uploadProduct = async (product: ImportedProduct) => {
  try {
    const docRef = await addDoc(collection(db, "produtos"), {
      ...product,
      quantidade: Number(product.quantidade),
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao enviar produto:", error);
    throw error;
  }
};

export const uploadMultipleProducts = async (products: ImportedProduct[]) => {
  return uploadBatch(products, "produtos", (product) => ({
    ...product,
    quantidade: Number(product.quantidade),
    createdAt: serverTimestamp()
  }));
};

// Operações para Equipamentos
export const uploadEquipment = async (equipment: ImportedEquipment) => {
  try {
    const docRef = await addDoc(collection(db, "equipamentos"), {
      ...equipment,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao enviar equipamento:", error);
    throw error;
  }
};

export const uploadMultipleEquipments = async (equipments: ImportedEquipment[]) => {
  try {
    const batch = writeBatch(db);
    const collectionRef = collection(db, "equipamentos");
    
    equipments.forEach((equipment) => {
      const docRef = doc(collectionRef);
      batch.set(docRef, {
        ...equipment,
        createdAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Erro ao enviar equipamentos:", error);
    throw error;
  }
};

// Operações para Paradas Realizadas
export const uploadParadaRealizada = async (parada: Record<string, any>) => {
  try {
    const docRef = await addDoc(collection(db, "paradas_maquina"), {
      ...parada,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao enviar parada realizada:", error);
    throw error;
  }
};

export const uploadMultipleParadasRealizadas = async (paradas: ImportedParadaRealizada[]) => {
  try {
    const batch = writeBatch(db);
    const collectionRef = collection(db, "paradas_maquina");
    
    paradas.forEach((parada) => {
      const docRef = doc(collectionRef);
      batch.set(docRef, {
        ...parada,
        createdAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Erro ao enviar paradas realizadas:", error);
    throw error;
  }
};

// Nova função com progresso para upload de paradas
export const uploadMultipleParadasRealizadasComProgresso = async (
  paradas: any[],
  onProgress?: (progress: number) => void
) => {
  const BATCH_LIMIT = 500;
  const collectionRef = collection(db, "paradas_maquina");
  
  let totalEnviados = 0;
  
  try {
    for (let i = 0; i < paradas.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const lote = paradas.slice(i, i + BATCH_LIMIT);
      
      lote.forEach((parada) => {
        const docRef = doc(collectionRef, parada.id); // Usa o ID gerado
        batch.set(docRef, {
          ...parada,
          createdAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      totalEnviados += lote.length;
      
      const progress = Math.round((totalEnviados / paradas.length) * 100);
      if (onProgress) {
        onProgress(progress);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao enviar paradas realizadas:", error);
    throw error;
  }
};
export const uploadEmail = async (emailData: {
  remetente: string;
  remetenteNome: string;
  destinatario: string;
  assunto: string;
  mensagem: string;
  status: string;
  lido: boolean;
}) => {
  try {
    const docRef = await addDoc(collection(db, "emails"), {
      ...emailData,
      criadoEm: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw error;
  }
};

/* ------------------------------------------------------------------------
 * Integração GitHub
 * Os tokens NÃO são mais gravados nem lidos pelo cliente. Use
 * `@/services/githubSecureClient`, que fala com Cloud Functions:
 * o token é enviado uma vez, fica no servidor e nunca retorna ao navegador.
 * (O antigo btoa/atob não era criptografia.)
 * --------------------------------------------------------------------- */