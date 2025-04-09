import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, FileDown, Package, ArrowUpDown, Trash2, Loader2 } from "lucide-react";

import AppLayout from "@/layouts/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProdutoCard from "@/components/ProdutoCard";
import EmptyState from "@/components/EmptyState";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import useProdutos from "@/hooks/useProdutos";

const Produtos = () => {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [produtoSelecionado, setProdutoSelecionado] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { 
    filteredProdutos, 
    searchTerm, 
    handleSearch, 
    deleteProduto,
    loading 
  } = useProdutos();

  const handleEdit = (id: string) => {
    navigate(`/produtos/${id}/editar`);
  };

  const handleDelete = (id: string) => {
    setProdutoSelecionado(id);
  };

  const confirmDelete = async () => {
    if (produtoSelecionado) {
      await deleteProduto(produtoSelecionado);
      setProdutoSelecionado(null);
    }
  };

  const exportarRelatorio = (formato: "excel" | "pdf") => {
    // This is just a UI simulation, in a real app we would generate and download a file
    // We'll keep this functionality as is for now
  };

  if (loading) {
    return (
      <AppLayout title="Produtos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Carregando produtos...</span>
        </div>
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
                Centro de Custo
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked>
                Alimentos Básicos
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                Produtos Hortifrúti
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                Congelados
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                Depósito
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked>
                Depósito A
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>
                Depósito B
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>
                Depósito C
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                Status de Estoque
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem>
                Estoque Baixo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                Estoque Normal
              </DropdownMenuCheckboxItem>
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

          <Button onClick={() => navigate("/produtos/novo")}>
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
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
                description="Nenhum produto corresponde aos critérios de busca."
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
                  />
                ))}
              </div>
            ) : (
              <div className="border rounded-md">
                <table className="data-table">
                  <thead className="data-table-header">
                    <tr>
                      <th className="data-table-head">
                        <div className="flex items-center space-x-1">
                          <span>Código</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th className="data-table-head">
                        <div className="flex items-center space-x-1">
                          <span>Nome</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th className="data-table-head">Centro de Custo</th>
                      <th className="data-table-head">
                        <div className="flex items-center space-x-1">
                          <span>Quantidade</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th className="data-table-head">
                        <div className="flex items-center space-x-1">
                          <span>Valor Unit.</span>
                          <ArrowUpDown size={14} />
                        </div>
                      </th>
                      <th className="data-table-head">Depósito</th>
                      <th className="data-table-head">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="data-table-body">
                    {filteredProdutos.map((produto) => (
                      <tr key={produto.id} className="data-table-row">
                        <td className="data-table-cell">{produto.codigo}</td>
                        <td className="data-table-cell">
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
                        <td className="data-table-cell">{produto.centroDeCusto}</td>
                        <td className="data-table-cell">
                          <span className={produto.quantidadeAtual <= produto.quantidadeMinima ? "text-destructive font-medium" : ""}>
                            {produto.quantidadeAtual} / {produto.quantidadeMinima}
                          </span>
                        </td>
                        <td className="data-table-cell">R$ {produto.valorUnitario.toFixed(2)}</td>
                        <td className="data-table-cell">{produto.deposito}</td>
                        <td className="data-table-cell">
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
            {filteredProdutos.filter(p => p.quantidadeAtual <= p.quantidadeMinima).length === 0 ? (
              <EmptyState
                title="Nenhum produto com estoque baixo"
                description="Todos os produtos estão com estoque adequado."
                icon={<Package size={50} />}
              />
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProdutos
                  .filter(p => p.quantidadeAtual <= p.quantidadeMinima)
                  .map((produto) => (
                    <ProdutoCard
                      key={produto.id}
                      produto={produto}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
              </div>
            ) : (
              <div className="border rounded-md">
                <table className="data-table">
                  <thead className="data-table-header">
                    <tr>
                      <th className="data-table-head">Código</th>
                      <th className="data-table-head">Nome</th>
                      <th className="data-table-head">Centro de Custo</th>
                      <th className="data-table-head">Quantidade</th>
                      <th className="data-table-head">Valor Unit.</th>
                      <th className="data-table-head">Depósito</th>
                      <th className="data-table-head">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="data-table-body">
                    {filteredProdutos
                      .filter(p => p.quantidadeAtual <= p.quantidadeMinima)
                      .map((produto) => (
                        <tr key={produto.id} className="data-table-row">
                          <td className="data-table-cell">{produto.codigo}</td>
                          <td className="data-table-cell">
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
                          <td className="data-table-cell">{produto.centroDeCusto}</td>
                          <td className="data-table-cell">
                            <span className="text-destructive font-medium">
                              {produto.quantidadeAtual} / {produto.quantidadeMinima}
                            </span>
                          </td>
                          <td className="data-table-cell">R$ {produto.valorUnitario.toFixed(2)}</td>
                          <td className="data-table-cell">{produto.deposito}</td>
                          <td className="data-table-cell">
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

      <AlertDialog open={produtoSelecionado !== null} onOpenChange={() => setProdutoSelecionado(null)}>
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
