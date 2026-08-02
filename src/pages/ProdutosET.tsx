import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useProdutos } from "@/pages/EntradaManualTransferencia/contexts/ProdutoContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronUp, ChevronDown, Edit, Eye, Loader2, Trash2, Filter, ArrowDownUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Produto, depositos, unidades } from "@/pages/EntradaManualTransferencia/types/types";

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

const ProdutosET = () => {
  const { 
    produtos, 
    loading, 
    hasMore, 
    carregarProdutos, 
    carregarMaisProdutos, 
    excluirProduto,
    atualizarProduto
  } = useProdutos();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCodigo, setFiltroCodigo] = useState("");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [filtroDeposito, setFiltroDeposito] = useState("");
  const [filtroUnidade, setFiltroUnidade] = useState("");
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "nome",
    direction: "asc",
  });
  
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [produtoEditado, setProdutoEditado] = useState<Produto | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);

  // Verificar se há um ID de produto na URL
  useEffect(() => {
    const produtoId = searchParams.get("id");
    if (produtoId) {
      const produtoEncontrado = produtos.find(p => p.id === produtoId);
      if (produtoEncontrado) {
        setProdutoSelecionado(produtoEncontrado);
      }
    }
  }, [searchParams, produtos]);

  // Carregar produtos na primeira renderização e quando filtros ou ordenação mudarem
  useEffect(() => {
    const filtros: any = {};
    
    if (filtroCodigo) filtros.codigo_estoque = parseInt(filtroCodigo);
    if (filtroNome) filtros.nome = filtroNome;
    if (filtroFornecedor) filtros.fornecedor_nome = filtroFornecedor;
    if (filtroDeposito) filtros.deposito = filtroDeposito;
    if (filtroUnidade) filtros.unidade = filtroUnidade;
    
    carregarProdutos(filtros, sortConfig.key, sortConfig.direction);
  }, [filtroCodigo, filtroNome, filtroFornecedor, filtroDeposito, filtroUnidade, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(currentSortConfig => {
      if (currentSortConfig.key === key) {
        return {
          key,
          direction: currentSortConfig.direction === "asc" ? "desc" : "asc",
        };
      } else {
        return {
          key,
          direction: "asc",
        };
      }
    });
  };

  const handleExcluirProduto = async () => {
    if (!produtoParaExcluir || !produtoParaExcluir.id) return;
    
    setIsDeleteLoading(true);
    try {
      await excluirProduto(produtoParaExcluir.id);
      setProdutoParaExcluir(null);
      setProdutoSelecionado(null);
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleSalvarEdicao = async () => {
    if (!produtoEditado || !produtoEditado.id) return;
    
    setIsEditLoading(true);
    try {
      await atualizarProduto(produtoEditado.id, produtoEditado);
      setIsEditMode(false);
      setProdutoSelecionado(produtoEditado);
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
    } finally {
      setIsEditLoading(false);
    }
  };

  const limparFiltros = () => {
    setFiltroNome("");
    setFiltroCodigo("");
    setFiltroFornecedor("");
    setFiltroDeposito("");
    setFiltroUnidade("");
  };

  // Formatar valor para moeda brasileira
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(valor);
  };

  // Formatar data
  const formatarData = (dataString: string) => {
    if (!dataString) return "-";
    try {
      const [ano, mes, dia] = dataString.split("-");
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dataString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                placeholder="Buscar por código"
                value={filtroCodigo}
                onChange={(e) => setFiltroCodigo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto</Label>
              <Input
                id="nome"
                placeholder="Buscar por nome"
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input
                id="fornecedor"
                placeholder="Buscar por fornecedor"
                value={filtroFornecedor}
                onChange={(e) => setFiltroFornecedor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposito">Depósito</Label>
              <Select 
                value={filtroDeposito} 
                onValueChange={setFiltroDeposito}
              >
                <SelectTrigger id="deposito">
                  <SelectValue placeholder="Todos os depósitos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os depósitos</SelectItem>
                  {depositos.map((deposito) => (
                    <SelectItem key={deposito} value={deposito}>
                      {deposito}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade/Filial</Label>
              <Select 
                value={filtroUnidade} 
                onValueChange={setFiltroUnidade}
              >
                <SelectTrigger id="unidade">
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {unidades.map((unidade) => (
                    <SelectItem key={unidade} value={unidade}>
                      {unidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button variant="outline" onClick={limparFiltros}>
            Limpar Filtros
          </Button>
          <Button 
            onClick={() => {
              const filtros: any = {};
              if (filtroCodigo) filtros.codigo_estoque = parseInt(filtroCodigo);
              if (filtroNome) filtros.nome = filtroNome;
              if (filtroFornecedor) filtros.fornecedor_nome = filtroFornecedor;
              if (filtroDeposito) filtros.deposito = filtroDeposito;
              if (filtroUnidade) filtros.unidade = filtroUnidade;
              
              carregarProdutos(filtros, sortConfig.key, sortConfig.direction);
            }}
            className="bg-inventory-primary hover:bg-inventory-primary-light"
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </CardFooter>
      </Card>

      {/* Tabela de produtos */}
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="w-[100px] cursor-pointer"
                    onClick={() => handleSort("codigo_estoque")}
                  >
                    <div className="flex items-center">
                      Código
                      {sortConfig.key === "codigo_estoque" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("nome")}
                  >
                    <div className="flex items-center">
                      Produto
                      {sortConfig.key === "nome" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort("quantidade")}
                  >
                    <div className="flex items-center justify-end">
                      Quantidade
                      {sortConfig.key === "quantidade" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Valor Unitário</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && produtos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <span className="mt-2 text-sm text-muted-foreground">Carregando produtos...</span>
                    </TableCell>
                  </TableRow>
                ) : produtos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <p className="text-muted-foreground">Nenhum produto encontrado</p>
                      <p className="text-sm text-muted-foreground mt-2">Tente ajustar os filtros ou cadastre novos produtos</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  produtos.map((produto) => (
                    <TableRow key={produto.id} className={produto.quantidade < produto.quantidade_minima ? "bg-red-50" : ""}>
                      <TableCell>{produto.codigo_estoque}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{produto.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {produto.codigo_material}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{produto.fornecedor_nome}</TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        produto.quantidade < produto.quantidade_minima && "text-red-500"
                      )}>
                        {produto.quantidade} {produto.unidade_de_medida}
                        {produto.quantidade < produto.quantidade_minima && (
                          <p className="text-xs text-red-500">Estoque baixo</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatarMoeda(produto.valor_unitario)}</TableCell>
                      <TableCell>{produto.deposito}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-1">
                          <Dialog open={produtoSelecionado?.id === produto.id} onOpenChange={(open) => {
                            if (!open) {
                              setProdutoSelecionado(null);
                              setIsEditMode(false);
                              setSearchParams({});
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setProdutoSelecionado(produto);
                                  setProdutoEditado(produto);
                                  setIsEditMode(false);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>
                                  {isEditMode ? "Editar Produto" : "Detalhes do Produto"}
                                </DialogTitle>
                                <DialogDescription>
                                  {isEditMode ? "Edite as informações do produto abaixo." : "Informações detalhadas do produto."}
                                </DialogDescription>
                              </DialogHeader>
                              
                              {produtoSelecionado && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-muted-foreground">Código</Label>
                                      <p className="font-medium">{produtoSelecionado.codigo_estoque}</p>
                                    </div>
                                    
                                    <div>
                                      <Label>Nome do Produto</Label>
                                      {isEditMode ? (
                                        <Input
                                          value={produtoEditado?.nome}
                                          onChange={(e) => setProdutoEditado({
                                            ...produtoEditado!,
                                            nome: e.target.value
                                          })}
                                        />
                                      ) : (
                                        <p className="font-medium">{produtoSelecionado.nome}</p>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <Label>Código Material</Label>
                                      {isEditMode ? (
                                        <Input
                                          value={produtoEditado?.codigo_material}
                                          onChange={(e) => setProdutoEditado({
                                            ...produtoEditado!,
                                            codigo_material: e.target.value
                                          })}
                                        />
                                      ) : (
                                        <p>{produtoSelecionado.codigo_material}</p>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <Label>Fornecedor</Label>
                                      {isEditMode ? (
                                        <Input
                                          value={produtoEditado?.fornecedor_nome}
                                          onChange={(e) => setProdutoEditado({
                                            ...produtoEditado!,
                                            fornecedor_nome: e.target.value
                                          })}
                                        />
                                      ) : (
                                        <p>{produtoSelecionado.fornecedor_nome}</p>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <Label>CNPJ</Label>
                                      {isEditMode ? (
                                        <Input
                                          value={produtoEditado?.fornecedor_cnpj}
                                          onChange={(e) => setProdutoEditado({
                                            ...produtoEditado!,
                                            fornecedor_cnpj: e.target.value
                                          })}
                                        />
                                      ) : (
                                        <p>{produtoSelecionado.fornecedor_cnpj}</p>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <Label>Data de Entrada</Label>
                                      <p>{formatarData(produtoSelecionado.data_criacao)}</p>
                                    </div>
                                    
                                    {produtoSelecionado.data_vencimento && (
                                      <div>
                                        <Label>Data de Vencimento</Label>
                                        <p>{formatarData(produtoSelecionado.data_vencimento)}</p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Quantidade</Label>
                                      {isEditMode ? (
                                        <Input
                                          type="number"
                                          value={produtoEditado?.quantidade}
                                          min="0"
                                          onChange={(e) => setProdutoEditado({
                                            ...produtoEditado!,
                                            quantidade: parseFloat(e.target.value)
                                          })}
                                        />
                                      ) : (
                                        <p className={cn(
                                          "font-medium",
                                          produtoSelecionado.quantidade < produtoSelecionado.quantidade_minima && "text-red-500"
                                        )}>
                                          {produtoSelecionado.quantidade} {produtoSelecionado.unidade_de_medida}
                                          {produtoSelecionado.quantidade < produtoSelecionado.quantidade_minima && (
                                            <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                              Estoque baixo
                                            </span>
                                          )}
                                        </p>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <Label>Quantidade Mínima</Label>
                                      {isEditMode ? (
                                        <Input
                                          type="number"
                                          value={produtoEditado?.quantidade_minima}
                                          min="0"
                                          onChange={(e) => setProdutoEditado({
                                            ...produtoEditado!,
                                            quantidade_minima: parseFloat(e.target.value)
                                          })}
                                        />
                                      ) : (
                                        <p>{produtoSelecionado.quantidade_minima} {produtoSelecionado.unidade_de_medida}</p>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <Label>Valor Unitário</Label>
                                      {isEditMode ? (
                                        <Input
                                          type="number"
                                          value={produtoEditado?.valor_unitario}
                                          min="0"
                                          step="0.01"
                                          onChange={(e) => setProdutoEditado({
                                            ...produtoEditado!,
                                            valor_unitario: parseFloat(e.target.value)
                                          })}
                                        />
                                      ) : (
                                        <p>{formatarMoeda(produtoSelecionado.valor_unitario)}</p>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <Label>Unidade/Filial</Label>
                                      {isEditMode ? (
                                        <Select 
                                          value={produtoEditado?.unidade}
                                          onValueChange={(value) => setProdutoEditado({
                                            ...produtoEditado!,
                                            unidade: value
                                          })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {unidades.map((unidade) => (
                                              <SelectItem key={unidade} value={unidade}>
                                                {unidade}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <p>{produtoSelecionado.unidade}</p>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <Label>Depósito</Label>
                                      {isEditMode ? (
                                        <Select 
                                          value={produtoEditado?.deposito}
                                          onValueChange={(value) => setProdutoEditado({
                                            ...produtoEditado!,
                                            deposito: value
                                          })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {depositos.map((deposito) => (
                                              <SelectItem key={deposito} value={deposito}>
                                                {deposito}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <p>{produtoSelecionado.deposito}</p>
                                      )}
                                    </div>
                                    
                                    {produtoSelecionado.prateleira && (
                                      <div>
                                        <Label>Prateleira/Localização</Label>
                                        {isEditMode ? (
                                          <Input
                                            value={produtoEditado?.prateleira}
                                            onChange={(e) => setProdutoEditado({
                                              ...produtoEditado!,
                                              prateleira: e.target.value
                                            })}
                                          />
                                        ) : (
                                          <p>{produtoSelecionado.prateleira}</p>
                                        )}
                                      </div>
                                    )}
                                    
                                    {produtoSelecionado.detalhes && (
                                      <div>
                                        <Label>Detalhes adicionais</Label>
                                        <p className="text-sm text-muted-foreground">
                                          {produtoSelecionado.detalhes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <DialogFooter>
                                {isEditMode ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setIsEditMode(false);
                                        setProdutoEditado(produtoSelecionado);
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={handleSalvarEdicao}
                                      disabled={isEditLoading}
                                      className="bg-inventory-primary hover:bg-inventory-primary-light"
                                    >
                                      {isEditLoading ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Salvando...
                                        </>
                                      ) : (
                                        "Salvar Alterações"
                                      )}
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          onClick={() => setProdutoParaExcluir(produtoSelecionado)}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Excluir
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza que deseja excluir o produto "{produtoParaExcluir?.nome}"?
                                            Esta ação não pode ser desfeita.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={handleExcluirProduto}
                                            className="bg-destructive text-destructive-foreground"
                                          >
                                            {isDeleteLoading ? (
                                              <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Excluindo...
                                              </>
                                            ) : (
                                              "Confirmar Exclusão"
                                            )}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                    <Button 
                                      type="button"
                                      onClick={() => setIsEditMode(true)}
                                      className="bg-inventory-primary hover:bg-inventory-primary-light"
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </Button>
                                  </>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProdutoSelecionado(produto);
                              setProdutoEditado(produto);
                              setIsEditMode(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setProdutoParaExcluir(produto)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o produto "{produtoParaExcluir?.nome}"?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleExcluirProduto}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  {isDeleteLoading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Excluindo...
                                    </>
                                  ) : (
                                    "Confirmar Exclusão"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {loading && produtos.length > 0 && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          
          {!loading && hasMore && (
            <div className="mt-4 flex justify-center">
              <Button 
                onClick={carregarMaisProdutos}
                variant="outline"
              >
                <ArrowDownUp className="mr-2 h-4 w-4" />
                Carregar Mais Produtos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProdutosET;