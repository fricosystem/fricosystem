import { useState, useEffect } from "react";
import { ProdutoProvider } from "@/pages/EntradaManualTransferencia/contexts/ProdutoContext";
import { TransferenciaProvider } from "@/pages/EntradaManualTransferencia/contexts/TransferenciaContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useProdutos } from "@/pages/EntradaManualTransferencia/contexts/ProdutoContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, CheckCircle2, CircleAlert, Trash2, Check, Search, Loader2, Plus } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import { db } from "@/firebase/firebase";
import { collection, query, orderBy, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Produto, depositos, unidades, unidades_medida } from "@/pages/EntradaManualTransferencia/types/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const EntradaProdutosETContent = () => {
  const { adicionarProduto, atualizarProduto, buscarProdutoPorCodigo, buscarProdutoPorCodigoMaterial } = useProdutos();
  const { userData } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listaProdutos, setListaProdutos] = useState<Produto[]>([]);
  const [fornecedorPopoverOpen, setFornecedorPopoverOpen] = useState(false);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [depositos, setDepositos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [loadingDepositos, setLoadingDepositos] = useState(false);
  const [depositoPopoverOpen, setDepositoPopoverOpen] = useState(false);
  const [produtoExistente, setProdutoExistente] = useState<Produto | null>(null);
  const [isCheckingMaterial, setIsCheckingMaterial] = useState(false);
  const [loadingCodigoEstoque, setLoadingCodigoEstoque] = useState(false);
  const [ultimoCodigoEstoque, setUltimoCodigoEstoque] = useState(null);
  const [alertInfo, setAlertInfo] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
    productId?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    existingProduct: any | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    existingProduct: null,
  });
  const navigate = useNavigate();

  const formSchema = z.object({
    codigo_estoque: z.string().min(1, "Código do estoque é obrigatório"),
    codigo_material: z.string().min(1, "Código do material é obrigatório"),
    nome: z.string().min(1, "Nome do produto é obrigatório"),
    fornecedor_nome: z.string().min(1, "Nome do fornecedor é obrigatório"),
    fornecedor_cnpj: z.string().min(1, "CNPJ do fornecedor é obrigatório"),
    fornecedor_id: z.string().optional(),
    data_vencimento: z.date().optional(),
    quantidade: z.coerce.number().positive("Quantidade deve ser um número positivo"),
    quantidade_minima: z.coerce.number().min(0, "Quantidade mínima não pode ser negativa"),
    valor_unitario: z.coerce.number().min(0, "Valor não pode ser negativo"),
    unidade: z.string().min(1, "Unidade é obrigatória"),
    deposito: z.string().min(1, "Depósito é obrigatório"),
    prateleira: z.string().optional(),
    unidade_de_medida: z.string().min(1, "Unidade de medida é obrigatória"),
    detalhes: z.string().optional(),
    imagem: z.string().optional(),
  });

  interface Deposito {
    id: string;
    deposito: string;
    unidade: string;
    cnpj?: string;
    endereco?: string;
    razao_social?: string;
    responsavel?: string;
    telefone?: string;
    criado_em?: Date;
  }

  interface Unidade {
    id: string;
    nome: string;
    cnpj?: string;
  }

  const carregarDepositos = async () => {
    setLoadingDepositos(true);
    try {
      const depositosRef = collection(db, "depositos");
      const depositosQuery = query(depositosRef, orderBy("deposito"));
      const snapshot = await getDocs(depositosQuery);
      
      const depositosData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          deposito: data.deposito,
          unidade: data.unidade,
          cnpj: data.cnpj,
          endereco: data.endereco,
          razao_social: data.razao_social,
          responsavel: data.responsavel,
          telefone: data.telefone,
          criado_em: data.criado_em?.toDate()
        };
      });
      
      setDepositos(depositosData);
    } catch (error) {
      console.error("Erro ao carregar depósitos:", error);
    } finally {
      setLoadingDepositos(false);
    }
  };

  const carregarUnidades = async () => {
    setLoadingUnidades(true);
    try {
      const unidadesRef = collection(db, "unidades");
      const unidadesQuery = query(unidadesRef, orderBy("nome"));
      const snapshot = await getDocs(unidadesQuery);
      
      const unidadesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.nome,
          cnpj: data.cnpj
        };
      });
      
      setUnidades(unidadesData);
    } catch (error) {
      console.error("Erro ao carregar unidades:", error);
    } finally {
      setLoadingUnidades(false);
    }
  };

  const getSelectedFornecedorName = () => {
    const selectedId = form.watch("fornecedor_id");
    if (!selectedId) return null;
    
    const selectedFornecedor = fornecedores.find(f => f.id === selectedId);
    return selectedFornecedor ? `${selectedFornecedor.razaoSocial} - ${selectedFornecedor.cnpj}` : null;
  };

  const buscarFornecedores = async () => {
    setLoadingFornecedores(true);
    try {
      const fornecedoresRef = collection(db, "fornecedores");
      const fornecedoresSnapshot = await getDocs(fornecedoresRef);
      const fornecedoresList: Fornecedor[] = [];
      
      fornecedoresSnapshot.forEach((doc) => {
        const data = doc.data();
        fornecedoresList.push({
          id: doc.id,
          razaoSocial: data.razaoSocial || "",
          cnpj: data.cnpj || "",
        });
      });
      
      setFornecedores(fornecedoresList);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      setAlertInfo({
        isOpen: true,
        title: "Erro",
        message: "Falha ao carregar lista de fornecedores.",
        type: "error",
      });
    } finally {
      setLoadingFornecedores(false);
    }
  };
  
  type FormValues = z.infer<typeof formSchema>;

  const defaultValues: Partial<FormValues> = {
    codigo_estoque: "",
    codigo_material: "",
    nome: "",
    fornecedor_nome: "",
    fornecedor_cnpj: "",
    fornecedor_id: "",
    data_vencimento: undefined,
    quantidade: 0,
    quantidade_minima: 0,
    valor_unitario: 0,
    unidade: "",
    deposito: "",
    prateleira: "",
    unidade_de_medida: unidades_medida[0],
    detalhes: "",
    imagem: "",
  };

  const verificarCodigoMaterialExistente = async () => {
    const codigoMaterial = form.getValues().codigo_material;
    if (!codigoMaterial) return;
  
    setIsCheckingMaterial(true);
    try {
      const produtoExistente = await buscarProdutoPorCodigoMaterial(codigoMaterial);
      
      if (produtoExistente) {
        form.reset({
          codigo_estoque: produtoExistente.codigo_estoque,
          codigo_material: produtoExistente.codigo_material,
          nome: produtoExistente.nome,
          fornecedor_nome: produtoExistente.fornecedor_nome,
          fornecedor_cnpj: produtoExistente.fornecedor_cnpj,
          fornecedor_id: produtoExistente.fornecedor_id || "",
          data_vencimento: produtoExistente.data_vencimento 
            ? new Date(produtoExistente.data_vencimento) 
            : undefined,
          quantidade: 0, // Reset quantity for new entry
          quantidade_minima: produtoExistente.quantidade_minima || 0,
          valor_unitario: produtoExistente.valor_unitario || 0,
          unidade: produtoExistente.unidade || "",
          deposito: depositos.find(d => 
            d.deposito === produtoExistente.deposito && 
            d.unidade === produtoExistente.unidade
          )?.id || "",
          prateleira: produtoExistente.prateleira || "",
          unidade_de_medida: produtoExistente.unidade_de_medida || "",
          detalhes: produtoExistente.detalhes || "",
          imagem: produtoExistente.imagem || ""
        });
        
        setProdutoExistente(produtoExistente);
        setAlertInfo({
          isOpen: true,
          title: "Produto encontrado",
          message: "Todos os dados do produto foram carregados pelo código de material.",
          type: "info",
        });
      } else {
        form.reset({
          ...defaultValues,
          codigo_material: codigoMaterial
        });
        
        setProdutoExistente(null);
        setAlertInfo({
          isOpen: true,
          title: "Código disponível",
          message: "Este código de material está disponível para cadastro.",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Erro ao verificar código de material:", error);
      setProdutoExistente(null);
      setAlertInfo({
        isOpen: true,
        title: "Erro",
        message: "Ocorreu um erro ao verificar o código de material.",
        type: "error",
      });
    } finally {
      setIsCheckingMaterial(false);
    }
  };

  interface Fornecedor {
    id: string;
    razaoSocial: string;
    cnpj: string;
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const verificarCodigoExistente = async () => {
    const codigo = form.getValues().codigo_estoque;
    if (!codigo) return;
  
    setIsChecking(true);
    try {
      const produtoExistente = await buscarProdutoPorCodigo(codigo);
      
      if (produtoExistente) {
        form.reset({
          codigo_estoque: produtoExistente.codigo_estoque,
          codigo_material: produtoExistente.codigo_material,
          nome: produtoExistente.nome,
          fornecedor_nome: produtoExistente.fornecedor_nome,
          fornecedor_cnpj: produtoExistente.fornecedor_cnpj,
          fornecedor_id: produtoExistente.fornecedor_id || "",
          data_vencimento: produtoExistente.data_vencimento 
            ? new Date(produtoExistente.data_vencimento) 
            : undefined,
          quantidade: 0, // Reset quantity for new entry
          quantidade_minima: produtoExistente.quantidade_minima || 0,
          valor_unitario: produtoExistente.valor_unitario || 0,
          unidade: produtoExistente.unidade || "",
          deposito: depositos.find(d => 
            d.deposito === produtoExistente.deposito && 
            d.unidade === produtoExistente.unidade
          )?.id || "",
          prateleira: produtoExistente.prateleira || "",
          unidade_de_medida: produtoExistente.unidade_de_medida || "",
          detalhes: produtoExistente.detalhes || "",
          imagem: produtoExistente.imagem || ""
        });
        
        setProdutoExistente(produtoExistente);
        setAlertInfo({
          isOpen: true,
          title: "Produto encontrado",
          message: "Todos os dados do produto foram carregados.",
          type: "info",
        });
      } else {
        form.reset({
          ...defaultValues,
          codigo_estoque: codigo
        });
        
        setProdutoExistente(null);
        setAlertInfo({
          isOpen: true,
          title: "Código disponível",
          message: "Este código de estoque está disponível para cadastro.",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      setProdutoExistente(null);
      setAlertInfo({
        isOpen: true,
        title: "Erro",
        message: "Ocorreu um erro ao verificar o código do produto.",
        type: "error",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const adicionarProdutoALista = () => {
    const data = form.getValues();
    const isValid = form.trigger();
    
    if (!isValid) {
      return;
    }
    
    const novoProduto: Produto = {
      codigo_estoque: data.codigo_estoque,
      codigo_material: data.codigo_material,
      nome: data.nome,
      fornecedor_nome: data.fornecedor_nome,
      fornecedor_cnpj: data.fornecedor_cnpj,
      fornecedor_id: data.fornecedor_id || "",
      data_criacao: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      data_vencimento: data.data_vencimento ? format(data.data_vencimento, "yyyy-MM-dd") : "",
      quantidade: data.quantidade,
      quantidade_minima: data.quantidade_minima,
      valor_unitario: data.valor_unitario,
      unidade: depositos.find(d => d.id === data.deposito)?.unidade || "",
      deposito: depositos.find(d => d.id === data.deposito)?.deposito || "",
      prateleira: data.prateleira || "",
      unidade_de_medida: data.unidade_de_medida,
      detalhes: `Unidade de medida: ${data.unidade_de_medida}\n${data.detalhes || ''}`.trim(),
      imagem: data.imagem || "",
    };
    
    const produtoExistenteNaLista = listaProdutos.find(p => p.codigo_estoque === novoProduto.codigo_estoque);
    
    if (produtoExistenteNaLista) {
      setListaProdutos(prev => 
        prev.map(p => 
          p.codigo_estoque === novoProduto.codigo_estoque 
            ? { ...p, quantidade: p.quantidade + novoProduto.quantidade }
            : p
        )
      );
    } else {
      setListaProdutos(prev => [...prev, novoProduto]);
    }
    
    form.reset({
      codigo_estoque: "",
      codigo_material: '',
      nome: '',
      fornecedor_nome: '',
      fornecedor_cnpj: '',
      fornecedor_id: '',
      data_vencimento: null,
      quantidade: 0,
      quantidade_minima: 0,
      valor_unitario: 0,
      unidade: '',
      deposito: '',
      prateleira: '',
      unidade_de_medida: '',
      detalhes: '',
      imagem: '',
      ...defaultValues
    });
    
    setAlertInfo({
      isOpen: true,
      title: "Produto adicionado à lista",
      message: "O produto foi adicionado à lista de produtos a cadastrar.",
      type: "success",
    });
  };
  
  const removerProdutoDaLista = (codigo: string) => {
    setListaProdutos(prev => prev.filter(p => p.codigo_estoque !== codigo));
  };

  const cadastrarTodosProdutos = async () => {
    if (listaProdutos.length === 0) {
      setAlertInfo({
        isOpen: true,
        title: "Nenhum produto na lista",
        message: "Adicione pelo menos um produto à lista para cadastrar.",
        type: "error",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      for (const produto of listaProdutos) {
        try {
          const produtoExistente = await buscarProdutoPorCodigo(produto.codigo_estoque);
          let produtoId = "";
          
          if (produtoExistente) {
            await atualizarProduto(produtoExistente.id as string, {
              ...produtoExistente,
              quantidade: produtoExistente.quantidade + produto.quantidade,
            });
            produtoId = produtoExistente.id as string;
          } else {
            produtoId = await adicionarProduto(produto);
          }

          // Criar registro de relatório para a entrada manual
          const relatorioData = {
            requisicao_id: produtoId,
            produto_id: produtoId,
            codigo_material: produto.codigo_material,
            nome_produto: produto.nome,
            quantidade: produto.quantidade,
            valor_unitario: produto.valor_unitario || 0,
            valor_total: (produto.valor_unitario || 0) * produto.quantidade,
            status: 'entrada',
            tipo: "Entrada Manual",
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
            deposito: produto.deposito,
            prateleira: produto.prateleira || "Não endereçado",
            centro_de_custo: produto.deposito,
            unidade: produto.unidade,
            data_saida: Timestamp.fromDate(new Date()),
            data_registro: Timestamp.fromDate(new Date())
          };

          // Adicionar o relatório de entrada
          await addDoc(collection(db, "relatorios"), relatorioData);

        } catch (error) {
          console.error(`Erro ao processar produto ${produto.codigo_estoque}:`, error);
        }
      }
      
      setListaProdutos([]);
      setAlertInfo({
        isOpen: true,
        title: "Produtos cadastrados",
        message: `${listaProdutos.length} produtos foram cadastrados com sucesso no sistema.`,
        type: "success",
      });
    } catch (error) {
      console.error("Erro ao cadastrar produtos:", error);
      setAlertInfo({
        isOpen: true,
        title: "Erro",
        message: "Ocorreu um erro ao cadastrar os produtos.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const formattedData: Produto = {
        codigo_estoque: data.codigo_estoque,
        codigo_material: data.codigo_material,
        nome: data.nome,
        fornecedor_nome: data.fornecedor_nome,
        fornecedor_cnpj: data.fornecedor_cnpj,
        fornecedor_id: data.fornecedor_id || "",
        data_criacao: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        data_vencimento: data.data_vencimento ? format(data.data_vencimento, "yyyy-MM-dd") : "",
        quantidade: data.quantidade,
        quantidade_minima: data.quantidade_minima,
        valor_unitario: data.valor_unitario,
        unidade: depositos.find(d => d.id === data.deposito)?.unidade || "",
        deposito: depositos.find(d => d.id === data.deposito)?.deposito || "",
        prateleira: data.prateleira || "",
        unidade_de_medida: data.unidade_de_medida,
        detalhes: `Unidade de medida: ${data.unidade_de_medida}\n${data.detalhes || ''}`.trim(),
        imagem: data.imagem || "",
      };
      
      // Verificar se o produto já existe pelo código de estoque
      const produtoExistente = await buscarProdutoPorCodigo(data.codigo_estoque);
      let produtoId = "";
      
      if (produtoExistente) {
        // Se produto existe, incrementar a quantidade
        const quantidadeExistente = isNaN(produtoExistente.quantidade) ? 0 : produtoExistente.quantidade;
        const quantidadeAtualizada = quantidadeExistente + data.quantidade;
        
        await atualizarProduto(produtoExistente.id as string, {
          ...produtoExistente,
          quantidade: quantidadeAtualizada,
          fornecedor_nome: data.fornecedor_nome,
          fornecedor_cnpj: data.fornecedor_cnpj,
          fornecedor_id: data.fornecedor_id || "",
          valor_unitario: data.valor_unitario,
        });
        produtoId = produtoExistente.id as string;
        
        setAlertInfo({
          isOpen: true,
          title: "Quantidade atualizada",
          message: `A quantidade do produto foi incrementada de ${quantidadeExistente} para ${quantidadeAtualizada}.`,
          type: "success",
        });
      } else {
        // Se produto não existe, criar novo
        produtoId = await adicionarProduto(formattedData);
        
        setAlertInfo({
          isOpen: true,
          title: "Produto cadastrado",
          message: "O produto foi cadastrado com sucesso no sistema.",
          type: "success",
        });
      }

      // Criar registro de relatório para a entrada manual
      const relatorioData = {
        requisicao_id: produtoId,
        produto_id: produtoId,
        codigo_material: data.codigo_material,
        nome_produto: data.nome,
        quantidade: data.quantidade,
        valor_unitario: data.valor_unitario || 0,
        valor_total: (data.valor_unitario || 0) * data.quantidade,
        status: 'entrada',
        tipo: "Entrada Manual",
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
        deposito: formattedData.deposito,
        prateleira: formattedData.prateleira || "Não endereçado",
        centro_de_custo: formattedData.deposito,
        unidade: formattedData.unidade,
        data_saida: Timestamp.fromDate(new Date()),
        data_registro: Timestamp.fromDate(new Date())
      };

      // Adicionar o relatório de entrada
      await addDoc(collection(db, "relatorios"), relatorioData);
      
      form.reset(defaultValues);
      setProdutoExistente(null);
    } catch (error) {
      console.error("Erro ao processar produto:", error);
      setAlertInfo({
        isOpen: true,
        title: "Erro",
        message: "Ocorreu um erro ao processar o produto.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedDepositoName = () => {
    const selectedId = form.watch("deposito");
    if (!selectedId) return null;
    
    const selectedDeposito = depositos.find(d => d.id === selectedId);
    return selectedDeposito ? `${selectedDeposito.unidade} - ${selectedDeposito.deposito}` : null;
  };

  const handleUpdateQuantity = async () => {
    if (!produtoExistente) return;
    
    setIsSubmitting(true);
    try {
      const novaQuantidade = form.getValues().quantidade;
      const quantidadeExistente = isNaN(produtoExistente.quantidade) ? 0 : produtoExistente.quantidade;
      const quantidadeAtualizada = quantidadeExistente + novaQuantidade;
      const valorUnitario = form.getValues().valor_unitario;
      
      await atualizarProduto(produtoExistente.id, {
        ...produtoExistente,
        quantidade: quantidadeAtualizada,
        fornecedor_nome: form.getValues().fornecedor_nome,
        fornecedor_cnpj: form.getValues().fornecedor_cnpj,
        fornecedor_id: form.getValues().fornecedor_id || "",
        valor_unitario: valorUnitario,
      });

      // Criar registro de relatório para a entrada manual
      const relatorioData = {
        requisicao_id: produtoExistente.id,
        produto_id: produtoExistente.id,
        codigo_material: produtoExistente.codigo_material,
        nome_produto: produtoExistente.nome,
        quantidade: novaQuantidade,
        valor_unitario: valorUnitario || 0,
        valor_total: (valorUnitario || 0) * novaQuantidade,
        status: 'entrada',
        tipo: "Entrada Manual",
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
        deposito: produtoExistente.deposito,
        prateleira: produtoExistente.prateleira || "Não endereçado",
        centro_de_custo: produtoExistente.deposito,
        unidade: produtoExistente.unidade,
        data_saida: Timestamp.fromDate(new Date()),
        data_registro: Timestamp.fromDate(new Date())
      };

      // Adicionar o relatório de entrada
      await addDoc(collection(db, "relatorios"), relatorioData);
      
      setAlertInfo({
        isOpen: true,
        title: "Produto atualizado",
        message: `A quantidade do produto ${produtoExistente.nome} foi atualizada com sucesso (${quantidadeAtualizada}).`,
        type: "success",
        productId: produtoExistente.id,
      });
      
      form.reset(defaultValues);
      setProdutoExistente(null);
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error);
      setAlertInfo({
        isOpen: true,
        title: "Erro",
        message: "Ocorreu um erro ao atualizar a quantidade do produto.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    buscarFornecedores();
    carregarDepositos();
    carregarUnidades();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
            <CardDescription>
              Preencha os dados de cada produto da NF-e para cadastro ou realizar entrada manual de produtos existentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alertInfo.isOpen && (
              <Alert 
                className={cn(
                  "mb-6",
                  alertInfo.type === "success" ? "bg-green-50 border-green-600 text-green-800" : 
                  alertInfo.type === "error" ? "bg-red-50 border-red-600 text-red-800" : 
                  "bg-blue-50 border-blue-600 text-blue-800"
                )}
              >
                <div className="flex items-center gap-2">
                  {alertInfo.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : alertInfo.type === "error" ? (
                    <CircleAlert className="h-4 w-4" />
                  ) : null}
                  <AlertTitle>{alertInfo.title}</AlertTitle>
                </div>
                <AlertDescription>
                  {alertInfo.message}
                  {alertInfo.productId && (
                    <Button
                      variant="link"
                      className="p-0 h-auto text-inventory-primary"
                      onClick={() => navigate(`/produtos?id=${alertInfo.productId}`)}
                    >
                      Ver detalhes do produto
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Identificação</h3>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="codigo_estoque"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código do Estoque*</FormLabel>
                          <div className="flex gap-2 items-center">
                            <FormControl>
                              <Input
                                placeholder="Código do estoque"
                                {...field}
                              />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={verificarCodigoExistente}
                              disabled={isChecking || !field.value}
                              className="shrink-0"
                            >
                              {isChecking ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Verificar
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="codigo_material"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código do Material / Fornecedor*</FormLabel>
                          <div className="flex gap-2 items-center">
                            <FormControl>
                              <Input placeholder="ABC123" {...field} />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={verificarCodigoMaterialExistente}
                              disabled={isCheckingMaterial || !field.value}
                              className="shrink-0"
                            >
                              {isCheckingMaterial ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Verificar
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Produto*</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do produto" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Fornecedor</h3>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="fornecedor_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fornecedor*</FormLabel>
                          <Popover open={fornecedorPopoverOpen} onOpenChange={setFornecedorPopoverOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  style={{ height: '40px' }}
                                  disabled={loadingFornecedores}
                                >
                                  {loadingFornecedores
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</>
                                    : field.value
                                      ? fornecedores.find(f => f.id === field.value)?.razaoSocial || "Fornecedor selecionado"
                                      : "Selecione o fornecedor"}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput placeholder="Buscar fornecedor..." className="h-9" />
                                <CommandList className="max-h-[300px]">
                                  <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    {fornecedores.map((fornecedor) => (
                                      <CommandItem
                                        key={fornecedor.id}
                                        value={`${fornecedor.razaoSocial} ${fornecedor.cnpj}`}
                                        onSelect={() => {
                                          form.setValue("fornecedor_id", fornecedor.id);
                                          form.setValue("fornecedor_nome", fornecedor.razaoSocial);
                                          form.setValue("fornecedor_cnpj", fornecedor.cnpj);
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
                                          <span>{fornecedor.razaoSocial}</span>
                                          <span className="text-xs text-muted-foreground">
                                            CNPJ: {fornecedor.cnpj}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                                <div className="p-2 border-t flex justify-between">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      buscarFornecedores();
                                    }}
                                    disabled={loadingFornecedores}
                                  >
                                    {loadingFornecedores ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <Search className="mr-1 h-3 w-3" />
                                    )}
                                    Atualizar lista
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      alert("Redirecionar para cadastro de fornecedor");
                                      setFornecedorPopoverOpen(false);
                                    }}
                                  >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Novo fornecedor
                                  </Button>
                                </div>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fornecedor_cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ*</FormLabel>
                          <FormControl>
                            <Input placeholder="00.000.000/0001-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Datas</h3>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="data_vencimento"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Vencimento (opcional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Quantidade e Valor</h3>
                    </div>
                    
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
                              step="1" 
                              {...field} 
                              onChange={(e) => {
                                const value = e.target.value;
                                if (!value) {
                                  form.setError("quantidade", { 
                                    type: "required", 
                                    message: "Favor inserir a quantidade" 
                                  });
                                } else {
                                  form.clearErrors("quantidade");
                                }
                                field.onChange(value ? parseFloat(value) : "");
                              }}
                              onBlur={() => {
                                if (!field.value) {
                                  form.setError("quantidade", { 
                                    type: "required", 
                                    message: "Favor inserir a quantidade" 
                                  });
                                }
                              }}
                              placeholder="Quantidade a ser adicionada ao estoque"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quantidade_minima"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade Mínima( Opcional )</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="1" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : "")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="valor_unitario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Unitário (R$)*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : "")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Localização</h3>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="unidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade/Filial*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a unidade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border border-border shadow-lg z-50">
                              {loadingUnidades ? (
                                <SelectItem value="loading" disabled>
                                  <div className="flex items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Carregando unidades...
                                  </div>
                                </SelectItem>
                              ) : unidades.length > 0 ? (
                                unidades.map((unidade) => (
                                  <SelectItem key={unidade.id} value={unidade.nome}>
                                    {unidade.nome} {unidade.cnpj && `- ${unidade.cnpj}`}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-units" disabled>
                                  Nenhuma unidade encontrada
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deposito"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Depósito*</FormLabel>
                          <Popover open={depositoPopoverOpen} onOpenChange={setDepositoPopoverOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  style={{ height: '40px' }}
                                  disabled={loadingDepositos}
                                >
                                  {loadingDepositos
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</>
                                    : field.value
                                      ? getSelectedDepositoName()
                                      : "Selecione o depósito"}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput placeholder="Buscar depósito..." className="h-9" />
                                <CommandList className="max-h-[300px]">
                                  <CommandEmpty>Nenhum depósito encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    {depositos
                                      .filter(d => !form.watch("unidade") || d.unidade === form.watch("unidade"))
                                      .map((deposito) => (
                                        <CommandItem
                                          key={deposito.id}
                                          value={`${deposito.deposito} ${deposito.unidade}`}
                                          onSelect={() => {
                                            form.setValue("deposito", deposito.id);
                                            form.setValue("unidade", deposito.unidade);
                                            setDepositoPopoverOpen(false);
                                          }}
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
                                            <span>{deposito.deposito}</span>
                                            <span className="text-xs text-muted-foreground">
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
                      control={form.control}
                      name="prateleira"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prateleira/Localização (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="A-01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Detalhes</h3>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="unidade_de_medida"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade de Medida*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a unidade de medida">
                                  {field.value}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {unidades_medida.map((unidade) => (
                                <SelectItem key={unidade} value={unidade}>
                                  {unidade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    
                    <FormField
                      control={form.control}
                      name="detalhes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detalhes adicionais (opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Informações adicionais sobre o produto" 
                              className="resize-none h-20"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset(defaultValues);
                      setProdutoExistente(null);
                      setAlertInfo(prev => ({ ...prev, isOpen: false }));
                    }}
                  >
                    Limpar
                  </Button>
                  <Button 
                    type="button" 
                    onClick={adicionarProdutoALista}
                    className="bg-inventory-primary hover:bg-inventory-primary-light"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar à Lista
                  </Button>
                  <Button 
                    type="button" 
                    onClick={form.handleSubmit(produtoExistente ? handleUpdateQuantity : onSubmit)}
                    disabled={isSubmitting}
                    className={cn(
                      produtoExistente ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {produtoExistente ? "Atualizando..." : "Cadastrando..."}
                      </>
                    ) : (
                      produtoExistente ? "Atualizar Produto" : "Cadastrar Diretamente"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      {/* Coluna da lista de produtos */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Lista de Produtos</CardTitle>
            <CardDescription>
              {listaProdutos.length} produto(s) na lista para cadastro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto">
              {listaProdutos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum produto na lista.
                  <p className="text-sm mt-2">
                    Preencha o formulário e clique em "Adicionar à Lista"
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listaProdutos.map((produto) => (
                      <TableRow key={produto.codigo_estoque}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{produto.nome}</p>
                            <p className="text-xs text-gray-500">Cód: {produto.codigo_estoque}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {produto.quantidade}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerProdutoDaLista(produto.codigo_estoque)}
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
              className="w-full bg-inventory-primary hover:bg-inventory-primary-light"
              disabled={listaProdutos.length === 0 || isSubmitting}
              onClick={cadastrarTodosProdutos}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Cadastrar Todos ({listaProdutos.length})
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Dialog para produto existente */}
      <AlertDialog open={alertDialog.isOpen} onOpenChange={isOpen => setAlertDialog(prev => ({ ...prev, isOpen }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialog.message}
              {alertDialog.existingProduct && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md space-y-2">
                  <p><strong>Nome:</strong> {alertDialog.existingProduct.nome}</p>
                  <p><strong>Quantidade atual:</strong> {alertDialog.existingProduct.quantidade} {alertDialog.existingProduct.unidade_de_medida}</p>
                  <p><strong>Nova quantidade após atualização:</strong> {alertDialog.existingProduct.quantidade + (form.getValues().quantidade || 0)} {alertDialog.existingProduct.unidade_de_medida}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateQuantity}
              disabled={isSubmitting}
              className="bg-inventory-primary hover:bg-inventory-primary-light"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar Quantidade"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const EntradaProdutosET = () => {
  return (
    <AppLayout title="Cadastro / Entrada de Produtos">
      <ProdutoProvider>
        <TransferenciaProvider>
          <EntradaProdutosETContent />
        </TransferenciaProvider>
      </ProdutoProvider>
    </AppLayout>
  );
};

export default EntradaProdutosET;