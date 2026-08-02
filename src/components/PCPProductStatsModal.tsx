import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Settings,
  BarChart3,
  Scale,
  Target,
  Cog,
  TrendingUp,
  Clock,
  Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePCPProductStats } from "@/hooks/usePCPProductStats";

interface ProdutoPCP {
  id: string;
  codigo: string;
  descricao_produto: string;
  maquina: string;
  embalagem: string;
  un_cx: string;
  cx_respectiva: string;
  peso_liq_unit_kg: string;
  batch_receita_kg: string;
  classificacao: string;
}

interface PCPProductStatsModalProps {
  produto: ProdutoPCP;
  isOpen: boolean;
  onClose: () => void;
}

const PCPProductStatsModal: React.FC<PCPProductStatsModalProps> = ({
  produto,
  isOpen,
  onClose,
}) => {
  // Buscar dados reais do Firestore
  const { stats, loading } = usePCPProductStats(produto.codigo);
  
  // Cálculos estatísticos específicos para produtos PCP
  const unidadesPorCaixa = parseFloat(produto.un_cx) || 0;
  const pesoLiquidoUnit = parseFloat(produto.peso_liq_unit_kg) || 0;
  const batchReceita = parseFloat(produto.batch_receita_kg) || 0;

  // Cálculos de produtividade com dados reais
  const pesoTotalCaixa = unidadesPorCaixa * pesoLiquidoUnit;
  const rendimentoBatch = batchReceita > 0 ? batchReceita / pesoLiquidoUnit : 0;
  const eficienciaEmbalagem = pesoTotalCaixa > 0 ? (pesoLiquidoUnit / pesoTotalCaixa) * 100 : 0;
  
  // Calcular percentuais dos turnos
  const percentual1Turno = stats.meta1Turno > 0 ? (stats.producao1Turno / stats.meta1Turno) * 100 : 0;
  const percentual2Turno = stats.meta2Turno > 0 ? (stats.producao2Turno / stats.meta2Turno) * 100 : 0;

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estatísticas Gerais do Produto PCP
          </DialogTitle>
          </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{produto.descricao_produto}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{produto.codigo}</Badge>
              <Badge variant="outline">{produto.maquina}</Badge>
              <Badge variant="outline">{produto.classificacao}</Badge>
            </div>
          </div>

          {/* Cards de estatísticas principais com dados reais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produção Total (Últimos 30 dias)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.producaoRealizada.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">kg produzidos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meta Total (Período)</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.producaoPlanejada.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">kg planejados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : `${stats.eficienciaGeral.toFixed(1)}%`}</div>
                <p className="text-xs text-muted-foreground">performance atual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1">
                        Overall Equipment Effectiveness (OEE)
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Métrica que mede a eficiência geral do equipamento</p>
                        <p>baseada em disponibilidade × performance × qualidade</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : `${stats.oeeTotal.toFixed(1)}%`}</div>
                <p className="text-xs text-muted-foreground">eficiência geral</p>
              </CardContent>
            </Card>
          </div>

          {/* Análise de produção com dados reais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Produção e Performance Geral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Produção Planejada vs Realizada com dados reais */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Produção planejada:</span>
                      <span className="font-semibold text-blue-600">
                        {loading ? '...' : `${stats.producaoPlanejada.toLocaleString()} kg`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Produção realizada:</span>
                      <span className="font-semibold text-green-600">
                        {loading ? '...' : `${stats.producaoRealizada.toLocaleString()} kg`}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all relative"
                        style={{ width: loading ? "0%" : `${Math.min(100, stats.eficienciaGeral)}%` }}
                      >
                        <div className="absolute right-2 top-0 h-full w-0.5 bg-white opacity-75"></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">
                        {loading ? '...' : `${stats.eficienciaGeral.toFixed(1)}% da meta`}
                      </span>
                      <span className="text-muted-foreground">Meta: 100%</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    {/* Produtividade por Turno com dados reais */}
                    <div className="text-sm font-medium mb-2">Produtividade por Turno (Geral):</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">1º Turno:</span>
                        <span className="text-xs font-medium">
                          {loading ? '...' : `${stats.producao1Turno.toLocaleString()} kg (${percentual1Turno.toFixed(1)}%)`}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${percentual1Turno >= 90 ? 'bg-green-500' : percentual1Turno >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: loading ? "0%" : `${Math.min(100, percentual1Turno)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs">2º Turno:</span>
                        <span className="text-xs font-medium">
                          {loading ? '...' : `${stats.producao2Turno.toLocaleString()} kg (${percentual2Turno.toFixed(1)}%)`}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${percentual2Turno >= 90 ? 'bg-green-500' : percentual2Turno >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: loading ? "0%" : `${Math.min(100, percentual2Turno)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overall Equipment Effectiveness (OEE) - Eficiência Geral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Capacidade e Performance com dados reais */}
                  <div className="flex justify-between items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 text-sm">
                          Capacidade instalada:
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Capacidade máxima teórica de produção</p>
                          <p>do equipamento no período analisado</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="font-semibold text-blue-600">
                      {loading ? '...' : `${stats.capacidadeInstalada.toLocaleString()} kg/período`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rendimento por batch:</span>
                    <span className="font-semibold">
                      {rendimentoBatch > 0 ? `${rendimentoBatch.toFixed(0)} unidades` : loading ? '...' : '0 unidades'}
                    </span>
                  </div>
                  
                  {/* OEE com dados reais */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="text-sm font-medium mb-2">Componentes OEE:</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 text-xs">
                              Disponibilidade:
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Percentual do tempo que o equipamento</p>
                              <p>está disponível para produção</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-xs font-medium text-green-600">
                          {loading ? '...' : `${stats.disponibilidade.toFixed(1)}%`}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-green-500" 
                          style={{ width: loading ? "0%" : `${stats.disponibilidade}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 text-xs">
                              Performance:
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Relação entre produção realizada</p>
                              <p>e produção planejada</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-xs font-medium text-blue-600">
                          {loading ? '...' : `${stats.performance.toFixed(1)}%`}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-blue-500" 
                          style={{ width: loading ? "0%" : `${Math.min(100, stats.performance)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1 text-xs">
                              Qualidade:
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Percentual de produtos dentro</p>
                              <p>dos padrões de qualidade</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-xs font-medium text-purple-600">
                          {loading ? '...' : `${stats.qualidade.toFixed(1)}%`}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-purple-500" 
                          style={{ width: loading ? "0%" : `${stats.qualidade}%` }}
                        ></div>
                      </div>
                      
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1 text-sm font-medium">
                                OEE Total:
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Overall Equipment Effectiveness Total</p>
                                <p>Disponibilidade × Performance × Qualidade</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="text-sm font-bold text-orange-600">
                            {loading ? '...' : `${stats.oeeTotal.toFixed(1)}%`}
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 mt-1">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600" 
                            style={{ width: loading ? "0%" : `${stats.oeeTotal}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Especificações técnicas simplificadas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Especificações Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código</p>
                  <p className="font-semibold">{produto.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Máquina</p>
                  <p className="font-semibold">{produto.maquina}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Embalagem</p>
                  <p className="font-semibold">{produto.embalagem}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unidades/Caixa</p>
                  <p className="font-semibold">{produto.un_cx}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Peso Unitário</p>
                  <p className="font-semibold">{produto.peso_liq_unit_kg} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Batch Receita</p>
                  <p className="font-semibold">{produto.batch_receita_kg} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo consolidado com dados reais */}
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                <Settings className="h-4 w-4" />
                Resumo de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Produção Geral (Últimos 30 dias):</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    • Realizado: {loading ? '...' : `${stats.producaoRealizada.toLocaleString()} kg`}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    • Meta: {loading ? '...' : `${stats.producaoPlanejada.toLocaleString()} kg`}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    • Capacidade máxima: {loading ? '...' : `${stats.capacidadeInstalada.toLocaleString()} kg/período`}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Indicadores:</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    • Eficiência: {loading ? '...' : `${stats.eficienciaGeral.toFixed(1)}%`}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    • Overall Equipment Effectiveness (OEE): {loading ? '...' : `${stats.oeeTotal.toFixed(1)}%`}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    • Performance por batch: {rendimentoBatch > 0 ? `${rendimentoBatch.toFixed(0)} unid.` : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Status Geral:</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {loading ? '...' : (() => {
                      const oee = stats.oeeTotal;
                      return oee >= 85 ? "Excelente" : oee >= 75 ? "Bom" : oee >= 60 ? "Regular" : "Precisa Melhorar";
                    })()}
                  </span>
                </div>
                <Progress value={loading ? 0 : stats.oeeTotal} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
};

export default PCPProductStatsModal;