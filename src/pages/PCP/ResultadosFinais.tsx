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
import { RefreshCw, CalendarIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import usePCPOptimized from "@/hooks/usePCPOptimized";
import { PeriodFilter } from "@/hooks/usePCPPageState";
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
        return {
          inicio: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
          fim: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
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
  const toggleClassificacao = (classificacao: string) => {
    setExpandedClassificacao(expandedClassificacao === classificacao ? null : classificacao);
  };

  // Atualizar período quando mudança ocorrer
  useEffect(() => {
    if (periodType !== "personalizado") {
      const {
        inicio,
        fim
      } = calculatePeriod(periodType);
      setDataInicio(inicio);
      setDataFim(fim);
    }
  }, [periodType]);

  // Carregar dados do PCP
  useEffect(() => {
    const period = convertPeriodToFilter(periodType);
    
    if (periodType === "personalizado" && dataInicio && dataFim) {
      fetchPCPData(period, dataInicio, dataFim);
    } else {
      fetchPCPData(period);
    }

    // Setup listener para atualizações em tempo real
    let unsubscribe: (() => void) | undefined;
    
    if (periodType === "personalizado" && dataInicio && dataFim) {
      unsubscribe = setupRealtimeListener(period, dataInicio, dataFim);
    } else {
      unsubscribe = setupRealtimeListener(period);
    }
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [periodType, dataInicio, dataFim, fetchPCPData, setupRealtimeListener]);
  if (loading) {
    return <div className="space-y-6">
        <h2 className="text-2xl font-bold">Resultados Finais</h2>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando resultados finais...</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="period-select">Período</Label>
              <Select value={periodType} onValueChange={(value: PeriodType) => setPeriodType(value)}>
                <SelectTrigger id="period-select">
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Dia</SelectItem>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mês</SelectItem>
                  <SelectItem value="ano">Ano</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
                      <Calendar mode="single" selected={dataInicio} onSelect={date => {
                    setDataInicio(date);
                    setShowCalendarInicio(false);
                  }} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
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
                      <Calendar mode="single" selected={dataFim} onSelect={date => {
                    setDataFim(date);
                    setShowCalendarFim(false);
                  }} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
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
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="text-3xl font-bold">
              {formatNumber(metricas.eficienciaMedia)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Produtos Processados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metricas.totalProdutos}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas por Classificação */}
      <Card>
        <CardHeader>
          <CardTitle>Produção por Família de Produto</CardTitle>
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
                    <TableHead>Total Produzido</TableHead>
                    <TableHead>Planejado</TableHead>
                    <TableHead>Diferença</TableHead>
                    <TableHead>Eficiência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClassificacoes.map(pp => <React.Fragment key={pp.classificacao}>
                      <TableRow className="cursor-pointer" onClick={() => toggleClassificacao(pp.classificacao)}>
                        <TableCell className="font-medium">{pp.classificacao}</TableCell>
                        <TableCell>
                          {formatNumber(pp.produtos.reduce((sum, p) => sum + p.kgTotal, 0))} kg
                        </TableCell>
                        <TableCell>
                          {formatNumber(pp.produtos.reduce((sum, p) => sum + p.planoDiario, 0))} kg
                        </TableCell>
                        <TableCell>
                          <span className={pp.produtos.reduce((sum, p) => sum + (p.kgTotal - p.planoDiario), 0) >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatNumber(pp.produtos.reduce((sum, p) => sum + (p.kgTotal - p.planoDiario), 0))} kg
                          </span>
                        </TableCell>
                        <TableCell>
                          {(() => {
                        const totalProduzido = pp.produtos.reduce((sum, p) => sum + p.kgTotal, 0);
                        const totalPlanejado = pp.produtos.reduce((sum, p) => sum + p.planoDiario, 0);
                        return formatNumber(totalPlanejado > 0 ? totalProduzido / totalPlanejado * 100 : 0) + '%';
                      })()}
                        </TableCell>
                      </TableRow>
                      
                      {expandedClassificacao === pp.classificacao && <>
                          {pp.produtos.map(produto => <TableRow key={`${pp.classificacao}-${produto.codigo}`} className="bg-muted/50">
                              <TableCell className="pl-8">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{produto.codigo}</span>
                                  <Separator orientation="vertical" className="h-4" />
                                  <span>{produto.descricao}</span>
                                </div>
                              </TableCell>
                              <TableCell>{formatNumber(produto.kgTotal)} kg</TableCell>
                              <TableCell>{formatNumber(produto.planoDiario)} kg</TableCell>
                              <TableCell>
                                <span className={produto.kgTotal - produto.planoDiario >= 0 ? "text-green-600" : "text-red-600"}>
                                  {formatNumber(produto.kgTotal - produto.planoDiario)} kg
                                </span>
                              </TableCell>
                              <TableCell>
                                {formatNumber(produto.eficiencia)}%
                              </TableCell>
                            </TableRow>)}
                          
                          <TableRow className="font-medium bg-muted/25">
                            <TableCell className="pl-8">Detalhes por Turno</TableCell>
                            <TableCell colSpan={4}>
                              <div className="grid grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">1° Turno</p>
                                  <p>{formatNumber(pp.produtos.reduce((sum, p) => sum + p.kgTurno1, 0))} kg</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">2° Turno</p>
                                  <p>{formatNumber(pp.produtos.reduce((sum, p) => sum + p.kgTurno2, 0))} kg</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Planejado 1°</p>
                                  <p>{formatNumber(pp.produtos.reduce((sum, p) => sum + p.planejadoTurno1, 0))} kg</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Planejado 2°</p>
                                  <p>{formatNumber(pp.produtos.reduce((sum, p) => sum + p.planejadoTurno2, 0))} kg</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        </>}
                    </React.Fragment>)}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default ResultadosFinais;