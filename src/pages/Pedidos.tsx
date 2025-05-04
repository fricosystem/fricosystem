import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, serverTimestamp, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Pencil, Trash, Check, X, Filter, MessageSquare } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

interface Produto {
  id: string;
  nome: string;
  unidade_de_medida: string;
  valor_unitario: number;
  fornecedor_nome: string;
  codigo_material: string;
  contato?: string;
}

interface Pedido {
  id: string;
  material: string;
  quantidade: number;
  unidade: string;
  status: string;
  observacao: string;
  criadoPor: string;
  criadoPorId: string;
  criadoEm: Timestamp;
  produtoId?: string;
  valorUnitario?: number;
  fornecedorNome?: string;
  codigoMaterial?: string;
  prioridade?: string;
  contato?: string;
}

const Pedidos = () => {
  const { toast } = useToast();
  const { user, userData } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState<Pedido[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [loading, setLoading] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [excluirDialogAberto, setExcluirDialogAberto] = useState(false);
  const [pedidoAtual, setPedidoAtual] = useState<Pedido | null>(null);
  const [editando, setEditando] = useState(false);

  // Produtos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);

  // Campos do formulário
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("un");
  const [status, setStatus] = useState("pendente");
  const [observacao, setObservacao] = useState("");
  const [prioridade, setPrioridade] = useState("normal");
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);

  const buscarProdutos = async () => {
    try {
      setLoadingProdutos(true);
      const produtosRef = collection(db, "produtos");
      const querySnapshot = await getDocs(produtosRef);
      const produtosData: Produto[] = [];
      querySnapshot.forEach(doc => {
        produtosData.push({
          id: doc.id,
          ...doc.data()
        } as Produto);
      });
      setProdutos(produtosData);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive"
      });
    } finally {
      setLoadingProdutos(false);
    }
  };

  const buscarPedidos = async () => {
    try {
      setLoading(true);
      const pedidosRef = collection(db, "pedidos");
      const q = query(pedidosRef, orderBy("criadoEm", "desc"));
      const querySnapshot = await getDocs(q);
      const pedidosData: Pedido[] = [];
      querySnapshot.forEach(doc => {
        pedidosData.push({
          id: doc.id,
          ...doc.data()
        } as Pedido);
      });
      setPedidos(pedidosData);
      aplicarFiltro(pedidosData, filtroStatus);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarPedidos();
    buscarProdutos();
  }, []);

  const aplicarFiltro = (pedidosData: Pedido[], status: string) => {
    if (status === "todos") {
      setPedidosFiltrados(pedidosData);
    } else {
      setPedidosFiltrados(pedidosData.filter(pedido => pedido.status === status));
    }
  };

  useEffect(() => {
    aplicarFiltro(pedidos, filtroStatus);
  }, [filtroStatus, pedidos]);

  const resetarFormulario = () => {
    setQuantidade("");
    setUnidade("un");
    setStatus("pendente");
    setObservacao("");
    setPrioridade("normal");
    setProdutoSelecionado(null);
    setEditando(false);
    setPedidoAtual(null);
  };

  const selecionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setUnidade(produto.unidade_de_medida);
  };

  const handleStatusChange = async (pedidoId: string, novoStatus: string) => {
    try {
      const pedidoRef = doc(db, "pedidos", pedidoId);
      await updateDoc(pedidoRef, {
        status: novoStatus
      });

      // Atualiza o estado local
      const pedidosAtualizados = pedidos.map(pedido => pedido.id === pedidoId ? {
        ...pedido,
        status: novoStatus
      } : pedido);
      setPedidos(pedidosAtualizados);
      toast({
        title: "Status atualizado",
        description: `Pedido marcado como ${novoStatus}.`
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoSelecionado || !quantidade) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um produto e informe a quantidade.",
        variant: "destructive"
      });
      return;
    }
    try {
      // Always set status to "pendente" for new orders
      const statusToUse = editando ? status : "pendente";
      const pedidoData = {
        material: produtoSelecionado.nome,
        quantidade: Number(quantidade),
        unidade,
        status: statusToUse,
        observacao,
        criadoPor: userData?.nome || user?.email || "Usuário desconhecido",
        criadoPorId: user?.uid || "",
        prioridade
      };

      // Adicionar dados do produto selecionado, se houver
      if (produtoSelecionado) {
        Object.assign(pedidoData, {
          produtoId: produtoSelecionado.id,
          valorUnitario: produtoSelecionado.valor_unitario,
          fornecedorNome: produtoSelecionado.fornecedor_nome,
          codigoMaterial: produtoSelecionado.codigo_material,
          contato: produtoSelecionado.contato || ""
        });
      }

      if (editando && pedidoAtual) {
        // Atualizar pedido existente
        const pedidoRef = doc(db, "pedidos", pedidoAtual.id);
        await updateDoc(pedidoRef, pedidoData);
        toast({
          title: "Pedido atualizado",
          description: "O pedido foi atualizado com sucesso."
        });
      } else {
        // Criar novo pedido
        await addDoc(collection(db, "pedidos"), {
          ...pedidoData,
          criadoEm: serverTimestamp()
        });
        toast({
          title: "Pedido criado",
          description: "O pedido foi criado com sucesso."
        });
      }
      resetarFormulario();
      setFormAberto(false);
      buscarPedidos();
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o pedido.",
        variant: "destructive"
      });
    }
  };

  const abrirEditarPedido = (pedido: Pedido) => {
    setPedidoAtual(pedido);
    setQuantidade(pedido.quantidade.toString());
    setUnidade(pedido.unidade);
    setStatus(pedido.status);
    setObservacao(pedido.observacao);
    setPrioridade(pedido.prioridade || "normal");
    if (pedido.produtoId) {
      const produtoEncontrado = produtos.find(p => p.id === pedido.produtoId);
      if (produtoEncontrado) {
        setProdutoSelecionado(produtoEncontrado);
      }
    } else {
      setProdutoSelecionado(null);
    }
    setEditando(true);
    setFormAberto(true);
  };

  const confirmarExcluirPedido = (pedido: Pedido) => {
    setPedidoAtual(pedido);
    setExcluirDialogAberto(true);
  };

  const excluirPedido = async () => {
    if (!pedidoAtual) return;
    try {
      await deleteDoc(doc(db, "pedidos", pedidoAtual.id));
      toast({
        title: "Pedido excluído",
        description: "O pedido foi excluído com sucesso."
      });
      buscarPedidos();
      setExcluirDialogAberto(false);
    } catch (error) {
      console.error("Erro ao excluir pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o pedido.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "realizado":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPrioridadeBadgeClass = (prioridade?: string) => {
    switch (prioridade) {
      case "urgente":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "normal":
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  const abrirWhatsApp = (contato?: string) => {
    if (!contato) {
      toast({
        title: "Contato não disponível",
        description: "Este fornecedor não possui contato cadastrado.",
        variant: "destructive"
      });
      return;
    }

    // Limpar o número, removendo caracteres não numéricos
    const numeroLimpo = contato.replace(/\D/g, '');

    // Verificar se o número tem pelo menos 8 dígitos
    if (numeroLimpo.length < 8) {
      toast({
        title: "Contato inválido",
        description: "O número de contato parece ser inválido.",
        variant: "destructive"
      });
      return;
    }

    // Criar URL do WhatsApp
    const url = `https://wa.me/${numeroLimpo}`;
    window.open(url, '_blank');
  };

  // Formatar valor para moeda brasileira
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <AppLayout title="Pedidos">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
          <Button onClick={() => {
            resetarFormulario();
            setFormAberto(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Novo Pedido
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="realizado">Realizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {pedidosFiltrados.length} pedidos encontrados
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {pedidosFiltrados.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor Unit.</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado por</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidosFiltrados.map(pedido => (
                        <TableRow key={pedido.id}>
                          <TableCell>
                            <div>
                              <div>{pedido.material}</div>
                              {pedido.codigoMaterial && (
                                <div className="text-xs text-muted-foreground">
                                  Cód: {pedido.codigoMaterial}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {pedido.quantidade} {pedido.unidade}
                          </TableCell>
                          <TableCell>
                            {pedido.valorUnitario ? formatarMoeda(pedido.valorUnitario) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {pedido.fornecedorNome || '-'}
                              {pedido.contato && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirWhatsApp(pedido.contato)} title="Enviar mensagem pelo WhatsApp">
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeBadgeClass(pedido.prioridade)}`}>
                              {(pedido.prioridade || "Normal").charAt(0).toUpperCase() + (pedido.prioridade || "Normal").slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(pedido.status)}`}>
                              {pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>{pedido.criadoPor}</TableCell>
                          <TableCell className="flex justify-end gap-2">
                            {pedido.status === "pendente" && (
                              <Button variant="outline" size="sm" onClick={() => handleStatusChange(pedido.id, "realizado")} title="Marcar como realizado">
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {pedido.status === "pendente" && (
                              <Button variant="outline" size="sm" onClick={() => handleStatusChange(pedido.id, "cancelado")} title="Cancelar pedido">
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            {/* Mostrar botão de edição apenas se o usuário for o criador do pedido ou admin */}
                            {(user?.uid === pedido.criadoPorId || userData?.cargo === 'admin') && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => abrirEditarPedido(pedido)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => confirmarExcluirPedido(pedido)}>
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8">
                  <Package className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-xl font-semibold">Nenhum pedido encontrado</p>
                  <p className="text-muted-foreground mt-2">
                    {filtroStatus !== "todos" ? `Não há pedidos com status "${filtroStatus}".` : "Crie um novo pedido para começar."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para criar/editar pedido */}
      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Pedido" : "Novo Pedido"}</DialogTitle>
            <DialogDescription>
              {editando ? "Edite os detalhes do pedido abaixo." : "Preencha os dados para criar um novo pedido de material."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="produto">Selecionar Produto *</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {produtoSelecionado ? produtoSelecionado.nome : "Selecione um produto"}
                      <span className="ml-2">▼</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full max-h-[300px] overflow-y-auto">
                    {loadingProdutos ? (
                      <div className="flex justify-center p-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      </div>
                    ) : produtos.length > 0 ? (
                      produtos.map(produto => (
                        <DropdownMenuItem key={produto.id} onClick={() => selecionarProduto(produto)} className="cursor-pointer">
                          <div className="w-full">
                            <p className="font-medium">{produto.nome}</p>
                            <div className="flex flex-col text-xs text-muted-foreground">
                              <span>Valor: {formatarMoeda(produto.valor_unitario)}</span>
                              <span>Fornecedor: {produto.fornecedor_nome}</span>
                              <span>Cód: {produto.codigo_material}</span>
                              {produto.contato && <span>Contato: {produto.contato}</span>}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Nenhum produto encontrado
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {produtoSelecionado && (
                <div className="grid gap-2 p-4 border rounded-md bg-muted/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Valor Unitário:</span>
                    <span>{formatarMoeda(produtoSelecionado.valor_unitario)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Fornecedor:</span>
                    <span>{produtoSelecionado.fornecedor_nome}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Código do Material:</span>
                    <span>{produtoSelecionado.codigo_material}</span>
                  </div>
                  {produtoSelecionado.contato && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Contato:</span>
                      <span>{produtoSelecionado.contato}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input id="quantidade" type="number" min="0" step="0.01" value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="0" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unidade">Unidade</Label>
                  <Input id="unidade" value={unidade} onChange={e => setUnidade(e.target.value)} readOnly className="bg-gray-950" />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={prioridade} onValueChange={setPrioridade}>
                  <SelectTrigger id="prioridade">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Status is now hidden when creating a new order */}
              {editando && (
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="realizado">Realizado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea id="observacao" value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Informações adicionais sobre o pedido" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                resetarFormulario();
                setFormAberto(false);
              }}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para excluir pedido */}
      <Dialog open={excluirDialogAberto} onOpenChange={setExcluirDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Pedido</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcluirDialogAberto(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={excluirPedido}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Pedidos;