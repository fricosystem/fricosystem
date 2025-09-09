import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Target, Plus, Calendar, TrendingUp, Edit, Save, X, RefreshCw, Settings } from "lucide-react";
import { usePCPConfig } from "@/hooks/usePCPConfig";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface Produto {
  id: string;
  batch_receita_kg: string;
  batch_receita_un: string;
  classificacao: string;
  codigo: string;
  cx_respectiva: string;
  descricao_produto: string;
  embalagem: string;
  maquina: string;
  peso_liq_unit_kg: string;
  un_cx: string;
}

interface ProcessamentoData {
  id: string;
  dataProcessamento: string;
  turnosProcessados: string[];
  kgTotal: number;
  kgTurno1: number;
  kgTurno2: number;
  planejadoTurno1: number;
  planejadoTurno2: number;
  planoDiario: number;
  timestamp: Date;
}

interface MetaPorClassificacao {
  classificacao: string;
  meta: number;
  realizado: number;
  percentual: number;
}

interface PeriodoFilter {
  inicio: string;
  fim: string;
  tipo: 'diario' | 'semanal' | 'mensal' | 'personalizado';
  customStartDate?: Date;
  customEndDate?: Date;
}

const Metas = () => {
  const { config, saveConfig, loading: configLoading } = usePCPConfig();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [processamentos, setProcessamentos] = useState<ProcessamentoData[]>([]);
  const [metasPorClassificacao, setMetasPorClassificacao] = useState<MetaPorClassificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoFilter>({
    inicio: format(new Date(), 'yyyy-MM-dd'),
    fim: format(new Date(), 'yyyy-MM-dd'),
    tipo: 'diario'
  });
  const [editandoMeta, setEditandoMeta] = useState<string | null>(null);
  const [novaMetaTemp, setNovaMetaTemp] = useState<number>(0);
  const [metaDiariaGlobal, setMetaDiariaGlobal] = useState(config.meta_diaria_global || 125000);

  // Cache para documentos já carregados
  const [documentCache, setDocumentCache] = useState<Record<string, any>>({});

  // Estados para o card Parâmetros de Produção
  const [diasTrabalhados, setDiasTrabalhados] = useState(0);
  const [diasParaFecharMes, setDiasParaFecharMes] = useState(0);
  const [totalProducao, setTotalProducao] = useState(0);
  const [volumeDiasRestantes, setVolumeDiasRestantes] = useState(0);
  const [metaDiariaRealizada, setMetaDiariaRealizada] = useState(0);
  const [progressoMensal, setProgressoMensal] = useState(0);
  
  // Estados para controlar valores formatados dos inputs
  const [metaMensalFormatada, setMetaMensalFormatada] = useState('0');
  const [diasUteisFormatados, setDiasUteisFormatados] = useState('0');

  // Hook usePCPConfig para funções do sistema
  const { 
    carregarProducaoTotal,
    carregarMetaDiariaRealizada,
    contarDocumentosPCP,
    salvarConfigSistema,
  } = usePCPConfig();

  // Funções utilitárias para formatação brasileira
  const formatarNumero = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatarNumeroInput = (valor: number): string => {
    return valor.toLocaleString('pt-BR');
  };

  const parseNumero = (valor: string): number => {
    // Remove pontos (separadores de milhares) e substitui vírgula por ponto
    const cleanValue = valor.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  // Atualizar valores formatados quando config carrega
  useEffect(() => {
    if (!configLoading && config) {
      const metaMinima = config.meta_minima_mensal || 0;
      const diasUteis = config.dias_uteis_mes || 0;
      
      setMetaMensalFormatada(formatarNumeroInput(metaMinima));
      setDiasUteisFormatados(formatarNumeroInput(diasUteis));
    }
  }, [config, configLoading]);

  // Carregar dados reais do sistema
  useEffect(() => {
    const carregarDadosReais = async () => {
      try {
        // Carregar produção total dos Resultados Finais
        const producaoTotalReal = await carregarProducaoTotal();
        setTotalProducao(producaoTotalReal);

        // Carregar meta diária realizada do último processamento
        const metaDiariaReal = await carregarMetaDiariaRealizada();
        setMetaDiariaRealizada(metaDiariaReal);

        // Contar documentos PCP criados (dias trabalhados)
        const documentosCount = await contarDocumentosPCP();
        setDiasTrabalhados(documentosCount);
      } catch (error) {
        console.error('Erro ao carregar dados reais:', error);
      }
    };

    carregarDadosReais();
  }, [carregarProducaoTotal, carregarMetaDiariaRealizada, contarDocumentosPCP]);

  // Calcular valores derivados quando os dados mudam
  useEffect(() => {
    if (config) {
      const metaMinimaMensal = config.meta_minima_mensal || 0;
      const diasUteisMes = config.dias_uteis_mes || 0;
      
      // Cálculos baseados nos dados reais
      const diasRestantes = Math.max(0, diasUteisMes - diasTrabalhados);
      const volumeRestante = Math.max(0, metaMinimaMensal - totalProducao);
      const progresso = metaMinimaMensal > 0 ? (totalProducao / metaMinimaMensal) * 100 : 0;

      setDiasParaFecharMes(diasRestantes);
      setVolumeDiasRestantes(volumeRestante);
      setProgressoMensal(progresso);
    }
  }, [config, diasTrabalhados, totalProducao]);

  // Função para salvar configurações dos parâmetros de produção
  const handleSalvarParametros = async () => {
    const dataToSave = {
      meta_minima_mensal: parseNumero(metaMensalFormatada),
      dias_uteis_mes: parseNumero(diasUteisFormatados)
    };

    const success = await salvarConfigSistema(dataToSave);

    if (success) {
      toast({
        title: "Parâmetros salvos",
        description: "Os parâmetros de produção foram atualizados!",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar os parâmetros.",
        variant: "destructive",
      });
    }
  };

  // Metas padrão baseadas na imagem
  const metasPadrao = {
    'FRESCAIS GROSSAS': 50000,
    'FRESCAIS FINAS': 18000,
    'FRESCAIS BANDEJAS': 3000,
    'BACON': 5000,
    'CALABRESA': 22000,
    'MORTADELA': 8000,
    'PRESUNTARIA': 16000,
    'FATIADOS': 3000
  };

  // Função para normalizar códigos
  const normalizeCode = (code: string | undefined): string => {
    return (code || "").trim().toLowerCase();
  };

  // Função para carregar documento com cache
  const getDocumentWithCache = async (docId: string) => {
    if (documentCache[docId]) {
      return documentCache[docId];
    }
    
    try {
      const docRef = doc(db, "PCP", docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDocumentCache(prev => ({ ...prev, [docId]: data }));
        return data;
      }
    } catch (error) {
      console.error(`Erro ao carregar documento ${docId}:`, error);
    }
    return null;
  };

  const loadProdutos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "PCP_produtos"));
      const produtosData: Produto[] = [];
      querySnapshot.forEach((doc) => {
        produtosData.push({
          id: doc.id,
          ...doc.data()
        } as Produto);
      });
      setProdutos(produtosData);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos",
        variant: "destructive",
      });
    }
  };

  const loadProcessamentos = async () => {
    try {
      const processamentosCollection = collection(db, "PCP");
      const q = query(processamentosCollection, orderBy("Processamento.timestamp", "desc"));
      const querySnapshot = await getDocs(q);

      const processamentosData: ProcessamentoData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data().Processamento;
        if (data) {
          processamentosData.push({
            id: doc.id,
            dataProcessamento: data.dataProcessamento,
            turnosProcessados: data.turnosProcessados,
            kgTotal: data.kgTotal || 0,
            kgTurno1: data.kgTurno1 || 0,
            kgTurno2: data.kgTurno2 || 0,
            planejadoTurno1: data.planejadoTurno1 || 0,
            planejadoTurno2: data.planejadoTurno2 || 0,
            planoDiario: data.planoDiario || 0,
            timestamp: data.timestamp.toDate()
          });
        }
      });
      setProcessamentos(processamentosData);
    } catch (error) {
      console.error("Erro ao carregar processamentos:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar processamentos",
        variant: "destructive",
      });
    }
  };

  const calcularRealizadoPorClassificacao = async (classificacao: string): Promise<number> => {
    try {
      // Carregar todos os documentos de uma vez em lote
      const allDocPromises = processamentos.map(processamento => getDocumentWithCache(processamento.id));
      const allDocs = await Promise.all(allDocPromises);

      // Criar um índice de todos os produtos de todos os turnos
      const produtoIndex = new Map<string, number>();

      allDocs.forEach((docData) => {
        if (!docData) return;

        const turno1 = docData["1 Turno"] || [];
        const turno2 = docData["2 Turno"] || [];

        // Processar turno 1
        turno1.forEach((item: any) => {
          const codigo = normalizeCode(item.codigo);
          if (!codigo) return;
          
          const kg = parseFloat(item.kg || "0");
          produtoIndex.set(codigo, (produtoIndex.get(codigo) || 0) + kg);
        });

        // Processar turno 2
        turno2.forEach((item: any) => {
          const codigo = normalizeCode(item.codigo);
          if (!codigo) return;
          
          const kg = parseFloat(item.kg || "0");
          produtoIndex.set(codigo, (produtoIndex.get(codigo) || 0) + kg);
        });
      });

      // Calcular total para a classificação
      const produtosDaClassificacao = produtos.filter(p => p.classificacao === classificacao);
      let totalClassificacao = 0;

      for (const produto of produtosDaClassificacao) {
        const codigoNormalizado = normalizeCode(produto.codigo);
        const kgProduto = produtoIndex.get(codigoNormalizado) || 0;
        totalClassificacao += kgProduto;
      }

      return totalClassificacao;
    } catch (error) {
      console.error(`Erro ao calcular realizado para ${classificacao}:`, error);
      return 0;
    }
  };

  const inicializarMetas = async () => {
    if (produtos.length === 0 || processamentos.length === 0) return;

    setLoading(true);
    
    // Obter classificações únicas dos produtos
    const classificacoesUnicas = [...new Set(produtos.map(p => p.classificacao).filter(Boolean))];
    
    const metasComRealizado: MetaPorClassificacao[] = [];

    for (const classificacao of classificacoesUnicas) {
      const meta = metasPadrao[classificacao as keyof typeof metasPadrao] || 0;
      const realizado = await calcularRealizadoPorClassificacao(classificacao);
      const percentual = meta > 0 ? (realizado / meta) * 100 : 0;

      metasComRealizado.push({
        classificacao,
        meta,
        realizado,
        percentual: Math.round(percentual * 100) / 100
      });
    }

    setMetasPorClassificacao(metasComRealizado);
    setLoading(false);
  };

  const handlePeriodoChange = (tipo: string) => {
    const hoje = new Date();
    let inicio: string;
    let fim: string;

    switch (tipo) {
      case 'diario':
        inicio = format(hoje, 'yyyy-MM-dd');
        fim = format(hoje, 'yyyy-MM-dd');
        break;
      case 'semanal':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        inicio = format(inicioSemana, 'yyyy-MM-dd');
        fim = format(fimSemana, 'yyyy-MM-dd');
        break;
      case 'mensal':
        inicio = format(startOfMonth(hoje), 'yyyy-MM-dd');
        fim = format(endOfMonth(hoje), 'yyyy-MM-dd');
        break;
      default:
        return;
    }

    setPeriodo({ inicio, fim, tipo: tipo as any });
  };

  const handleEditarMeta = (classificacao: string, metaAtual: number) => {
    setEditandoMeta(classificacao);
    setNovaMetaTemp(metaAtual);
  };

  const handleSalvarMeta = (classificacao: string) => {
    setMetasPorClassificacao(prev => 
      prev.map(meta => 
        meta.classificacao === classificacao 
          ? { 
              ...meta, 
              meta: novaMetaTemp,
              percentual: novaMetaTemp > 0 ? (meta.realizado / novaMetaTemp) * 100 : 0
            }
          : meta
      )
    );
    setEditandoMeta(null);
    toast({
      title: "Meta atualizada",
      description: `Meta para ${classificacao} atualizada para ${novaMetaTemp.toLocaleString()} kg`
    });
  };

  const handleCancelarEdicao = () => {
    setEditandoMeta(null);
    setNovaMetaTemp(0);
  };

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadProdutos(), loadProcessamentos()]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Inicializar metas quando dados estiverem carregados
  useEffect(() => {
    if (produtos.length > 0 && processamentos.length > 0) {
      inicializarMetas();
    }
  }, [produtos, processamentos, periodo]);

  const formatarKg = (valor: number) => {
    return new Intl.NumberFormat('pt-BR').format(valor);
  };

  const getCorStatus = (percentual: number) => {
    if (percentual >= 100) return "bg-green-500";
    if (percentual >= 80) return "bg-yellow-500";
    if (percentual >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const getTextStatus = (percentual: number) => {
    if (percentual >= 100) return "text-green-700";
    if (percentual >= 80) return "text-yellow-700";
    if (percentual >= 60) return "text-orange-700";
    return "text-red-700";
  };

  const totalMeta = metasPorClassificacao.reduce((acc, item) => acc + item.meta, 0);
  const totalRealizado = metasPorClassificacao.reduce((acc, item) => acc + item.realizado, 0);
  const percentualGeral = totalMeta > 0 ? (totalRealizado / totalMeta) * 100 : 0;

  if (loading || configLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p>Carregando metas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Gestão de Metas
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure e acompanhe as metas de produção por classificação
          </p>
        </div>
      </div>

      {/* Card Parâmetros de Produção */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Parâmetros de Produção
            </div>
            <Button 
              size="sm" 
              onClick={handleSalvarParametros}
              className="flex items-center gap-1"
            >
              <Save className="h-3 w-3" />
              Salvar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-3">
               <div>
                 <Label className="font-medium">Meta Mínima Mensal (KG)</Label>
                 <Input
                   type="text"
                   value={metaMensalFormatada}
                   onChange={(e) => {
                     const valor = e.target.value;
                     setMetaMensalFormatada(valor);
                   }}
                   placeholder="Ex: 100.000"
                 />
               </div>
               
               <div>
                 <Label className="font-medium">Dias Úteis no Mês</Label>
                 <Input
                   type="text"
                   value={diasUteisFormatados}
                   onChange={(e) => {
                     const valor = e.target.value;
                     setDiasUteisFormatados(valor);
                   }}
                   placeholder="Ex: 22"
                 />
               </div>
             </div>
             
             <div className="space-y-2">
               <div>
                 <Label className="font-medium text-muted-foreground">Dias Trabalhados</Label>
                 <div className="font-semibold">{diasTrabalhados}</div>
               </div>
               
               <div>
                 <Label className="font-medium text-muted-foreground">Dias para Fechar</Label>
                 <div className="font-semibold">{diasParaFecharMes}</div>
               </div>

               <div>
                 <Label className="font-medium text-muted-foreground">Meta Diária Realizada</Label>
                 <div className="font-semibold">{formatarNumero(metaDiariaRealizada)} kg</div>
               </div>
             </div>

             <div className="space-y-2">
               <div>
                 <Label className="font-medium text-muted-foreground">Total Produção</Label>
                 <div className="font-semibold">{formatarNumero(totalProducao)} kg</div>
               </div>

               <div>
                 <Label className="font-medium text-muted-foreground">Volume Restante</Label>
                 <div className="font-semibold">{formatarNumero(volumeDiasRestantes)} kg</div>
               </div>
             </div>
           </div>
           
           {/* Barra de progresso ocupando toda a largura */}
           <div className="mt-4 space-y-2">
             <Label className="font-medium text-muted-foreground">Progresso Mensal: {progressoMensal.toFixed(1)}%</Label>
             <Progress value={progressoMensal} className="h-3" />
           </div>
        </CardContent>
      </Card>

      {/* Seletor de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={periodo.tipo} onValueChange={handlePeriodoChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="diario">Diário</TabsTrigger>
              <TabsTrigger value="semanal">Semanal</TabsTrigger>
              <TabsTrigger value="mensal">Mensal</TabsTrigger>
              <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personalizado" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={periodo.customStartDate ? format(periodo.customStartDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      setPeriodo(prev => ({ 
                        ...prev, 
                        customStartDate: date,
                        inicio: date ? format(date, 'yyyy-MM-dd') : prev.inicio
                      }));
                    }}
                  />
                </div>
                <div>
                  <Label>Data de Fim</Label>
                  <Input
                    type="date"
                    value={periodo.customEndDate ? format(periodo.customEndDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      setPeriodo(prev => ({ 
                        ...prev, 
                        customEndDate: date,
                        fim: date ? format(date, 'yyyy-MM-dd') : prev.fim
                      }));
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Cards de Metas por Classificação - Cards menores */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {metasPorClassificacao.map((item) => (
          <Card key={item.classificacao} className="relative overflow-hidden">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-center leading-tight">
                  {item.classificacao}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditarMeta(item.classificacao, item.meta)}
                  className="h-5 w-5 p-0"
                >
                  <Edit className="h-2 w-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {/* Meta */}
              <div className="bg-primary text-primary-foreground p-2 rounded-md text-center">
                {editandoMeta === item.classificacao ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={novaMetaTemp}
                      onChange={(e) => setNovaMetaTemp(Number(e.target.value))}
                      className="text-center bg-primary-foreground text-primary text-xs p-1 h-6"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSalvarMeta(item.classificacao)}
                      className="h-5 w-5 p-0"
                    >
                      <Save className="h-2 w-2" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCancelarEdicao}
                      className="h-5 w-5 p-0"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-[10px] font-medium">META</div>
                    <div className="text-sm font-bold">
                      {formatarKg(item.meta)}
                    </div>
                  </>
                )}
              </div>

              {/* Realizado */}
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground">Realizado</div>
                <div className="text-sm font-semibold">{formatarKg(item.realizado)}</div>
              </div>

              {/* Percentual */}
              <div className="text-center">
                <Badge 
                  variant="secondary" 
                  className={`${getTextStatus(item.percentual)} font-semibold text-[10px] px-1`}
                >
                  {item.percentual.toFixed(1)}%
                </Badge>
              </div>

              {/* Barra de progresso */}
              <div className="relative bg-gray-200 rounded-full h-1.5">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${getCorStatus(item.percentual)}`}
                  style={{ width: `${Math.min(item.percentual, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Card Resumo Total */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <TrendingUp className="h-6 w-6" />
            META TOTAL DIÁRIA (KG)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-primary text-primary-foreground p-6 rounded-lg text-center">
            <div className="text-3xl font-bold mb-2">
              {formatarKg(totalRealizado)} / {formatarKg(totalMeta)}
            </div>
            <div className="text-lg">
              {percentualGeral.toFixed(1)}% da meta atingida
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Meta Total:</span>
              <span className="font-semibold">{formatarKg(totalMeta)} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Realizado:</span>
              <span className="font-semibold">{formatarKg(totalRealizado)} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Restante:</span>
              <span className="font-semibold">{formatarKg(Math.max(0, totalMeta - totalRealizado))} kg</span>
            </div>
          </div>
          
          {/* Barra de progresso geral */}
          <div className="mt-4 relative bg-gray-200 rounded-full h-3">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${getCorStatus(percentualGeral)}`}
              style={{ width: `${Math.min(percentualGeral, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Metas;