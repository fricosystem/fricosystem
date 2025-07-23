import { useEffect, useState } from "react";
import { FileText, Upload, Search, Loader2, CheckCircle, AlertCircle, X, Link2, Plus } from "lucide-react";
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast";

import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import LoadingIndicator from "@/components/LoadingIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useNotasFiscais } from "@/hooks/useNotasFiscais";

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
}

interface NotaFiscal {
  id: string;
  numero: string;
  fornecedor: string;
  valor: number;
  dataEmissao: string;
  dataProcessamento: string;
  status: 'processada' | 'pendente';
  itens: ItemNotaFiscal[];
  cnpjFornecedor: string;
  chaveAcesso: string;
  xmlContent: string;
  tipoProcessamento?: 'estoque' | 'consumo_direto';
}

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

interface ConsumoDiretoItem {
  id: string;
  nfeId: string;
  nfeNumero: string;
  dataProcessamento: string;
  fornecedor: string;
  cnpjFornecedor: string;
  itemCodigo: string;
  itemDescricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  centroCusto?: string;
  responsavel?: string;
  observacoes?: string;
}

interface Deposito {
  id: string;
  deposito: string;
  unidade: string;
}

const NotasFiscais = () => {
  const {
    notasFiscais,
    setNotasFiscais,
    loading,
    arquivoSelecionado,
    setArquivoSelecionado,
    carregando,
    sefazValidado,
    handleArquivoChange,
    processarNota
  } = useNotasFiscais();

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscal | null>(null);
  const [showVinculacaoModal, setShowVinculacaoModal] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [produtoParaCriar, setProdutoParaCriar] = useState<ItemNotaFiscal | null>(null);
  const [novoProduto, setNovoProduto] = useState<Partial<Produto> | null>(null);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [loadingDepositos, setLoadingDepositos] = useState(false);
  const [showProcessamentoModal, setShowProcessamentoModal] = useState(false);
  const [showConsumoDiretoModal, setShowConsumoDiretoModal] = useState(false);
  const [consumoDiretoData, setConsumoDiretoData] = useState<Partial<ConsumoDiretoItem>>({});
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const { toast } = useToast();

  const URL_SEFAZ = 'https://nfe.fazenda.sp.gov.br/ws/nfestatusservico2.asmx';
  const [sefazStatus, setSefazStatus] = useState<SefazStatus>({
    status: "online",
    message: "Sistema online e operacional",
    lastChecked: new Date().toLocaleTimeString('pt-BR')
  });
  const [checkingSefaz, setCheckingSefaz] = useState(false);

  const parseXML = (xmlString: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        
        const errors = xmlDoc.getElementsByTagName("parsererror");
        if (errors.length > 0) {
          throw new Error("XML malformado ou inválido");
        }
  
        const xmlToObj = (node: Element): any => {
          const obj: any = {};
          
          if (node.attributes && node.attributes.length > 0) {
            for (let i = 0; i < node.attributes.length; i++) {
              const attr = node.attributes[i];
              obj[attr.name] = attr.value;
            }
          }
          
          if (node.childNodes.length > 0) {
            for (let i = 0; i < node.childNodes.length; i++) {
              const child = node.childNodes[i] as Element;
              
              if (child.nodeType === 1) {
                const nodeName = child.nodeName;
                
                if (child.childNodes.length === 1 && child.childNodes[0].nodeType === 3) {
                  obj[nodeName] = child.childNodes[0].nodeValue?.trim() || '';
                } else {
                  if (typeof obj[nodeName] === 'undefined') {
                    obj[nodeName] = xmlToObj(child);
                  } else {
                    if (!Array.isArray(obj[nodeName])) {
                      obj[nodeName] = [obj[nodeName]];
                    }
                    obj[nodeName].push(xmlToObj(child));
                  }
                }
              }
            }
          }
          
          return obj;
        };
  
        resolve(xmlToObj(xmlDoc.documentElement));
      } catch (error) {
        console.error("Erro no parser XML:", error);
        reject(new Error("Erro ao processar o arquivo XML. Verifique se é um arquivo válido."));
      }
    });
  };

  const getSafeValue = (obj: any, path: string[]): any => {
    try {
      let current = obj;
      for (const key of path) {
        if (!current || typeof current !== 'object') return null;
        current = current[key];
        if (Array.isArray(current)) {
          current = current.length > 0 ? current[0] : null;
        }
      }
      return current || null;
    } catch (error) {
      console.error('Erro no getSafeValue:', error);
      return null;
    }
  };
  
  const extrairDadosNFe = (nfeData: any): NotaFiscal => {
    try {
      const nfeRoot = 
        getSafeValue(nfeData, ['nfeProc', 'NFe', 'infNFe']) ||
        getSafeValue(nfeData, ['NFe', 'infNFe']) ||
        getSafeValue(nfeData, ['infNFe']) ||
        nfeData;
  
      if (!nfeRoot) {
        throw new Error("Estrutura principal da NFe não encontrada");
      }

      const ide = getSafeValue(nfeRoot, ['ide']) || {};
      const emit = getSafeValue(nfeRoot, ['emit']) || {};
      const total = getSafeValue(nfeRoot, ['total', 'ICMSTot']) || {};

      const detItems = getSafeValue(nfeRoot, ['det']);
      let itens: ItemNotaFiscal[] = [];
      
      if (detItems) {
        const itemsArray = Array.isArray(detItems) ? detItems : [detItems];
        itens = itemsArray
          .filter((item: any) => item && getSafeValue(item, ['prod']))
          .map((item: any) => {
            const prod = getSafeValue(item, ['prod']) || {};
            return {
              codigo: prod.cProd?.[0] || prod.$?.cProd || '',
              descricao: prod.xProd?.[0] || '',
              quantidade: parseFloat(prod.qCom?.[0] || prod.$?.qCom || '0'),
              unidade: prod.uCom?.[0] || prod.$?.uCom || '',
              valorUnitario: parseFloat(prod.vUnCom?.[0] || prod.$?.vUnCom || '0'),
              valorTotal: parseFloat(prod.vProd?.[0] || prod.$?.vProd || '0')
            };
          });
      }

      return {
        id: uuidv4(),
        numero: ide.nNF?.[0] || ide.$?.nNF || ide.cNF?.[0] || ide.$?.cNF || '',
        fornecedor: emit.xFant?.[0] || emit.xNome?.[0] || emit.$?.xNome || '',
        valor: parseFloat(total.vNF?.[0] || total.$?.vNF || '0'),
        dataEmissao: ide.dhEmi?.[0] || ide.$?.dhEmi || ide.dEmi?.[0] || ide.$?.dEmi || '',
        dataProcessamento: new Date().toISOString(),
        status: 'pendente',
        itens,
        cnpjFornecedor: emit.CNPJ?.[0] || emit.$?.CNPJ || emit.cnpj?.[0] || emit.CPF?.[0] || '',
        chaveAcesso: getSafeValue(nfeData, ['nfeProc', 'protNFe', 'infProt', 'chNFe']) || 
                    nfeRoot.$?.Id?.replace('NFe', '') || '',
        xmlContent: ''
      };
    } catch (error) {
      console.error("Erro detalhado na extração:", error);
      throw new Error(`Falha ao extrair dados da NFe: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processarNota();
  };

  const checkRealSefazStatus = async () => {
    try {
      const response = await fetch(URL_SEFAZ, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico2/nfeStatusServicoNF2'
        },
        body: `<?xml version="1.0"?>
          <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
            <soap:Body>
              <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico2">
                <!-- XML de consulta específico -->
              </nfeDadosMsg>
            </soap:Body>
          </soap:Envelope>`
      });
      
      // Processar resposta XML
    } catch (error) {
      console.error("Erro na consulta SEFAZ:", error);
    }
  };

  const carregarDepositos = async () => {
    setLoadingDepositos(true);
    try {
      const depositosRef = collection(db, "depositos");
      const depositosSnapshot = await getDocs(depositosRef);
      const depositosData = depositosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Deposito[];
      setDepositos(depositosData);
    } catch (error) {
      console.error("Erro ao carregar depósitos:", error);
    } finally {
      setLoadingDepositos(false);
    }
  };

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
    } finally {
      setLoadingProdutos(false);
    }
  };

  const abrirModalVinculacao = async () => {
    if (!notaSelecionada) return;
    setShowProcessamentoModal(true);
  };

  const handleSelecionarProcessamento = (tipo: 'estoque' | 'consumo_direto') => {
    if (!notaSelecionada) return;
    
    setShowProcessamentoModal(false);
    
    const atualizarNota = async () => {
      try {
        const notaRef = doc(db, "notas_fiscais", notaSelecionada.id);
        await updateDoc(notaRef, {
          tipoProcessamento: tipo,
          status: 'processada'
        });
        
        setNotasFiscais(notasFiscais.map(n => 
          n.id === notaSelecionada.id ? 
          { 
            ...n, 
            tipoProcessamento: tipo, 
            status: 'processada',
            numero: n.numero,
            dataEmissao: n.dataEmissao,
            dataProcessamento: n.dataProcessamento,
            xmlContent: n.xmlContent
          } : n
        ));
        
        setNotaSelecionada({
          ...notaSelecionada,
          tipoProcessamento: tipo,
          status: 'processada',
          numero: notaSelecionada.numero,
          dataEmissao: notaSelecionada.dataEmissao,
          dataProcessamento: notaSelecionada.dataProcessamento,
          xmlContent: notaSelecionada.xmlContent
        });
        
        if (tipo === 'estoque') {
          setShowVinculacaoModal(true);
          await carregarDepositos();
          await carregarProdutos();
        } else {
          setShowConsumoDiretoModal(true);
          setConsumoDiretoData({
            nfeId: notaSelecionada.id,
            nfeNumero: notaSelecionada.numero,
            dataProcessamento: new Date().toISOString(),
            fornecedor: notaSelecionada.fornecedor,
            cnpjFornecedor: notaSelecionada.cnpjFornecedor
          });
        }
      } catch (error) {
        console.error("Erro ao atualizar nota fiscal:", error);
      }
    };
    
    atualizarNota();
  };

  const produtoJaExiste = (codigoItem: string) => {
    return produtos.some(produto => produto.codigo === codigoItem);
  };

  const vincularProduto = async (item: ItemNotaFiscal, produto: Produto) => {
    try {
      const produtoRef = doc(db, "produtos", produto.id);
      await updateDoc(produtoRef, {
        quantidadeAtual: produto.quantidadeAtual + item.quantidade,
        valorUnitario: item.valorUnitario,
        fornecedor_nome: notaSelecionada?.fornecedor,
        fornecedor_cnpj: notaSelecionada?.cnpjFornecedor,
        status: "em_abastecimento"
      });
      
      setProdutos(produtos.map(p => 
        p.id === produto.id ? {
          ...p,
          quantidadeAtual: p.quantidadeAtual + item.quantidade,
          valorUnitario: item.valorUnitario,
          fornecedor_nome: notaSelecionada?.fornecedor || p.fornecedor_nome,
          fornecedor_cnpj: notaSelecionada?.cnpjFornecedor || p.fornecedor_cnpj,
          status: "em_abastecimento"
        } : p
      ));
      
      if (notaSelecionada) {
        setNotaSelecionada({
          ...notaSelecionada,
          itens: notaSelecionada.itens.map(i => 
            i.codigo === item.codigo ? { ...i, vinculado: true } : i
          ),
          numero: notaSelecionada.numero,
          dataEmissao: notaSelecionada.dataEmissao,
          dataProcessamento: notaSelecionada.dataProcessamento,
          xmlContent: notaSelecionada.xmlContent
        });
      }
    } catch (error) {
      console.error("Erro ao vincular produto:", error);
    }
  };

  const criarNovoProduto = async () => {
    if (!produtoParaCriar || !novoProduto || !notaSelecionada) return;
    
    try {
      const produtosRef = collection(db, "produtos");
      const novoProdutoCompleto: Omit<Produto, 'id'> = {
        codigo: produtoParaCriar.codigo,
        codigoEstoque: novoProduto.codigoEstoque || produtoParaCriar.codigo,
        nome: novoProduto.nome || produtoParaCriar.descricao,
        unidade: produtoParaCriar.unidade,
        unidade_de_medida: novoProduto.unidade_de_medida || produtoParaCriar.unidade,
        deposito: novoProduto.deposito || "Principal",
        quantidadeAtual: produtoParaCriar.quantidade,
        quantidadeMinima: novoProduto.quantidadeMinima || 0,
        detalhes: novoProduto.detalhes || "",
        imagem: novoProduto.imagem || "",
        valorUnitario: produtoParaCriar.valorUnitario,
        prateleira: novoProduto.prateleira || "",
        dataVencimento: novoProduto.dataVencimento || "",
        dataHora: new Date().toISOString(),
        fornecedor: notaSelecionada.fornecedor,
        fornecedor_nome: notaSelecionada.fornecedor,
        fornecedor_cnpj: notaSelecionada.cnpjFornecedor || "",
        status: "em_abastecimento"
      };
      
      await addDoc(produtosRef, novoProdutoCompleto);
      await carregarProdutos();
      setProdutoParaCriar(null);
      setNovoProduto(null);
      
      setNotaSelecionada({
        ...notaSelecionada,
        itens: notaSelecionada.itens.map(i => 
          i.codigo === produtoParaCriar.codigo ? { ...i, vinculado: true } : i
        ),
        numero: notaSelecionada.numero,
        dataEmissao: notaSelecionada.dataEmissao,
        dataProcessamento: notaSelecionada.dataProcessamento,
        xmlContent: notaSelecionada.xmlContent
      });
    } catch (error) {
      console.error("Erro ao criar novo produto:", error);
    }
  };

  const finalizarVinculacao = () => {
    const atualizarStatus = async () => {
      const produtosParaAtualizar = produtos.filter(p => 
        notaSelecionada?.itens.some(i => i.codigo === p.codigo && i.vinculado)
      );
      
      try {
        await Promise.all(produtosParaAtualizar.map(async produto => {
          const produtoRef = doc(db, "produtos", produto.id);
          await updateDoc(produtoRef, {
            status: "abastecido"
          });
        }));
        
        setNotaSelecionada(null);
        setShowVinculacaoModal(false);
      } catch (error) {
        console.error("Erro ao finalizar vinculação:", error);
      }
    };
    
    atualizarStatus();
  };

  const salvarConsumoDireto = async () => {
    if (!notaSelecionada || !consumoDiretoData) return;
    
    try {
      await Promise.all(notaSelecionada.itens.map(async (item) => {
        const consumoDiretoRef = collection(db, "consumo_direto_nfe");
        await addDoc(consumoDiretoRef, {
          nfeId: notaSelecionada.id,
          nfeNumero: notaSelecionada.numero,
          dataProcessamento: new Date().toISOString(),
          fornecedor: notaSelecionada.fornecedor,
          cnpjFornecedor: notaSelecionada.cnpjFornecedor,
          itemCodigo: item.codigo,
          itemDescricao: item.descricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valorUnitario: item.valorUnitario,
          valorTotal: item.valorTotal,
          centroCusto: consumoDiretoData.centroCusto || '',
          responsavel: consumoDiretoData.responsavel || '',
          observacoes: consumoDiretoData.observacoes || ''
        });
      }));
      
      setShowConsumoDiretoModal(false);
      setNotaSelecionada(null);
    } catch (error) {
      console.error("Erro ao salvar consumo direto:", error);
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
  const notasProcessadas = notasFiscais.filter(n => n.status === 'processada');

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
            <Tabs defaultValue="processadas">
              <TabsList>
                <TabsTrigger value="pendentes">Pendentes ({notasPendentes.length})</TabsTrigger>
                <TabsTrigger value="processadas">Processadas ({notasProcessadas.length})</TabsTrigger>
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
                                  <span className={`text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`}>
                                    Pendente
                                  </span>
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

              {/* Aba Processadas */}
              <TabsContent value="processadas" className="mt-4">
                {notasProcessadas.length > 0 ? (
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Notas fiscais processadas</h3>
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
                              <th className="text-left p-3 text-sm font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {notasProcessadas.map((nota) => (
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
                                  {nota.tipoProcessamento === 'estoque' ? 'Estoque' : 'Consumo Direto'}
                                </td>
                                <td className="p-3">
                                  <span className={`text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`}>
                                    Processada
                                  </span>
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
                    title="Nenhuma nota fiscal processada"
                    description="Não existem notas fiscais processadas no momento."
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
          
          {/* Card de Status SEFAZ */}
          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Status da SEFAZ</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={checkRealSefazStatus}
                disabled={checkingSefaz}
              >
                {checkingSefaz ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
              </Button>
            </CardHeader>
            <CardContent>
              {checkingSefaz ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Verificando status da SEFAZ...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    {sefazStatus.status === 'online' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {sefazStatus.status === 'partial' && (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    {sefazStatus.status === 'offline' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${
                      sefazStatus.status === 'online' ? 'text-green-500' :
                      sefazStatus.status === 'partial' ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {sefazStatus.message}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Última verificação: {sefazStatus.lastChecked}
                  </p>
                </>
              )}
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
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Itens da Nota Fiscal</h3>
                {notaSelecionada.status === 'pendente' && (
                  <Button onClick={abrirModalVinculacao}>
                    Processar Nota Fiscal
                  </Button>
                )}
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
                      <th className="text-left p-3 text-sm font-medium">Status</th>
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
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.vinculado 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                              {item.vinculado ? 'Vinculado' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center p-4 text-muted-foreground">
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

      {/* Modal de Vinculação */}
      {showVinculacaoModal && notaSelecionada && (
        <Dialog open={showVinculacaoModal} onOpenChange={setShowVinculacaoModal}>
          <DialogContent className="max-w-6xl h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Link2 className="h-5 w-5 mr-2" />
                Vincular Itens da Nota Fiscal ao Estoque
              </DialogTitle>
            </DialogHeader>

            {loadingProdutos ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Carregando produtos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <h3 className="font-medium mb-2">Itens da Nota Fiscal</h3>
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2 text-sm font-medium">Código</th>
                          <th className="text-left p-2 text-sm font-medium">Descrição</th>
                          <th className="text-left p-2 text-sm font-medium">Qtd</th>
                          <th className="text-left p-2 text-sm font-medium">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notaSelecionada.itens?.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{item.codigo || '-'}</td>
                            <td className="p-2">{item.descricao || '-'}</td>
                            <td className="p-2">{(item.quantidade || 0).toLocaleString('pt-BR')} {item.unidade || '-'}</td>
                            <td className="p-2">
                              {produtoJaExiste(item.codigo) ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled={item.vinculado}
                                  onClick={() => {
                                    const produto = produtos.find(p => p.codigo === item.codigo);
                                    if (produto) {
                                      vincularProduto(item, produto);
                                    }
                                  }}
                                >
                                  {item.vinculado ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" /> Vinculado
                                    </>
                                  ) : (
                                    <>
                                      <Link2 className="h-4 w-4 mr-1" /> Vincular
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setProdutoParaCriar(item);
                                    setNovoProduto({
                                      codigoEstoque: item.codigo,
                                      nome: item.descricao,
                                      unidade_de_medida: item.unidade,
                                      deposito: "Principal",
                                      quantidadeMinima: 0,
                                      valorUnitario: item.valorUnitario
                                    });
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Criar Produto
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Produtos no Estoque</h3>
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2 text-sm font-medium">Código</th>
                          <th className="text-left p-2 text-sm font-medium">Nome</th>
                          <th className="text-left p-2 text-sm font-medium">Estoque</th>
                          <th className="text-left p-2 text-sm font-medium">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produtos?.map((produto, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{produto.codigo || '-'}</td>
                            <td className="p-2">{produto.nome || '-'}</td>
                            <td className="p-2">
                              {(produto.quantidadeAtual || 0).toLocaleString('pt-BR')} {produto.unidade || '-'}
                            </td>
                            <td className="p-2">
                              R$ {(produto.valorUnitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6 space-x-2">
              <Button variant="outline" onClick={() => setShowVinculacaoModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={finalizarVinculacao}
                disabled={!notaSelecionada.itens?.some(i => i.vinculado)}
              >
                Finalizar Vinculação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Criação de Produto */}
      {produtoParaCriar && novoProduto && (
        <Dialog open={!!produtoParaCriar} onOpenChange={(open) => !open && setProdutoParaCriar(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Produto</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código do Produto</label>
                <Input 
                  value={novoProduto.codigoEstoque || produtoParaCriar.codigo || ''}
                  onChange={(e) => setNovoProduto({...novoProduto, codigoEstoque: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nome do Produto</label>
                <Input 
                  value={novoProduto.nome || produtoParaCriar.descricao || ''}
                  onChange={(e) => setNovoProduto({...novoProduto, nome: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Unidade de Medida</label>
                  <Input 
                    value={novoProduto.unidade_de_medida || produtoParaCriar.unidade || ''}
                    onChange={(e) => setNovoProduto({...novoProduto, unidade_de_medida: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Depósito</label>
                  {loadingDepositos ? (
                    <Input disabled value="Carregando depósitos..." />
                  ) : (
                    <Select
                      value={novoProduto.deposito || "Principal"}
                      onValueChange={(value) => setNovoProduto({...novoProduto, deposito: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um depósito" />
                      </SelectTrigger>
                      <SelectContent>
                        {depositos.map((deposito) => (
                          <SelectItem key={deposito.id} value={deposito.deposito}>
                            {deposito.deposito} ({deposito.unidade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade Mínima</label>
                  <Input 
                    type="number"
                    value={novoProduto.quantidadeMinima || 0}
                    onChange={(e) => setNovoProduto({...novoProduto, quantidadeMinima: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor Unitário</label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={novoProduto.valorUnitario || produtoParaCriar.valorUnitario || 0}
                    onChange={(e) => setNovoProduto({...novoProduto, valorUnitario: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prateleira</label>
                <Input 
                  value={novoProduto.prateleira || ""}
                  onChange={(e) => setNovoProduto({...novoProduto, prateleira: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Detalhes</label>
                <Input 
                  value={novoProduto.detalhes || ""}
                  onChange={(e) => setNovoProduto({...novoProduto, detalhes: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-2">
              <Button variant="outline" onClick={() => setProdutoParaCriar(null)}>
                Cancelar
              </Button>
              <Button onClick={criarNovoProduto}>
                <Plus className="h-4 w-4 mr-2" /> Criar Produto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Consumo Direto */}
      {showConsumoDiretoModal && notaSelecionada && (
        <Dialog open={showConsumoDiretoModal} onOpenChange={setShowConsumoDiretoModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Consumo Direto</DialogTitle>
              <DialogDescription>
                Preencha os detalhes para registrar os itens como consumo direto
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">Centro de Custo</label>
                <Input 
                  value={consumoDiretoData.centroCusto || ''}
                  onChange={(e) => setConsumoDiretoData({...consumoDiretoData, centroCusto: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Responsável</label>
                <Input 
                  value={consumoDiretoData.responsavel || ''}
                  onChange={(e) => setConsumoDiretoData({...consumoDiretoData, responsavel: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <Input 
                  value={consumoDiretoData.observacoes || ''}
                  onChange={(e) => setConsumoDiretoData({...consumoDiretoData, observacoes: e.target.value})}
                />
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Itens da Nota Fiscal</h4>
                <div className="border rounded-md p-4">
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
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConsumoDiretoModal(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarConsumoDireto}>
                Registrar Consumo Direto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
};

export default NotasFiscais;