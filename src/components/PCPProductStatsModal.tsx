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
} from "lucide-react";

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
  // Cálculos estatísticos específicos para produtos PCP
  const unidadesPorCaixa = parseFloat(produto.un_cx) || 0;
  const pesoLiquidoUnit = parseFloat(produto.peso_liq_unit_kg) || 0;
  const batchReceita = parseFloat(produto.batch_receita_kg) || 0;
  const caixasRespectiva = parseFloat(produto.cx_respectiva) || 0;

  // Cálculos de produtividade
  const pesoTotalCaixa = unidadesPorCaixa * pesoLiquidoUnit;
  const rendimentoBatch = batchReceita > 0 ? batchReceita / pesoLiquidoUnit : 0;
  const eficienciaEmbalagem = pesoTotalCaixa > 0 ? (pesoLiquidoUnit / pesoTotalCaixa) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estatísticas do Produto PCP
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

          {/* Cards de estatísticas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unidades/Caixa</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unidadesPorCaixa}</div>
                <p className="text-xs text-muted-foreground">unidades por embalagem</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peso Unitário</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pesoLiquidoUnit}</div>
                <p className="text-xs text-muted-foreground">kg por unidade</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Batch Receita</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{batchReceita}</div>
                <p className="text-xs text-muted-foreground">kg por batch</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Máquina</CardTitle>
                <Cog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{produto.maquina}</div>
                <p className="text-xs text-muted-foreground">equipamento produção</p>
              </CardContent>
            </Card>
          </div>

          {/* Análises de produtividade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Análise de Embalagem e Produtividade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Produção Planejada vs Realizada */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Produção diária (planejado):</span>
                      <span className="font-semibold text-blue-600">1.200 kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Produção realizada (hoje):</span>
                      <span className="font-semibold text-green-600">1.050 kg</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all relative"
                        style={{ width: "87.5%" }}
                      >
                        <div className="absolute right-2 top-0 h-full w-0.5 bg-white opacity-75"></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">87.5% da meta</span>
                      <span className="text-muted-foreground">Meta: 100%</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    {/* Eficiência de Embalagem */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Eficiência de embalagem:</span>
                      <span className="font-semibold">{eficienciaEmbalagem.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tipo de embalagem:</span>
                      <span className="font-semibold">{produto.embalagem}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Peso total por caixa:</span>
                      <span className="font-semibold">{pesoTotalCaixa.toFixed(2)} kg</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    {/* Produtividade por Turno */}
                    <div className="text-sm font-medium mb-2">Produtividade por Turno:</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">1º Turno:</span>
                        <span className="text-xs font-medium">580 kg (96.7%)</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="h-2 rounded-full bg-green-500" style={{ width: "96.7%" }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs">2º Turno:</span>
                        <span className="text-xs font-medium">470 kg (78.3%)</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="h-2 rounded-full bg-yellow-500" style={{ width: "78.3%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Análise de Produção e Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Capacidade e Performance */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Capacidade instalada:</span>
                    <span className="font-semibold text-blue-600">1.500 kg/dia</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rendimento por batch:</span>
                    <span className="font-semibold">
                      {rendimentoBatch > 0 ? `${rendimentoBatch.toFixed(0)} unidades` : "1.250 unidades"}
                    </span>
                  </div>
                  
                  {/* OEE (Overall Equipment Effectiveness) */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="text-sm font-medium mb-2">OEE - Eficiência Geral:</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Disponibilidade:</span>
                        <span className="text-xs font-medium text-green-600">92.5%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-green-500" style={{ width: "92.5%" }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Performance:</span>
                        <span className="text-xs font-medium text-blue-600">87.8%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: "87.8%" }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Qualidade:</span>
                        <span className="text-xs font-medium text-purple-600">95.2%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-purple-500" style={{ width: "95.2%" }}></div>
                      </div>
                      
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">OEE Total:</span>
                          <span className="text-sm font-bold text-orange-600">77.4%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 mt-1">
                          <div className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600" style={{ width: "77.4%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Classificação:</span>
                      <span className="text-xs font-medium">{produto.classificacao}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Máquina:</span>
                      <span className="text-xs font-medium">{produto.maquina}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações técnicas detalhadas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Especificações Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código do Produto</p>
                  <p className="font-semibold">{produto.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="font-semibold">{produto.descricao_produto}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Máquina de Produção</p>
                  <p className="font-semibold">{produto.maquina}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Embalagem</p>
                  <p className="font-semibold">{produto.embalagem}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unidades por Caixa</p>
                  <p className="font-semibold">{produto.un_cx}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Caixas Respectivas</p>
                  <p className="font-semibold">{produto.cx_respectiva}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Peso Líquido Unitário</p>
                  <p className="font-semibold">{produto.peso_liq_unit_kg} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Batch Receita</p>
                  <p className="font-semibold">{produto.batch_receita_kg} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Classificação</p>
                  <p className="font-semibold">{produto.classificacao}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indicadores de performance */}
          {(batchReceita > 0 && pesoLiquidoUnit > 0) && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Settings className="h-4 w-4" />
                  Indicadores de Performance Consolidados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Capacidade e Produção:</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      • Capacidade por batch: {Math.floor(batchReceita / pesoLiquidoUnit)} unidades
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      • Produção diária realizada: 1.050 kg (87.5% da meta)
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      • Peso total por caixa: {pesoTotalCaixa.toFixed(2)} kg
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Eficiências:</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      • Eficiência de embalagem: {eficienciaEmbalagem.toFixed(1)}%
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      • OEE (Eficiência Geral): 77.4%
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      • Performance média turnos: 87.5%
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-2 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Status Geral:</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {(() => {
                        const oee = 77.4;
                        return oee >= 85 ? "Excelente" : oee >= 75 ? "Bom" : oee >= 60 ? "Regular" : "Precisa Melhorar";
                      })()}
                    </span>
                  </div>
                  <Progress value={77.4} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PCPProductStatsModal;