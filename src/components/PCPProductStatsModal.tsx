import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
                <CardTitle className="text-base">Análise de Embalagem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Peso total por caixa:</span>
                  <span className="font-semibold">{pesoTotalCaixa.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tipo de embalagem:</span>
                  <span className="font-semibold">{produto.embalagem}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Caixas respectivas:</span>
                  <span className="font-semibold">{caixasRespectiva}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${Math.min(eficienciaEmbalagem, 100)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Eficiência de embalagem: {eficienciaEmbalagem.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Análise de Produção</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Rendimento por batch:</span>
                  <span className="font-semibold">
                    {rendimentoBatch > 0 ? `${rendimentoBatch.toFixed(0)} unidades` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Classificação:</span>
                  <span className="font-semibold">{produto.classificacao}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Máquina designada:</span>
                  <span className="font-semibold">{produto.maquina}</span>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-sm">
                    <strong>Capacidade teórica:</strong>
                    <br />
                    {batchReceita > 0 && pesoLiquidoUnit > 0 
                      ? `${Math.floor(batchReceita / pesoLiquidoUnit)} unidades por batch`
                      : "Dados insuficientes para cálculo"
                    }
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
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Settings className="h-4 w-4" />
                  Indicadores de Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  • Capacidade de produção por batch: {Math.floor(batchReceita / pesoLiquidoUnit)} unidades
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  • Peso total por caixa: {pesoTotalCaixa.toFixed(2)} kg
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  • Eficiência de embalagem: {eficienciaEmbalagem.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PCPProductStatsModal;