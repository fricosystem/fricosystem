
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Produto {
  id: string;
  codigo: string;
  nome: string;
  centroDeCusto: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  valorUnitario: number;
  imagem?: string;
  deposito: string;
  codigoEstoque?: string;
  unidade?: string;
  detalhes?: string;
  dataHora?: string;
  prateleira?: string;
  dataVencimento?: string;
}

export const useProdutos = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dataSource, setDataSource] = useState<'supabase' | 'googleSheets'>('googleSheets');
  const { toast } = useToast();

  useEffect(() => {
    fetchProdutos();
  }, [dataSource]);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      
      if (dataSource === 'supabase') {
        const { data, error } = await supabase
          .from('produtos')
          .select('*');
          
        if (error) {
          console.error("Error fetching produtos:", error);
          throw error;
        }
        
        if (data) {
          // Transform to match our interface structure
          const formattedProdutos: Produto[] = data.map((item) => ({
            id: item.id,
            codigo: item.codigo,
            nome: item.nome,
            centroDeCusto: item.centro_de_custo || '',
            quantidadeAtual: item.quantidade_atual,
            quantidadeMinima: item.quantidade_minima,
            valorUnitario: item.valor_unitario,
            imagem: item.imagem || '/placeholder.svg',
            deposito: item.deposito || '',
            codigoEstoque: item.codigo_estoque || '',
            unidade: item.unidade || 'UN',
            detalhes: item.detalhes || '',
            dataHora: item.data_hora || new Date().toISOString(),
            prateleira: item.prateleira || '',
            dataVencimento: item.data_vencimento || '',
          }));
          
          setProdutos(formattedProdutos);
          setFilteredProdutos(formattedProdutos);
          
          toast({
            title: "Dados carregados",
            description: `${formattedProdutos.length} produtos foram carregados.`,
          });
        }
      }
      
    } catch (error: any) {
      console.error("Error fetching produtos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      });
      
      // Inicializar com array vazio em caso de erro
      setProdutos([]);
      setFilteredProdutos([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredProdutos(produtos);
    } else {
      const filtered = produtos.filter(
        produto => 
          produto.nome.toLowerCase().includes(term.toLowerCase()) || 
          produto.codigo.toLowerCase().includes(term.toLowerCase()) ||
          produto.centroDeCusto.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredProdutos(filtered);
    }
  };
  
  const deleteProduto = async (id: string) => {
    try {
      setLoading(true);
      
      if (dataSource === 'googleSheets') {
        toast({
          title: "Operação não suportada",
          description: "Não é possível excluir produtos diretamente da planilha do Google Sheets.",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state after deletion
      setProdutos(prevProdutos => prevProdutos.filter(p => p.id !== id));
      setFilteredProdutos(prevFiltered => prevFiltered.filter(p => p.id !== id));
      
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
      
    } catch (error: any) {
      console.error("Error deleting produto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addProduto = async (novoProduto: Partial<Produto>) => {
    try {
      setLoading(true);
      
      if (dataSource === 'googleSheets') {
        toast({
          title: "Operação não suportada",
          description: "Não é possível adicionar produtos diretamente à planilha do Google Sheets.",
          variant: "destructive",
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('produtos')
        .insert([novoProduto])
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const formattedProduto: Produto = {
          id: data[0].id,
          codigo: data[0].codigo,
          nome: data[0].nome,
          centroDeCusto: data[0].centro_de_custo || '',
          quantidadeAtual: data[0].quantidade_atual,
          quantidadeMinima: data[0].quantidade_minima,
          valorUnitario: data[0].valor_unitario,
          imagem: data[0].imagem || '/placeholder.svg',
          deposito: data[0].deposito || '',
          codigoEstoque: data[0].codigo_estoque || '',
          unidade: data[0].unidade || 'UN',
          detalhes: data[0].detalhes || '',
          dataHora: data[0].data_hora || new Date().toISOString(),
          prateleira: data[0].prateleira || '',
          dataVencimento: data[0].data_vencimento || '',
        };
        
        // Update local state with the new product
        setProdutos(prevProdutos => [...prevProdutos, formattedProduto]);
        setFilteredProdutos(prevFiltered => [...prevFiltered, formattedProduto]);
        
        toast({
          title: "Produto adicionado",
          description: "O produto foi adicionado com sucesso.",
        });
      }
      
    } catch (error: any) {
      console.error("Error adding produto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    produtos,
    filteredProdutos,
    loading,
    searchTerm,
    dataSource,
    handleSearch,
    deleteProduto,
    addProduto,
    refreshProdutos: fetchProdutos,
    setDataSource
  };
};

export default useProdutos;
