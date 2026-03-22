import { db } from "@/firebase/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

interface ApiKeyData {
  id: string;
  groq?: string;
  [key: string]: any;
}

/**
 * Busca a chave de API do Groq da coleção "api_key"
 * @returns Promise com a chave de API ou null se não encontrada
 */
export const getGroqApiKey = async (): Promise<string | null> => {
  try {
    const apiKeyRef = collection(db, "api_key");
    const q = query(apiKeyRef, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error("[v0] Nenhuma chave de API encontrada na coleção 'api_key'");
      return null;
    }

    const docData = snapshot.docs[0].data() as ApiKeyData;
    
    if (!docData.groq) {
      console.error("[v0] Campo 'groq' não encontrado na coleção 'api_key'");
      return null;
    }

    return docData.groq as string;
  } catch (error) {
    console.error("[v0] Erro ao buscar chave de API do Groq:", error);
    return null;
  }
};

/**
 * Busca qualquer chave de API da coleção "api_key"
 * @param fieldName Nome do campo a buscar (ex: 'groq', 'openai', etc)
 * @returns Promise com a chave de API ou null se não encontrada
 */
export const getApiKey = async (fieldName: string): Promise<string | null> => {
  try {
    const apiKeyRef = collection(db, "api_key");
    const q = query(apiKeyRef, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`[v0] Nenhuma chave de API encontrada na coleção 'api_key'`);
      return null;
    }

    const docData = snapshot.docs[0].data() as ApiKeyData;
    
    if (!docData[fieldName]) {
      console.error(`[v0] Campo '${fieldName}' não encontrado na coleção 'api_key'`);
      return null;
    }

    return docData[fieldName] as string;
  } catch (error) {
    console.error(`[v0] Erro ao buscar chave de API '${fieldName}':`, error);
    return null;
  }
};
