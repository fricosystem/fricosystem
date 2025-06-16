import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase/firebase";
import { collection, getDocs, doc, updateDoc, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Plus,
  Trash2,
  X,
  ChevronDown,
  Package,
  Loader2,
  Check,
  RefreshCw,
  ArrowLeft,
  ClipboardList
} from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Produto {
  id: string;
  codigo_estoque: string;
  nome: string;
  quantidade: number;
  unidade_de_medida: string;
}

interface ItemDevolucao {
  produtoId: string;
  codigo: string;
  nome: string;
  quantidade: number;
  unidade: string;
}

interface Devolucao {
  id?: string;
  motivo: string;
  observacoes: string;
  data: string;
  itens: ItemDevolucao[];
  usuarioId: string;
  usuarioNome: string;
  usuarioCargo: string;
  dataRegistro: Date;
}

const DevolucaoMateriais = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState<ItemDevolucao[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [produtoPopoverOpen, setProdutoPopoverOpen] = useState(false);
  const [devolucao, setDevolucao] = useState<Omit<Devolucao, 'dataRegistro' | 'usuarioId' | 'usuarioNome' | 'usuarioCargo'>>({
    motivo: "",
    observacoes: "",
    data: new Date().toISOString().split('T')[0],
    itens: [],
  });
  const [view, setView] = useState<"form" | "historico">("form");
  const [historicoDevolucoes, setHistoricoDevolucoes] = useState<Devolucao[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    fetchProdutos();
    if (view === "historico") {
      fetchHistoricoDevolucoes();
    }
  }, [view]);

  const fetchProdutos = async () => {
    try {
      setIsLoading(true);
      const produtosCollection = collection(db, "produtos");
      const produtosQuery = query(produtosCollection, orderBy("nome"));
      const produtosSnapshot = await getDocs(produtosQuery);
      
      const produtosData = produtosSnapshot.docs.map(doc => ({
        id: doc.id,
        codigo_estoque: doc.data().codigo_estoque || "",
        nome: doc.data().nome || "",
        quantidade: doc.data().quantidade || 0,
        unidade_de_medida: doc.data().unidade_de_medida || "",
      })) as Produto[];
      
      setProdutos(produtosData);
      setError(null);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setError("Falha ao carregar produtos");
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoricoDevolucoes = async () => {
    try {
      setIsLoading(true);
      const devolucoesCollection = collection(db, "devolucao");
      const devolucoesQuery = query(devolucoesCollection, orderBy("dataRegistro", "desc"));
      const devolucoesSnapshot = await getDocs(devolucoesQuery);
      
      const devolucoesData = devolucoesSnapshot.docs.map(doc => ({
        id: doc.id,
        motivo: doc.data().motivo || "",
        observacoes: doc.data().observacoes || "",
        data: doc.data().data || "",
        itens: doc.data().itens || [],
        usuarioId: doc.data().usuarioId || "",
        usuarioNome: doc.data().usuarioNome || "",
        usuarioCargo: doc.data().usuarioCargo || "",
        dataRegistro: doc.data().dataRegistro?.toDate() || new Date()
      })) as Devolucao[];
      
      setHistoricoDevolucoes(devolucoesData);
    } catch (error) {
      console.error("Erro ao buscar histórico de devoluções:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar histórico de devoluções",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdicionarProduto = (produto: Produto) => {
    const produtoExistente = produtosSelecionados.find(p => p.produtoId === produto.id);

    if (produtoExistente) {
      setProdutosSelecionados(produtosSelecionados.map(p =>
        p.produtoId === produto.id ? { ...p, quantidade: p.quantidade + 1 } : p
      ));
    } else {
      setProdutosSelecionados([
        ...produtosSelecionados,
        {
          produtoId: produto.id,
          codigo: produto.codigo_estoque,
          nome: produto.nome,
          quantidade: 1,
          unidade: produto.unidade_de_medida
        }
      ]);
    }
    setProdutoPopoverOpen(false);
    setSearchTerm("");
  };

  const handleRemoverProduto = (produtoId: string) => {
    setProdutosSelecionados(produtosSelecionados.filter(p => p.produtoId !== produtoId));
  };

  const handleQuantidadeChange = (produtoId: string, quantidade: number) => {
    if (quantidade < 1) return;
    
    setProdutosSelecionados(produtosSelecionados.map(p =>
      p.produtoId === produtoId ? { ...p, quantidade } : p
    ));
  };

  const handleSubmitDevolucao = async () => {
    if (!user || !userData) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    if (produtosSelecionados.length === 0) {
      toast({
        title: "Atenção",
        description: "Adicione pelo menos um produto para devolução",
        variant: "destructive",
      });
      return;
    }

    if (!devolucao.motivo) {
      toast({
        title: "Atenção",
        description: "Informe o motivo da devolução",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Registrar a devolução
      const devolucaoRef = await addDoc(collection(db, "devolucao"), {
        ...devolucao,
        itens: produtosSelecionados,
        usuarioId: user.uid,
        usuarioNome: userData.nome,
        usuarioCargo: userData.cargo,
        dataRegistro: serverTimestamp()
      });

      // Atualizar estoque dos produtos
      const batchUpdates = produtosSelecionados.map(async item => {
        const produtoRef = doc(db, "produtos", item.produtoId);
        const produto = produtos.find(p => p.id === item.produtoId);
        
        if (produto) {
          await updateDoc(produtoRef, {
            quantidade: produto.quantidade + item.quantidade
          });
        }
      });

      await Promise.all(batchUpdates);

      toast({
        title: "Sucesso",
        description: "Devolução registrada com sucesso!",
      });

      // Resetar formulário
      setDevolucao({
        motivo: "",
        observacoes: "",
        data: new Date().toISOString().split('T')[0],
        itens: [],
      });
      setProdutosSelecionados([]);
      fetchProdutos(); // Atualizar lista de produtos com novos estoques
    } catch (error) {
      console.error("Erro ao registrar devolução:", error);
      toast({
        title: "Erro",
        description: "Falha ao registrar devolução",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Registrar Devolução</h2>
        <Button
          variant="outline"
          onClick={() => setView("historico")}
          className="flex items-center gap-2"
        >
          <ClipboardList size={16} />
          Ver Histórico
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Motivo da Devolução */}
        <div className="space-y-2 md:col-span-2">
          <Label>Motivo da Devolução*</Label>
          <Select
            value={devolucao.motivo}
            onValueChange={(value) => setDevolucao({...devolucao, motivo: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o motivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Compra em excesso">Compra em excesso</SelectItem>
              <SelectItem value="Produto com defeito">Produto com defeito</SelectItem>
              <SelectItem value="Validade próxima">Validade próxima</SelectItem>
              <SelectItem value="Erro no pedido">Erro no pedido</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data da Devolução */}
        <div className="space-y-2">
          <Label>Data da Devolução</Label>
          <Input
            type="date"
            value={devolucao.data}
            disabled
            onChange={(e) => setDevolucao({...devolucao, data: e.target.value})}
          />
        </div>

        {/* Registrado por */}
        <div className="space-y-2">
          <Label>Registrado por</Label>
          <Input
            value={userData ? `${userData.nome} (${userData.cargo})` : "Carregando..."}
            disabled
          />
        </div>

        {/* Observações */}
        <div className="space-y-2 md:col-span-2">
          <Label>Observações</Label>
          <Textarea
            placeholder="Detalhes adicionais sobre a devolução..."
            value={devolucao.observacoes}
            onChange={(e) => setDevolucao({...devolucao, observacoes: e.target.value})}
            rows={3}
          />
        </div>
      </div>

      {/* Produtos para Devolução */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Produtos para Devolução*</Label>
          <Popover open={produtoPopoverOpen} onOpenChange={setProdutoPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus size={16} />
                Adicionar Produto
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[95vw] sm:w-[400px] p-0">
              <Command>
                <CommandInput 
                  placeholder="Buscar produto..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList className="max-h-[50vh] sm:max-h-[300px]">
                  <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                  <CommandGroup>
                    {produtos.map((produto) => (
                      <CommandItem
                        key={produto.id}
                        value={`${produto.nome} ${produto.codigo_estoque}`}
                        onSelect={() => handleAdicionarProduto(produto)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            produtosSelecionados.some(p => p.produtoId === produto.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{produto.nome}</span>
                          <span className="text-xs text-gray-500">
                            Código: {produto.codigo_estoque} | Estoque: {produto.quantidade} {produto.unidade_de_medida}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {produtosSelecionados.length > 0 ? (
          <div className="border rounded-md divide-y">
            {produtosSelecionados.map((item) => (
              <div key={item.produtoId} className="p-4 flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-medium">{item.nome}</div>
                  <div className="text-sm text-gray-500">Código: {item.codigo} | Unidade: {item.unidade}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantidadeChange(item.produtoId, item.quantidade - 1)}
                      disabled={item.quantidade <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => handleQuantidadeChange(item.produtoId, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantidadeChange(item.produtoId, item.quantidade + 1)}
                    >
                      +
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoverProduto(item.produtoId)}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-md p-8 text-center text-gray-500">
            Nenhum produto selecionado para devolução
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmitDevolucao} 
          disabled={isLoading || produtosSelecionados.length === 0 || !user}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Registrar Devolução
        </Button>
      </div>
    </div>
  );

  const renderHistorico = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setView("form")}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>
        <h2 className="text-xl font-bold">Histórico de Devoluções</h2>
        <div></div> {/* Espaçador */}
      </div>

      {historicoDevolucoes.length > 0 ? (
        <div className="border rounded-md divide-y">
          {historicoDevolucoes.map((devolucao) => (
            <div key={devolucao.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">
                    {new Date(devolucao.dataRegistro).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-sm text-gray-500">Motivo: {devolucao.motivo}</div>
                </div>
                <div className="text-sm text-gray-500">
                  Registrado por: {devolucao.usuarioNome} ({devolucao.usuarioCargo})
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Produtos devolvidos:</div>
                <div className="border rounded-md divide-y">
                  {devolucao.itens.map((item, index) => (
                    <div key={index} className="p-3 flex justify-between">
                      <div>
                        <div>{item.nome}</div>
                        <div className="text-sm text-gray-500">Código: {item.codigo}</div>
                      </div>
                      <div className="text-right">
                        <div>{item.quantidade} {item.unidade}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {devolucao.observacoes && (
                <div className="mt-4">
                  <div className="text-sm font-medium">Observações:</div>
                  <div className="text-sm text-gray-600 mt-1">{devolucao.observacoes}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center text-gray-500">
          Nenhuma devolução registrada
        </div>
      )}
    </div>
  );

  if (authLoading) {
    return (
      <AppLayout title="Devolução de Materiais">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout title="Devolução de Materiais">
        <div className="flex justify-center items-center h-full">
          <p>Redirecionando para login...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Devolução de Materiais">
      <div className="h-full flex flex-col p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
            <Button 
              className="mt-4"
              onClick={fetchProdutos}
            >
              Tentar novamente
            </Button>
          </div>
        ) : view === "form" ? (
          renderForm()
        ) : (
          renderHistorico()
        )}
      </div>
    </AppLayout>
  );
};

export default DevolucaoMateriais;