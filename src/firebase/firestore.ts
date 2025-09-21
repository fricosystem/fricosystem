// src/firebase/firestore.ts
import { collection, addDoc, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { ImportedProduct, ImportedEquipment } from "@/types/typesImportarPlanilha";

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

// Operações para Emails
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

// Operações para configuração do GitHub
export const saveGitHubConfig = async (userId: string, config: {
  token: string;
  owner: string;
  repo: string;
}) => {
  try {
    // Criptografa o token (base64 simples - em produção usar criptografia mais robusta)
    const encryptedToken = btoa(config.token);
    
    const docRef = await addDoc(collection(db, "github"), {
      userId,
      owner: config.owner,
      repo: config.repo,
      encryptedToken,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao salvar configuração do GitHub:", error);
    throw error;
  }
};

export const getGitHubConfig = async (userId: string) => {
  try {
    const { getDocs, query, where } = await import("firebase/firestore");
    const q = query(collection(db, "github"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      // Descriptografa o token
      const decryptedToken = atob(data.encryptedToken);
      
      return {
        id: doc.id,
        token: decryptedToken,
        owner: data.owner,
        repo: data.repo,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar configuração do GitHub:", error);
    throw error;
  }
};

export const updateGitHubConfig = async (docId: string, config: {
  token: string;
  owner: string;
  repo: string;
}) => {
  try {
    const { updateDoc, doc: docRef } = await import("firebase/firestore");
    const encryptedToken = btoa(config.token);
    
    await updateDoc(docRef(db, "github", docId), {
      owner: config.owner,
      repo: config.repo,
      encryptedToken,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar configuração do GitHub:", error);
    throw error;
  }
};

export const deleteGitHubConfig = async (docId: string) => {
  try {
    const { deleteDoc, doc: docRef } = await import("firebase/firestore");
    await deleteDoc(docRef(db, "github", docId));
    return true;
  } catch (error) {
    console.error("Erro ao deletar configuração do GitHub:", error);
    throw error;
  }
};