import { useEffect, useState } from "react";
import { FileText, Upload, Search, Loader2, CheckCircle, AlertCircle, X, Link2, Plus, Download } from "lucide-react";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import LoadingIndicator from "@/components/LoadingIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface SefazStatus {
  status: "online" | "partial" | "offline";
  message: string;
  lastChecked: string;
}

interface ItemNotaFiscal {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  vinculado?: boolean;
  produtoVinculado?: string;
}

interface NotaFiscal {
  id: string;
  numero: string;
  fornecedor: string;
  valor: number;
  dataEmissao: string;
  dataProcessamento: string;
  status: 'pendente' | 'processada_estoque' | 'processada_consumo';
  itens: ItemNotaFiscal[];
  cnpjFornecedor: string;
  chaveAcesso: string;
  xmlContent: string;
  tipoProcessamento?: 'estoque' | 'consumo_direto';
  usuarioProcessamento?: string;
}

interface Produto {
  id: string;
  codigo_material: string;
  nome: string;
  codigo_estoque: string;
  quantidade: number;
}

interface CentroCusto {
  id: string;
  nome: string;
  unidade: string;
}

interface NotaFiscalUpdate {
  [key: string]: any;
  status: 'pendente' | 'processada_estoque' | 'processada_consumo';
  tipoProcessamento?: 'estoque' | 'consumo_direto';
  dataProcessamento: string;
  usuarioProcessamento?: string;
  itens: Array<{
    codigo: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    valorUnitario: number;
    valorTotal: number;
    vinculado?: boolean;
    produtoVinculado?: string;
  }>;
}

interface ConsumoDireto {
  id: string;
  nfeId: string;
  nfeNumero: string;
  dataProcessamento: string;
  fornecedor: string;
  cnpjFornecedor: string;
  itens: {
    codigo: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    valorUnitario: number;
    valorTotal: number;
  }[];
  centrosCusto: {
    id: string;
    nome: string;
    unidade: string;
  }[];
  responsavel: string;
  observacoes?: string;
  usuarioRegistro: string;
}

