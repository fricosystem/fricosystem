import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

interface PCPProductData {
  id: string;
  date: string;
  turno: '1_turno' | '2_turno';
  quantidade_produzida: number;
  quantidade_planejada: number;
  codigo: string;
  produto_nome: string;
}

interface ProductStats {
  producaoRealizada: number;
  producaoPlanejada: number;
  producao1Turno: number;
  producao2Turno: number;
  meta1Turno: number;
  meta2Turno: number;
  capacidadeInstalada: number;
  disponibilidade: number;
  performance: number;
  qualidade: number;
  oeeTotal: number;
  eficienciaGeral: number;
}

export const usePCPProductStats = (codigoProduto: string) => {
  const [stats, setStats] = useState<ProductStats>({
    producaoRealizada: 0,
    producaoPlanejada: 0,
    producao1Turno: 0,
    producao2Turno: 0,
    meta1Turno: 0,
    meta2Turno: 0,
    capacidadeInstalada: 0,
    disponibilidade: 0,
    performance: 0,
    qualidade: 0,
    oeeTotal: 0,
    eficienciaGeral: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!codigoProduto) {
      setLoading(false);
      return;
    }

    const fetchProductStats = async () => {
      setLoading(true);
      try {
        // Buscar dados PCP do produto - dados gerais (últimos 30 dias)
        const pcpQuery = query(
          collection(db, 'PCP'),
          where('processado', '==', 'sim')
        );
        
        const pcpSnapshot = await getDocs(pcpQuery);
        let producaoData: PCPProductData[] = [];

        pcpSnapshot.forEach((doc) => {
          const data = doc.data();
          const docDate = doc.id;
          
          // Processar turnos
          ['1_turno', '2_turno'].forEach((turno) => {
            if (data[turno]) {
              Object.entries(data[turno]).forEach(([key, item]: [string, any]) => {
                if (item.codigo === codigoProduto) {
                  producaoData.push({
                    id: `${doc.id}_${turno}_${key}`,
                    date: docDate,
                    turno: turno as '1_turno' | '2_turno',
                    quantidade_produzida: parseFloat(item.kg || '0'),
                    quantidade_planejada: parseFloat(item.planejamento || '0'),
                    codigo: item.codigo,
                    produto_nome: item.texto_breve || ''
                  });
                }
              });
            }
          });
        });

        // Buscar dados do produto na coleção PCP_produtos
        const produtosQuery = query(
          collection(db, 'PCP_produtos'),
          where('codigo', '==', codigoProduto)
        );
        
        const produtosSnapshot = await getDocs(produtosQuery);
        let metaDiaria = 1500; // valor padrão
        
        if (!produtosSnapshot.empty) {
          const produtoDoc = produtosSnapshot.docs[0];
          const produtoData = produtoDoc.data();
          metaDiaria = produtoData.meta_diaria || 1500;
        }

        // Calcular estatísticas gerais (últimos 30 dias)
        const ultimos30Dias = Array.from({ length: 30 }, (_, i) => 
          format(subDays(new Date(), i + 1), 'yyyy-MM-dd')
        );
        
        const producaoUltimos30Dias = producaoData.filter(item => 
          ultimos30Dias.includes(item.date)
        );
        
        const producaoRealizada = producaoUltimos30Dias.reduce((acc, item) => acc + item.quantidade_produzida, 0);
        const diasComProducao = [...new Set(producaoUltimos30Dias.map(item => item.date))].length;
        const producaoPlanejada = diasComProducao > 0 ? diasComProducao * metaDiaria : metaDiaria;
        
        const producao1Turno = producaoUltimos30Dias
          .filter(item => item.turno === '1_turno')
          .reduce((acc, item) => acc + item.quantidade_produzida, 0);
        
        const producao2Turno = producaoUltimos30Dias
          .filter(item => item.turno === '2_turno')
          .reduce((acc, item) => acc + item.quantidade_produzida, 0);

        const meta1Turno = (diasComProducao * metaDiaria) * 0.6; // 60% da meta total no primeiro turno
        const meta2Turno = (diasComProducao * metaDiaria) * 0.4; // 40% da meta total no segundo turno

        // Calcular métricas de performance
        const performance = producaoPlanejada > 0 ? (producaoRealizada / producaoPlanejada) * 100 : 0;
        const disponibilidade = Math.min(95, 85 + (performance / 10)); // Simular disponibilidade baseada na performance
        const qualidade = Math.min(98, 90 + (performance / 15)); // Simular qualidade baseada na performance
        const oeeTotal = (disponibilidade * performance * qualidade) / 10000;

        setStats({
          producaoRealizada,
          producaoPlanejada,
          producao1Turno,
          producao2Turno,
          meta1Turno,
          meta2Turno,
          capacidadeInstalada: (diasComProducao * metaDiaria) * 1.25, // 25% acima da meta como capacidade máxima para o período
          disponibilidade,
          performance,
          qualidade,
          oeeTotal,
          eficienciaGeral: performance
        });

      } catch (error) {
        console.error('Erro ao buscar estatísticas do produto:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductStats();
  }, [codigoProduto]);

  return { stats, loading };
};