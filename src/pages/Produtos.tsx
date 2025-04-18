import { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
<<<<<<< HEAD
import { SearchIcon, RefreshCw } from "lucide-react";
=======
import { SearchIcon, RefreshCw, FileSpreadsheet } from "lucide-react";
>>>>>>> 31c14901166975e070d1d9141daf9f5e61b8f696
import EmptyState from "@/components/EmptyState";
import ProdutoCard from "@/components/ProdutoCard";
import AddProdutoModal from "@/components/AddProdutoModal";
import AlertaBaixoEstoque from "@/components/AlertaBaixoEstoque";
<<<<<<< HEAD
=======
import LoadingIndicator from "@/components/LoadingIndicator";
>>>>>>> 31c14901166975e070d1d9141daf9f5e61b8f696
import { useCarrinho } from "@/hooks/useCarrinho";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

<<<<<<< HEAD
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

=======
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

>>>>>>> 31c14901166975e070d1d9141daf9f5e61b8f696
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

<<<<<<< HEAD
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
=======
// ID da planilha Google
const GOOGLE_SHEET_ID = "1eASDt7YXnc7-XTW8cuwKqkIILP1dY_22YXjs-R7tEMs";
>>>>>>> 31c14901166975e070d1d9141daf9f5e61b8f696

const Produtos = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
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
=======
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
>>>>>>> 31c14901166975e070d1d9141daf9f5e61b8f696
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
<<<<<<< HEAD
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
=======
    adicionarAoCarrinho(produto);
>>>>>>> 31c14901166975e070d1d9141daf9f5e61b8f696
    toast({
      title: "Produto adicionado!",
      description: `O produto ${produto.nome} foi adicionado ao carrinho.`,
    });
  };

  const produtosFiltrados = produtos
    ? produtos.filter((produto) =>
<<<<<<< HEAD
        produto.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
=======
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
>>>>>>> 31c14901166975e070d1d9141daf9f5e61b8f696
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
<<<<<<< HEAD
=======
          <div className="ml-2 flex items-center text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            <span>Dados da planilha Google Sheets</span>
          </div>
>>>>>>> 31c14901166975e070d1d9141daf9f5e61b8f696
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
      ) : errorMessage ? (
        <EmptyState
          title="Erro ao carregar produtos"
          description={errorMessage}
        />
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
<<<<<<< HEAD
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
=======
          {produtosFiltrados.map((produto) => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              onEdit={() => {}} 
              onDelete={() => {}}
              onAddToCart={() => handleAdicionarAoCarrinho(produto)}
            />
          ))}
>>>>>>> 31c14901166975e070d1d9141daf9f5e61b8f696
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

<<<<<<< HEAD
export default Produtos;
=======
export default Produtos;
>>>>>>> 31c14901166975e070d1d9141daf9f5e61b8f696
