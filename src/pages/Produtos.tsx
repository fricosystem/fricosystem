import { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, SearchIcon, RefreshCw } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ProdutoCard from "@/components/ProdutoCard";
import AddProdutoModal from "@/components/AddProdutoModal";
import AlertaBaixoEstoque from "@/components/AlertaBaixoEstoque";
import { useCarrinho } from "@/hooks/useCarrinho";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// URL base para o endpoint do Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwKwqQZzpe21ONIcNmiydlqxiheQ73e8f4lQlB0YWuXTH6l6X5um1SHTkM2cTwWfeaV/exec";

// Interface para o produto
interface Produto {
  id: string;
  codigo: string;
  codigoEstoque: string;
  nome: string;
  unidade: string;
  deposito: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  detalhes: string;
  imagem: string;
  valorUnitario: number;
  prateleira: string;
  dataVencimento: string;
  dataHora: string;
  centroDeCusto: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Função para buscar dados via Apps Script
const fetchSheetDataFromAppsScript = async () => {
  console.log("Buscando dados via Apps Script...");
  
  try {
    // Adiciona um timestamp para evitar cache
    const url = `${APPS_SCRIPT_URL}?action=getProdutos&_t=${new Date().getTime()}`;
    console.log(`URL da requisição: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Falha ao buscar dados. Status: ${response.status}, Texto: ${response.statusText}`);
      throw new Error(`Falha ao buscar dados: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log("Resposta bruta:", text);
    
    try {
      // Tenta analisar o JSON
      const data = JSON.parse(text);
      console.log("Resposta do Apps Script analisada:", data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!Array.isArray(data.produtos)) {
        console.error("Formato de resposta inválido - produtos não é um array:", data);
        throw new Error("Formato de resposta inválido: produtos não é um array");
      }
      
      return data.produtos;
    } catch (parseError) {
      console.error("Erro ao analisar a resposta JSON:", parseError);
      throw new Error(`A resposta não é um JSON válido: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Erro ao buscar dados via Apps Script:", error);
    throw error;
  }
};

// Função para criar produtos demo para testes
const createDemoProducts = (count: number = 10): Produto[] => {
  return Array(count).fill(0).map((_, index) => ({
    id: `demo-${index + 1}`,
    codigo: `PROD${String(index + 1).padStart(3, '0')}`,
    codigoEstoque: `EST-${index + 1}`,
    nome: `Produto Demo ${index + 1}`,
    unidade: 'UN',
    deposito: 'Principal',
    quantidadeAtual: Math.floor(Math.random() * 100),
    quantidadeMinima: 10,
    detalhes: 'Produto para demonstração',
    imagem: '/placeholder.svg',
    valorUnitario: Math.random() * 100 + 10,
    prateleira: `P${Math.floor(Math.random() * 10) + 1}`,
    dataVencimento: new Date(2023, 11, 31).toISOString(),
    dataHora: new Date().toISOString(),
    centroDeCusto: 'ESTOQUE-GERAL'
  }));
};

const Produtos = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useDemoData, setUseDemoData] = useState(false);
  const { adicionarAoCarrinho } = useCarrinho();
  const { toast } = useToast();
  const [produtosEmBaixoEstoque, setProdutosEmBaixoEstoque] = useState<Produto[]>([]);
  
  const fetchProdutos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (useDemoData) {
        // Carregar dados demo após um pequeno delay para simular requisição
        setTimeout(() => {
          const demoProdutos = createDemoProducts(15);
          setProdutos(demoProdutos);
          toast({
            title: "Dados demo carregados",
            description: `${demoProdutos.length} produtos de demonstração foram carregados.`,
          });
          setLoading(false);
        }, 1000);
        return;
      }
      
      console.log("Buscando dados via Apps Script...");
      
