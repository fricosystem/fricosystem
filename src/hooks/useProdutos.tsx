
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fetchGoogleSheetsData } from '@/utils/googleSheetsUtil';

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

// Sample mock data for development
const mockProdutos: Produto[] = [
  {
    id: '1',
    codigo: 'PROD001',
    nome: 'Parafuso 10mm',
    centroDeCusto: 'ESTOQUE-GERAL',
    quantidadeAtual: 150,
    quantidadeMinima: 50,
    valorUnitario: 1.599069,
    imagem: '/placeholder.svg',
    deposito: 'Depósito A',
    codigoEstoque: 'EST-001',
    unidade: 'PÇ',
    detalhes: 'Parafuso de aço inox',
    dataHora: new Date().toISOString()
  },
  {
    id: '2',
    codigo: 'PROD002',
    nome: 'Porca 8mm',
    centroDeCusto: 'ESTOQUE-GERAL',
    quantidadeAtual: 200,
    quantidadeMinima: 30,
    valorUnitario: 0.599069,
    imagem: '/placeholder.svg',
    deposito: 'Depósito A',
    codigoEstoque: 'EST-002',
    unidade: 'PÇ',
    detalhes: 'Porca de aço inox',
    dataHora: new Date().toISOString()
  },
  {
    id: '3',
    codigo: 'PROD003',
    nome: 'Arruela 12mm',
    centroDeCusto: 'ESTOQUE-GERAL',
    quantidadeAtual: 5,
    quantidadeMinima: 20,
    valorUnitario: 0.299069,
    imagem: '/placeholder.svg',
    deposito: 'Depósito B',
    codigoEstoque: 'EST-003',
    unidade: 'PÇ',
    detalhes: 'Arruela de aço inox',
    dataHora: new Date().toISOString()
  },
];

// Google Sheets ID extracted from the provided URL
const GOOGLE_SHEET_ID = "1eASDt7YXnc7-XTW8cuwKqkIILP1dY_22YXjs-R7tEMs";

export const useProdutos = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [useMockData, setUseMockData] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'googleSheets' | 'mock'>('googleSheets');
  const { toast } = useToast();

  useEffect(() => {
    fetchProdutos();
  }, [dataSource]);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      
      if (dataSource === 'googleSheets') {
        try {
          const sheetsData = await fetchGoogleSheetsData(GOOGLE_SHEET_ID);
          setProdutos(sheetsData);
          setFilteredProdutos(sheetsData);
          
          toast({
            title: "Dados carregados da planilha",
            description: `${sheetsData.length} produtos foram carregados do Google Sheets.`,
          });
          
          return;
        } catch (error: any) {
          console.error("Error fetching Google Sheets data:", error);
          toast({
            title: "Erro ao carregar planilha",
            description: "Tentando carregar dados do Supabase...",
            variant: "destructive",
          });
          
          // If Google Sheets fails, try Supabase
          setDataSource('supabase');
          return;
        }
      }
      
      if (dataSource === 'supabase') {
        const { data, error } = await supabase
          .from('produtos')
          .select('*');
          
        if (error) {
          console.error("Error fetching produtos:", error);
          
          // If table doesn't exist, use mock data
          if (error.code === '42P01') {
            setUseMockData(true);
            setDataSource('mock');
            
            toast({
              title: "Usando dados de exemplo",
              description: "A tabela 'produtos' não foi encontrada. Usando dados de exemplo para demonstração.",
            });
          } else {
            throw error;
          }
        } else if (data) {
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
      } else if (dataSource === 'mock') {
        // Use mock data
        setProdutos(mockProdutos);
        setFilteredProdutos(mockProdutos);
        
        toast({
          title: "Dados de exemplo",
          description: "Usando dados de exemplo para demonstração.",
        });
      }
      
    } catch (error: any) {
      console.error("Error fetching produtos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      });
      
      // Fallback to mock data
      setProdutos(mockProdutos);
      setFilteredProdutos(mockProdutos);
      setDataSource('mock');
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
      
      if (dataSource === 'mock' || dataSource === 'googleSheets') {
        // Remove from local data
        setProdutos(prevProdutos => prevProdutos.filter(p => p.id !== id));
        setFilteredProdutos(prevFiltered => prevFiltered.filter(p => p.id !== id));
        
        toast({
          title: "Produto excluído",
          description: "O produto foi excluído localmente (não no Google Sheets).",
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
      
      if (dataSource === 'mock' || dataSource === 'googleSheets') {
        // Add to local data
        const newProduto = {
          id: Date.now().toString(),
          ...novoProduto,
          codigo: novoProduto.codigo || `PROD${Date.now().toString().slice(-4)}`,
          nome: novoProduto.nome || 'Novo Produto',
          quantidadeAtual: novoProduto.quantidadeAtual || 0,
          quantidadeMinima: novoProduto.quantidadeMinima || 0,
          valorUnitario: novoProduto.valorUnitario || 0,
          centroDeCusto: novoProduto.centroDeCusto || '',
          deposito: novoProduto.deposito || '',
          imagem: novoProduto.imagem || '/placeholder.svg',
          codigoEstoque: novoProduto.codigoEstoque || '',
          unidade: novoProduto.unidade || 'UN',
          detalhes: novoProduto.detalhes || '',
          dataHora: novoProduto.dataHora || new Date().toISOString(),
        } as Produto;
        
        setProdutos(prevProdutos => [...prevProdutos, newProduto]);
        setFilteredProdutos(prevFiltered => [...prevFiltered, newProduto]);
        
        toast({
          title: "Produto adicionado",
          description: dataSource === 'googleSheets' 
            ? "O produto foi adicionado localmente (não no Google Sheets)." 
            : "O produto foi adicionado com sucesso.",
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
