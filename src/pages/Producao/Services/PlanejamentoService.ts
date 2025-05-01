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
    limit,
    serverTimestamp,
    Timestamp,
  } from "firebase/firestore";
  import { db } from "@/firebase/firebase";
  import { Planejamento, ItemPlanejamento, Produto } from "@/types/typesProducao";
  import { startOfWeek, endOfWeek, subWeeks, subMonths, subYears, format } from "date-fns";
  import { pt } from "date-fns/locale";
  
  export const getPlanejamento = async (planejamentoId: string) => {
    try {
      const planejamentoDoc = await getDoc(doc(db, "planejamento", planejamentoId));
      
      if (planejamentoDoc.exists()) {
        return {
          success: true,
          planejamento: {
            id: planejamentoDoc.id,
            ...planejamentoDoc.data(),
          } as Planejamento,
        };
      } else {
        return {
          success: false,
          error: "Planejamento não encontrado.",
        };
      }
    } catch (error) {
      console.error("Erro ao buscar planejamento:", error);
      return {
        success: false,
        error: "Erro ao buscar planejamento.",
      };
    }
  };
  
  export const getPlanejamentoByPeriodo = async (dataInicio: Date, dataFim: Date) => {
    try {
      const planejamentoRef = collection(db, "planejamento");
      const inicioStr = format(dataInicio, "yyyy-MM-dd");
      const fimStr = format(dataFim, "yyyy-MM-dd");
      
      const q = query(
        planejamentoRef,
        where("dataInicio", "==", inicioStr),
        where("dataFim", "==", fimStr)
      );
      
      const planejamentoSnap = await getDocs(q);
      
      if (!planejamentoSnap.empty) {
        const planejamentoDoc = planejamentoSnap.docs[0];
        return {
          success: true,
          planejamento: {
            id: planejamentoDoc.id,
            ...planejamentoDoc.data(),
          } as Planejamento,
        };
      } else {
        // Criar um planejamento vazio para o período
        const novoPlanejamento: Planejamento = {
          dataInicio: inicioStr,
          dataFim: fimStr,
          responsavel: "",
          itens: [],
          status: "rascunho",
          criadoEm: null,
          atualizadoEm: null,
        };
        
        return {
          success: true,
          planejamento: novoPlanejamento,
        };
      }
    } catch (error) {
      console.error("Erro ao buscar planejamento por período:", error);
      return {
        success: false,
        error: "Erro ao buscar planejamento por período.",
      };
    }
  };
  
  export const getPlanejamentoPorData = async (data: Date) => {
    try {
      const dataStr = format(data, "yyyy-MM-dd");
      
      // Buscar planejamentos que incluem esta data
      const planejamentoRef = collection(db, "planejamento");
      const q = query(
        planejamentoRef,
        where("dataInicio", "<=", dataStr),
        where("dataFim", ">=", dataStr)
      );
      
      const planejamentoSnap = await getDocs(q);
      
      if (!planejamentoSnap.empty) {
        const planejamentoDoc = planejamentoSnap.docs[0];
        return {
          success: true,
          planejamento: {
            id: planejamentoDoc.id,
            ...planejamentoDoc.data(),
          } as Planejamento,
        };
      } else {
        return {
          success: false,
          error: "Nenhum planejamento encontrado para esta data.",
        };
      }
    } catch (error) {
      console.error("Erro ao buscar planejamento por data:", error);
      return {
        success: false,
        error: "Erro ao buscar planejamento por data.",
      };
    }
  };
  
  export const salvarPlanejamento = async (planejamento: Planejamento) => {
    try {
      const agora = serverTimestamp();
      
      if (planejamento.id) {
        await updateDoc(doc(db, "planejamento", planejamento.id), {
          ...planejamento,
          atualizadoEm: agora,
        });
        
        return {
          success: true,
          planejamentoId: planejamento.id,
        };
      } else {
        const docRef = await addDoc(collection(db, "planejamento"), {
          ...planejamento,
          criadoEm: agora,
          atualizadoEm: agora,
        });
        
        return {
          success: true,
          planejamentoId: docRef.id,
        };
      }
    } catch (error) {
      console.error("Erro ao salvar planejamento:", error);
      return {
        success: false,
        error: "Erro ao salvar planejamento.",
      };
    }
  };
  
  export const getComparativoPeriodoAnterior = async (dataInicio: Date, dataFim: Date, tipo: 'semana' | 'mes' | 'ano') => {
    try {
      let periodoAnteriorInicio: Date;
      let periodoAnteriorFim: Date;
      
      if (tipo === 'semana') {
        periodoAnteriorInicio = subWeeks(dataInicio, 1);
        periodoAnteriorFim = subWeeks(dataFim, 1);
      } else if (tipo === 'mes') {
        periodoAnteriorInicio = subMonths(dataInicio, 1);
        periodoAnteriorFim = subMonths(dataFim, 1);
      } else {
        periodoAnteriorInicio = subYears(dataInicio, 1);
        periodoAnteriorFim = subYears(dataFim, 1);
      }
      
      const inicioStr = format(periodoAnteriorInicio, "yyyy-MM-dd");
      const fimStr = format(periodoAnteriorFim, "yyyy-MM-dd");
      
      const planejamentoRef = collection(db, "planejamento");
      const q = query(
        planejamentoRef,
        where("dataInicio", "==", inicioStr),
        where("dataFim", "==", fimStr)
      );
      
      const planejamentoSnap = await getDocs(q);
      
      if (!planejamentoSnap.empty) {
        const planejamentoDoc = planejamentoSnap.docs[0];
        return {
          success: true,
          planejamento: {
            id: planejamentoDoc.id,
            ...planejamentoDoc.data(),
          } as Planejamento,
        };
      } else {
        return {
          success: false,
          error: `Não há dados para o período anterior (${tipo}).`,
        };
      }
    } catch (error) {
      console.error(`Erro ao buscar comparativo ${tipo} anterior:`, error);
      return {
        success: false,
        error: `Erro ao buscar comparativo ${tipo} anterior.`,
      };
    }
  };
  
  export const getMesMaiorProducao = async (ano: number) => {
    try {
      const planejamentoRef = collection(db, "planejamento");
      const planejamentosSnap = await getDocs(planejamentoRef);
      
      const producaoPorMes: { [mes: number]: number } = {};
      
      planejamentosSnap.docs.forEach((doc) => {
        const planejamento = doc.data() as Planejamento;
        const dataInicio = new Date(planejamento.dataInicio);
        
        if (dataInicio.getFullYear() === ano) {
          const mes = dataInicio.getMonth();
          const valorTotal = planejamento.metricas?.valorTotal || 0;
          
          if (!producaoPorMes[mes]) {
            producaoPorMes[mes] = 0;
          }
          
          producaoPorMes[mes] += valorTotal;
        }
      });
      
      let mesMaior = 0;
      let valorMaior = 0;
      
      Object.entries(producaoPorMes).forEach(([mes, valor]) => {
        if (valor > valorMaior) {
          mesMaior = parseInt(mes);
          valorMaior = valor;
        }
      });
      
      return {
        success: true,
        mes: mesMaior,
        valor: valorMaior,
      };
    } catch (error) {
      console.error("Erro ao buscar mês de maior produção:", error);
      return {
        success: false,
        error: "Erro ao buscar mês de maior produção.",
      };
    }
  };
  