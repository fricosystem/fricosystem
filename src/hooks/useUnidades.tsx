import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

interface UnidadeStats {
  distributionData: Array<{
    unidade: string;
    produtos: number;
    usuarios: number;
    centrosCusto: number;
  }>;
  totalProdutos: number;
  totalUsuarios: number;
  totalCentrosCusto: number;
}

export const useUnidades = () => {
  const [loading, setLoading] = useState(true);
  const [unidadesStats, setUnidadesStats] = useState<UnidadeStats | null>(null);

  const calcularEstatisticasUnidades = async () => {
    try {
      setLoading(true);

      // 1. Buscar todas as unidades
      const unidadesRef = collection(db, "unidades");
      const unidadesSnapshot = await getDocs(unidadesRef);
      const unidades = unidadesSnapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome,
        ...doc.data()
      }));

      // 2. Buscar dados de produtos por unidade
      const produtosRef = collection(db, "produtos");
      const produtosSnapshot = await getDocs(produtosRef);
      const produtos = produtosSnapshot.docs.map(doc => ({
        id: doc.id,
        unidade: doc.data().unidade || "Não especificada",
        ...doc.data()
      }));

      // 3. Buscar dados de usuários por unidade
      const usuariosRef = collection(db, "usuarios");
      const usuariosSnapshot = await getDocs(usuariosRef);
      const usuarios = usuariosSnapshot.docs.map(doc => ({
        id: doc.id,
        unidade: doc.data().unidade || "Não especificada",
        ...doc.data()
      }));

      // 4. Buscar dados de centros de custo por unidade
      const centrosCustoRef = collection(db, "centro_de_custo");
      const centrosCustoSnapshot = await getDocs(centrosCustoRef);
      const centrosCusto = centrosCustoSnapshot.docs.map(doc => ({
        id: doc.id,
        unidade: doc.data().unidade || "Não especificada",
        ...doc.data()
      }));

      // 5. Calcular estatísticas por unidade
      const distributionData = unidades.map(unidade => {
        const produtosDaUnidade = produtos.filter(p => p.unidade === unidade.nome).length;
        const usuariosDaUnidade = usuarios.filter(u => u.unidade === unidade.nome).length;
        const centrosCustoDaUnidade = centrosCusto.filter(c => c.unidade === unidade.nome).length;

        return {
          unidade: unidade.nome,
          produtos: produtosDaUnidade,
          usuarios: usuariosDaUnidade,
          centrosCusto: centrosCustoDaUnidade,
        };
      });

      // 6. Adicionar dados de itens sem unidade especificada
      const produtosSemUnidade = produtos.filter(p => !p.unidade || p.unidade === "Não especificada").length;
      const usuariosSemUnidade = usuarios.filter(u => !u.unidade || u.unidade === "Não especificada").length;
      const centrosCustoSemUnidade = centrosCusto.filter(c => !c.unidade || c.unidade === "Não especificada").length;

      if (produtosSemUnidade > 0 || usuariosSemUnidade > 0 || centrosCustoSemUnidade > 0) {
        distributionData.push({
          unidade: "Não especificada",
          produtos: produtosSemUnidade,
          usuarios: usuariosSemUnidade,
          centrosCusto: centrosCustoSemUnidade,
        });
      }

      const stats: UnidadeStats = {
        distributionData,
        totalProdutos: produtos.length,
        totalUsuarios: usuarios.length,
        totalCentrosCusto: centrosCusto.length,
      };

      setUnidadesStats(stats);

    } catch (error) {
      console.error("Erro ao calcular estatísticas das unidades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calcularEstatisticasUnidades();
  }, []);

  return {
    unidadesStats,
    loadingStats: loading,
    recalcularStats: calcularEstatisticasUnidades
  };
};