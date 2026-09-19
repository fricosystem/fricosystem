import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  serverTimestamp,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import { TemplateTarefa, TemplateTarefaInput } from "@/types/typesTemplatesTarefas";

const COLLECTION = "lista_tarefas_manutencao";

export const addTemplateTarefa = async (data: TemplateTarefaInput) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar template de tarefa:", error);
    throw error;
  }
};

export const updateTemplateTarefa = async (id: string, data: Partial<TemplateTarefaInput>) => {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      atualizadoEm: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar template de tarefa:", error);
    throw error;
  }
};

export const deleteTemplateTarefa = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Erro ao deletar template de tarefa:", error);
    throw error;
  }
};

export const getTemplatesTarefas = async (): Promise<TemplateTarefa[]> => {
  try {
    const q = query(collection(db, COLLECTION), orderBy("titulo", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as TemplateTarefa));
  } catch (error) {
    console.error("Erro ao buscar templates de tarefas:", error);
    throw error;
  }
};
