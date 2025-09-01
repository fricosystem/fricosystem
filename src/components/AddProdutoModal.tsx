import { useState, useEffect } from "react";
import { Loader2, Save, X, Calculator, Percent, Search, RefreshCw } from "lucide-react";
import ProductImageUpload from '@/components/ProdutosUploadCloudinary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addDoc, collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";

interface Fornecedor {
  id: string;
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone: string;
}

interface CentroCusto {
  id: string;
  nome: string;
  unidade: string;
}

interface Unidade {
  id: string;
  nome: string;
  cnpj: string;
}

interface AddProdutoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  codigo: string;
  codigoEstoque: string;
  nome: string;
  unidade: string;
  deposito: string;
  quantidade: string;
  calcularMinimo: boolean;
  percentualMinimo: string;
  quantidadeMinima: string;
  detalhes: string;
  imagem: string;
  unidadeMedida: string;
  valorUnitario: string;
  dataVencimento: string;
  fornecedorAtual: string;
  fornecedorNome: string;
  fornecedorCNPJ: string;
  fornecedorEmail: string;
  fornecedorTelefone: string;
  prateleira: string;
  centroCusto: string;
}

const AddProdutoModal = ({ open, onOpenChange, onSuccess }: AddProdutoModalProps) => {
  const [loading, setLoading] = useState(false);
  const [calcularMinimo, setCalcularMinimo] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [loadingCentrosCusto, setLoadingCentrosCusto] = useState(false);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [fornecedorPopoverOpen, setFornecedorPopoverOpen] = useState(false);
  const [centroCustoPopoverOpen, setCentroCustoPopoverOpen] = useState(false);
  const [unidadePopoverOpen, setUnidadePopoverOpen] = useState(false);
  const [ultimoCodigoEstoque, setUltimoCodigoEstoque] = useState<number | null>(null);
  const [loadingCodigoEstoque, setLoadingCodigoEstoque] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const { toast } = useToast();
  const { userData } = useAuth();

  // Initialize react-hook-form
  const form = useForm<FormData>({
    defaultValues: {
      codigo: "",
      codigoEstoque: "",
      nome: "",
      unidade: "",
      deposito: "",
      quantidade: "",
      calcularMinimo: false,
      percentualMinimo: "25",
      quantidadeMinima: "",
      detalhes: "",
      imagem: "",
      unidadeMedida: "",
      valorUnitario: "",
      dataVencimento: "",
      fornecedorAtual: "",
      fornecedorNome: "",
      fornecedorCNPJ: "",
      fornecedorEmail: "",
      fornecedorTelefone: "",
      prateleira: "",
      centroCusto: "",
    },
  });

  // Carregar fornecedores, centros de custo, unidades e último código estoque do Firebase
  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        setLoadingFornecedores(true);
        const fornecedoresRef = collection(db, "fornecedores");
        const querySnapshot = await getDocs(fornecedoresRef);
        
        const fornecedoresData: Fornecedor[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fornecedoresData.push({
            id: doc.id,
            razaoSocial: data.razaoSocial || "",
            cnpj: data.cnpj || "",
            email: data.email || "",
            telefone: data.telefone || "",
          });
        });
        
        setFornecedores(fornecedoresData);
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de fornecedores.",
          variant: "destructive",
        });
      } finally {
        setLoadingFornecedores(false);
      }
    };

    const fetchCentrosCusto = async () => {
      try {
        setLoadingCentrosCusto(true);
        const centrosCustoRef = collection(db, "centro_de_custo");
        const q = query(centrosCustoRef, orderBy("nome", "asc"));
        const querySnapshot = await getDocs(q);
        
        const centrosCustoData: CentroCusto[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          centrosCustoData.push({
            id: doc.id,
            nome: data.nome || "",
            unidade: data.unidade || "",
          });
        });
        
        setCentrosCusto(centrosCustoData);
      } catch (error) {
        console.error("Erro ao buscar centros de custo:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de centros de custo.",
          variant: "destructive",
        });
      } finally {
        setLoadingCentrosCusto(false);
      }
    };

    const fetchUnidades = async () => {
      try {
        setLoadingUnidades(true);
        const unidadesRef = collection(db, "unidades");
        const q = query(unidadesRef, orderBy("nome", "asc"));
        const querySnapshot = await getDocs(q);
        
        const unidadesData: Unidade[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          unidadesData.push({
            id: doc.id,
            nome: data.nome || "",
            cnpj: data.cnpj || "",
          });
        });
        
        setUnidades(unidadesData);
      } catch (error) {
        console.error("Erro ao buscar unidades:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de unidades.",
          variant: "destructive",
        });
      } finally {
        setLoadingUnidades(false);
      }
    };

    const fetchUltimoCodigoEstoque = async () => {
      try {
        setLoadingCodigoEstoque(true);
        
        // Buscar todos os produtos ordenados pelo código de estoque
        const produtosRef = collection(db, "produtos");
        const q = query(produtosRef, orderBy("codigo_estoque", "asc"));
        const querySnapshot = await getDocs(q);
        
        // Se não houver produtos, use 1
        if (querySnapshot.empty) {
          setUltimoCodigoEstoque(0);
          form.setValue("codigoEstoque", "1");
          return;
        }
        
        // Extrair todos os códigos de estoque como números
        const codigosExistentes = querySnapshot.docs.map(doc => {
          const codigo = doc.data().codigo_estoque;
          return typeof codigo === 'string' ? parseInt(codigo, 10) : codigo;
        }).filter(codigo => !isNaN(codigo)); // Filtra códigos inválidos
        
        // Encontrar o primeiro número disponível
        let proximoCodigo = 1;
        for (let i = 0; i < codigosExistentes.length; i++) {
          if (codigosExistentes[i] === proximoCodigo) {
            proximoCodigo++;
          } else if (codigosExistentes[i] > proximoCodigo) {
            // Se encontrarmos um código maior que o próximo esperado, há um gap
            break;
          }
        }
        
        // Definir o último código encontrado (para referência)
        const ultimoCodigo = codigosExistentes.length > 0 ? 
          Math.max(...codigosExistentes) : 0;
        setUltimoCodigoEstoque(ultimoCodigo);
        
        // Definir o próximo código disponível
        form.setValue("codigoEstoque", String(proximoCodigo));
        
      } catch (error) {
        console.error("Erro ao buscar próximo código de estoque disponível:", error);
      } finally {
        setLoadingCodigoEstoque(false);
      }
    };

    if (open) {
      fetchFornecedores();
      fetchCentrosCusto();
      fetchUnidades();
      fetchUltimoCodigoEstoque();
    }
  }, [open, toast, form]);

  // Observar mudanças na quantidade, percentual e no switch de cálculo automático
  const quantidade = form.watch("quantidade");
  const percentualMinimo = form.watch("percentualMinimo");
  const calculoAutomatico = form.watch("calcularMinimo");
  
  // Atualizar quantidade mínima quando a quantidade ou percentual mudar e o cálculo automático estiver ativado
  const handleCalcMinimo = () => {
    if (quantidade && percentualMinimo) {
      const percent = parseFloat(percentualMinimo) / 100;
      const qtdMinima = (parseFloat(quantidade) * percent).toFixed(2);
      form.setValue("quantidadeMinima", qtdMinima);
    }
  };

  const handleToggleCalcMinimo = (checked: boolean) => {
    form.setValue("calcularMinimo", checked);
    setCalcularMinimo(checked);
    if (checked && quantidade && percentualMinimo) {
      handleCalcMinimo();
    }
  };

  // Formatação do valor unitário ao digitar
  const formatarValorUnitario = (valor: string) => {
    // Remove todos os caracteres não-numéricos exceto vírgula e ponto
    let valorLimpo = valor.replace(/[^\d.,]/g, '');
    
    // Substituir vírgula por ponto se existir
    valorLimpo = valorLimpo.replace(',', '.');
    
    // Se houver mais de um ponto, mantém apenas o último (para casos de entrada incorreta)
    if ((valorLimpo.match(/\./g) || []).length > 1) {
      const partes = valorLimpo.split('.');
      const ultimaParte = partes.pop();
      valorLimpo = partes.join('') + '.' + ultimaParte;
    }
    
    return valorLimpo;
  };

  // Normalizar valor unitário para formato numérico com ponto decimal
  const normalizarValorUnitario = (valor: string) => {
    // Remove todos os caracteres não-numéricos exceto vírgula e ponto
    let valorLimpo = valor.replace(/[^\d.,]/g, '');
    
    // Substituir vírgula por ponto
    valorLimpo = valorLimpo.replace(',', '.');
    
    // Garantir que exista apenas um ponto decimal
    if ((valorLimpo.match(/\./g) || []).length > 1) {
      const partes = valorLimpo.split('.');
      const ultimaParte = partes.pop();
      valorLimpo = partes.join('') + '.' + ultimaParte;
    }
    
    // Se não for um número válido, retorna 0
    const valorNumerico = parseFloat(valorLimpo);
    return isNaN(valorNumerico) ? 0 : valorNumerico;
  };

  // Get selected fornecedor name for display
  const getSelectedFornecedorName = () => {
    const selectedId = form.watch("fornecedorAtual");
    if (!selectedId) return null;
    
    const selectedFornecedor = fornecedores.find(f => f.id === selectedId);
    return selectedFornecedor ? `${selectedFornecedor.razaoSocial} - ${selectedFornecedor.cnpj}` : null;
  };

  // Get selected centro de custo name for display
  const getSelectedCentroCustoName = () => {
    const selectedId = form.watch("centroCusto");
    if (!selectedId) return null;
    
    const selectedCentroCusto = centrosCusto.find(c => c.id === selectedId);
    return selectedCentroCusto ? `${selectedCentroCusto.nome} - ${selectedCentroCusto.unidade}` : null;
  };

  // Get selected unidade name for display
  const getSelectedUnidadeName = () => {
    const selectedId = form.watch("unidade");
    if (!selectedId) return null;
    
    const selectedUnidade = unidades.find(u => u.id === selectedId);
    return selectedUnidade ? `${selectedUnidade.nome} - ${selectedUnidade.cnpj}` : null;
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      // Get fornecedor details if ID is provided
      let fornecedorNome = formData.fornecedorNome;
      let fornecedorCNPJ = formData.fornecedorCNPJ;
      let fornecedorEmail = formData.fornecedorEmail;
      let fornecedorTelefone = formData.fornecedorTelefone;

      if (formData.fornecedorAtual) {
        const selectedFornecedor = fornecedores.find(f => f.id === formData.fornecedorAtual);
        if (selectedFornecedor) {
          fornecedorNome = selectedFornecedor.razaoSocial;
          fornecedorCNPJ = selectedFornecedor.cnpj;
          fornecedorEmail = selectedFornecedor.email;
          fornecedorTelefone = selectedFornecedor.telefone;
        }
      }

      // Get centro de custo details if ID is provided
      let centroCustoNome = "";
      let centroCustoUnidade = "";

      if (formData.centroCusto) {
        const selectedCentroCusto = centrosCusto.find(c => c.id === formData.centroCusto);
        if (selectedCentroCusto) {
          centroCustoNome = selectedCentroCusto.nome;
          centroCustoUnidade = selectedCentroCusto.unidade;
        }
      }

      // Get unidade details if ID is provided
      let unidadeNome = "";
      let unidadeCNPJ = "";

      if (formData.unidade) {
        const selectedUnidade = unidades.find(u => u.id === formData.unidade);
        if (selectedUnidade) {
          unidadeNome = selectedUnidade.nome;
          unidadeCNPJ = selectedUnidade.cnpj;
        }
      }

      // Normaliza o valor unitário para formato com ponto decimal
      const valorUnitarioNormalizado = normalizarValorUnitario(formData.valorUnitario);

      // Convert numeric fields to numbers
      const produtoData = {
        codigo_material: formData.codigo,
        codigo_estoque: formData.codigoEstoque || "0",
        nome: formData.nome,
        unidade: unidadeNome || formData.unidade,
        unidade_id: formData.unidade || null,
        unidade_cnpj: unidadeCNPJ || null,
        deposito: formData.deposito,
        quantidade: parseFloat(formData.quantidade),
        quantidade_minima: parseFloat(formData.quantidadeMinima),
        detalhes: formData.detalhes,
        imagem: form.getValues("imagem") || imageUrl || "/placeholder.svg",
        valor_unitario: valorUnitarioNormalizado,
        data_criacao: new Date().toISOString(),
        data_vencimento: formData.dataVencimento,
        fornecedor_id: formData.fornecedorAtual || null,
        fornecedor_nome: fornecedorNome || null,
        fornecedor_cnpj: fornecedorCNPJ || null,
        fornecedor_email: fornecedorEmail || null,
        fornecedor_telefone: fornecedorTelefone || null,
        prateleira: formData.prateleira || "Não endereçado",
        unidade_de_medida: formData.unidadeMedida,
        centro_de_custo: centroCustoNome || null,
        centro_de_custo_unidade: centroCustoUnidade || null,
        centro_de_custo_id: formData.centroCusto || null,
      };

      // Add the product to Firestore
      const produtoRef = await addDoc(collection(db, "produtos"), produtoData);

      // Criar registro de relatório para a entrada do produto
      const relatorioData = {
        requisicao_id: produtoRef.id,
        produto_id: produtoRef.id,
        codigo_material: formData.codigo,
        nome_produto: formData.nome,
        quantidade: parseFloat(formData.quantidade),
        valor_unitario: valorUnitarioNormalizado,
        valor_total: valorUnitarioNormalizado * parseFloat(formData.quantidade),
        status: 'entrada',
        tipo: "Cadastro",
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
        deposito: formData.deposito,
        prateleira: formData.prateleira || "Não endereçado",
        centro_de_custo: centroCustoNome || formData.unidade,
        unidade: unidadeNome || formData.unidade,
        data_saida: Timestamp.fromDate(new Date()),
        data_registro: Timestamp.fromDate(new Date())
      };

      // Adicionar o relatório de entrada
      await addDoc(collection(db, "relatorios"), relatorioData);

      // Show success message
      toast({
        title: "Produto adicionado",
        description: "O produto foi adicionado com sucesso ao Firestore.",
      });

      // Close modal and reset form
      onOpenChange(false);
      onSuccess();
      form.reset();
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto ao Firestore.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-[95%] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha os dados do produto para adicionar ao inventário.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2 sm:py-4">
            {/* Grid adaptativo para código and código estoque */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do poduto*</FormLabel>
                    <FormControl>
                      <Input placeholder="Presente no item da Nota Fiscal" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codigoEstoque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Estoque*</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Input 
                          placeholder={loadingCodigoEstoque ? "Carregando..." : "Ex: 1"} 
                          {...field} 
                          required 
                          disabled={loadingCodigoEstoque}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="ml-2 px-2 sm:px-3" 
                          onClick={async () => {
                            setLoadingCodigoEstoque(true);
                            try {
                              const produtosRef = collection(db, "produtos");
                              const q = query(produtosRef, orderBy("codigo_estoque", "desc"), limit(1));
                              const querySnapshot = await getDocs(q);
                              
                              if (!querySnapshot.empty) {
                                const ultimoProduto = querySnapshot.docs[0].data();
                                const ultimoCodigo = ultimoProduto.codigo_estoque;
                                
                                let ultimoCodigoNum = typeof ultimoCodigo === 'string' 
                                  ? parseInt(ultimoCodigo, 10) 
                                  : ultimoCodigo;
                                  
                                if (!isNaN(ultimoCodigoNum)) {
                                  setUltimoCodigoEstoque(ultimoCodigoNum);
                                  form.setValue("codigoEstoque", String(ultimoCodigoNum + 1));
                                }
                              } else {
                                setUltimoCodigoEstoque(0);
                                form.setValue("codigoEstoque", "1");
                              }
                            } catch (error) {
                              console.error("Erro ao atualizar código de estoque:", error);
                              toast({
                                title: "Erro",
                                description: "Não foi possível atualizar o código de estoque.",
                                variant: "destructive",
                              });
                            } finally {
                              setLoadingCodigoEstoque(false);
                            }
                          }}
                          disabled={loadingCodigoEstoque}
                          title="Buscar próximo código disponível"
                        >
                          {loadingCodigoEstoque ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    {ultimoCodigoEstoque !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Último código: {ultimoCodigoEstoque}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto*</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do produto" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade da empresa*</FormLabel>
                    <Popover open={unidadePopoverOpen} onOpenChange={setUnidadePopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between text-left",
                              !field.value && "text-muted-foreground"
                            )}
                            style={{ height: '40px' }}
                            disabled={loadingUnidades}
                          >
                            <span className="truncate">
                              {loadingUnidades
                                ? "Carregando..."
                                : field.value
                                  ? getSelectedUnidadeName()
                                  : "Selecione a unidade"}
                            </span>
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[95vw] sm:w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar unidade..." className="h-9" />
                          <CommandList className="max-h-[50vh] sm:max-h-[300px]">
                            <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
                            <CommandGroup>
                              {unidades.map((unidade) => (
                                <CommandItem
                                  key={unidade.id}
                                  value={`${unidade.nome} ${unidade.cnpj}`}
                                  onSelect={() => {
                                    form.setValue("unidade", unidade.id);
                                    setUnidadePopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === unidade.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{unidade.nome}</span>
                                    <span className="text-xs text-muted-foreground">
                                      CNPJ: {unidade.cnpj}
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
                control={form.control}
                name="unidadeMedida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida*</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UN">Unidade (UN)</SelectItem>
                        <SelectItem value="KG">Quilograma (KG)</SelectItem>
                        <SelectItem value="GR">Grama (GR)</SelectItem>
                        <SelectItem value="MG">Miligrama (MG)</SelectItem>
                        <SelectItem value="LT">Litro (LT)</SelectItem>
                        <SelectItem value="ML">Mililitro (ML)</SelectItem>
                        <SelectItem value="CX">Caixa (CX)</SelectItem>
                        <SelectItem value="PC">Peça (PC)</SelectItem>
                        <SelectItem value="MT">Metro (MT)</SelectItem>
                        <SelectItem value="CM">Centímetro (CM)</SelectItem>
                        <SelectItem value="MM">Milímetro (MM)</SelectItem>
                        <SelectItem value="M2">Metro Quadrado (M²)</SelectItem>
                        <SelectItem value="M3">Metro Cúbico (M³)</SelectItem>
                        <SelectItem value="PCT">Pacote (PCT)</SelectItem>
                        <SelectItem value="FD">Fardo (FD)</SelectItem>
                        <SelectItem value="AMP">Ampola (AMP)</SelectItem>
                        <SelectItem value="FR">Frasco (FR)</SelectItem>
                        <SelectItem value="RL">Rolo (RL)</SelectItem>
                        <SelectItem value="KIT">Kit (KIT)</SelectItem>
                        <SelectItem value="TN">Tonelada (TN)</SelectItem>
                        <SelectItem value="SC">Saco (SC)</SelectItem>
                        <SelectItem value="BL">Bloco (BL)</SelectItem>
                        <SelectItem value="CT">Cartela (CT)</SelectItem>
                        <SelectItem value="JG">Jogo (JG)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fornecedor com pesquisa e Data de Vencimento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fornecedorAtual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor Atual</FormLabel>
                    <Popover open={fornecedorPopoverOpen} onOpenChange={setFornecedorPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between text-left",
                              !field.value && "text-muted-foreground"
                            )}
                            style={{ height: '40px' }}
                            disabled={loadingFornecedores}
                          >
                            <span className="truncate">
                              {loadingFornecedores
                                ? "Carregando..."
                                : field.value
                                  ? getSelectedFornecedorName()
                                  : "Selecione o fornecedor"}
                            </span>
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[95vw] sm:w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar fornecedor..." className="h-9" />
                          <CommandList className="max-h-[50vh] sm:max-h-[300px]">
                            <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                            <CommandGroup>
                              {fornecedores.map((fornecedor) => (
                                <CommandItem
                                  key={fornecedor.id}
                                  value={`${fornecedor.razaoSocial} ${fornecedor.cnpj}`}
                                  onSelect={() => {
                                    form.setValue("fornecedorAtual", fornecedor.id);
                                    // Salvar também os dados do fornecedor
                                    form.setValue("fornecedorNome", fornecedor.razaoSocial);
                                    form.setValue("fornecedorCNPJ", fornecedor.cnpj);
                                    form.setValue("fornecedorEmail", fornecedor.email);
                                    form.setValue("fornecedorTelefone", fornecedor.telefone);
                                    setFornecedorPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === fornecedor.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="truncate">{fornecedor.razaoSocial}</span>
                                    <span className="text-xs text-muted-foreground truncate">
                                      CNPJ: {fornecedor.cnpj}
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
                control={form.control}
                name="dataVencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        style={{ height: '40px' }} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Centro de Custo */}
            <FormField
              control={form.control}
              name="centroCusto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro de Custo*</FormLabel>
                  <Popover open={centroCustoPopoverOpen} onOpenChange={setCentroCustoPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between text-left",
                            !field.value && "text-muted-foreground"
                          )}
                          style={{ height: '40px' }}
                          disabled={loadingCentrosCusto}
                        >
                          <span className="truncate">
                            {loadingCentrosCusto
                              ? "Carregando..."
                              : field.value
                                ? getSelectedCentroCustoName()
                                : "Selecione o centro de custo"}
                          </span>
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[95vw] sm:w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar centro de custo..." className="h-9" />
                        <CommandList className="max-h-[50vh] sm:max-h-[300px]">
                          <CommandEmpty>Nenhum centro de custo encontrado.</CommandEmpty>
                          <CommandGroup>
                            {centrosCusto.map((centroCusto) => (
                              <CommandItem
                                key={centroCusto.id}
                                value={`${centroCusto.nome} ${centroCusto.unidade}`}
                                onSelect={() => {
                                  form.setValue("centroCusto", centroCusto.id);
                                  setCentroCustoPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === centroCusto.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{centroCusto.nome}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Unidade: {centroCusto.unidade}
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

            {/* Quantidade e cálculo de quantidade mínima */}
            <div>
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="NF/Físico" 
                        {...field} 
                        required 
                        onChange={(e) => {
                          field.onChange(e);
                          if (calcularMinimo) {
                            setTimeout(handleCalcMinimo, 100);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Opções de cálculo de quantidade mínima */}
              <div className="mt-4 border rounded-md p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h4 className="text-sm font-medium mb-2 sm:mb-0">Cálculo de Quantidade Mínima</h4>
                  <FormField
                    control={form.control}
                    name="calcularMinimo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormLabel className="text-sm">Calcular automaticamente</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              handleToggleCalcMinimo(checked);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="percentualMinimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentual (%)</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input 
                              type="number" 
                              min="1" 
                              max="100"
                              placeholder="Ex: 25" 
                              className="rounded-r-none"
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                if (calcularMinimo) {
                                  setTimeout(handleCalcMinimo, 100);
                                }
                              }}
                            />
                            <div className="flex items-center justify-center bg-transparent px-3 border border-l-0 rounded-r-md text-gray-100">
                              <Percent className="h-4 w-4" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="quantidadeMinima"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Mínima*</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="Ex: 10" 
                              {...field} 
                              disabled={calcularMinimo}
                              required 
                            />
                            {!calcularMinimo && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                className="ml-2 px-3"
                                onClick={handleCalcMinimo}
                                title="Calcular com o percentual definido"
                              >
                                <Calculator className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Deposito e Prateleira */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deposito"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depósito/Localização*</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o depósito" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Manutenção">MANUTENÇÃO</SelectItem>
                        <SelectItem value="Cozinha">COZINHA</SelectItem>
                        <SelectItem value="Produção">PRODUÇÃO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prateleira"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prateleira (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: A3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="valorUnitario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Unitário*</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder="Ex: 15,75" 
                      {...field} 
                      required 
                      onChange={(e) => {
                        // Formata o valor ao digitar para exibição amigável
                        const valorFormatado = formatarValorUnitario(e.target.value);
                        e.target.value = valorFormatado;
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite usando ponto como separador decimal (ex: 15.75)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="detalhes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição, detalhes do produto, onde será utilizado, etc."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imagem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem do Produto</FormLabel>
                  <FormControl>
                    <ProductImageUpload
                      currentImageUrl={field.value}
                      onImageUploaded={(url) => {
                        setImageUrl(url);
                        field.onChange(url);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Produto
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProdutoModal;