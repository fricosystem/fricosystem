import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
  } from "firebase/firestore";
  import { db } from "@/firebase/firebase";
  import { Produto, Receita } from "@/types/typesProducao";
  
  export const getProdutos = async () => {
    try {
      const produtosRef = collection(db, "produtos");
      const produtosSnap = await getDocs(produtosRef);
      
      return {
        success: true,
        produtos: produtosSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Produto[],
      };
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      return {
        success: false,
        error: "Erro ao buscar produtos.",
      };
    }
  };
  
  export const getProduto = async (produtoId: string) => {
    try {
      const produtoDoc = await getDoc(doc(db, "produtos", produtoId));
      
      if (produtoDoc.exists()) {
        return {
          success: true,
          produto: { id: produtoDoc.id, ...produtoDoc.data() } as Produto,
        };
      } else {
        return {
          success: false,
          error: "Produto não encontrado.",
        };
      }
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return {
        success: false,
        error: "Erro ao buscar produto.",
      };
    }
  };
  
  export const getReceitas = async () => {
    try {
      const receitasRef = collection(db, "receitas");
      const receitasSnap = await getDocs(receitasRef);
      
      return {
        success: true,
        receitas: receitasSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Receita[],
      };
    } catch (error) {
      console.error("Erro ao buscar receitas:", error);
      return {
        success: false,
        error: "Erro ao buscar receitas.",
      };
    }
  };
  
  export const getReceitaByProdutoFinal = async (produtoFinalId: string) => {
    try {
      const receitasRef = collection(db, "receitas");
      const q = query(receitasRef, where("produtoFinalId", "==", produtoFinalId));
      const receitasSnap = await getDocs(q);
      
      if (!receitasSnap.empty) {
        const receitaDoc = receitasSnap.docs[0];
        return {
          success: true,
          receita: { id: receitaDoc.id, ...receitaDoc.data() } as Receita,
        };
      } else {
        return {
          success: false,
          error: "Receita não encontrada para este produto final.",
        };
      }
    } catch (error) {
      console.error("Erro ao buscar receita:", error);
      return {
        success: false,
        error: "Erro ao buscar receita.",
      };
    }
  };
  
  export const salvarReceita = async (receita: Receita) => {
    try {
      if (receita.id) {
        await updateDoc(doc(db, "receitas", receita.id), {
          ...receita,
          atualizadoEm: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "receitas"), {
          ...receita,
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        });
      }
      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar receita:", error);
      return {
        success: false,
        error: "Erro ao salvar receita.",
      };
    }
  };
  