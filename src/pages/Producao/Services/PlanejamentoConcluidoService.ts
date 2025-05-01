import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
  } from "firebase/firestore";
  import { db } from "@/firebase/firebase";
  import { PlanejamentoConcluido, Planejamento } from "@/types/typesProducao";
  import { format } from "date-fns";
  
  export const getPlanejamentosConcluidos = async () => {
    try {
      const planejamentosRef = collection(db, "planejamentoconcluido");
      const q = query(planejamentosRef, orderBy("data", "desc"));
      const planejamentosSnap = await getDocs(q);
      
      return {
        success: true,
        planejamentosConcluidos: planejamentosSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PlanejamentoConcluido[],
      };
    } catch (error) {
      console.error("Erro ao buscar planejamentos concluídos:", error);
      return {
        success: false,
        error: "Erro ao buscar planejamentos concluídos.",
      };
    }
  };
  
  export const getPlanejamentoConcluidoPorData = async (data: Date) => {
    try {
      const dataStr = format(data, "yyyy-MM-dd");
      
      const planejamentosRef = collection(db, "planejamentoconcluido");
      const q = query(planejamentosRef, where("data", "==", dataStr));
      const planejamentosSnap = await getDocs(q);
      
      if (!planejamentosSnap.empty) {
        const planejamentoDoc = planejamentosSnap.docs[0];
        return {
          success: true,
          planejamentoConcluido: {
            id: planejamentoDoc.id,
            ...planejamentoDoc.data(),
          } as PlanejamentoConcluido,
        };
      } else {
        return {
          success: false,
          error: "Nenhum planejamento concluído encontrado para esta data.",
        };
      }
    } catch (error) {
      console.error("Erro ao buscar planejamento concluído por data:", error);
      return {
        success: false,
        error: "Erro ao buscar planejamento concluído por data.",
      };
    }
  };
  
  export const getPlanejamentosConcluidosPorPeriodo = async (
    dataInicio: Date,
    dataFim: Date
  ) => {
    try {
      const dataInicioStr = format(dataInicio, "yyyy-MM-dd");
      const dataFimStr = format(dataFim, "yyyy-MM-dd");
      
      const planejamentosRef = collection(db, "planejamentoconcluido");
      const q = query(
        planejamentosRef,
        where("data", ">=", dataInicioStr),
        where("data", "<=", dataFimStr),
        orderBy("data")
      );
      
      const planejamentosSnap = await getDocs(q);
      
      return {
        success: true,
        planejamentosConcluidos: planejamentosSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PlanejamentoConcluido[],
      };
    } catch (error) {
      console.error("Erro ao buscar planejamentos concluídos por período:", error);
      return {
        success: false,
        error: "Erro ao buscar planejamentos concluídos por período.",
      };
    }
  };
  
  export const concluirPlanejamentoDoDia = async (
    planejamento: Planejamento,
    data: Date
  ) => {
    try {
      const dataStr = format(data, "yyyy-MM-dd");
      
      // Verificar se já existe um planejamento concluído para esta data
      const existenteResult = await getPlanejamentoConcluidoPorData(data);
      
      if (existenteResult.success && existenteResult.planejamentoConcluido) {
        return {
          success: false,
          error: "Já existe um planejamento concluído para esta data.",
        };
      }
      
      // Criar o objeto de planejamento concluído
      const produtosFinais = planejamento.itens.map((item) => ({
        produtoId: item.produtoId,
        produtoNome: item.produtoNome,
        quantidadeProduzida: item.quantidadePlanejada, // Assumindo que produziu o que foi planejado
        unidadeMedida: item.unidadeMedida,
        valorTotal: item.quantidadePlanejada * 0, // Deve buscar o valor unitário do produto
      }));
      
      const planejamentoConcluido: PlanejamentoConcluido = {
        planejamentoId: planejamento.id || "",
        data: dataStr,
        produtosFinais,
        responsavel: planejamento.responsavel,
        criadoEm: null,
        atualizadoEm: null,
      };
      
      const agora = serverTimestamp();
      
      const docRef = await addDoc(collection(db, "planejamentoconcluido"), {
        ...planejamentoConcluido,
        criadoEm: agora,
        atualizadoEm: agora,
      });
      
      return {
        success: true,
        id: docRef.id,
      };
    } catch (error) {
      console.error("Erro ao concluir planejamento do dia:", error);
      return {
        success: false,
        error: "Erro ao concluir planejamento do dia.",
      };
    }
  };
  