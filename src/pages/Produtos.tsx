import { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, RefreshCw } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ProdutoCard from "@/components/ProdutoCard";
import AddProdutoModal from "@/components/AddProdutoModal";
import AlertaBaixoEstoque from "@/components/AlertaBaixoEstoque";
import { useCarrinho } from "@/hooks/useCarrinho";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// URL da planilha do Google Sheets (versão pública)
const SHEET_ID = "1eASDt7YXnc7-XTW8cuwKqkIILP1dY_22YXjs-R7tEMs";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=736804534`;

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
  fornecedor: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const parseCSV = (csvText: string): Produto[] => {
  // Divide o CSV em linhas e remove linhas vazias
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  
  // A primeira linha contém os cabeçalhos, então começamos da segunda (índice 1)
  const productos: Produto[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    // Parse CSV considerando valores com vírgulas dentro de aspas
    const parseLine = (line: string): string[] => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      
      // Adiciona o último valor
      result.push(current);
      
      return result;
    };
    
    const values = parseLine(lines[i]);
    
    if (values.length >= 15) { // Garantir que temos todos os campos necessários
      const produto: Produto = {
        id: `sheet-${i}`,
        codigo: values[1].trim() || `PROD${i}`,
        codigoEstoque: values[2].trim() || `EST-${i}`,
        nome: values[3].trim() || `Produto ${i}`,
        unidade: values[4].trim() || 'UN',
        deposito: values[5].trim() || 'Principal',
        quantidadeAtual: parseFloat(values[6]) || 0,
        quantidadeMinima: parseFloat(values[7]) || 0,
        detalhes: values[8].trim() || '',
        imagem: values[9].trim() || '/placeholder.svg',
        valorUnitario: parseFloat(values[11]) || 0,
        prateleira: values[12].trim() || '',
        dataVencimento: values[13].trim() || '',
        dataHora: values[14].trim() || new Date().toISOString(),
        fornecedor: values[15].trim() || ''
      };
      
      productos.push(produto);
    }
  }
  
  return productos;
};

const Produtos = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { adicionarAoCarrinho } = useCarrinho();
  const { toast } = useToast();
  const [produtosEmBaixoEstoque, setProdutosEmBaixoEstoque] = useState<Produto[]>([]);
  
  const fetchProdutos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Buscando dados da planilha do Google Sheets...");
      
      // Adiciona um timestamp para evitar cache
      const url = `${SHEET_URL}&_t=${new Date().getTime()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Falha ao buscar dados: ${response.status} ${response.statusText}`);
      }
      
      const csvData = await response.text();
      
      // Analisa o CSV e converte para objetos de produto
      const produtosData = parseCSV(csvData);
      
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
      console.error("Erro ao buscar dados da planilha:", error);
      
      const errorMessage = error.message || "Erro ao carregar dados";
      setError(errorMessage);
      
      toast({
        title: "Erro ao carregar dados",
        description: `Não foi possível carregar os dados: ${errorMessage}.`,
        variant: "destructive",
        duration: 5000,
      });
      
      setProdutos([]);
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-4 rounded-md">
          <h3 className="font-medium">Erro ao carregar dados</h3>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-2">
            Verifique se a planilha está acessível publicamente e contém todos os cabeçalhos necessários.
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
              : error
                ? "Ocorreu um erro ao carregar os dados. Tente novamente."
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