
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  FileDown,
  Package,
  ArrowUpDown,
  Trash2,
  Loader2,
  Upload,
  FilePlus2,
  FileUp,
  ShoppingCart,
} from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProdutoCard from "@/components/ProdutoCard";
import EmptyState from "@/components/EmptyState";
import LoadingIndicator from "@/components/LoadingIndicator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

// Interface para os produtos da planilha
interface ProdutoSheets {
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
  centroDeCusto?: string; // Mantido para compatibilidade
}

const Produtos = () => {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [produtoSelecionado, setProdutoSelecionado] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<ProdutoSheets[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<ProdutoSheets[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // URL da planilha do Google Sheets (exportação CSV)
  const SHEETS_ID = "1eASDt7YXnc7-XTW8cuwKqkIILP1dY_22YXjs-R7tEMs";
  const SHEET_GID = "736804534";
  const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEETS_ID}/export?format=csv&gid=${SHEET_GID}`;

  // Buscar dados da planilha
  const fetchSheetData = async () => {
    setLoading(true);
    setLoadingProgress(0);
    try {
      const response = await fetch(CSV_URL);
      if (!response.ok) {
        throw new Error("Não foi possível carregar os dados da planilha");
      }
      // Simular progresso de carregamento
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 100);

      const csvText = await response.text();
      const parsedData = parseCSV(csvText);

      // Finalizar o progresso
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setProdutos(parsedData);
      setFilteredProdutos(parsedData);
      setLoading(false);
      
      toast({
        title: "Dados carregados",
        description: `${parsedData.length} produtos foram carregados da planilha.`,
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setLoading(false);
      setLoadingProgress(0);
      
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de produtos da planilha.",
        variant: "destructive",
      });
    }
  };

  // Formatar valor para o padrão brasileiro (R$ 0.000,00)
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para adicionar ao carrinho
  const handleAddToCart = (produto: ProdutoSheets) => {
    const carrinhoAtual = JSON.parse(localStorage.getItem("carrinho") || "[]");

    // Verificar se o produto já está no carrinho
    const produtoExistente = carrinhoAtual.find((item: ProdutoSheets) => item.id === produto.id);

    if (produtoExistente) {
      // Se o produto já existe, aumentar a quantidade
      const novoCarrinho = carrinhoAtual.map((item: ProdutoSheets) =>
        item.id === produto.id ? { ...item, quantidadeAtual: item.quantidadeAtual + 1 } : item
      );
      localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
    } else {
      // Se o produto não existe, adicioná-lo ao carrinho
      const novoCarrinho = [...carrinhoAtual, { ...produto, quantidadeAtual: 1 }];
      localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
    }

    toast({
      title: "Produto adicionado",
      description: `${produto.nome} foi adicionado ao carrinho.`,
    });

    navigate("/carrinho", {
      state: {
        carrinho: JSON.parse(localStorage.getItem("carrinho") || "[]"),
      },
    });
  };

  // Analisar o CSV retornado e adicionar campos para imagem e valor unitário
  const parseCSV = (csvText: string): ProdutoSheets[] => {
    const lines = csvText.split("\n");
    // Remover a primeira linha (cabeçalho)
    const headers = lines[0].split(",");
    const dataRows = lines.slice(1);
    return dataRows
      .filter((row) => row.trim() !== "") // Filtrar linhas vazias
      .map((row, index) => {
        // Separar valores considerando que campos possam conter vírgulas dentro de aspas
        const values = row.split(",").map((value) => value.trim());
        // Obter valores reais das colunas específicas
        const imagemValue = values[9] ? values[9].trim() : "";
        const unidadeValue = values[10] ? values[10].trim() : "";
        // Processar valor unitário da coluna 11
        let valorUnitarioValue = 0;
        if (values[11]) {
          // Remover caracteres não numéricos (como R$) e converter para número
          const valorString = values[11].replace(/[^0-9.,]/g, "").replace(",", ".");
          valorUnitarioValue = parseFloat(valorString) || 0;
        }
        // Validar URL da imagem
        let imageUrl = imagemValue;
        if (!imageUrl || imageUrl.trim() === "") {
          // Fallback para placeholder se imagem estiver vazia
          imageUrl = "/placeholder.svg";
        }
        // Verificar se é uma URL válida
        const isValidUrl = (url: string) => {
          try {
            new URL(url);
            return true;
          } catch {
            return url.startsWith("/"); // Aceitar caminhos relativos
          }
        };
        if (!isValidUrl(imageUrl)) {
          imageUrl = "/placeholder.svg";
        }
        return {
          id: `produto-${index}`, // Gerar ID único
          dataHora: values[0] || "",
          codigo: values[1] || "",
          codigoEstoque: values[2] || "",
          nome: values[3] || "",
          unidade: unidadeValue || values[4] || "", // Usar o valor específico ou o valor antigo como fallback
          deposito: values[5] || "",
          quantidadeAtual: parseFloat(values[6]) || 0,
          quantidadeMinima: parseFloat(values[7]) || 0,
          detalhes: values[8] || "",
          centroDeCusto: "Geral", // Valor padrão para compatibilidade
          valorUnitario: valorUnitarioValue, // Usar o valor real da coluna 11
          imagem: imageUrl, // Usar imagem real da coluna 9
        };
      });
  };

  // Buscar dados ao carregar o componente
  useEffect(() => {
    fetchSheetData();
  }, []);

  // Filtrar produtos baseado na busca
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProdutos(produtos);
    } else {
      const filtered = produtos.filter(
        (produto) =>
          produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          produto.codigoEstoque.toLowerCase().includes(searchTerm.toLowerCase()) ||
          produto.deposito.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProdutos(filtered);
    }
  }, [searchTerm, produtos]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const refreshProdutos = () => {
    fetchSheetData();
  };

  const handleEdit = (id: string) => {
    navigate(`/produtos/${id}/editar`);
  };

  const handleDelete = (id: string) => {
    setProdutoSelecionado(id);
  };

  const confirmDelete = async () => {
    if (produtoSelecionado) {
      // Em um ambiente real, você chamaria uma API para deletar o produto
      // Aqui estamos apenas simulando a exclusão
      const newProdutos = produtos.filter((produto) => produto.id !== produtoSelecionado);
      setProdutos(newProdutos);
      setFilteredProdutos(
        newProdutos.filter((produto) =>
          produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setProdutoSelecionado(null);
      
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
    }
  };

  const exportarRelatorio = (formato: "excel" | "pdf") => {
    // Simulação de exportação
    toast({
      title: "Exportação iniciada",
      description: `Exportação em formato ${formato.toUpperCase()} será implementada em breve!`,
    });
  };

  const importarProdutos = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A importação de produtos será implementada em breve!",
    });
  };

  if (loading) {
    return (
      <AppLayout title="Produtos">
        <LoadingIndicator
          message="Carregando produtos da planilha..."
          progress={loadingProgress}
          showProgress={true}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Produtos">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtros</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                Depósito
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked>
                Todos Depósitos
              </DropdownMenuCheckboxItem>
              {/* Gerar dinamicamente baseado nos depósitos presentes na planilha */}
              {Array.from(new Set(produtos.map((p) => p.deposito)))
                .filter(Boolean)
                .map((deposito) => (
                  <DropdownMenuCheckboxItem key={deposito}>
                    {deposito}
                  </DropdownMenuCheckboxItem>
                ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                Status de Estoque
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem>Estoque Baixo</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Estoque Normal</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportarRelatorio("excel")}>
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportarRelatorio("pdf")}>
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Produto
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/produtos/novo")}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                Cadastrar manualmente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={importarProdutos}>
                <FileUp className="mr-2 h-4 w-4" />
                Importar de planilha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={refreshProdutos}>
                <Loader2 className="mr-2 h-4 w-4" />
                Atualizar da planilha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="mb-6">
        <Tabs defaultValue="todos" className="w-full">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="estoque-baixo">Estoque Baixo</TabsTrigger>
            </TabsList>
            <div>
              <TabsList>
                <TabsTrigger
                  value="grid"
                  onClick={() => setView("grid")}
                  className={view === "grid" ? "bg-primary text-primary-foreground" : ""}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.5 1H6.5V6H1.5V1ZM8.5 1H13.5V6H8.5V1ZM1.5 8H6.5V13H1.5V8ZM8.5 8H13.5V13H8.5V8Z"
                      stroke="currentColor"
                      strokeWidth="1"
                      fillRule="evenodd"
                    />
                  </svg>
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  onClick={() => setView("table")}
                  className={view === "table" ? "bg-primary text-primary-foreground" : ""}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.5 1H13.5V14H1.5V1ZM1.5 4H13.5M1.5 7H13.5M1.5 10H13.5M5 4V14"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          <TabsContent value="todos" className="mt-6">
            {filteredProdutos.length === 0 ? (
              <EmptyState
                title="Nenhum produto encontrado"
                description="Nenhum produto corresponde aos critérios de busca ou a planilha está vazia."
                icon={<Package size={50} />}
              />
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProdutos.map((produto) => (
                  <ProdutoCard
                    key={produto.id}
                    produto={produto}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Código</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Código Estoque</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Nome</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left font-medium">Unidade</th>
                      <th className="py-3 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Quantidade</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Valor Unit.</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left font-medium">Depósito</th>
                      <th className="py-3 px-4 text-left font-medium">Detalhes</th>
                      <th className="py-3 px-4 text-left font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProdutos.map((produto) => (
                      <tr key={produto.id} className="border-t hover:bg-muted/50">
                        <td className="py-3 px-4">{produto.codigo}</td>
                        <td className="py-3 px-4">{produto.codigoEstoque}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded bg-muted overflow-hidden">
                              <img
                                src={produto.imagem || "/placeholder.svg"}
                                alt={produto.nome}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="font-medium">{produto.nome}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{produto.unidade}</td>
                        <td className="py-3 px-4">
                          <span
                            className={
                              produto.quantidadeAtual <= produto.quantidadeMinima
                                ? "text-destructive font-medium"
                                : ""
                            }
                          >
                            {produto.quantidadeAtual} / {produto.quantidadeMinima}
                          </span>
                        </td>
                        <td className="py-3 px-4">{formatCurrency(produto.valorUnitario)}</td>
                        <td className="py-3 px-4">{produto.deposito}</td>
                        <td className="py-3 px-4">{produto.detalhes}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(produto.id)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(produto.id)}
                              className="text-destructive"
                            >
                              <Trash2 size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddToCart(produto)}
                              className="text-primary"
                            >
                              <ShoppingCart size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="estoque-baixo" className="mt-6">
            {filteredProdutos.filter((p) => p.quantidadeAtual <= p.quantidadeMinima).length ===
            0 ? (
              <EmptyState
                title="Nenhum produto com estoque baixo"
                description="Todos os produtos estão com estoque adequado."
                icon={<Package size={50} />}
              />
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProdutos
                  .filter((p) => p.quantidadeAtual <= p.quantidadeMinima)
                  .map((produto) => (
                    <ProdutoCard
                      key={produto.id}
                      produto={produto}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium">Código</th>
                      <th className="py-3 px-4 text-left font-medium">Código Estoque</th>
                      <th className="py-3 px-4 text-left font-medium">Nome</th>
                      <th className="py-3 px-4 text-left font-medium">Unidade</th>
                      <th className="py-3 px-4 text-left font-medium">Quantidade</th>
                      <th className="py-3 px-4 text-left font-medium">Valor Unit.</th>
                      <th className="py-3 px-4 text-left font-medium">Depósito</th>
                      <th className="py-3 px-4 text-left font-medium">Detalhes</th>
                      <th className="py-3 px-4 text-left font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProdutos
                      .filter((p) => p.quantidadeAtual <= p.quantidadeMinima)
                      .map((produto) => (
                        <tr key={produto.id} className="border-t hover:bg-muted/50">
                          <td className="py-3 px-4">{produto.codigo}</td>
                          <td className="py-3 px-4">{produto.codigoEstoque}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded bg-muted overflow-hidden">
                                <img
                                  src={produto.imagem || "/placeholder.svg"}
                                  alt={produto.nome}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <span className="font-medium">{produto.nome}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{produto.unidade}</td>
                          <td className="py-3 px-4">
                            <span className="text-destructive font-medium">
                              {produto.quantidadeAtual} / {produto.quantidadeMinima}
                            </span>
                          </td>
                          <td className="py-3 px-4">{formatCurrency(produto.valorUnitario)}</td>
                          <td className="py-3 px-4">{produto.deposito}</td>
                          <td className="py-3 px-4">{produto.detalhes}</td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(produto.id)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(produto.id)}
                                className="text-destructive"
                              >
                                <Trash2 size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddToCart(produto)}
                                className="text-primary"
                              >
                                <ShoppingCart size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <AlertDialog
        open={produtoSelecionado !== null}
        onOpenChange={() => setProdutoSelecionado(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Produtos;