const NotasFiscais = () => {
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [sefazValidado, setSefazValidado] = useState<boolean | null>(null);
  const { user, userData } = useAuth();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscal | null>(null);
  const [showVinculacaoModal, setShowVinculacaoModal] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [showProcessamentoModal, setShowProcessamentoModal] = useState(false);
  const [showConsumoDiretoModal, setShowConsumoDiretoModal] = useState(false);
  const [showEstoqueModal, setShowEstoqueModal] = useState(false);
  const [consumoDiretoData, setConsumoDiretoData] = useState<Partial<ConsumoDireto>>({
    responsavel: userData?.nome || user?.displayName || '',
    observacoes: ''
  });
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [loadingCentrosCusto, setLoadingCentrosCusto] = useState(false);
  const [produtosVinculados, setProdutosVinculados] = useState<Record<string, string>>({});
  const [centrosSelecionados, setCentrosSelecionados] = useState<string[]>([]);
  const [searchCentroCusto, setSearchCentroCusto] = useState('');
  const { toast } = useToast();

  // Função para criar relatório de entrada
  const criarRelatorioEntrada = async (notaFiscal: NotaFiscal, itens: ItemNotaFiscal[], tipo: 'estoque' | 'consumo_direto') => {
    try {
      const centrosSelecionadosData = centrosCusto.filter(centro => 
        centrosSelecionados.includes(centro.id)
      );

      // Criar relatório principal
      const relatorioPrincipal = {
        tipo: "entrada",
        subtipo: tipo === 'estoque' ? "entrada_estoque" : "entrada_consumo_direto",
        nfe_id: notaFiscal.id,
        nfe_numero: notaFiscal.numero,
        fornecedor: notaFiscal.fornecedor,
        cnpj_fornecedor: notaFiscal.cnpjFornecedor,
        chave_acesso: notaFiscal.chaveAcesso,
        data_registro: serverTimestamp(),
        data_emissao: notaFiscal.dataEmissao,
        valor_total: notaFiscal.valor,
        tipo_entrada: tipo === 'estoque' ? "Estoque" : "Consumo Direto",
        centros_custo: tipo === 'consumo_direto' ? centrosSelecionadosData.map(c => ({
          id: c.id,
          nome: c.nome,
          unidade: c.unidade
        })) : [],
        usuario: {
          id: user?.uid || "",
          email: user?.email || "",
          nome: userData?.nome || ""
        },
        status: "confirmado"
      };

      // Adicionar relatório principal
      const relatorioRef = await addDoc(collection(db, "relatorios"), relatorioPrincipal);

      // Criar relatórios para cada item
      for (const item of itens) {
        const produtoVinculado = produtos.find(p => p.id === produtosVinculados[item.codigo]);
        const centroDeCustoSelecionado = centrosSelecionadosData[0]; // Pega o primeiro centro de custo para consumo direto
        
        const relatorioItem = {
          relatorio_id: relatorioRef.id,
          tipo: "entrada_item",
          produto_id: produtoVinculado?.id || "",
          codigo_material: produtoVinculado?.codigo_material || item.codigo,
          nome_produto: produtoVinculado?.nome || item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valorUnitario,
          valor_total: item.valorTotal,
          unidade: item.unidade,
          deposito: tipo === 'estoque' ? "Estoque Principal" : "Consumo Direto",
          centro_de_custo: tipo === 'consumo_direto' ? centroDeCustoSelecionado?.nome : "Estoque",
          unidade_centro_custo: tipo === 'consumo_direto' ? centroDeCustoSelecionado?.unidade : "",
          data_registro: serverTimestamp(),
          usuario: {
            id: user?.uid || "",
            email: user?.email || "",
            nome: userData?.nome || ""
          }
        };

        await addDoc(collection(db, "relatorios"), relatorioItem);
      }

    } catch (error) {
      console.error("Erro ao criar relatório de entrada:", error);
      throw error;
    }
  };

  // Função para baixar XML
  const downloadXML = (xmlContent: string, numeroNota: string) => {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NFe_${numeroNota}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Carregar notas fiscais do Firestore
  const carregarNotasFiscais = async () => {
    setLoading(true);
    try {
      const notasRef = collection(db, "notas_fiscais_xml");
      const notasSnapshot = await getDocs(notasRef);
      const notasData = notasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotaFiscal[];
      setNotasFiscais(notasData);
    } catch (error) {
      console.error("Erro ao carregar notas fiscais:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as notas fiscais",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarNotasFiscais();
  }, []);

  // Carregar produtos do Firestore
  const carregarProdutos = async () => {
    setLoadingProdutos(true);
    try {
      const produtosRef = collection(db, "produtos");
      const produtosSnapshot = await getDocs(produtosRef);
      const produtosData = produtosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Produto[];
      setProdutos(produtosData);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive"
      });
    } finally {
      setLoadingProdutos(false);
    }
  };

  // Carregar centros de custo do Firestore
  const carregarCentrosCusto = async () => {
    setLoadingCentrosCusto(true);
    try {
      const centrosRef = collection(db, "centro_de_custo");
      const centrosSnapshot = await getDocs(centrosRef);
      const centrosData = centrosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CentroCusto[];
      setCentrosCusto(centrosData);
    } catch (error) {
      console.error("Erro ao carregar centros de custo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os centros de custo",
        variant: "destructive"
      });
    } finally {
      setLoadingCentrosCusto(false);
    }
  };

  // Abrir modal de processamento
  const abrirModalProcessamento = async () => {
    if (!notaSelecionada) return;
    setShowProcessamentoModal(true);
  };

  // Selecionar tipo de processamento
  const handleSelecionarProcessamento = (tipo: 'estoque' | 'consumo_direto') => {
    if (!notaSelecionada) return;
    
    setShowProcessamentoModal(false);
    
    if (tipo === 'estoque') {
      carregarProdutos();
      setShowEstoqueModal(true);
    } else {
      carregarCentrosCusto();
      setShowConsumoDiretoModal(true);
      setConsumoDiretoData({
        nfeId: notaSelecionada.id,
        nfeNumero: notaSelecionada.numero,
        dataProcessamento: new Date().toISOString(),
        fornecedor: notaSelecionada.fornecedor,
        cnpjFornecedor: notaSelecionada.cnpjFornecedor,
        responsavel: userData?.nome || user?.displayName || '',
        itens: notaSelecionada.itens,
        usuarioRegistro: user?.uid || ''
      });
    }
  };

  // Vincular produto a um item da NFe
  const handleVincularProduto = (itemCodigo: string, produtoId: string) => {
    setProdutosVinculados(prev => ({
      ...prev,
      [itemCodigo]: produtoId
    }));
  };

  const toggleCentroCusto = (centroId: string) => {
    setCentrosSelecionados(prev =>
      prev.includes(centroId)
        ? prev.filter(id => id !== centroId)
        : [...prev, centroId]
    );
  };

  // Confirmar processamento para estoque
  const confirmarProcessamentoEstoque = async () => {
    if (!notaSelecionada) return;
    
    try {
      // Atualizar produtos no Firestore
      await Promise.all(
        notaSelecionada.itens.map(async item => {
          const produtoId = produtosVinculados[item.codigo];
          if (produtoId) {
            const produtoRef = doc(db, "produtos", produtoId);
            const produto = produtos.find(p => p.id === produtoId);
            
            if (produto) {
              await updateDoc(produtoRef, {
                quantidade: (produto.quantidade || 0) + item.quantidade
              });
            }
          }
        })
      );
  
      // Criar objeto para atualização no Firestore
      const notaAtualizadaFirestore: NotaFiscalUpdate = {
        status: 'processada_estoque',
        tipoProcessamento: 'estoque',
        dataProcessamento: new Date().toISOString(),
        usuarioProcessamento: user?.uid || '',
        itens: notaSelecionada.itens.map(item => ({
          ...item,
          vinculado: !!produtosVinculados[item.codigo],
          produtoVinculado: produtosVinculados[item.codigo] || undefined
        }))
      };
  
      // Atualizar nota fiscal no Firestore
      const notaRef = doc(db, "notas_fiscais_xml", notaSelecionada.id);
      await updateDoc(notaRef, notaAtualizadaFirestore);

      // Criar relatório de entrada
      await criarRelatorioEntrada(
        notaSelecionada,
        notaSelecionada.itens,
        'estoque'
      );
  
      // Criar objeto completo para o estado local
      const notaAtualizadaEstado: NotaFiscal = {
        ...notaSelecionada,
        ...notaAtualizadaFirestore
      };
  
      // Atualizar estado local
      setNotasFiscais(notasFiscais.map(n => 
        n.id === notaSelecionada.id ? notaAtualizadaEstado : n
      ));
  
      setNotaSelecionada(notaAtualizadaEstado);
      setShowEstoqueModal(false);
      setProdutosVinculados({});
  
      toast({
        title: "Nota fiscal processada",
        description: "Os itens foram adicionados ao estoque com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao processar nota para estoque:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a nota fiscal para estoque.",
        variant: "destructive"
      });
    }
  };

  // Registrar consumo direto
  const salvarConsumoDireto = async () => {
    if (!notaSelecionada || !consumoDiretoData) return;
    
    try {
      // Filtrar centros de custo selecionados
      const centrosSelecionadosData = centrosCusto.filter(centro => 
        centrosSelecionados.includes(centro.id)
      );
  
      // Criar registro de consumo direto
      const consumoDiretoRef = collection(db, "consumo_direto");
      await addDoc(consumoDiretoRef, {
        nfeId: notaSelecionada.id,
        nfeNumero: notaSelecionada.numero,
        dataProcessamento: new Date().toISOString(),
        fornecedor: notaSelecionada.fornecedor,
        cnpjFornecedor: notaSelecionada.cnpjFornecedor,
        itens: notaSelecionada.itens,
        centrosCusto: centrosSelecionadosData,
        responsavel: userData?.nome || user?.displayName || '',
        observacoes: consumoDiretoData.observacoes || '',
        usuarioRegistro: user?.uid || ''
      });
  
      // Criar objeto para atualização no Firestore
      const notaAtualizadaFirestore: NotaFiscalUpdate = {
        status: 'processada_consumo',
        tipoProcessamento: 'consumo_direto',
        dataProcessamento: new Date().toISOString(),
        usuarioProcessamento: user?.uid || '',
        itens: notaSelecionada.itens
      };
  
      // Atualizar nota fiscal no Firestore
      const notaRef = doc(db, "notas_fiscais_xml", notaSelecionada.id);
      await updateDoc(notaRef, notaAtualizadaFirestore);

      // Criar relatório de entrada
      await criarRelatorioEntrada(
        notaSelecionada,
        notaSelecionada.itens,
        'consumo_direto'
      );
  
      // Criar objeto completo para o estado local
      const notaAtualizadaEstado: NotaFiscal = {
        ...notaSelecionada,
        ...notaAtualizadaFirestore
      };
  
      // Atualizar estado local
      setNotasFiscais(notasFiscais.map(n => 
        n.id === notaSelecionada.id ? notaAtualizadaEstado : n
      ));
  
      setNotaSelecionada(notaAtualizadaEstado);
      setShowConsumoDiretoModal(false);
      setCentrosSelecionados([]);
  
      toast({
        title: "Consumo direto registrado",
        description: "Os itens foram registrados como consumo direto com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao registrar consumo direto:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar o consumo direto.",
        variant: "destructive"
      });
    }
  };

  // Filtrar centros de custo baseado na pesquisa
  const filteredCentrosCusto = centrosCusto.filter(centro =>
    centro.nome.toLowerCase().includes(searchCentroCusto.toLowerCase()) ||
    centro.unidade.toLowerCase().includes(searchCentroCusto.toLowerCase())
  );

  // Handler para upload de arquivo
  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = e.target.files;
    setSefazValidado(null);

    if (!arquivos || arquivos.length === 0) {
      setArquivoSelecionado(null);
      return;
    }

    const arquivo = arquivos[0];

    if (!arquivo.name.endsWith('.xml')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo XML.',
        variant: 'destructive',
      });
      setArquivoSelecionado(null);
      return;
    }

    setArquivoSelecionado(arquivo);
  };

  // Handler para submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoSelecionado) return;

    setCarregando(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!event.target?.result) {
          toast({
            title: 'Erro na leitura',
            description: 'Não foi possível ler o conteúdo do arquivo.',
            variant: 'destructive',
          });
          return;
        }

        const xmlContent = event.target.result as string;
        
        // Extrair dados do XML
        const dados = extrairDadosXML(xmlContent);

        // Adicionar nota fiscal ao Firestore
        const notasRef = collection(db, "notas_fiscais_xml");
        const novaNota = {
          ...dados,
          status: 'pendente',
          xmlContent: xmlContent
        };

        await addDoc(notasRef, novaNota);

        // Atualizar estado local
        setNotasFiscais([novaNota as NotaFiscal, ...notasFiscais]);

        toast({
          title: "Nota fiscal processada",
          description: "A nota fiscal foi carregada com sucesso.",
          variant: "default"
        });
      };

      reader.readAsText(arquivoSelecionado);
    } catch (error) {
      console.error("Erro ao processar nota fiscal:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a nota fiscal.",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
      setArquivoSelecionado(null);
    }
  };

  const removerNotaFiscal = async (notaId: string) => {
    try {
      // Verifica se o usuário realmente quer remover
      const confirmacao = window.confirm("Tem certeza que deseja remover esta nota fiscal? Esta ação não pode ser desfeita.");
      
      if (!confirmacao) return;
  
      // Remove do Firestore
      await deleteDoc(doc(db, "notas_fiscais_xml", notaId));
      
      // Atualiza o estado local
      setNotasFiscais(notasFiscais.filter(nota => nota.id !== notaId));
      
      // Fecha o modal se estiver aberto
      if (notaSelecionada?.id === notaId) {
        setNotaSelecionada(null);
      }
  
      toast({
        title: "Nota fiscal removida",
        description: "A nota fiscal foi removida com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao remover nota fiscal:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover a nota fiscal.",
        variant: "destructive"
      });
    }
  };

  const extrairDadosXML = (xmlString: string): NotaFiscal => {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        // Extrair dados básicos com fallbacks seguros
        const nfeNode = xmlDoc.querySelector("NFe") || xmlDoc.querySelector("nfeProc > NFe");
        const infNFe = nfeNode?.querySelector("infNFe");
        
        // Dados do emitente (fornecedor)
        const emitNode = infNFe?.querySelector("emit");
        const fornecedor = emitNode?.querySelector("xNome")?.textContent?.trim() || "Fornecedor não informado";
        const cnpjFornecedor = emitNode?.querySelector("CNPJ")?.textContent?.trim() || 
                              emitNode?.querySelector("CPF")?.textContent?.trim() || "";

        // Dados da nota
        const ideNode = infNFe?.querySelector("ide");
        const numero = ideNode?.querySelector("nNF")?.textContent?.trim() || "Sem número";
        const chaveAcesso = infNFe?.getAttribute("Id")?.replace("NFe", "") || "";
        
        // Data de emissão com tratamento de formatos
        let dataEmissao = ideNode?.querySelector("dhEmi")?.textContent?.trim() || 
                        ideNode?.querySelector("dEmi")?.textContent?.trim() || "";
        
        if (dataEmissao && /^\d{4}-\d{2}-\d{2}$/.test(dataEmissao)) {
            dataEmissao = new Date(dataEmissao + 'T00:00:00').toISOString();
        } else if (!dataEmissao) {
            dataEmissao = new Date().toISOString();
        }

        // Valor total com fallback para 0
        const totalNode = infNFe?.querySelector("total > ICMSTot");
        const valor = parseFloat(totalNode?.querySelector("vNF")?.textContent?.trim() || "0");

        // Extrair itens com tratamento completo
        const itens: ItemNotaFiscal[] = [];
        const detNodes = infNFe?.querySelectorAll("det");

        detNodes?.forEach(det => {
            const prod = det.querySelector("prod");
            
            if (prod) {
                const codigo = prod.querySelector("cProd")?.textContent?.trim() || uuidv4().substring(0, 8); // Gera um código se não existir
                const descricao = prod.querySelector("xProd")?.textContent?.trim() || "Produto não descrito";
                const quantidade = parseFloat(prod.querySelector("qCom")?.textContent?.trim() || "0");
                const unidade = prod.querySelector("uCom")?.textContent?.trim() || "UN";
                const valorUnitario = parseFloat(prod.querySelector("vUnCom")?.textContent?.trim() || "0");
                let valorTotal = parseFloat(prod.querySelector("vProd")?.textContent?.trim() || "0");

                // Adicionar IPI se existir
                const imposto = det.querySelector("imposto");
                const ipiNode = imposto?.querySelector("IPI > IPITrib");
                const valorIPI = parseFloat(ipiNode?.querySelector("vIPI")?.textContent?.trim() || "0");
                valorTotal += valorIPI;
                
                // Verifica se já existe um item com o mesmo código e descrição
                const itemExistente = itens.find(item => 
                    item.codigo === codigo && item.descricao === descricao
                );

                if (itemExistente) {
                    // Se existir, soma as quantidades e valores
                    itemExistente.quantidade += quantidade;
                    itemExistente.valorTotal += valorTotal;
                    itemExistente.valorUnitario = itemExistente.valorTotal / itemExistente.quantidade;
                } else {
                    // Se não existir, adiciona novo item
                    itens.push({
                        codigo,
                        descricao,
                        quantidade,
                        unidade,
                        valorUnitario,
                        valorTotal,
                        vinculado: false
                    });
                }
            }
        });

        // Retornar objeto completo com valores padrão para todos os campos
        return {
            id: uuidv4(),
            numero,
            fornecedor,
            valor,
            dataEmissao: dataEmissao,
            dataProcessamento: new Date().toISOString(),
            status: 'pendente',
            itens,
            cnpjFornecedor,
            chaveAcesso,
            xmlContent: xmlString,
            tipoProcessamento: 'estoque',
            usuarioProcessamento: ''
        };
    } catch (error) {
        console.error("Erro ao extrair dados do XML:", error);
        toast({
            title: "Erro",
            description: "Não foi possível extrair os dados do XML da nota fiscal.",
            variant: "destructive"
        });
        // Retornar objeto com valores padrão em caso de erro
        return {
            id: uuidv4(),
            numero: "",
            fornecedor: "",
            valor: 0,
            dataEmissao: new Date().toISOString(),
            dataProcessamento: new Date().toISOString(),
            status: 'pendente',
            itens: [],
            cnpjFornecedor: "",
            chaveAcesso: "",
            xmlContent: "",
            tipoProcessamento: 'estoque',
            usuarioProcessamento: ''
        };
    }
};

  if (loading) {
    return (
      <AppLayout title="Notas Fiscais">
        <LoadingIndicator 
          message="Buscando notas fiscais..." 
          progress={loadingProgress}
          showProgress={true}
        />
      </AppLayout>
    );
  }

  const notasPendentes = notasFiscais.filter(n => n.status === 'pendente');
  const notasProcessadasEstoque = notasFiscais.filter(n => n.status === 'processada_estoque');
  const notasProcessadasConsumo = notasFiscais.filter(n => n.status === 'processada_consumo');
  const notasHistorico = [...notasProcessadasEstoque, ...notasProcessadasConsumo].sort((a, b) => 
    new Date(b.dataProcessamento).getTime() - new Date(a.dataProcessamento).getTime()
  );

  return (
    <AppLayout title="Notas Fiscais">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Seção principal (2/3 da largura) */}
        <div className="md:col-span-2">
          {/* Card de Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload de Nota Fiscal Eletrônica</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Selecione o arquivo XML da NFe
                  </label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center bg-muted/50 cursor-pointer"
                    onClick={() => document.getElementById("arquivo-xml")?.click()}
                  >
                    {arquivoSelecionado ? (
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                        <p className="font-medium">{arquivoSelecionado.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(arquivoSelecionado.size / 1024).toFixed(2)} KB
                        </p>
                        <Button 
                          variant="link" 
                          className="mt-2 h-auto p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setArquivoSelecionado(null);
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground text-center">
                          Clique para fazer upload ou arraste o arquivo XML aqui
                        </p>
                      </>
                    )}
                    <Input 
                      id="arquivo-xml"
                      type="file" 
                      accept=".xml" 
                      className="hidden" 
                      onChange={handleArquivoChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={!arquivoSelecionado || carregando}>
                    {carregando ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : "Processar XML"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Abas de Notas Fiscais */}
          <div className="mt-6">
            <Tabs defaultValue="pendentes">
              <TabsList>
                <TabsTrigger value="pendentes">Pendentes ({notasPendentes.length})</TabsTrigger>
                <TabsTrigger value="estoque">Estoque ({notasProcessadasEstoque.length})</TabsTrigger>
                <TabsTrigger value="consumo">Consumo ({notasProcessadasConsumo.length})</TabsTrigger>
                <TabsTrigger value="historico">Histórico ({notasHistorico.length})</TabsTrigger>
              </TabsList>
              
              {/* Aba Pendentes */}
              <TabsContent value="pendentes" className="mt-4">
                {notasPendentes.length > 0 ? (
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Notas fiscais pendentes</h3>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar nota fiscal..."
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="border rounded-md">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">Número</th>
                              <th className="text-left p-3 text-sm font-medium">Fornecedor</th>
                              <th className="text-left p-3 text-sm font-medium">Data</th>
                              <th className="text-left p-3 text-sm font-medium">Valor</th>
                              <th className="text-left p-3 text-sm font-medium">Status</th>
                              <th className="text-left p-3 text-sm font-medium">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                          {notasPendentes.map((nota) => (
                            <tr 
                              key={nota.id} 
                              className="hover:bg-muted/50 cursor-pointer border-t"
                              onClick={() => setNotaSelecionada(nota)}
                            >
                              <td className="p-3">{nota.numero || '-'}</td>
                              <td className="p-3">{nota.fornecedor || '-'}</td>
                              <td className="p-3">
                                {nota.dataEmissao ? new Date(nota.dataEmissao).toLocaleDateString('pt-BR') : '-'}
                              </td>
                              <td className="p-3">
                                R$ {(nota.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">Pendente</Badge>
                              </td>
                              <td className="p-3 flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (nota.xmlContent) {
                                      downloadXML(nota.xmlContent, nota.numero);
                                    }
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removerNotaFiscal(nota.id);
                                  }}
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <EmptyState
                    title="Sem notas fiscais pendentes"
                    description="Não existem notas fiscais pendentes de processamento no momento."
                    icon={<FileText size={50} />}
                  />
                )}
              </TabsContent>

              {/* Aba Estoque */}
              <TabsContent value="estoque" className="mt-4">
                {notasProcessadasEstoque.length > 0 ? (
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Notas fiscais - Estoque</h3>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar nota fiscal..."
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="border rounded-md">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">Número</th>
                              <th className="text-left p-3 text-sm font-medium">Fornecedor</th>
                              <th className="text-left p-3 text-sm font-medium">Data</th>
                              <th className="text-left p-3 text-sm font-medium">Valor</th>
                              <th className="text-left p-3 text-sm font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {notasProcessadasEstoque.map((nota) => (
                              <tr 
                                key={nota.id} 
                                className="hover:bg-muted/50 cursor-pointer border-t"
                                onClick={() => setNotaSelecionada(nota)}
                              >
                                <td className="p-3">{nota.numero || '-'}</td>
                                <td className="p-3">{nota.fornecedor || '-'}</td>
                                <td className="p-3">
                                  {nota.dataEmissao ? new Date(nota.dataEmissao).toLocaleDateString('pt-BR') : '-'}
                                </td>
                                <td className="p-3">
                                  R$ {(nota.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3">
                                  <Badge variant="secondary">Estoque</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <EmptyState
                    title="Nenhuma nota fiscal processada para estoque"
                    description="Não existem notas fiscais processadas para estoque no momento."
                    icon={<FileText size={50} />}
                  />
                )}
              </TabsContent>

              {/* Aba Consumo */}
              <TabsContent value="consumo" className="mt-4">
                {notasProcessadasConsumo.length > 0 ? (
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Notas fiscais - Consumo Direto</h3>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar nota fiscal..."
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="border rounded-md">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">Número</th>
                              <th className="text-left p-3 text-sm font-medium">Fornecedor</th>
                              <th className="text-left p-3 text-sm font-medium">Data</th>
                              <th className="text-left p-3 text-sm font-medium">Valor</th>
                              <th className="text-left p-3 text-sm font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {notasProcessadasConsumo.map((nota) => (
                              <tr 
                                key={nota.id} 
                                className="hover:bg-muted/50 cursor-pointer border-t"
                                onClick={() => setNotaSelecionada(nota)}
                              >
                                <td className="p-3">{nota.numero || '-'}</td>
                                <td className="p-3">{nota.fornecedor || '-'}</td>
                                <td className="p-3">
                                  {nota.dataEmissao ? new Date(nota.dataEmissao).toLocaleDateString('pt-BR') : '-'}
                                </td>
                                <td className="p-3">
                                  R$ {(nota.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3">
                                  <Badge variant="secondary">Consumo</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <EmptyState
                    title="Nenhuma nota fiscal processada para consumo"
                    description="Não existem notas fiscais processadas para consumo direto no momento."
                    icon={<FileText size={50} />}
                  />
                )}
              </TabsContent>

              {/* Aba Histórico */}
              <TabsContent value="historico" className="mt-4">
                {notasHistorico.length > 0 ? (
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Histórico de Notas Fiscais</h3>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar nota fiscal..."
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="border rounded-md">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">Número</th>
                              <th className="text-left p-3 text-sm font-medium">Fornecedor</th>
                              <th className="text-left p-3 text-sm font-medium">Data</th>
                              <th className="text-left p-3 text-sm font-medium">Valor</th>
                              <th className="text-left p-3 text-sm font-medium">Tipo</th>
                              <th className="text-left p-3 text-sm font-medium">Processamento</th>
                              <th className="text-left p-3 text-sm font-medium">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {notasHistorico.map((nota) => (
                              <tr 
                                key={nota.id} 
                                className="hover:bg-muted/50 cursor-pointer border-t"
                                onClick={() => setNotaSelecionada(nota)}
                              >
                                <td className="p-3">{nota.numero || '-'}</td>
                                <td className="p-3">{nota.fornecedor || '-'}</td>
                                <td className="p-3">
                                  {nota.dataEmissao ? new Date(nota.dataEmissao).toLocaleDateString('pt-BR') : '-'}
                                </td>
                                <td className="p-3">
                                  R$ {(nota.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3">
                                  {nota.tipoProcessamento === 'estoque' ? (
                                    <Badge variant="secondary">Estoque</Badge>
                                  ) : (
                                    <Badge variant="secondary">Consumo Direto</Badge>
                                  )}
                                </td>
                                <td className="p-3">
                                  {nota.dataProcessamento ? new Date(nota.dataProcessamento).toLocaleString('pt-BR') : '-'}
                                </td>
                                <td className="p-3">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (nota.xmlContent) {
                                        downloadXML(nota.xmlContent, nota.numero);
                                      }
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <EmptyState
                    title="Nenhuma nota fiscal no histórico"
                    description="Não existem notas fiscais processadas no histórico."
                    icon={<FileText size={50} />}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar (1/3 da largura) */}
        <div>
          {/* Card de Ajuda */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ajuda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Como funciona o processo?</h4>
                <p className="text-muted-foreground">
                  Faça o upload do arquivo XML da nota fiscal eletrônica. O sistema irá extrair automaticamente os dados e itens para confirmação.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Onde obter o arquivo XML?</h4>
                <p className="text-muted-foreground">
                  O arquivo XML da NFe é enviado pelo fornecedor ou pode ser obtido no portal da SEFAZ do seu estado.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Após o processamento</h4>
                <p className="text-muted-foreground">
                  Revise os dados e itens extraídos, confirme as quantidades recebidas e finalize o processo para atualizar automaticamente o estoque.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {notaSelecionada && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="w-full max-w-2xl h-full bg-background overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Detalhes da Nota Fiscal</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setNotaSelecionada(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="font-medium">{notaSelecionada.numero || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {notaSelecionada.dataEmissao ? new Date(notaSelecionada.dataEmissao).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{notaSelecionada.fornecedor || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">
                    {notaSelecionada.cnpjFornecedor || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-medium">
                    R$ {(notaSelecionada.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chave de Acesso</p>
                  <p className="font-medium text-sm break-all">
                    {notaSelecionada.chaveAcesso || 'Não informada'}
                  </p>
                </div>
                {notaSelecionada.dataProcessamento && (
                  <div>
                    <p className="text-sm text-muted-foreground">Processamento</p>
                    <p className="font-medium">
                      {new Date(notaSelecionada.dataProcessamento).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                {notaSelecionada.tipoProcessamento && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">
                      {notaSelecionada.tipoProcessamento === 'estoque' ? 'Estoque' : 'Consumo Direto'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Itens da Nota Fiscal</h3>
                <div className="flex space-x-2">
                  {notaSelecionada.xmlContent && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadXML(notaSelecionada.xmlContent, notaSelecionada.numero)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar XML
                    </Button>
                  )}
                  {notaSelecionada.status === 'pendente' && (
                    <>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removerNotaFiscal(notaSelecionada.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                      <Button onClick={abrirModalProcessamento}>
                        Processar Nota Fiscal
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="border rounded-md">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Código</th>
                      <th className="text-left p-3 text-sm font-medium">Descrição</th>
                      <th className="text-left p-3 text-sm font-medium">Quantidade</th>
                      <th className="text-left p-3 text-sm font-medium">Unidade</th>
                      <th className="text-left p-3 text-sm font-medium">Valor Unit.</th>
                      <th className="text-left p-3 text-sm font-medium">Valor Total</th>
                      {notaSelecionada.status !== 'pendente' && (
                        <th className="text-left p-3 text-sm font-medium">Status</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {notaSelecionada.itens?.length ? (
                      notaSelecionada.itens.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">{item.codigo || '-'}</td>
                          <td className="p-3">{item.descricao || '-'}</td>
                          <td className="p-3">{(item.quantidade || 0).toLocaleString('pt-BR')}</td>
                          <td className="p-3">{item.unidade || '-'}</td>
                          <td className="p-3">
                            R$ {(item.valorUnitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3">
                            R$ {(item.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          {notaSelecionada.status !== 'pendente' && (
                            <td className="p-3">
                              <Badge variant={item.vinculado ? "default" : "outline"}>
                                {item.vinculado ? 'Processado' : 'Não processado'}
                              </Badge>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={notaSelecionada.status !== 'pendente' ? 7 : 6} className="text-center p-4 text-muted-foreground">
                          Nenhum item encontrado nesta nota fiscal
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setNotaSelecionada(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Processamento */}
      <Dialog open={showProcessamentoModal} onOpenChange={setShowProcessamentoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processar Nota Fiscal</DialogTitle>
            <DialogDescription>
              Selecione como deseja processar esta nota fiscal
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => handleSelecionarProcessamento('estoque')}
              >
                <FileText className="h-6 w-6 mb-2" />
                <span>Para Estoque</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => handleSelecionarProcessamento('consumo_direto')}
              >
                <FileText className="h-6 w-6 mb-2" />
                <span>Consumo Direto</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Processamento para Estoque */}
      {showEstoqueModal && notaSelecionada && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="w-full max-w-4xl h-full bg-background overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Vincular Itens ao Estoque</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowEstoqueModal(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {loadingProdutos ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Carregando produtos...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Código</th>
                          <th className="text-left p-3 text-sm font-medium">Descrição</th>
                          <th className="text-left p-3 text-sm font-medium">Quantidade</th>
                          <th className="text-left p-3 text-sm font-medium">Vincular a</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notaSelecionada.itens?.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">{item.codigo || '-'}</td>
                            <td className="p-3">{item.descricao || '-'}</td>
                            <td className="p-3">{(item.quantidade || 0).toLocaleString('pt-BR')} {item.unidade || '-'}</td>
                            <td className="p-3">
                              <Select
                                value={produtosVinculados[item.codigo] || ''}
                                onValueChange={(value) => handleVincularProduto(item.codigo, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                                <SelectContent className="bg-background">
                                  {produtos.map((produto) => (
                                    <SelectItem 
                                      key={produto.id} 
                                      value={produto.id}
                                      className="hover:bg-muted/50"
                                    >
                                      {produto.codigo_material} - {produto.nome} (Estoque: {produto.quantidade})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mt-6 space-x-2">
                    <Button variant="outline" onClick={() => setShowEstoqueModal(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={confirmarProcessamentoEstoque}
                      disabled={Object.keys(produtosVinculados).length !== notaSelecionada.itens.length}
                    >
                      Confirmar Processamento
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Consumo Direto */}
      {showConsumoDiretoModal && notaSelecionada && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="w-full max-w-md h-full bg-background overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Registrar Consumo Direto</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowConsumoDiretoModal(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {loadingCentrosCusto ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Carregando centros de custo...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Centro de Custo</label>
                    <div className="relative">
                      <div className="flex items-center border rounded-md mb-2">
                        <Search className="h-4 w-4 ml-3 text-muted-foreground" />
                        <Input
                          placeholder="Buscar centro de custo..."
                          className="border-0 pl-2 focus-visible:ring-0"
                          value={searchCentroCusto}
                          onChange={(e) => setSearchCentroCusto(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                        {filteredCentrosCusto.length > 0 ? (
                          filteredCentrosCusto.map(centro => (
                            <div key={centro.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                              <input
                                type="checkbox"
                                id={`centro-${centro.id}`}
                                checked={centrosSelecionados.includes(centro.id)}
                                onChange={() => toggleCentroCusto(centro.id)}
                                className="h-4 w-4"
                              />
                              <label htmlFor={`centro-${centro.id}`} className="text-sm flex-1">
                                <div className="font-medium">{centro.nome}</div>
                                <div className="text-muted-foreground text-xs">{centro.unidade}</div>
                              </label>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-4 text-muted-foreground text-sm">
                            Nenhum centro de custo encontrado
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Responsável</label>
                    <Input 
                      value={userData?.nome || user?.displayName || ''}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Observações</label>
                    <Input 
                      value={consumoDiretoData.observacoes || ''}
                      onChange={(e) => setConsumoDiretoData({
                        ...consumoDiretoData,
                        observacoes: e.target.value
                      })}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Itens da Nota Fiscal</h4>
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 text-sm font-medium">Código</th>
                            <th className="text-left p-2 text-sm font-medium">Descrição</th>
                            <th className="text-left p-2 text-sm font-medium">Quantidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notaSelecionada.itens?.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{item.codigo}</td>
                              <td className="p-2">{item.descricao}</td>
                              <td className="p-2">{item.quantidade} {item.unidade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6 space-x-2">
                    <Button variant="outline" onClick={() => setShowConsumoDiretoModal(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={salvarConsumoDireto}
                      disabled={centrosSelecionados.length === 0}
                    >
                      Registrar Consumo Direto
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default NotasFiscais;