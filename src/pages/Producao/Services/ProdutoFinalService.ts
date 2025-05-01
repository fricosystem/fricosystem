import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
  } from "firebase/firestore";
  import { db } from "@/firebase/firebase";
  import { ProdutoFinal } from "@/types/typesProducao";
  
  export const getProdutosFinais = async () => {
    try {
      const produtosFinaisRef = collection(db, "produtofinal");
      const produtosFinaisSnap = await getDocs(produtosFinaisRef);
      
      return {
        success: true,
        produtosFinais: produtosFinaisSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ProdutoFinal[],
      };
    } catch (error) {
      console.error("Erro ao buscar produtos finais:", error);
      return {
        success: false,
        error: "Erro ao buscar produtos finais.",
      };
    }
  };
  
  export const getProdutoFinal = async (id: string) => {
    try {
      const produtoFinalDoc = await getDoc(doc(db, "produtofinal", id));
      
      if (produtoFinalDoc.exists()) {
        return {
          success: true,
          produtoFinal: {
            id: produtoFinalDoc.id,
            ...produtoFinalDoc.data(),
          } as ProdutoFinal,
        };
      } else {
        return {
          success: false,
          error: "Produto final não encontrado.",
        };
      }
    } catch (error) {
      console.error("Erro ao buscar produto final:", error);
      return {
        success: false,
        error: "Erro ao buscar produto final.",
      };
    }
  };
  
  export const salvarProdutoFinal = async (produtoFinal: ProdutoFinal) => {
    try {
      const agora = serverTimestamp();
      
      if (produtoFinal.id) {
        await updateDoc(doc(db, "produtofinal", produtoFinal.id), {
          ...produtoFinal,
          atualizadoEm: agora,
        });
        
        return {
          success: true,
          id: produtoFinal.id,
        };
      } else {
        const docRef = await addDoc(collection(db, "produtofinal"), {
          ...produtoFinal,
          criadoEm: agora,
          atualizadoEm: agora,
        });
        
        return {
          success: true,
          id: docRef.id,
        };
      }
    } catch (error) {
      console.error("Erro ao salvar produto final:", error);
      return {
        success: false,
        error: "Erro ao salvar produto final.",
      };
    }
  };
  
  export const excluirProdutoFinal = async (id: string) => {
    try {
      await deleteDoc(doc(db, "produtofinal", id));
      
      return {
        success: true,
      };
    } catch (error) {
      console.error("Erro ao excluir produto final:", error);
      return {
        success: false,
        error: "Erro ao excluir produto final.",
      };
    }
  };
  