
import { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, FileSpreadsheet, SearchIcon, Trash2, RefreshCw } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ProdutoCard from "@/components/ProdutoCard";
import AddProdutoModal from "@/components/AddProdutoModal";
import AlertaBaixoEstoque from "@/components/AlertaBaixoEstoque";
import { useProdutos } from "@/hooks/useProdutos";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useCarrinho } from "@/hooks/useCarrinho";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Google Sheets interface and utilities - moved from googleSheetsUtil.ts
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

// Convert spreadsheet data to a more usable format
const parseGoogleSheetsData = (data: GoogleSheetsResponse) => {
  const entries = data.feed.entry;
  const rows: Record<string, Record<string, string>> = {};
  
  // Map of column indices to field names
  const columnMap: Record<string, string> = {};
  
  // Process header row to create column mapping
  entries
    .filter(entry => entry.gs$cell.row === "1")
    .forEach(entry => {
      const headerText = entry.gs$cell.$t.trim();
      const columnIndex = entry.gs$cell.col;
      
      // Map Google Sheets column headers to our field names
      switch (headerText) {
        case "Codigo material": columnMap[columnIndex] = "codigo"; break;
        case "Codigo estoque": columnMap[columnIndex] = "codigoEstoque"; break;
        case "Nome": columnMap[columnIndex] = "nome"; break;
        case "Unidade": columnMap[columnIndex] = "unidade"; break;
        case "Deposito": columnMap[columnIndex] = "deposito"; break;
        case "Quantidade": columnMap[columnIndex] = "quantidadeAtual"; break;
        case "Quantidade minima": columnMap[columnIndex] = "quantidadeMinima"; break;
        case "Detalhes": columnMap[columnIndex] = "detalhes"; break;
        case "Imagem": columnMap[columnIndex] = "imagem"; break;
        case "Valor unitario": columnMap[columnIndex] = "valorUnitario"; break;
        case "Prateleira": columnMap[columnIndex] = "prateleira"; break;
        case "Data vencimento": columnMap[columnIndex] = "dataVencimento"; break;
        case "Data criacao": columnMap[columnIndex] = "dataHora"; break;
        default: columnMap[columnIndex] = headerText.toLowerCase().replace(/\s/g, "_"); 
      }
    });

  // Process data rows
  entries
    .filter(entry => entry.gs$cell.row !== "1") // Skip header row
    .forEach(entry => {
      const rowIndex = entry.gs$cell.row;
      const colIndex = entry.gs$cell.col;
      const value = entry.gs$cell.$t;
      
      if (!rows[rowIndex]) {
        rows[rowIndex] = {};
      }
      
      const fieldName = columnMap[colIndex];
      if (fieldName) {
        rows[rowIndex][fieldName] = value;
      }
    });

  // Convert rows object to array and transform data types
  return Object.values(rows).map((row, index) => ({
    id: row.id || `sheet-${index + 1}`,
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
    centroDeCusto: row.centroDeCusto || "ESTOQUE-GERAL"
  }));
};

// Fetch Google Sheets data as JSON
const fetchGoogleSheetsData = async (sheetId: string, sheetNumber = 1) => {
  try {
    const url = `https://spreadsheets.google.com/feeds/cells/${sheetId}/${sheetNumber}/public/full?alt=json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet: ${response.status}`);
    }
    
    const data = await response.json();
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

// Google Sheets ID extracted from the provided URL
const GOOGLE_SHEET_ID = "1eASDt7YXnc7-XTW8cuwKqkIILP1dY_22YXjs-R7tEMs";

const Produtos = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'supabase' | 'googleSheets' | 'mock'>('googleSheets');
  const { adicionarAoCarrinho } = useCarrinho();
  const { toast } = useToast();
  const [produtosEmBaixoEstoque, setProdutosEmBaixoEstoque] = useState<any[]>([]);
  
  const fetchProdutos = async () => {
    try {
      setLoading(true);
      
      if (dataSource === 'googleSheets') {
        try {
          console.log("Fetching data from Google Sheets...");
          const sheetsData = await fetchGoogleSheetsData(GOOGLE_SHEET_ID);
          console.log("Google Sheets data:", sheetsData);
          setProdutos(sheetsData);
          
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
          setDataSource('mock');
          return;
        }
      }
      
      // Mock data for example
      const mockProdutos = [
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
      
      // Use mock data
      setProdutos(mockProdutos);
      
      toast({
        title: "Dados de exemplo",
        description: "Usando dados de exemplo para demonstração.",
      });
      
    } catch (error: any) {
      console.error("Error fetching produtos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      });
      
      // Fallback to empty array
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProdutos();
  }, [dataSource]);
  
  useEffect(() => {
    if (produtos) {
      const produtosComBaixoEstoque = produtos.filter(
        (produto) => produto.quantidadeAtual <= produto.quantidadeMinima
      );
      setProdutosEmBaixoEstoque(produtosComBaixoEstoque);
    }
  }, [produtos]);

  const handleAdicionarAoCarrinho = (produto: any) => {
    // Ensure the product has all required fields for ProdutoSheets type
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

  const changeDataSource = (source: 'supabase' | 'googleSheets' | 'mock') => {
    setDataSource(source);
    toast({
      title: "Fonte de dados alterada",
      description: `Os dados serão carregados de ${
        source === 'supabase' 
          ? 'Supabase' 
          : source === 'googleSheets' 
            ? 'Google Sheets' 
            : 'dados de exemplo'
      }.`,
    });
  };

  const produtosFiltrados = produtos
    ? produtos.filter((produto) =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {dataSource === 'googleSheets' 
                  ? 'Google Sheets' 
                  : dataSource === 'supabase' 
                    ? 'Supabase' 
                    : 'Dados de exemplo'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => changeDataSource('googleSheets')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Google Sheets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeDataSource('supabase')}>
                <Database className="h-4 w-4 mr-2" />
                Supabase
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeDataSource('mock')}>
                <Trash2 className="h-4 w-4 mr-2" />
                Dados de exemplo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      ) : produtosFiltrados.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description="Verifique sua busca ou adicione novos produtos."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {produtosFiltrados.map((produto) => {
            // Ensure all required properties exist to satisfy ProdutoSheets type
            const produtoCompleto = {
              ...produto,
              codigoEstoque: produto.codigoEstoque || `EST-${produto.id}`,
              unidade: produto.unidade || 'UN',
              detalhes: produto.detalhes || '',
              dataHora: produto.dataHora || new Date().toISOString(),
              imagem: produto.imagem || '/placeholder.svg',
            };
            
            return (
              <ProdutoCard
                key={produto.id}
                produto={produtoCompleto}
                onEdit={() => {}} 
                onDelete={() => {}}
                onAddToCart={() => handleAdicionarAoCarrinho(produto)}
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

