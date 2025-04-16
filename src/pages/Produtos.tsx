
import { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, RefreshCw, FileSpreadsheet } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ProdutoCard from "@/components/ProdutoCard";
import AddProdutoModal from "@/components/AddProdutoModal";
import AlertaBaixoEstoque from "@/components/AlertaBaixoEstoque";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useCarrinho } from "@/hooks/useCarrinho";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface GoogleSheetsResponse {
  feed: {
    entry: Array<{
      gs$cell: {
        row: string;
        col: string;
        $t: string;
      }
    }>
  }
}

// Interface para produtos
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
  dataHora: string;
  imagem: string;
  valorUnitario: number;
  centroDeCusto?: string;
  prateleira?: string;
  dataVencimento?: string;
}

const parseGoogleSheetsData = (data: GoogleSheetsResponse) => {
  const entries = data.feed.entry;
  const rows: Record<string, Record<string, string>> = {};
  
  // Mapeamento correto das colunas para campos
  const columnMap: Record<string, string> = {
    "1": "codigo",            // 1 = Codigo material
    "2": "codigoEstoque",     // 2 = Codigo estoque
    "3": "nome",              // 3 = Nome
    "4": "unidade",           // 4 = Unidade
    "5": "deposito",          // 5 = Deposito
    "6": "quantidadeAtual",   // 6 = Quantidade
    "7": "quantidadeMinima",  // 7 = Quantidade minima
    "8": "detalhes",          // 8 = Detalhes
    "9": "imagem",            // 9 = Imagem
    "10": "unidadeMedida",    // 10 = Unidade de medida
    "11": "valorUnitario",    // 11 = Valor unitario
    "12": "prateleira",       // 12 = Prateleira
    "13": "dataVencimento",   // 13 = Data vencimento
    "14": "dataHora",         // 14 = Data criacao
  };
  
  entries.forEach(entry => {
    const rowIndex = entry.gs$cell.row;
    const colIndex = entry.gs$cell.col;
    const value = entry.gs$cell.$t;
    
    if (rowIndex === "1") return; // Pular cabeçalho
    
    if (!rows[rowIndex]) {
      rows[rowIndex] = {};
    }
    
    const fieldName = columnMap[colIndex];
    if (fieldName) {
      rows[rowIndex][fieldName] = value;
    }
  });

  return Object.values(rows).map((row, index) => ({
    id: `sheet-${index + 1}`,
    codigo: row.codigo || "",
    codigoEstoque: row.codigoEstoque || "",
    nome: row.nome || "",
    unidade: row.unidade || "UN",
    deposito: row.deposito || "",
    quantidadeAtual: parseFloat(row.quantidadeAtual) || 0,
    quantidadeMinima: parseFloat(row.quantidadeMinima) || 0,
    detalhes: row.detalhes || "",
    imagem: row.imagem || "/placeholder.svg",
    valorUnitario: parseFloat(row.valorUnitario?.replace(",", ".")) || 0,
    prateleira: row.prateleira || "",
    dataVencimento: row.dataVencimento ? new Date(row.dataVencimento).toISOString() : "",
    dataHora: row.dataHora ? new Date(row.dataHora).toISOString() : new Date().toISOString(),
    centroDeCusto: "ESTOQUE-GERAL"
  }));
};

const fetchGoogleSheetsData = async (sheetId: string, sheetNumber = 1) => {
  try {
    const url = `https://spreadsheets.google.com/feeds/cells/${sheetId}/${sheetNumber}/public/full?alt=json`;
    console.log("Fetching from URL:", url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Raw Sheet Data:", data);
    return parseGoogleSheetsData(data);
  } catch (error) {
    console.error("Error fetching Google Sheets data:", error);
    throw error;
  }
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// ID da planilha Google
const GOOGLE_SHEET_ID = "1eASDt7YXnc7-XTW8cuwKqkIILP1dY_22YXjs-R7tEMs";

const Produtos = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const { adicionarAoCarrinho } = useCarrinho();
  const { toast } = useToast();
  const [produtosEmBaixoEstoque, setProdutosEmBaixoEstoque] = useState<Produto[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Função para buscar os dados da planilha
  const fetchProdutos = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      console.log("Fetching data from Google Sheets...");
      
      try {
        const sheetsData = await fetchGoogleSheetsData(GOOGLE_SHEET_ID);
        console.log("Google Sheets data:", sheetsData);
        setProdutos(sheetsData);
        
        toast({
          title: "Dados carregados",
          description: `${sheetsData.length} produtos foram carregados da planilha.`,
        });
        
        return;
      } catch (error: any) {
        console.error("Error fetching Google Sheets data:", error);
        setErrorMessage(
          "Não foi possível carregar os dados da planilha. " + 
          "Verifique se a planilha existe e está compartilhada publicamente."
        );
        
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados da planilha.",
          variant: "destructive",
        });
        
        setProdutos([]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProdutos();
  }, []);
  
  useEffect(() => {
    if (produtos) {
      const produtosComBaixoEstoque = produtos.filter(
        (produto) => produto.quantidadeAtual <= produto.quantidadeMinima
      );
      setProdutosEmBaixoEstoque(produtosComBaixoEstoque);
    }
  }, [produtos]);

  const handleAdicionarAoCarrinho = (produto: Produto) => {
    adicionarAoCarrinho(produto);
    toast({
      title: "Produto adicionado!",
      description: `O produto ${produto.nome} foi adicionado ao carrinho.`,
    });
  };

  const produtosFiltrados = produtos
    ? produtos.filter((produto) =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
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
          <div className="ml-2 flex items-center text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            <span>Dados da planilha Google Sheets</span>
          </div>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          Adicionar Produto
        </Button>
      </div>

      <div className="mb-4 flex items-center space-x-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <SearchIcon className="h-5 w-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>

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
      ) : errorMessage ? (
        <EmptyState
          title="Erro ao carregar produtos"
          description={errorMessage}
        />
      ) : produtosFiltrados.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description="Verifique sua busca ou adicione novos produtos."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {produtosFiltrados.map((produto) => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              onEdit={() => {}} 
              onDelete={() => {}}
              onAddToCart={() => handleAdicionarAoCarrinho(produto)}
            />
          ))}
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
