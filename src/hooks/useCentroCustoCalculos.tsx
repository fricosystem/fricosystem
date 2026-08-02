import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

interface RelatorioEntrada {
  id: string;
  tipo: string;
  subtipo: string;
  valor_total: number;
  centro_de_custo: string;
  unidade_centro_custo: string;
  data_registro: any;
  tipo_entrada: string;
  centros_custo?: Array<{
    id: string;
    nome: string;
    unidade: string;
  }>;
}

interface CentroCustoCalculado {
  id: string;
  nome: string;
  unidade: string;
  valorUtilizado: number;
  valorTotal: number;
  saldoDisponivel: number;
}

export const useCentroCustoCalculos = () => {
  const [loading, setLoading] = useState(true);
  const [centrosCalculados, setCentrosCalculados] = useState<CentroCustoCalculado[]>([]);

  const calcularValoresEntrada = async () => {
    try {
      setLoading(true);

      // 1. Buscar todos os centros de custo
      const centrosRef = collection(db, "centro_de_custo");
      const centrosSnapshot = await getDocs(centrosRef);
      const centrosCusto = centrosSnapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome,
        unidade: doc.data().unidade,
        valorTotal: doc.data().valorTotal || 0,
        valorUtilizado: doc.data().valorUtilizado || 0,
      }));

      // 2. Buscar todos os relatórios que tenham status = "entrada"
      const relatoriosRef = collection(db, "relatorios");
      
      // 3. Calcular valores utilizados por centro de custo
      const valoresUtilizados = new Map<string, number>();

      // Para cada centro de custo, buscar relatórios onde centro_de_custo = nome do centro
      for (const centro of centrosCusto) {
        // Buscar relatórios com status "entrada" e centro_de_custo = nome do centro
        const relatoriosEntradaQuery = query(
          relatoriosRef,
          where("status", "==", "entrada"),
          where("centro_de_custo", "==", centro.nome)
        );
        
        try {
          const relatoriosEntradaSnapshot = await getDocs(relatoriosEntradaQuery);

          // Somar valores dos relatórios de entrada
          let valorTotalCentro = 0;
          relatoriosEntradaSnapshot.docs.forEach(doc => {
            const data = doc.data();
            valorTotalCentro += data.valor_total || 0;
          });

          // Armazenar o valor total para este centro
          const chave = `${centro.nome}-${centro.unidade}`;
          valoresUtilizados.set(chave, valorTotalCentro);
        } catch (queryError) {
          console.warn(`Erro ao consultar relatórios para centro ${centro.nome}:`, queryError);
          // Em caso de erro, definir valor como 0
          const chave = `${centro.nome}-${centro.unidade}`;
          valoresUtilizados.set(chave, 0);
        }
      }

      // 4. Criar resultado final com cálculos
      const centrosCalculados = centrosCusto.map(centro => {
        const chave = `${centro.nome}-${centro.unidade}`;
        const valorUtilizado = valoresUtilizados.get(chave) || 0;
        const saldoDisponivel = centro.valorTotal - valorUtilizado;

        return {
          id: centro.id,
          nome: centro.nome,
          unidade: centro.unidade,
          valorUtilizado,
          valorTotal: centro.valorTotal,
          saldoDisponivel
        };
      });

      setCentrosCalculados(centrosCalculados);

    } catch (error) {
      console.error("Erro ao calcular valores dos centros de custo:", error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarCentrosCustoFirestore = async () => {
    try {
      // Atualizar cada centro de custo no Firestore com os valores calculados
      const { updateDoc, doc } = await import('firebase/firestore');
      
      for (const centro of centrosCalculados) {
        const centroRef = doc(db, "centro_de_custo", centro.id);
        await updateDoc(centroRef, {
          valorUtilizado: centro.valorUtilizado
        });
      }

    } catch (error) {
      console.error("Erro ao atualizar centros de custo:", error);
    }
  };

  useEffect(() => {
    calcularValoresEntrada();
  }, []);

  return {
    centrosCalculados,
    loading,
    calcularValoresEntrada,
    atualizarCentrosCustoFirestore
  };
};