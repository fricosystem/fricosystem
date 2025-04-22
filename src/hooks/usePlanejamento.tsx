import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { format, addDays } from "date-fns";

export interface Material {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  disponivel: boolean;
}

export interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  status: 'pendente' | 'em_producao' | 'concluido' | 'problema';
  materiais: Material[];
}

export interface DiaPlanejamento {
  id?: string;
  data: Date;
  produtos: Produto[];
}

// Type for Firestore document
interface FirestorePlanejamentoDoc {
  id: string;
  data: string; // ISO date string format
  produtos: Produto[];
  timestamp?: Date;
}

export const usePlanejamento = (inicioSemana: Date) => {
  const queryClient = useQueryClient();

  // Função para obter o planejamento da semana
  const obterPlanejamentoSemana = async (): Promise<DiaPlanejamento[]> => {
    try {
      const dias = Array.from({ length: 7 }, (_, i) =>
        format(addDays(inicioSemana, i), "yyyy-MM-dd")
      );
      
      const col = collection(db, "planejamento");
      const q = query(col, where("data", ">=", dias[0]), where("data", "<=", dias[6]));
      const snap = await getDocs(q);
      const docs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirestorePlanejamentoDoc));
      
      console.log("Documentos encontrados:", docs.length);
      
      return dias.map(dataStr => {
        const docDia = docs.find(d => d.data === dataStr);
        return {
          id: docDia?.id || `temp-${dataStr}`,
          data: new Date(dataStr),
          produtos: docDia?.produtos || []
        };
      });
    } catch (error) {
      console.error("Erro ao buscar planejamento:", error);
      throw error;
    }
  };

  // Função para salvar o planejamento no Firestore
  const salvarPlanejamentoFirestore = async (diasPlanejamento: DiaPlanejamento[]): Promise<boolean> => {
    console.log("Iniciando salvamento:", diasPlanejamento);
    try {
      // Primeiro, deletamos todos os registros da semana atual para evitar duplicatas
      const col = collection(db, "planejamento");
      const dataInicio = format(diasPlanejamento[0].data, "yyyy-MM-dd");
      const dataFim = format(diasPlanejamento[diasPlanejamento.length - 1].data, "yyyy-MM-dd");
      
      const registrosAtuais = query(col, where("data", ">=", dataInicio), where("data", "<=", dataFim));
      const snapshot = await getDocs(registrosAtuais);
      
      // Excluir registros existentes
      const exclusoes = snapshot.docs.map(documento => deleteDoc(doc(db, "planejamento", documento.id)));
      await Promise.all(exclusoes);
      
      // Agora adicionar os novos registros
      const promises = diasPlanejamento.map(async (dia) => {
        if (!dia.data) {
          console.error("Dia sem data:", dia);
          return;
        }

        const dataStr = format(dia.data, "yyyy-MM-dd");
        console.log(`Salvando dia ${dataStr} com ${dia.produtos.length} produtos`);

        // Garantir que temos produtos válidos antes de salvar
        const produtosValidos = dia.produtos.filter(p => p && p.id && p.nome);
        
        await addDoc(col, {
          data: dataStr,
          produtos: produtosValidos,
          timestamp: new Date() // Adicionar timestamp para ordenação
        });
      });
      
      await Promise.all(promises);
      console.log("Salvamento concluído com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao salvar planejamento:", error);
      throw error;
    }
  };

  // Query para obter dados
  const planejamentoQuery = useQuery({
    queryKey: ["planejamento", format(inicioSemana, "yyyy-MM-dd")],
    queryFn: obterPlanejamentoSemana,
  });

  // Mutation para salvar dados
  const mutation = useMutation({
    mutationFn: salvarPlanejamentoFirestore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planejamento"] });
    }
  });

  return {
    planejamento: planejamentoQuery.data,
    isLoading: planejamentoQuery.isLoading,
    error: planejamentoQuery.error,
    salvar: mutation.mutate,
    isSaving: mutation.isPending,
    saveError: mutation.error
  };
};