      try {
        const produtosData = await fetchSheetDataFromAppsScript();
        console.log(`Dados obtidos: ${produtosData.length} produtos`);
        
        if (!produtosData || produtosData.length === 0) {
          toast({
            title: "Aviso",
            description: "Nenhum produto encontrado na planilha. Verifique se a planilha contém dados."
          });
          setProdutos([]);
        } else {
          setProdutos(produtosData);
          
          toast({
            title: "Dados carregados",
            description: `${produtosData.length} produtos foram carregados com sucesso.`,
          });
        }
      } catch (error: any) {
        console.error("Erro ao buscar dados via Apps Script:", error);
        
        const errorMessage = error.message || "Erro ao carregar dados";
        setError(errorMessage);
        
        toast({
          title: "Erro ao carregar dados",
          description: `Não foi possível carregar os dados: ${errorMessage}. Usando dados de demonstração.`,
          variant: "destructive",
          duration: 5000,
        });
        
        // Carregar dados demo como fallback
        const demoProdutos = createDemoProducts(12);
        setProdutos(demoProdutos);
        setUseDemoData(true);
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProdutos();
  }, []);
  
  useEffect(() => {
    if (produtos && produtos.length > 0) {
      const produtosComBaixoEstoque = produtos.filter(
        (produto) => produto.quantidadeAtual <= produto.quantidadeMinima
      );
      setProdutosEmBaixoEstoque(produtosComBaixoEstoque);
    } else {
      setProdutosEmBaixoEstoque([]);
    }
  }, [produtos]);

  const handleAdicionarAoCarrinho = (produto: Produto) => {
    // Garante que o produto tenha todos os campos necessários
    const produtoCompleto = {
      ...produto,
      codigoEstoque: produto.codigoEstoque || `EST-${produto.id}`,
      unidade: produto.unidade || 'UN',
      detalhes: produto.detalhes || '',
      dataHora: produto.dataHora || new Date().toISOString(),
      imagem: produto.imagem || '/placeholder.svg',
    };
    
    adicionarAoCarrinho(produtoCompleto);
    toast({
      title: "Produto adicionado!",
      description: `O produto ${produto.nome} foi adicionado ao carrinho.`,
    });
  };

  const toggleDataSource = () => {
    setUseDemoData(!useDemoData);
    setLoading(true);
    
    if (!useDemoData) {
      // Mudar para dados demo
      const demoProdutos = createDemoProducts(15);
      setProdutos(demoProdutos);
      toast({
        title: "Modo de demonstração",
        description: "Usando dados de demonstração.",
      });
    } else {
      // Tentar carregar dados reais
      fetchProdutos();
    }
  };

  const produtosFiltrados = produtos
    ? produtos.filter((produto) =>
        produto.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <AppLayout title="Produtos">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold">Lista de Produtos</h1>
          <Button 
            variant="outline" 
            size="icon" 
            className="ml-2" 
            onClick={fetchProdutos}
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={toggleDataSource}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {useDemoData ? "Dados de Demonstração" : "Dados da Planilha"}
          </Button>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          Adicionar Produto
        </Button>
      </div>

      <div className="mb-4 flex items-center space-x-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Buscar produto por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <SearchIcon className="h-5 w-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>

      {useDemoData && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 mb-4 rounded-md">
          <h3 className="font-medium">Modo de demonstração</h3>
          <p className="text-sm">Exibindo dados de demonstração. Clique em "Dados da Planilha" para tentar carregar dados reais.</p>
        </div>
      )}

      {error && !useDemoData && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-4 rounded-md">
          <h3 className="font-medium">Erro ao carregar dados</h3>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-2">
            Verifique se o Apps Script está configurado corretamente e se a planilha contém todos os cabeçalhos necessários.
          </p>
        </div>
      )}

      {produtosEmBaixoEstoque.length > 0 && (
        <AlertaBaixoEstoque produtos={produtosEmBaixoEstoque} />
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-48 bg-muted">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description={
            searchTerm 
              ? "Nenhum produto corresponde à sua busca."
              : error && !useDemoData
                ? "Ocorreu um erro ao carregar os dados. Tente novamente ou use dados de demonstração."
                : "Adicione novos produtos para começar."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {produtosFiltrados.map((produto) => {
            // Garante que todas as propriedades necessárias existam
            const produtoCompleto = {
              ...produto,
              id: produto.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
              codigo: produto.codigo || "",
              codigoEstoque: produto.codigoEstoque || `EST-${produto.id || ""}`,
              nome: produto.nome || "Produto sem nome",
              unidade: produto.unidade || 'UN',
              detalhes: produto.detalhes || '',
              dataHora: produto.dataHora || new Date().toISOString(),
              imagem: produto.imagem || '/placeholder.svg',
              valorUnitario: produto.valorUnitario || 0,
              quantidadeAtual: produto.quantidadeAtual || 0,
              quantidadeMinima: produto.quantidadeMinima || 0
            };
            
            return (
              <ProdutoCard
                key={produtoCompleto.id}
                produto={produtoCompleto}
                onEdit={() => {}} 
                onDelete={() => {}}
                onAddToCart={() => handleAdicionarAoCarrinho(produtoCompleto)}
              />
            );
          })}
        </div>
      )}

      <AddProdutoModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={fetchProdutos}
      />
    </AppLayout>
  );
};

export default Produtos;