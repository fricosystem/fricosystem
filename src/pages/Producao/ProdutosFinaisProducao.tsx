import { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { PlusIcon, Save, Trash2, Edit, Package } from "lucide-react";
import { toast } from "sonner";

import { Produto, ProdutoFinal } from "@/types/typesProducao";
import { getProdutos } from "@/pages/Producao/Services/ProdutoService";
import { getProdutosFinais, salvarProdutoFinal, excluirProdutoFinal } from "@/pages/Producao/Services/ProdutoFinalService";

const ProdutosFinaisProducao = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFinais, setProdutosFinais] = useState<ProdutoFinal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<ProdutoFinal | null>(null);
  const [filtro, setFiltro] = useState("");
  
  const [novoProduto, setNovoProduto] = useState<ProdutoFinal>({
    nome: "",
    codigo: "",
    unidadeMedida: "",
    valorUnitario: 0,
    ingredientes: [],
    criadoEm: null,
    atualizadoEm: null
  });
  
  const [novoIngrediente, setNovoIngrediente] = useState({
    produtoId: "",
    quantidade: 0
  });
  
  useEffect(() => {
    carregarDados();
  }, []);
  
  const carregarDados = async () => {
    setLoading(true);
    try {
      const [produtosResult, produtosFinaisResult] = await Promise.all([
        getProdutos(),
        getProdutosFinais()
      ]);
      
      if (produtosResult.success) {
        setProdutos(produtosResult.produtos);
      } else {
        toast.error("Erro ao carregar produtos");
      }
      
      if (produtosFinaisResult.success) {
        setProdutosFinais(produtosFinaisResult.produtosFinais);
      } else {
        toast.error("Erro ao carregar produtos finais");
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };
  
  const handleAdicionarIngrediente = () => {
    if (!novoIngrediente.produtoId || novoIngrediente.quantidade <= 0) {
      toast.error("Selecione um produto e informe a quantidade");
      return;
    }
    
    const produtoSelecionado = produtos.find(p => p.id === novoIngrediente.produtoId);
    
    if (!produtoSelecionado) {
      toast.error("Produto não encontrado");
      return;
    }
    
    const jaExiste = novoProduto.ingredientes.some(i => i.produtoId === novoIngrediente.produtoId);
    
    if (jaExiste) {
      toast.error("Este ingrediente já foi adicionado");
      return;
    }
    
    const ingredienteNovo = {
      produtoId: produtoSelecionado.id,
      produtoNome: produtoSelecionado.nome,
      quantidade: novoIngrediente.quantidade,
      unidadeMedida: produtoSelecionado.unidade_de_medida
    };
    
    setNovoProduto({
      ...novoProduto,
      ingredientes: [...novoProduto.ingredientes, ingredienteNovo]
    });
    
    setNovoIngrediente({
      produtoId: "",
      quantidade: 0
    });
  };
  
  const handleRemoverIngrediente = (produtoId: string) => {
    setNovoProduto({
      ...novoProduto,
      ingredientes: novoProduto.ingredientes.filter(i => i.produtoId !== produtoId)
    });
  };
  
  const handleSalvar = async () => {
    if (!novoProduto.nome || !novoProduto.codigo || !novoProduto.unidadeMedida || novoProduto.valorUnitario <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    if (novoProduto.ingredientes.length === 0) {
      toast.error("Adicione pelo menos um ingrediente");
      return;
    }
    
    try {
      const resultado = await salvarProdutoFinal(novoProduto);
      
      if (resultado.success) {
        toast.success("Produto final salvo com sucesso");
        setDialogOpen(false);
        resetForm();
        await carregarDados();
      } else {
        toast.error(resultado.error || "Erro ao salvar produto final");
      }
    } catch (error) {
      console.error("Erro ao salvar produto final:", error);
      toast.error("Erro ao salvar produto final");
    }
  };
  
  const handleEditar = (produto: ProdutoFinal) => {
    setEditando(produto);
    setNovoProduto({
      ...produto
    });
    setDialogOpen(true);
  };
  
  const handleExcluir = async (id?: string) => {
    if (!id) return;
    
    if (!confirm("Tem certeza que deseja excluir este produto final?")) {
      return;
    }
    
    try {
      const resultado = await excluirProdutoFinal(id);
      
      if (resultado.success) {
        toast.success("Produto final excluído com sucesso");
        await carregarDados();
      } else {
        toast.error(resultado.error || "Erro ao excluir produto final");
      }
    } catch (error) {
      console.error("Erro ao excluir produto final:", error);
      toast.error("Erro ao excluir produto final");
    }
  };
  
  const resetForm = () => {
    setNovoProduto({
      nome: "",
      codigo: "",
      unidadeMedida: "",
      valorUnitario: 0,
      ingredientes: [],
      criadoEm: null,
      atualizadoEm: null
    });
    setNovoIngrediente({
      produtoId: "",
      quantidade: 0
    });
    setEditando(null);
  };
  
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };
  
  const produtosFinaisFiltrados = produtosFinais.filter(p => {
    if (!filtro) return true;
    
    const termoLower = filtro.toLowerCase();
    return (
      p.nome.toLowerCase().includes(termoLower) ||
      p.codigo.toLowerCase().includes(termoLower)
    );
  });
  
  // Usamos todos os produtos como ingredientes em potencial
  const ingredientesDisponiveis = produtos;
  
  const pageContent = () => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Spinner className="h-8 w-8" />
          <span className="ml-2">Carregando produtos finais...</span>
        </div>
      );
    }
    
    return (
      <>
        <div className="mb-6 flex items-center justify-between">
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editando ? "Editar Produto Final" : "Novo Produto Final"}
                </DialogTitle>
                <DialogDescription>
                  Crie um novo produto final a partir dos ingredientes disponíveis.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      placeholder="Nome do produto"
                      value={novoProduto.nome}
                      onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      placeholder="Código do produto"
                      value={novoProduto.codigo}
                      onChange={(e) => setNovoProduto({ ...novoProduto, codigo: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unidadeMedida">Unidade de Medida</Label>
                    <Input
                      id="unidadeMedida"
                      placeholder="Ex: kg, unid, caixa"
                      value={novoProduto.unidadeMedida}
                      onChange={(e) => setNovoProduto({ ...novoProduto, unidadeMedida: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorUnitario">Valor Unitário (R$)</Label>
                    <Input
                      id="valorUnitario"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={novoProduto.valorUnitario}
                      onChange={(e) => setNovoProduto({ ...novoProduto, valorUnitario: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label>Ingredientes</Label>
                  
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="ingrediente">Selecione um ingrediente</Label>
                      <Select
                        value={novoIngrediente.produtoId}
                        onValueChange={(value) => setNovoIngrediente({ ...novoIngrediente, produtoId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um ingrediente" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredientesDisponiveis.map((produto) => (
                            <SelectItem key={produto.id} value={produto.id}>
                              {produto.nome} ({produto.unidade_de_medida})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-24">
                      <Label htmlFor="quantidade">Qtde</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={novoIngrediente.quantidade}
                        onChange={(e) => setNovoIngrediente({ ...novoIngrediente, quantidade: parseFloat(e.target.value) })}
                      />
                    </div>
                    
                    <Button type="button" onClick={handleAdicionarIngrediente}>
                      Adicionar
                    </Button>
                  </div>
                  
                  <div className="rounded-md border">
                    <div className="p-2">
                      <h4 className="text-sm font-medium">Ingredientes adicionados</h4>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {novoProduto.ingredientes.length > 0 ? (
                        <ul className="divide-y">
                          {novoProduto.ingredientes.map((ingrediente) => (
                            <li key={ingrediente.produtoId} className="flex items-center justify-between p-3">
                              <div>
                                <span className="font-medium">{ingrediente.produtoNome}</span>
                                <span className="ml-2 text-sm text-muted-foreground">
                                  {ingrediente.quantidade} {ingrediente.unidadeMedida}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoverIngrediente(ingrediente.produtoId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Nenhum ingrediente adicionado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSalvar}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Produto Final
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mb-4">
          <Input
            placeholder="Buscar produto final por nome ou código..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produtosFinaisFiltrados.length > 0 ? (
            produtosFinaisFiltrados.map((produtoFinal) => (
              <Card key={produtoFinal.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{produtoFinal.nome}</CardTitle>
                      <CardDescription>Código: {produtoFinal.codigo}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-700">
                        {produtoFinal.valorUnitario?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || "N/A"}
                        {' / '}
                        {produtoFinal.unidadeMedida}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <h4 className="mb-2 text-sm font-medium">Ingredientes:</h4>
                  <ul className="space-y-1 text-sm">
                    {produtoFinal.ingredientes.map((ing) => (
                      <li key={ing.produtoId} className="flex justify-between">
                        <span>{ing.produtoNome}</span>
                        <span className="text-muted-foreground">
                          {ing.quantidade} {ing.unidadeMedida}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="flex justify-end gap-2 border-t bg-gray-50 p-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditar(produtoFinal)}>
                    <Edit className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleExcluir(produtoFinal.id)}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Excluir
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg text-muted-foreground">
                Nenhum produto final encontrado
              </p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Criar Produto Final
              </Button>
            </div>
          )}
        </div>
      </>
    );
  };
  
  return (
    <AppLayout title="Produtos Finais">
      {pageContent()}
    </AppLayout>
  );
};

export default ProdutosFinaisProducao;