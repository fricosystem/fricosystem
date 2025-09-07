import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import AppLayout from "@/layouts/AppLayout";
import { db } from "@/firebase/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, setDoc, getDoc, addDoc, Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ProdutoProvider, useProdutos } from "@/pages/EntradaManualTransferencia/contexts/ProdutoContext";
import { TransferenciaProvider, useTransferencias } from "@/pages/EntradaManualTransferencia/contexts/TransferenciaContext";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProdutoTransferido } from "@/pages/EntradaManualTransferencia/types/types";
import { Produto } from "@/pages/EntradaManualTransferencia/types/types";
import { Button } from "@/components/ui/button";

const TransferenciasETContent = () => {
  const { produtos, carregarProdutos, loading: produtosLoading } = useProdutos();
  const { transferencias, carregarTransferencias, realizarTransferencia, loading: transferenciasLoading } = useTransferencias();
  const { userData } = useAuth();
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [produtosTransferencia, setProdutosTransferencia] = useState<ProdutoTransferido[]>([]);
  const [pesquisaProduto, setPesquisaProduto] = useState("");
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [depositos, setDepositos] = useState<{id: string, deposito: string, unidade: string}[]>([]);
  const [loadingDepositos, setLoadingDepositos] = useState(true);
  const [popoverOrigemOpen, setPopoverOrigemOpen] = useState(false);
  const [popoverDestinoOpen, setPopoverDestinoOpen] = useState(false);

  useEffect(() => {
    carregarDepositos();
  }, []);

  const [alerta, setAlerta] = useState<{
    tipo: 'sucesso' | 'erro' | 'info';
    mensagem: string;
    visivel: boolean;
  }>({ tipo: 'info', mensagem: '', visivel: false });

  useEffect(() => {
    carregarProdutos();
    carregarTransferencias();
  }, []);

  useEffect(() => {
    if (pesquisaProduto.trim() === "") {
      setProdutosFiltrados([]);
    } else {
      const filtrados = produtos.filter(p => 
        p.nome.toLowerCase().includes(pesquisaProduto.toLowerCase()) ||
        p.codigo_estoque.toString().includes(pesquisaProduto)
      );
      setProdutosFiltrados(filtrados);
    }
  }, [pesquisaProduto, produtos]);

  const formSchema = z.object({
    origem: z.string().min(1, "Selecione um depósito de origem"),
    destino: z.string().min(1, "Selecione um depósito de destino"),
    observacoes: z.string().optional(),
  }).refine(data => data.origem !== data.destino, {
    message: "Os depósitos de origem e destino não podem ser iguais",
    path: ["destino"],
  });

  const carregarDepositos = async () => {
    setLoadingDepositos(true);
    try {
      const depositosRef = collection(db, "depositos");
      const depositosQuery = query(depositosRef, orderBy("deposito"));
      const snapshot = await getDocs(depositosQuery);
      
      const depositosData = snapshot.docs.map(doc => ({
        id: doc.id,
        deposito: doc.data().deposito,
        unidade: doc.data().unidade
      }));
      
      setDepositos(depositosData);
    } catch (error) {
      console.error("Erro ao carregar depósitos:", error);
    } finally {
      setLoadingDepositos(false);
    }
  };

  const formTransferencia = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origem: "",
      destino: "",
      observacoes: "",
    },
  });

  const quantidadeSchema = z.object({
    quantidade: z.coerce
      .number({
        invalid_type_error: "Deve ser um número",
        required_error: "Campo obrigatório"
      })
      .min(1, "A quantidade deve ser maior que zero")
      .superRefine((val, ctx) => {
        if (!produtoSelecionado) return;
        
        // Verifica se a quantidade é <= 0
        if (val <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O produto não tem quantidade disponível para transferência",
          });
          return;
        }
  
        // Verifica se excede o estoque disponível
        if (val > produtoSelecionado.quantidade) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Quantidade superior ao estoque disponível",
          });
          return;
        }
  
        // Verifica se a soma com quantidades já adicionadas excede o estoque
        const produtoExistente = produtosTransferencia.find(p => p.id === produtoSelecionado.id);
        if (produtoExistente && (produtoExistente.quantidade + val) > produtoSelecionado.quantidade) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Quantidade total excede o estoque disponível",
          });
        }
      }),
  });

  const formQuantidade = useForm<z.infer<typeof quantidadeSchema>>({
    resolver: zodResolver(quantidadeSchema),
    defaultValues: {
      quantidade: 1,
    },
  });

  const handleBuscarProduto = () => {
    if (pesquisaProduto.trim() === "") return;
  };

  const handleSelecionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setPesquisaProduto("");
    setProdutosFiltrados([]);
    formQuantidade.reset({ quantidade: 1 });
  };
  
  const handleToggleSelecionarProduto = (produto: Produto, isChecked: boolean) => {
    if (isChecked) {
      setProdutosSelecionados(prev => [...prev, produto]);
    } else {
      setProdutosSelecionados(prev => prev.filter(p => p.id !== produto.id));
    }
  };
  
  const handleAdicionarMultiplosProdutos = () => {
    if (produtosSelecionados.length === 0) return;
    
    const novosProdutosTransferencia = produtosSelecionados.map(produto => ({
      id: produto.id || '',
      codigo_estoque: produto.codigo_estoque,
      nome: produto.nome,
      quantidade: 1,
      quantidadeAtual: produto.quantidade
    }));
    
    const produtosNaoDuplicados = novosProdutosTransferencia.filter(
      novoProduto => !produtosTransferencia.some(p => p.id === novoProduto.id)
    );
    
    setProdutosTransferencia(prev => [...prev, ...produtosNaoDuplicados]);
    setProdutosSelecionados([]);
    setPesquisaProduto("");
    setProdutosFiltrados([]);
  };

  const handleAdicionarProdutoTransferencia = (data: z.infer<typeof quantidadeSchema>) => {
    if (!produtoSelecionado) return;
    
    const existente = produtosTransferencia.find(p => p.id === produtoSelecionado.id);
    
    if (existente) {
      setProdutosTransferencia(prev =>
        prev.map(p =>
          p.id === produtoSelecionado.id
            ? { ...p, quantidade: p.quantidade + data.quantidade }
            : p
        )
      );
    } else {
      setProdutosTransferencia(prev => [
        ...prev,
        {
          id: produtoSelecionado.id || '',
          codigo_estoque: produtoSelecionado.codigo_estoque,
          nome: produtoSelecionado.nome,
          quantidade: data.quantidade,
          quantidadeAtual: produtoSelecionado.quantidade
        }
      ]);
    }
    
    setProdutoSelecionado(null);
    formQuantidade.reset({ quantidade: 1 });
  };

  const handleRemoverProdutoTransferencia = (id: string) => {
    setProdutosTransferencia(prev => prev.filter(p => p.id !== id));
  };
  
  const handleAtualizarQuantidadeProdutoTransferencia = (id: string, quantidade: number) => {
    const produto = produtosTransferencia.find(p => p.id === id);
    if (!produto) return;
  
    const produtoOriginal = produtos.find(p => p.id === id);
    
    if (quantidade <= 0) {
      // Define como 1 e mostra mensagem de erro
      setAlerta({
        tipo: 'erro',
        mensagem: 'O produto não tem quantidade disponível para transferência',
        visivel: true
      });
      quantidade = 1;
    } else if (produtoOriginal && quantidade > produtoOriginal.quantidade) {
      // Se exceder o estoque, define como o máximo disponível
      setAlerta({
        tipo: 'erro',
        mensagem: 'Quantidade superior ao estoque disponível',
        visivel: true
      });
      quantidade = produtoOriginal.quantidade;
    }
  
    setProdutosTransferencia(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, quantidade }
          : p
      )
    );
  };

  const limparFormularios = () => {
    formTransferencia.reset({
      origem: "",
      destino: "",
      observacoes: "",
    });
    setProdutosTransferencia([]);
    setProdutosSelecionados([]);
    setPesquisaProduto("");
    setProdutosFiltrados([]);
    setProdutoSelecionado(null);
  };

  const handleEnviarTransferencia = async (data: z.infer<typeof formSchema>) => {
    if (produtosTransferencia.length === 0) {
      setAlerta({
        tipo: 'erro',
        mensagem: 'Adicione pelo menos um produto para realizar a transferência',
        visivel: true
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const depositoOrigem = depositos.find(d => d.id === data.origem);
      const depositoDestino = depositos.find(d => d.id === data.destino);
      
      if (!depositoOrigem || !depositoDestino) {
        throw new Error("Depósito de origem ou destino não encontrado");
      }
      
      const origemTexto = `${depositoOrigem.deposito} - ${depositoOrigem.unidade}`;
      const destinoTexto = `${depositoDestino.deposito} - ${depositoDestino.unidade}`;
      
      await realizarTransferencia(
        produtosTransferencia,
        origemTexto,
        destinoTexto,
        data.observacoes || ""
      );
      
      for (const produto of produtosTransferencia) {
        const produtoOrigemRef = doc(db, "produtos", produto.id);
        await updateDoc(produtoOrigemRef, {
          quantidade: produtos.find(p => p.id === produto.id)?.quantidade - produto.quantidade
        });
        
        const produtoDestinoRef = doc(db, "produtos", `${produto.id}_${data.destino}`);
        const produtoDestinoSnap = await getDoc(produtoDestinoRef);
        
        if (produtoDestinoSnap.exists()) {
          await updateDoc(produtoDestinoRef, {
            quantidade: produtoDestinoSnap.data().quantidade + produto.quantidade
          });
        } else {
          const produtoOriginal = produtos.find(p => p.id === produto.id);
          if (produtoOriginal) {
            await setDoc(produtoDestinoRef, {
              ...produtoOriginal,
              quantidade: produto.quantidade,
              deposito: data.destino,
              id: `${produto.id}_${data.destino}`
            });
          }
        }

        // Salvar relatório da transferência - SAÍDA da origem
        const produtoOriginal = produtos.find(p => p.id === produto.id);
        const relatorioSaidaData = {
          requisicao_id: produto.id,
          produto_id: produto.id,
          codigo_material: produto.codigo_estoque,
          nome_produto: produto.nome,
          quantidade: produto.quantidade,
          valor_unitario: produtoOriginal?.valor_unitario || 0,
          valor_total: (produtoOriginal?.valor_unitario || 0) * produto.quantidade,
          status: 'saida',
          tipo: "Transferência",
          solicitante: {
            id: userData?.id || 'system',
            nome: userData?.nome || 'Sistema',
            cargo: userData?.cargo || 'Administrador'
          },
          usuario: {
            id: userData?.id || 'system',
            nome: userData?.nome || 'Sistema',
            email: userData?.email || 'sistema@empresa.com'
          },
          deposito: origemTexto,
          prateleira: produtoOriginal?.prateleira || "Não endereçado",
          centro_de_custo: origemTexto,
          unidade: produtoOriginal?.unidade || 'UN',
          data_saida: Timestamp.fromDate(new Date()),
          data_registro: Timestamp.fromDate(new Date())
        };

        // Salvar relatório da transferência - ENTRADA no destino
        const relatorioEntradaData = {
          requisicao_id: produto.id,
          produto_id: produto.id,
          codigo_material: produto.codigo_estoque,
          nome_produto: produto.nome,
          quantidade: produto.quantidade,
          valor_unitario: produtoOriginal?.valor_unitario || 0,
          valor_total: (produtoOriginal?.valor_unitario || 0) * produto.quantidade,
          status: 'entrada',
          tipo: "Transferência",
          solicitante: {
            id: userData?.id || 'system',
            nome: userData?.nome || 'Sistema',
            cargo: userData?.cargo || 'Administrador'
          },
          usuario: {
            id: userData?.id || 'system',
            nome: userData?.nome || 'Sistema',
            email: userData?.email || 'sistema@empresa.com'
          },
          deposito: destinoTexto,
          prateleira: produtoOriginal?.prateleira || "Não endereçado",
          centro_de_custo: destinoTexto,
          unidade: produtoOriginal?.unidade || 'UN',
          data_saida: Timestamp.fromDate(new Date()),
          data_registro: Timestamp.fromDate(new Date())
        };

        // Adicionar ambos os relatórios da transferência
        await addDoc(collection(db, "relatorios"), relatorioSaidaData);
        await addDoc(collection(db, "relatorios"), relatorioEntradaData);
      }
      
      setAlerta({
        tipo: 'sucesso',
        mensagem: 'Transferência realizada com sucesso!',
        visivel: true
      });
      
      await carregarTransferencias();
      await carregarProdutos();
      limparFormularios();
      
    } catch (error) {
      console.error("Erro ao realizar transferência:", error);
      setAlerta({
        tipo: 'erro',
        mensagem: 'Ocorreu um erro ao realizar a transferência',
        visivel: true
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: Date) => {
    return format(data, "dd/MM/yyyy HH:mm");
  };

  return (
    <div className="space-y-4 dark:bg-gray-950 dark:text-gray-100">
      <Tabs defaultValue="nova" className="space-y-4">
        <TabsList className="dark:bg-gray-950 dark:border-gray-700">
          <TabsTrigger value="nova" className="dark:data-[state=active]:bg-gray-700">Nova Transferência</TabsTrigger>
          <TabsTrigger value="historico" className="dark:data-[state=active]:bg-gray-700">Histórico de Transferências</TabsTrigger>
        </TabsList>
        
        <TabsContent value="nova" className="space-y-4">
          {alerta.visivel && (
            <Alert 
              className={cn(
                alerta.tipo === 'sucesso' ? 'bg-green-50 border-green-500' :
                alerta.tipo === 'erro' ? 'bg-red-50 border-red-500' :
                'bg-blue-50 border-blue-500',
                'dark:bg-gray-950 dark:border-gray-700'
              )}
            >
              <AlertTitle className="dark:text-gray-100">
                {alerta.tipo === 'sucesso' ? 'Sucesso!' : 
                 alerta.tipo === 'erro' ? 'Erro!' : 'Informação'}
              </AlertTitle>
              <AlertDescription className="dark:text-gray-300">
                {alerta.mensagem}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Coluna 1: Dados da Transferência */}
            <Card className="col-span-1 dark:bg-gray-950 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Dados da Transferência</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Defina os depósitos de origem e destino
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...formTransferencia}>
                  <form className="space-y-4">
                    <FormField
                      control={formTransferencia.control}
                      name="origem"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Depósito de Origem</FormLabel>
                          <Popover open={popoverOrigemOpen} onOpenChange={setPopoverOrigemOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground",
                                  "dark:bg-gray-950 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600"
                                )}
                                style={{ height: '40px' }}
                                disabled={loadingDepositos}
                              >
                                {loadingDepositos
                                  ? "Carregando..."
                                  : field.value
                                    ? `${depositos.find(d => d.id === field.value)?.deposito || "Depósito selecionado"} - ${
                                        depositos.find(d => d.id === field.value)?.unidade || ""
                                      }`.trim()
                                    : "Selecione o depósito de origem"}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0 dark:bg-gray-950 dark:border-gray-700">
                              <Command className="dark:bg-gray-950">
                                <CommandInput placeholder="Buscar depósito..." className="h-9 dark:bg-gray-950" />
                                <CommandList className="max-h-[300px]">
                                  <CommandEmpty className="dark:text-gray-300">Nenhum depósito encontrado.</CommandEmpty>
                                  <CommandGroup className="dark:bg-gray-950">
                                    {depositos.map((deposito) => (
                                      <CommandItem
                                        key={deposito.id}
                                        value={`${deposito.deposito} ${deposito.unidade}`}
                                        onSelect={() => {
                                          formTransferencia.setValue("origem", deposito.id);
                                          setPopoverOrigemOpen(false);
                                        }}
                                        className="dark:hover:bg-gray-700"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === deposito.id
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span className="dark:text-gray-100">{deposito.deposito}</span>
                                          <span className="text-xs text-muted-foreground dark:text-gray-400">
                                            Unidade: {deposito.unidade}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-center">
                      <ArrowRight className="h-6 w-6 text-muted-foreground dark:text-gray-400" />
                    </div>
                    
                    <FormField
                      control={formTransferencia.control}
                      name="destino"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Depósito de Destino</FormLabel>
                          <Popover open={popoverDestinoOpen} onOpenChange={setPopoverDestinoOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground",
                                    "dark:bg-gray-950 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600"
                                  )}
                                  style={{ height: '40px' }}
                                  disabled={loadingDepositos}
                                >
                                  {loadingDepositos
                                    ? "Carregando..."
                                    : field.value
                                      ? `${depositos.find(d => d.id === field.value)?.deposito || ""} - ${depositos.find(d => d.id === field.value)?.unidade || ""}`.trim()
                                      : "Selecione o depósito de destino"}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0 dark:bg-gray-950 dark:border-gray-700">
                              <Command className="dark:bg-gray-950">
                                <CommandInput placeholder="Buscar depósito..." className="h-9 dark:bg-gray-950" />
                                <CommandList className="max-h-[300px]">
                                  <CommandEmpty className="dark:text-gray-300">Nenhum depósito encontrado.</CommandEmpty>
                                  <CommandGroup className="dark:bg-gray-950">
                                    {depositos.map((deposito) => (
                                      <CommandItem
                                        key={deposito.id}
                                        value={`${deposito.deposito} ${deposito.unidade}`}
                                        onSelect={() => {
                                          formTransferencia.setValue("destino", deposito.id);
                                          setPopoverDestinoOpen(false);
                                        }}
                                        disabled={deposito.id === formTransferencia.getValues("origem")}
                                        className="dark:hover:bg-gray-700"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === deposito.id
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span className="dark:text-gray-100">{deposito.deposito}</span>
                                          <span className="text-xs text-muted-foreground dark:text-gray-400">
                                            Unidade: {deposito.unidade}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={formTransferencia.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Observações (opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Adicione observações sobre esta transferência"
                              className="resize-none h-24 dark:bg-gray-950 dark:border-gray-600 dark:text-gray-100"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Coluna 2: Seleção de Produtos */}
            <Card className="col-span-1 dark:bg-gray-950 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Selecionar Produtos</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Busque produtos para transferir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Busque por nome ou código"
                    value={pesquisaProduto}
                    onChange={(e) => setPesquisaProduto(e.target.value)}
                    className="dark:bg-gray-950 dark:border-gray-600 dark:text-gray-100"
                  />
                  <Button 
                    type="button" 
                    size="icon" 
                    onClick={handleBuscarProduto}
                    variant="outline"
                    className="dark:bg-gray-950 dark:border-gray-600 dark:text-gray-100"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto border rounded-md dark:border-gray-950">
                  {produtosLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin dark:text-gray-400" />
                    </div>
                  ) : produtosFiltrados.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground dark:text-gray-400">
                      {pesquisaProduto.trim() === "" ? (
                        "Pesquise por nome, código do estoque ou código do fornecedor para buscar produtos específicos"
                      ) : (
                        "Nenhum produto encontrado"
                      )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="dark:bg-gray-950">
                        <TableRow className="dark:border-gray-600">
                          <TableHead className="w-12 dark:bg-gray-950"></TableHead>
                          <TableHead className="dark:bg-gray-950 dark:text-gray-100">Código</TableHead>
                          <TableHead className="dark:bg-gray-950 dark:text-gray-100">Nome</TableHead>
                          <TableHead className="dark:bg-gray-950 dark:text-gray-100">Estoque</TableHead>
                          <TableHead className="dark:bg-gray-950"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="dark:bg-gray-950">
                        {produtosFiltrados.map(produto => (
                          <TableRow key={produto.id} className="dark:border-gray-700">
                            <TableCell className="dark:bg-gray-950">
                              <Checkbox 
                                id={`produto-${produto.id}`}
                                checked={produtosSelecionados.some(p => p.id === produto.id)}
                                onCheckedChange={(checked) => handleToggleSelecionarProduto(produto, checked === true)}
                                className="dark:border-gray-600"
                              />
                            </TableCell>
                            <TableCell className="dark:text-gray-100">{produto.codigo_estoque}</TableCell>
                            <TableCell className="dark:text-gray-100">{produto.nome}</TableCell>
                            <TableCell className="dark:text-gray-100">{produto.quantidade} {produto.unidade_de_medida}</TableCell>
                            <TableCell className="dark:bg-gray-950">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSelecionarProduto(produto)}
                                className="dark:text-gray-100 dark:hover:bg-gray-700"
                              >
                                Selecionar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
                
                {produtosSelecionados.length > 0 && (
                  <Button 
                    type="button" 
                    className="w-full dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-600"
                    onClick={handleAdicionarMultiplosProdutos}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar {produtosSelecionados.length} produtos selecionados
                  </Button>
                )}
                
                {produtoSelecionado && (
                  <div className="p-4 border rounded-md bg-slate-50 space-y-3 dark:bg-gray-950 dark:border-gray-600">
                    <div>
                      <h4 className="font-medium dark:text-gray-100">Produto selecionado:</h4>
                      <p className="dark:text-gray-100">{produtoSelecionado.nome}</p>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        Estoque disponível: {produtoSelecionado.quantidade} {produtoSelecionado.unidade_de_medida}
                      </p>
                    </div>
                    
                    <Form {...formQuantidade}>
                      <form 
                        onSubmit={formQuantidade.handleSubmit(handleAdicionarProdutoTransferencia)}
                        className="flex flex-col gap-3"
                      >
                        <FormField
                          control={formQuantidade.control}
                          name="quantidade"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel className="dark:text-gray-300">Quantidade a transferir</FormLabel>
                                <span className="text-sm text-muted-foreground dark:text-gray-400">
                                  Disponível: {produtoSelecionado?.quantidade || 0} {produtoSelecionado?.unidade_de_medida}
                                </span>
                              </div>
                              <FormControl>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min="1"
                                    max={produtoSelecionado?.quantidade || 1}
                                    className="dark:bg-gray-950 dark:border-gray-500 dark:text-gray-100"
                                    {...field}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      // Força valor mínimo de 1 se for inválido
                                      if (isNaN(value) || value < 1) {
                                        field.onChange(1);
                                      } else {
                                        field.onChange(value);
                                      }
                                    }}
                                    onBlur={(e) => {
                                      if (e.target.value === '' || parseFloat(e.target.value) < 1) {
                                        field.onChange(1);
                                        formQuantidade.setError("quantidade", {
                                          type: "manual",
                                          message: "A quantidade deve ser maior que zero"
                                        });
                                      }
                                    }}
                                  />
                                  <Button 
                                    type="submit" 
                                    size="sm"
                                    className="dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-500"
                                    disabled={
                                      !produtoSelecionado || 
                                      produtoSelecionado.quantidade <= 0 ||
                                      formQuantidade.formState.isSubmitting
                                    }
                                  >
                                    {formQuantidade.formState.isSubmitting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Adicionar
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              {formQuantidade.formState.errors.quantidade && (
                                <FormMessage className="dark:text-red-400">
                                  {formQuantidade.formState.errors.quantidade.type === "too_small"
                                    ? "O produto não tem quantidade disponível para transferência"
                                    : formQuantidade.formState.errors.quantidade.message}
                                </FormMessage>
                              )}
                              {produtoSelecionado?.quantidade <= 0 && (
                                <p className="text-sm font-medium text-red-500 dark:text-red-400">
                                  Este produto não possui estoque disponível para transferência
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Coluna 3: Lista de Produtos para Transferência */}
            <Card className="col-span-1 dark:bg-gray-950 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Produtos a Transferir</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  {produtosTransferencia.length} produto(s) selecionado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto border rounded-md dark:border-gray-700">
                  {produtosTransferencia.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground dark:text-gray-400">
                      Nenhum produto adicionado à transferência
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="dark:bg-gray-950">
                        <TableRow className="dark:border-gray-600">
                          <TableHead className="dark:bg-gray-950 dark:text-gray-100">Produto</TableHead>
                          <TableHead className="text-center dark:bg-gray-950 dark:text-gray-100">Qtd</TableHead>
                          <TableHead className="dark:bg-gray-950"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="dark:bg-gray-950">
                        {produtosTransferencia.map(produto => (
                          <TableRow key={produto.id} className="dark:border-gray-700">
                            <TableCell className="dark:bg-gray-950">
                              <div>
                                <p className="dark:text-gray-100">{produto.nome}</p>
                                <p className="text-xs text-muted-foreground dark:text-gray-400">
                                  Código estoque: {produto.codigo_estoque}  |  Limite: {produto.quantidadeAtual}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center dark:bg-gray-950">
                            <Input 
                              type="number"
                              className="w-16 text-center mx-auto dark:bg-gray-950 dark:border-gray-600 dark:text-gray-100"
                              value={produto.quantidade}
                              min={1}
                              max={produto.quantidadeAtual}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value)) {
                                  handleAtualizarQuantidadeProdutoTransferencia(produto.id, value);
                                }
                              }}
                              onBlur={(e) => {
                                if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                  setAlerta({
                                    tipo: 'erro',
                                    mensagem: 'A quantidade deve ser maior que zero',
                                    visivel: true
                                  });
                                  handleAtualizarQuantidadeProdutoTransferencia(produto.id, 1);
                                }
                              }}
                            />
                            </TableCell>
                            <TableCell className="dark:bg-gray-950">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoverProdutoTransferencia(produto.id)}
                                className="dark:text-gray-100 dark:hover:bg-gray-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  className="w-full bg-inventory-primary hover:bg-inventory-primary-light dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-gray-100"
                  disabled={
                    produtosTransferencia.length === 0 ||
                    loading || 
                    !formTransferencia.formState.isValid
                  }
                  onClick={formTransferencia.handleSubmit(handleEnviarTransferencia)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Realizar Transferência
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="historico" className="space-y-4">
          <Card className="dark:bg-gray-950 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Histórico de Transferências</CardTitle>
              <CardDescription className="dark:text-gray-300">
                Registro de todas as transferências realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transferenciasLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin dark:text-gray-400" />
                </div>
              ) : transferencias.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground dark:text-gray-400">
                  Nenhum registro de transferência encontrado
                </div>
              ) : (
                <div className="space-y-6">
                  {transferencias.map((transferencia) => (
                    <div key={transferencia.id} className="border rounded-md p-4 dark:border-gray-700 dark:bg-gray-950">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="font-medium dark:text-gray-100">
                            Transferência #{transferencia.id?.substring(0, 8)}
                          </h4>
                          <p className="text-sm text-muted-foreground dark:text-gray-400">
                            {formatarData(transferencia.data_transferencia)}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="text-muted-foreground mr-2 dark:text-gray-400">{transferencia.origem}</div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                          <div className="text-muted-foreground ml-2 dark:text-gray-400">{transferencia.destino}</div>
                        </div>
                      </div>
                      
                      <Separator className="my-3 dark:bg-gray-950" />
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium dark:text-gray-100">Produtos transferidos:</h5>
                        <Table>
                          <TableHeader className="dark:bg-gray-950">
                            <TableRow className="dark:border-gray-500">
                              <TableHead className="dark:text-gray-100">Código</TableHead>
                              <TableHead className="dark:text-gray-100">Produto</TableHead>
                              <TableHead className="text-right dark:text-gray-100">Quantidade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="dark:bg-gray-950">
                            {transferencia.produtos_transferidos.map((produto) => (
                              <TableRow key={produto.id} className="dark:border-gray-600">
                                <TableCell className="dark:text-gray-100">{produto.codigo_estoque}</TableCell>
                                <TableCell className="dark:text-gray-100">{produto.nome}</TableCell>
                                <TableCell className="text-right dark:text-gray-100">{produto.quantidade}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {transferencia.observacoes && (
                        <div className="mt-3 text-sm">
                          <p className="font-medium dark:text-gray-100">Observações:</p>
                          <p className="text-muted-foreground dark:text-gray-400">{transferencia.observacoes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TransferenciasET = () => {
  return (
    <AppLayout title="Transferência de produtos">
      <ProdutoProvider>
        <TransferenciaProvider>
          <TransferenciasETContent />
        </TransferenciaProvider>
      </ProdutoProvider>
    </AppLayout>
  );
};

export default TransferenciasET;