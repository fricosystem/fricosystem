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
        console.log(`Batch commit: ${committedOperations}/${items.length} items`);
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