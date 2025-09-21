import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, RefreshCw, ArrowUpDown, Table, Grid, ShoppingCart } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ProdutoCard from "@/components/ProdutoCard";
import AddProdutoModal from "@/components/AddProdutoModal";
import AlertaBaixoEstoque from "@/components/AlertaBaixoEstoque";
import { useCarrinho } from "@/hooks/useCarrinho";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table as ShadcnTable, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProductDetails from "@/components/ProductDetails";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
interface Produto {
  id: string;
  codigo: string;
  codigoEstoque: string;
  nome: string;
  unidade: string;
  unidade_de_medida: string;
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
  fornecedor_nome: string;
  fornecedor_cnpj: string;
  status?: "pendente" | "em_abastecimento" | "abastecido";
}
const Produtos = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    adicionarAoCarrinho
  } = useCarrinho();
  const {
    toast
  } = useToast();
  const [produtosEmBaixoEstoque, setProdutosEmBaixoEstoque] = useState<Produto[]>([]);
  const [sortOption, setSortOption] = useState<string>("codigoEstoque-asc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const ITEMS_PER_PAGE = 20;
  const fetchProdutos = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, "produtos"));
      if (querySnapshot.empty) {
        toast({
          title: "Aviso",
          description: "Nenhum produto encontrado no banco de dados."
        });
        setProdutos([]);
      } else {
        const produtosData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            codigo: data.codigo_material || "",
            codigoEstoque: data.codigo_estoque || "",
            nome: data.nome || "",
            unidade: data.unidade || "UN",
            unidade_de_medida: data.unidade_de_medida || "",
            deposito: data.deposito || "",
            quantidadeAtual: data.quantidade || 0,
            quantidadeMinima: data.quantidade_minima || 0,
            detalhes: data.detalhes || "",
            imagem: data.imagem || "/placeholder.svg",
            valorUnitario: data.valor_unitario || 0,
            prateleira: data.prateleira || "",
            dataVencimento: data.data_vencimento || "",
            dataHora: data.data_criacao || new Date().toISOString(),
            fornecedor: data.fornecedor || "",
            fornecedor_nome: data.fornecedor_nome || "",
            fornecedor_cnpj: data.fornecedor_cnpj || "",
            status: data.status || "pendente"
          };
        }) as Produto[];
        setProdutos(produtosData);
        toast({
          title: "Dados carregados",
          description: `${produtosData.length} produtos foram carregados com sucesso.`
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar produtos:", error);
      const errorMessage = error.message || "Erro ao carregar dados do Firebase";
      setError(errorMessage);
      toast({
        title: "Erro ao carregar dados",
        description: `Não foi possível carregar os produtos: ${errorMessage}`,
        variant: "destructive",
        duration: 5000
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
      const produtosComBaixoEstoque = produtos.filter(produto => produto.quantidadeAtual <= produto.quantidadeMinima);
      setProdutosEmBaixoEstoque(produtosComBaixoEstoque);
    } else {
      setProdutosEmBaixoEstoque([]);
    }
  }, [produtos]);
  const getStatusBadge = (produto: Produto) => {
    // Mostra o badge apenas para produtos com baixo estoque
    if (produto.quantidadeAtual > produto.quantidadeMinima) {
      return null;
    }
    switch (produto.status) {
      case "pendente":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pedido Pendente</Badge>;
      case "em_abastecimento":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Comprado</Badge>;
      case "abastecido":
        return null;
      default:
        return null;
    }
  };
  const handleAdicionarAoCarrinho = (produto: Produto) => {
    const produtoCompleto = {
      ...produto,
      codigoEstoque: produto.codigoEstoque || `EST-${produto.id}`,
      unidade: produto.unidade || "UN",
      detalhes: produto.detalhes || "",
      dataHora: produto.dataHora || new Date().toISOString(),
      imagem: produto.imagem || "/placeholder.svg",
      unidade_de_medida: produto.unidade_de_medida || "",
      fornecedor_nome: produto.fornecedor_nome || "",
      fornecedor_cnpj: produto.fornecedor_cnpj || ""
    };
    adicionarAoCarrinho(produtoCompleto);
    toast({
      title: "Produto adicionado!",
      description: `O produto ${produto.nome} foi adicionado ao carrinho.`
    });
  };
  const handleDeleteClick = (id: string) => {
    setProdutoToDelete(id);
    setDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!produtoToDelete) return;
    try {
      await deleteDoc(doc(db, "produtos", produtoToDelete));
      toast({
        title: "Produto excluído",
        description: "O produto foi removido com sucesso"
      });
      setProdutos(produtos.filter(produto => produto.id !== produtoToDelete));
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto",
        variant: "destructive"
      });
    } finally {
      setDeleteModalOpen(false);
      setProdutoToDelete(null);
    }
  };
  const safeToLowerCase = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value).toLowerCase();
  };
  const sortProdutos = (produtos: Produto[]): Produto[] => {
    const [field, order] = sortOption.split('-');
    return [...produtos].sort((a, b) => {
      const valueA = a[field as keyof Produto] || '';
      const valueB = b[field as keyof Produto] || '';
      if (field === 'dataVencimento') {
        const dateA = new Date(valueA as string).getTime();
        const dateB = new Date(valueB as string).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (field === 'valorUnitario') {
        return order === 'asc' ? (valueA as number) - (valueB as number) : (valueB as number) - (valueA as number);
      }
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }
      return 0;
    });
  };
  const handleRowClick = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsDetailsModalOpen(true);
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  const mapToProductDetails = (produto: Produto) => {
    return {
      atualizado_em: produto.dataHora,
      codigo: produto.codigo,
      codigo_estoque: produto.codigoEstoque,
      codigo_material: produto.codigo,
      data_criacao: produto.dataHora,
      data_vencimento: produto.dataVencimento,
      deposito: produto.deposito,
      deposito_id: "",
      descricao: produto.detalhes,
      detalhes: produto.detalhes,
      fornecedor_cnpj: produto.fornecedor_cnpj,
      fornecedor_id: produto.fornecedor,
      fornecedor_nome: produto.fornecedor_nome,
      imagem: produto.imagem,
      nome: produto.nome,
      prateleira: produto.prateleira,
      quantidade: produto.quantidadeAtual,
      quantidade_minima: produto.quantidadeMinima,
      status: produto.quantidadeAtual > 0 ? "disponivel" : "indisponivel",
      unidade: produto.unidade,
      unidade_de_medida: produto.unidade_de_medida || produto.unidade,
      valor_unitario: produto.valorUnitario
    };
  };
  const produtosFiltrados = produtos ? sortProdutos(produtos.filter(produto => {
    const termoBusca = searchTerm.toLowerCase();
    return safeToLowerCase(produto.nome).includes(termoBusca) || safeToLowerCase(produto.codigo).includes(termoBusca) || safeToLowerCase(produto.codigoEstoque).includes(termoBusca) || safeToLowerCase(produto.fornecedor_nome).includes(termoBusca) || safeToLowerCase(produto.fornecedor_cnpj).includes(termoBusca) || safeToLowerCase(produto.detalhes).includes(termoBusca);
  })) : [];

  // Cálculos de paginação
  const totalItems = produtosFiltrados.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const produtosPaginados = produtosFiltrados.slice(startIndex, endIndex);

  // Reset da página quando filtrar
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOption]);
  return <AppLayout title="Produtos">
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Input type="text" placeholder="Buscar produto por nome, código ou fornecedor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          <SearchIcon className="h-5 w-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        
        <div className="w-full md:w-64">
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <SelectValue placeholder="Ordenar por" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="codigoEstoque-asc">Código Estoque (A-Z)</SelectItem>
              <SelectItem value="codigoEstoque-desc">Código Estoque (Z-A)</SelectItem>
              <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
              <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
              <SelectItem value="valorUnitario-desc">Maior Valor</SelectItem>
              <SelectItem value="valorUnitario-asc">Menor Valor</SelectItem>
              <SelectItem value="dataVencimento-asc">Vencimento (Próximos)</SelectItem>
              <SelectItem value="dataVencimento-desc">Vencimento (Distantes)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchProdutos} title="Atualizar dados">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title="Alternar visualização">
                {viewMode === "cards" ? <Grid className="h-4 w-4" /> : <Table className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setViewMode("cards")}>
                <Grid className="h-4 w-4 mr-2" />
                Visualização em Cards
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("table")}>
                <Table className="h-4 w-4 mr-2" />
                Visualização em Tabela
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {produtosEmBaixoEstoque.length > 0 && (
            <Dialog open={alertModalOpen} onOpenChange={setAlertModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Produtos com estoque baixo" className="text-yellow-600 border-yellow-600 hover:bg-yellow-50">
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Produtos com Estoque Baixo</DialogTitle>
                </DialogHeader>
                <AlertaBaixoEstoque produtos={produtosEmBaixoEstoque} />
              </DialogContent>
            </Dialog>
          )}
        </div>
        
      </div>
  
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-4 rounded-md">
          <h3 className="font-medium">Erro ao carregar dados</h3>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-2">
            Verifique se a coleção existe no Firebase e se as permissões estão corretas.
          </p>
        </div>}
  
  
      {loading ? viewMode === "cards" ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, index) => <Card key={index} className="overflow-hidden">
                  <div className="h-56 bg-muted">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </Card>)}
          </div> : <div className="space-y-4">
            {Array(5).fill(0).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}
          </div> : produtosFiltrados.length === 0 ? <EmptyState title="Nenhum produto encontrado" description={searchTerm ? "Nenhum produto corresponde à sua busca." : error ? "Ocorreu um erro ao carregar os dados. Tente novamente." : "Adicione novos produtos para começar."} /> : <>
          {viewMode === "cards" ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {produtosPaginados.map(produto => <ProdutoCard key={produto.id} produto={produto} onEdit={() => {}} onDelete={() => handleDeleteClick(produto.id)} onAddToCart={() => handleAdicionarAoCarrinho(produto)} />)}
            </div> : <div className="rounded-md border">
          <ShadcnTable>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtosPaginados.map(produto => <TableRow key={produto.id} className="cursor-pointer hover:bg-gray-800" onClick={() => handleRowClick(produto)}>
                  <TableCell className="font-medium">{produto.codigoEstoque}</TableCell>
                  <TableCell>{produto.nome}</TableCell>
                  <TableCell>{produto.fornecedor_nome || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{produto.quantidadeAtual} {produto.unidade_de_medida || produto.unidade}</span>
                      {produto.quantidadeAtual <= produto.quantidadeMinima && <span className="text-xs text-red-500">Estoque baixo</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(produto.valorUnitario)}
                  </TableCell>
                  <TableCell>{formatDate(produto.dataVencimento)}</TableCell>
                   <TableCell className="text-right">
                     <div className="flex justify-end gap-2">
                       <Button variant="outline" size="sm" onClick={e => {
                     e.stopPropagation();
                     handleAdicionarAoCarrinho(produto);
                   }}>
                         <ShoppingCart className="h-4 w-4" />
                       </Button>
                     </div>
                   </TableCell>
                </TableRow>)}
            </TableBody>
          </ShadcnTable>
        </div>}

          {/* Paginação */}
          {totalPages > 1 && <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                  </PaginationItem>
                  
                  {/* Páginas */}
                  {Array.from({
              length: Math.min(5, totalPages)
            }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return <PaginationItem key={pageNum}>
                        <PaginationLink onClick={() => setCurrentPage(pageNum)} isActive={currentPage === pageNum} className="cursor-pointer">
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>;
            })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>}
                  
                  <PaginationItem>
                    <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>}
        </>}

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  
      <AddProdutoModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} onSuccess={fetchProdutos} />

      {selectedProduto && <ProductDetails product={mapToProductDetails(selectedProduto)} isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} onEdit={() => {
      // Implemente a lógica de edição aqui
      setIsDetailsModalOpen(false);
      // Abrir modal de edição se necessário
    }} />}
    </AppLayout>;
};
export default Produtos;