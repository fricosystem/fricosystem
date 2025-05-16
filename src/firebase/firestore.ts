import { collection, addDoc, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebase";
import { ImportedProduct } from "@/types/typesImportarPlanilha";

// Enviar um único produto para o Firestore
export const uploadProduct = async (product: ImportedProduct) => {
  try {
    const productsRef = collection(db, "produtos");
    const docRef = await addDoc(productsRef, product);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao enviar produto:", error);
    throw error;
  }
};

// Enviar múltiplos produtos para o Firestore usando batch
export const uploadMultipleProducts = async (products: ImportedProduct[]) => {
  try {
    const batch = writeBatch(db);
    const productsRef = collection(db, "produtos");
    
    products.forEach((product) => {
      const newDocRef = doc(productsRef);
      batch.set(newDocRef, product);
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Erro ao enviar múltiplos produtos:", error);
    throw error;
  }
};