import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, CalendarIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import usePCPOptimized from "@/hooks/usePCPOptimized";
import { PeriodFilter } from "@/hooks/usePCPPageState";
import { db } from "@/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
type PeriodType = "dia" | "semana" | "mes" | "ano" | "personalizado";
interface ProdutoProcessado {
  classificacao: string;
  produtos: {
    codigo: string;
    descricao: string;
    kgTotal: number;
    kgTurno1: number;
    kgTurno2: number;
    planejadoTurno1: number;
    planejadoTurno2: number;
    planoDiario: number;
    eficiencia: number;
  }[];
}
const ResultadosFinais: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [periodType, setPeriodType] = useState<PeriodType>("dia");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(new Date());
  const [dataFim, setDataFim] = useState<Date | undefined>(new Date());
  const [showCalendarInicio, setShowCalendarInicio] = useState(false);
  const [showCalendarFim, setShowCalendarFim] = useState(false);
  const [expandedClassificacao, setExpandedClassificacao] = useState<string | null>(null);
  const [selectedClassificacao, setSelectedClassificacao] = useState<string>("todas");
  const [metas, setMetas] = useState<Record<string, number>>({});
  const {
    toast
  } = useToast();

  // Usar o hook otimizado do PCP
  const {
    pcpData,
    pcpProdutos,
    loading,
    error,
    fetchPCPData,
    setupRealtimeListener,
    getMetrics
  } = usePCPOptimized();
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Converter período para formato do hook
  const convertPeriodToFilter = (period: PeriodType): PeriodFilter => {
    switch (period) {
      case "dia":
        return "hoje";
      case "semana":
        return "semana";
      case "mes":
        return "mes";
      case "ano":
        return "ano";
      case "personalizado":
        return "personalizado";
      default:
        return "hoje";
    }
  };

  // Calcular período baseado na seleção
  const calculatePeriod = (type: PeriodType): {
    inicio: Date;
    fim: Date;
  } => {
    const hoje = new Date();
    switch (type) {
      case "dia":
        const ontem = new Date(hoje);
        ontem.setDate(hoje.getDate() - 1);
        return {
          inicio: new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate()),
          fim: new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59, 59)
        };
      case "semana":
        return {
          inicio: startOfWeek(hoje, {
            weekStartsOn: 0
          }),
          fim: endOfWeek(hoje, {
            weekStartsOn: 0
          })
        };
      case "mes":
        return {
          inicio: startOfMonth(hoje),
          fim: endOfMonth(hoje)
        };
      case "ano":
        return {
          inicio: startOfYear(hoje),
          fim: endOfYear(hoje)
        };
      case "personalizado":
        return {
          inicio: dataInicio || hoje,
          fim: dataFim || hoje
        };
      default:
        return {
          inicio: hoje,
          fim: hoje
        };
    }
  };

  // Processar dados do PCP para agrupar por classificação
  const produtosProcessados = useMemo((): ProdutoProcessado[] => {
    if (!pcpData.length || !pcpProdutos.length) return [];

    // Agrupar dados por classificação
    const grupoPorClassificacao = new Map<string, Map<string, any>>();
    pcpData.forEach(item => {
      const classificacao = item.classificacao || "Sem classificação";
      const codigo = item.codigo;
      if (!codigo) return;
      if (!grupoPorClassificacao.has(classificacao)) {
        grupoPorClassificacao.set(classificacao, new Map());
      }
      const grupoClassificacao = grupoPorClassificacao.get(classificacao)!;
      if (!grupoClassificacao.has(codigo)) {
        // Encontrar produto correspondente
        const produtoInfo = pcpProdutos.find(p => p.codigo === codigo);
        grupoClassificacao.set(codigo, {
          codigo,
          descricao: item.produto_nome || produtoInfo?.nome || "Produto não identificado",
          kgTotal: 0,
          kgTurno1: 0,
          kgTurno2: 0,
          planejadoTurno1: 0,
          planejadoTurno2: 0,
          planoDiario: 0,
          eficiencia: 0
        });
      }
      const produto = grupoClassificacao.get(codigo)!;

      // Acumular valores
      produto.kgTotal += item.quantidade_produzida || 0;
      produto.planoDiario += item.quantidade_planejada || 0;
      if (item.turno === '1_turno') {
        produto.kgTurno1 += item.quantidade_produzida || 0;
        produto.planejadoTurno1 += item.quantidade_planejada || 0;
      } else if (item.turno === '2_turno') {
        produto.kgTurno2 += item.quantidade_produzida || 0;
        produto.planejadoTurno2 += item.quantidade_planejada || 0;
      }
    });

    // Converter para array e calcular eficiência
    const resultado: ProdutoProcessado[] = [];
    grupoPorClassificacao.forEach((produtos, classificacao) => {
      const produtosArray = Array.from(produtos.values()).map(produto => ({
        ...produto,
        eficiencia: produto.planoDiario > 0 ? produto.kgTotal / produto.planoDiario * 100 : 0
      }));
      if (produtosArray.length > 0) {
        resultado.push({
          classificacao,
          produtos: produtosArray
        });
      }
    });
    return resultado.sort((a, b) => a.classificacao.localeCompare(b.classificacao));
  }, [pcpData, pcpProdutos]);

  // Obter todas as classificações únicas
  const classificacoes = useMemo(() => {
    return produtosProcessados.map(pp => pp.classificacao).sort();
  }, [produtosProcessados]);

  // Filtrar produtos processados por classificação selecionada
  const filteredClassificacoes = useMemo(() => {
    let filtered = produtosProcessados;

    // Filtrar por classificação selecionada
    if (selectedClassificacao !== "todas") {
      filtered = filtered.filter(pp => pp.classificacao === selectedClassificacao);
    }

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(pp => pp.classificacao.toLowerCase().includes(searchTerm.toLowerCase()) || pp.produtos.some(p => p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigo.toLowerCase().includes(searchTerm.toLowerCase())));
    }
    return filtered;
  }, [produtosProcessados, selectedClassificacao, searchTerm]);

  // Métricas dos dados filtrados
  const metricas = useMemo(() => {
    const totalProduzido = filteredClassificacoes.reduce((sum, pp) => sum + pp.produtos.reduce((prodSum, p) => prodSum + p.kgTotal, 0), 0);
    const totalPlanejado = filteredClassificacoes.reduce((sum, pp) => sum + pp.produtos.reduce((prodSum, p) => prodSum + p.planoDiario, 0), 0);
    const eficienciaMedia = totalPlanejado > 0 ? totalProduzido / totalPlanejado * 100 : 0;
    const totalProdutos = filteredClassificacoes.reduce((sum, pp) => sum + pp.produtos.length, 0);
    return {
      totalProduzido,
      totalPlanejado,
      eficienciaMedia,
      totalProdutos
    };
  }, [filteredClassificacoes]);

  // Buscar metas do Firestore
  const fetchMetas = async () => {
    try {
      const metaDoc = await getDoc(doc(db, "PCP_configuracoes", "meta"));
      if (metaDoc.exists()) {
        setMetas(metaDoc.data() || {});
      }
    } catch (error) {
      console.error("Erro ao buscar metas:", error);
    }
  };

  const toggleClassificacao = (classificacao: string) => {
    setExpandedClassificacao(expandedClassificacao === classificacao ? null : classificacao);
  };

  // Controla se é mudança iniciada pelo usuário para evitar duplo carregamento
  const [isUpdatingPeriod, setIsUpdatingPeriod] = useState(false);

  // Efeito combinado para atualizar período e carregar dados
  useEffect(() => {
    const loadData = async () => {
      // Atualizar datas se não for período personalizado
      if (periodType !== "personalizado" && !isUpdatingPeriod) {
        setIsUpdatingPeriod(true);
        const { inicio, fim } = calculatePeriod(periodType);
        setDataInicio(inicio);
        setDataFim(fim);
        
        // Carregar dados com as novas datas
        const period = convertPeriodToFilter(periodType);
        await fetchPCPData(period, inicio, fim);
        setIsUpdatingPeriod(false);
        return;
      }

      // Para período personalizado, garantir que ele sempre execute quando mudado para personalizado
      if (periodType === "personalizado") {
        // Se não há datas, definir as datas padrão
        if (!dataInicio || !dataFim) {
          const hoje = new Date();
          setDataInicio(hoje);
          setDataFim(hoje);
        } else if (!isUpdatingPeriod) {
          // Se há datas, carregar os dados
          const period = convertPeriodToFilter(periodType);
          await fetchPCPData(period, dataInicio, dataFim);
        }
      }
    };

    loadData();
  }, [periodType]); // Removido dataInicio e dataFim das dependências para evitar loop

  // Efeito separado para período personalizado quando as datas mudam
  useEffect(() => {
    if (periodType === "personalizado" && dataInicio && dataFim && !isUpdatingPeriod) {
      const period = convertPeriodToFilter(periodType);
      fetchPCPData(period, dataInicio, dataFim);
    }
  }, [dataInicio, dataFim, periodType]); // Executar também quando periodType muda para personalizado

  // Buscar metas quando mudar para filtro "dia"
  useEffect(() => {
    if (periodType === "dia") {
      fetchMetas();
    }
  }, [periodType]);

  // Setup do listener em tempo real
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupListener = () => {
      const period = convertPeriodToFilter(periodType);
      
      if (periodType === "personalizado" && dataInicio && dataFim) {
        unsubscribe = setupRealtimeListener(period, dataInicio, dataFim);
      } else if (periodType !== "personalizado") {
        const { inicio, fim } = calculatePeriod(periodType);
        unsubscribe = setupRealtimeListener(period, inicio, fim);
      }
    };

    // Delay para evitar setup múltiplo durante mudanças rápidas
    const timeoutId = setTimeout(setupListener, 500);
    
    return () => {
      clearTimeout(timeoutId);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [periodType, dataInicio, dataFim, setupRealtimeListener]);
  // Mostrar loading apenas se não há dados carregados
  if (loading && pcpData.length === 0) {
    return <div className="space-y-6">
        <h2 className="text-2xl font-bold">Resultados Finais</h2>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando resultados finais...</p>
          </div>
        </div>
      </div>;
  }
  if (error) {
    return <div className="space-y-6">
        <h2 className="text-2xl font-bold">Resultados Finais</h2>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => {
              const period = convertPeriodToFilter(periodType);
              if (periodType === "personalizado" && dataInicio && dataFim) {
                fetchPCPData(period, dataInicio, dataFim);
              } else {
                fetchPCPData(period);
              }
            }}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resultados Finais</h2>
        <Button variant="outline" onClick={() => {
          const period = convertPeriodToFilter(periodType);
          if (periodType === "personalizado" && dataInicio && dataFim) {
            fetchPCPData(period, dataInicio, dataFim);
          } else {
            fetchPCPData(period);
          }
        }} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Seleção de Período */}
      <Card>
        <CardHeader>
          <CardTitle>Período de Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Período</Label>
              <Tabs value={periodType} onValueChange={(value: PeriodType) => setPeriodType(value)} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="dia">Ontem</TabsTrigger>
                  <TabsTrigger value="semana">Semana</TabsTrigger>
                  <TabsTrigger value="mes">Mês</TabsTrigger>
                  <TabsTrigger value="ano">Ano</TabsTrigger>
                  <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {periodType === "personalizado" && <>
                <div>
                  <Label htmlFor="data-inicio">Data Início</Label>
                  <Popover open={showCalendarInicio} onOpenChange={setShowCalendarInicio}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataInicio && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataInicio ? format(dataInicio, "dd/MM/yyyy", {
                      locale: ptBR
                    }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar 
                        mode="single" 
                        selected={dataInicio} 
                        onSelect={date => {
                          setDataInicio(date);
                          setShowCalendarInicio(false);
                          if (periodType === "personalizado" && date && dataFim) {
                            const period = convertPeriodToFilter("personalizado");
                            fetchPCPData(period, date, dataFim);
                          }
                        }} 
                        initialFocus 
                        className="p-3 pointer-events-auto" 
                        locale={ptBR}
                        classNames={{
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-semibold border border-primary/20",
                          day: "h-9 w-9 text-center font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                          head_cell: "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
                          cell: "text-center p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          nav_button: "hover:bg-accent hover:text-accent-foreground",
                          caption: "flex justify-center pt-1 relative items-center"
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="data-fim">Data Fim</Label>
                  <Popover open={showCalendarFim} onOpenChange={setShowCalendarFim}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataFim && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataFim ? format(dataFim, "dd/MM/yyyy", {
                      locale: ptBR
                    }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar 
                        mode="single" 
                        selected={dataFim} 
                        onSelect={date => {
                          setDataFim(date);
                          setShowCalendarFim(false);
                          if (periodType === "personalizado" && dataInicio && date) {
                            const period = convertPeriodToFilter("personalizado");
                            fetchPCPData(period, dataInicio, date);
                          }
                        }} 
                        initialFocus 
                        className="p-3 pointer-events-auto" 
                        locale={ptBR}
                        classNames={{
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-semibold border border-primary/20",
                          day: "h-9 w-9 text-center font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                          head_cell: "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
                          cell: "text-center p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          nav_button: "hover:bg-accent hover:text-accent-foreground",
                          caption: "flex justify-center pt-1 relative items-center"
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>}
            
              <div className="flex items-end">
                <div className="text-sm text-muted-foreground">
                  <p>Período selecionado:</p>
                  <p className="font-medium">
                    {dataInicio && dataFim ? `${format(dataInicio, 'dd/MM/yyyy')} - ${format(dataFim, 'dd/MM/yyyy')}` : 'Selecionar datas'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Produção Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(metricas.totalProduzido)} kg
            </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Eficiência Média</CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-3xl font-bold">
                      {formatNumber(metricas.eficienciaMedia)}%
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>(Total Produzido ÷ Total Planejado) × 100</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>
      </div>

      {/* Abas por Classificação */}
      <Card>
        <CardHeader>
          <CardTitle>Produção por Classificação de Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedClassificacao} onValueChange={setSelectedClassificacao} className="w-full">
            

            {/* Campo de busca */}
            <div className="mb-4">
              <Input placeholder="Buscar por classificação ou produto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-md" />
            </div>

            {/* Tabela de Resultados */}
            <TabsContent value={selectedClassificacao} className="mt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Total Planejado</TableHead>
                    <TableHead>Total Produzido</TableHead>
                    <TableHead>Diferença</TableHead>
                    <TableHead>Eficiência</TableHead>
                    {periodType === "dia" && <TableHead>Meta Diária</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClassificacoes.map(pp => (
                    <React.Fragment key={pp.classificacao}>
                      {(() => {
                        const term = (searchTerm || '').toLowerCase();
                        const produtosVisiveis = term
                          ? pp.produtos.filter(p =>
                              p.codigo.toLowerCase().includes(term) ||
                              p.descricao.toLowerCase().includes(term)
                            )
                          : pp.produtos;

                        const totalPlanejado = produtosVisiveis.reduce((sum, p) => sum + p.planoDiario, 0);
                        const totalProduzido = produtosVisiveis.reduce((sum, p) => sum + p.kgTotal, 0);
                        const diff = totalProduzido - totalPlanejado;
                        const eficiencia = totalPlanejado > 0 ? (totalProduzido / totalPlanejado) * 100 : 0;

                        return (
                          <>
                            <TableRow className="cursor-pointer" onClick={() => toggleClassificacao(pp.classificacao)}>
                              <TableCell className="font-medium">{pp.classificacao}</TableCell>
                              <TableCell>
                                {formatNumber(totalPlanejado)} kg
                              </TableCell>
                              <TableCell>
                                {formatNumber(totalProduzido)} kg
                              </TableCell>
                              <TableCell>
                                <span className={diff >= 0 ? "text-green-600" : "text-red-600"}>
                                  {formatNumber(diff)} kg
                                </span>
                              </TableCell>
                              <TableCell>
                                {formatNumber(eficiencia)}%
                              </TableCell>
                              {periodType === "dia" && (
                                <TableCell>
                                  {(() => {
                                    const metaClassificacao = metas[pp.classificacao] || 0;
                                    const porcentagemMeta = metaClassificacao > 0 ? (totalProduzido / metaClassificacao) * 100 : 0;
                                    const cor = porcentagemMeta >= 80 ? "text-green-400" : "text-white";
                                    return (
                                      <span className={cor}>
                                        {formatNumber(porcentagemMeta)}%
                                      </span>
                                    );
                                  })()}
                                </TableCell>
                              )}
                            </TableRow>

                            {expandedClassificacao === pp.classificacao && (
                              <>
                                {produtosVisiveis.map(produto => (
                                  <TableRow key={`${pp.classificacao}-${produto.codigo}`} className="bg-muted/50">
                                    <TableCell className="pl-8">
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">{produto.codigo}</span>
                                        <Separator orientation="vertical" className="h-4" />
                                        <span>{produto.descricao}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>{formatNumber(produto.planoDiario)} kg</TableCell>
                                    <TableCell>{formatNumber(produto.kgTotal)} kg</TableCell>
                                    <TableCell>
                                      <span className={(produto.kgTotal - produto.planoDiario) >= 0 ? "text-green-600" : "text-red-600"}>
                                        {formatNumber(produto.kgTotal - produto.planoDiario)} kg
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {formatNumber(produto.eficiencia)}%
                                    </TableCell>
                                    {periodType === "dia" && (
                                      <TableCell>
                                        {(() => {
                                          const metaClassificacao = metas[pp.classificacao] || 0;
                                          const porcentagemMeta = metaClassificacao > 0 ? (produto.kgTotal / metaClassificacao) * 100 : 0;
                                          const cor = porcentagemMeta >= 80 ? "text-green-400" : "text-white";
                                          return (
                                            <span className={cor}>
                                              {formatNumber(porcentagemMeta)}%
                                            </span>
                                          );
                                        })()}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}

                                <TableRow className="font-medium bg-muted/25">
                                  <TableCell className="pl-8">Detalhes por Turno</TableCell>
                                  <TableCell colSpan={4}>
                                    <div className="grid grid-cols-4 gap-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground">1° Turno</p>
                                        <p>{formatNumber(produtosVisiveis.reduce((sum, p) => sum + p.kgTurno1, 0))} kg</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">2° Turno</p>
                                        <p>{formatNumber(produtosVisiveis.reduce((sum, p) => sum + p.kgTurno2, 0))} kg</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Planejado 1°</p>
                                        <p>{formatNumber(produtosVisiveis.reduce((sum, p) => sum + p.planejadoTurno1, 0))} kg</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Planejado 2°</p>
                                        <p>{formatNumber(produtosVisiveis.reduce((sum, p) => sum + p.planejadoTurno2, 0))} kg</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default ResultadosFinais;