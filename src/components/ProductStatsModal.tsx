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
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Calendar,
  AlertTriangle,
  Target,
  BarChart3,
} from "lucide-react";

interface Produto {
  id?: string;
  codigo?: string;
  codigoEstoque?: string;
  nome: string;
  quantidadeAtual?: number;
  quantidadeMinima?: number;
  valorUnitario?: number;
  dataVencimento?: string;
  dataHora?: string;
  unidade_de_medida?: string;
  unidade?: string;
  deposito?: string;
  prateleira?: string;
  fornecedor_nome?: string;
}

interface ProductStatsModalProps {
  produto: Produto;
  isOpen: boolean;
  onClose: () => void;
}

const ProductStatsModal: React.FC<ProductStatsModalProps> = ({
  produto,
  isOpen,
  onClose,
}) => {
  const quantidade = produto.quantidadeAtual || 0;
  const quantidadeMinima = produto.quantidadeMinima || 0;
  const valorUnitario = produto.valorUnitario || 0;
  const unidade = produto.unidade_de_medida || produto.unidade || "UN";

  // Cálculos estatísticos
  const isLowStock = quantidade <= quantidadeMinima;
  const stockPercentage = quantidadeMinima > 0 ? (quantidade / quantidadeMinima) * 100 : 100;
  const totalValue = quantidade * valorUnitario;
  const stockStatus = quantidade === 0 ? "Sem estoque" : isLowStock ? "Estoque baixo" : "Estoque normal";
  
  // Calcular dias até vencimento
  const daysUntilExpiry = produto.dataVencimento 
    ? Math.ceil((new Date(produto.dataVencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calcular tempo desde cadastro
  const daysSinceCreation = produto.dataHora
    ? Math.ceil((new Date().getTime() - new Date(produto.dataHora).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não informado";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStockStatusColor = () => {
    if (quantidade === 0) return "destructive";
    if (isLowStock) return "secondary";
    return "default";
  };

  const getStockIcon = () => {
    if (quantidade === 0) return <AlertTriangle className="h-4 w-4" />;
    if (isLowStock) return <TrendingDown className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estatísticas do Produto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{produto.nome}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{produto.codigo}</Badge>
              {produto.codigoEstoque && (
                <Badge variant="outline">{produto.codigoEstoque}</Badge>
              )}
              <Badge variant={getStockStatusColor()} className="flex items-center gap-1">
                {getStockIcon()}
                {stockStatus}
              </Badge>
            </div>
          </div>

          {/* Cards de estatísticas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Atual</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quantidade}</div>
                <p className="text-xs text-muted-foreground">{unidade}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(valorUnitario)} por {unidade}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Mínimo</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quantidadeMinima}</div>
                <p className="text-xs text-muted-foreground">
                  {stockPercentage.toFixed(0)}% do mínimo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dias no Sistema</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {daysSinceCreation !== null ? daysSinceCreation : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Desde {formatDate(produto.dataHora)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Indicadores de performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status do Estoque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quantidade atual:</span>
                  <span className="font-semibold">{quantidade} {unidade}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quantidade mínima:</span>
                  <span className="font-semibold">{quantidadeMinima} {unidade}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      quantidade === 0
                        ? "bg-destructive"
                        : isLowStock
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(Math.max(stockPercentage, 5), 100)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {quantidade === 0
                    ? "Produto sem estoque"
                    : isLowStock
                    ? "Estoque abaixo do mínimo recomendado"
                    : "Estoque em nível adequado"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {produto.deposito && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Depósito:</span>
                    <span className="font-semibold">{produto.deposito}</span>
                  </div>
                )}
                {produto.prateleira && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Prateleira:</span>
                    <span className="font-semibold">{produto.prateleira}</span>
                  </div>
                )}
                {produto.fornecedor_nome && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fornecedor:</span>
                    <span className="font-semibold">{produto.fornecedor_nome}</span>
                  </div>
                )}
                {daysUntilExpiry !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Vencimento:</span>
                    <span className={`font-semibold ${
                      daysUntilExpiry < 0 ? "text-destructive" : 
                      daysUntilExpiry < 30 ? "text-yellow-600" : 
                      "text-green-600"
                    }`}>
                      {daysUntilExpiry < 0 
                        ? `Vencido há ${Math.abs(daysUntilExpiry)} dias`
                        : `${daysUntilExpiry} dias`
                      }
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alertas e recomendações */}
          {(isLowStock || (daysUntilExpiry !== null && daysUntilExpiry < 30)) && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4" />
                  Alertas e Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLowStock && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    • Estoque baixo: Considere fazer um novo pedido
                  </p>
                )}
                {daysUntilExpiry !== null && daysUntilExpiry < 30 && daysUntilExpiry >= 0 && (
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    • Produto próximo ao vencimento: Use com prioridade
                  </p>
                )}
                {daysUntilExpiry !== null && daysUntilExpiry < 0 && (
                  <p className="text-sm text-destructive">
                    • Produto vencido: Remova do estoque imediatamente
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductStatsModal;