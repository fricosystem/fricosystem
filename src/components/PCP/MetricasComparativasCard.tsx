import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatsCard } from '@/components/ui/StatsCard';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target, 
  BarChart3, 
  CheckCircle2,
  AlertTriangle,
  Minus
} from 'lucide-react';
import { AnaliseComparativa } from '@/hooks/useHistoricoAvancado';

interface MetricasComparativasCardProps {
  analiseMes?: AnaliseComparativa | null;
  analiseAno?: AnaliseComparativa | null;
  loading?: boolean;
}

export const MetricasComparativasCard: React.FC<MetricasComparativasCardProps> = ({
  analiseMes,
  analiseAno,
  loading = false
}) => {
  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatPercentage = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getTrendIcon = (variacao: number) => {
    if (variacao > 2) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (variacao < -2) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getTrendColor = (variacao: number) => {
    if (variacao > 2) return 'text-green-600';
    if (variacao < -2) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = (eficiencia: number, frequenciaMeta: number) => {
    if (eficiencia >= 90 && frequenciaMeta >= 80) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    } else if (eficiencia >= 70 && frequenciaMeta >= 60) {
      return <Target className="h-4 w-4 text-yellow-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise Comparativa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Processando comparações...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Análise Comparativa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Comparação Mensal */}
        {analiseMes && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Calendar className="h-4 w-4" />
              <h4 className="font-semibold">Comparação Mensal</h4>
              <Badge variant={analiseMes.atual.tendencia === 'crescente' ? 'default' : 
                              analiseMes.atual.tendencia === 'decrescente' ? 'destructive' : 'secondary'}>
                {analiseMes.atual.tendencia === 'crescente' ? 'Crescendo' :
                 analiseMes.atual.tendencia === 'decrescente' ? 'Declinando' : 'Estável'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Produção */}
              <StatsCard
                title="Produção vs Mês Anterior"
                value={
                  <div className="flex items-center gap-2">
                    {getTrendIcon(analiseMes.comparacao.producaoVariacao)}
                    <span>{formatNumber(analiseMes.atual.producao)} kg</span>
                  </div>
                }
                icon={<BarChart3 />}
                description={`${formatPercentage(analiseMes.comparacao.producaoVariacao)} vs mês anterior`}
                trend={{
                  value: Math.abs(analiseMes.comparacao.producaoVariacao),
                  positive: analiseMes.comparacao.producaoVariacao >= 0,
                  label: `Mês anterior: ${formatNumber(analiseMes.anterior.producao)} kg`
                }}
              />

              {/* Eficiência */}
              <StatsCard
                title="Eficiência Mensal"
                value={
                  <div className="flex items-center gap-2">
                    {getStatusIcon(analiseMes.atual.eficiencia, 
                                   (analiseMes.atual.diasComMeta / analiseMes.atual.totalDias) * 100)}
                    <span>{analiseMes.atual.eficiencia.toFixed(1)}%</span>
                  </div>
                }
                icon={<Target />}
                description={`${formatPercentage(analiseMes.comparacao.eficienciaVariacao)} vs mês anterior`}
                trend={{
                  value: Math.abs(analiseMes.comparacao.eficienciaVariacao),
                  positive: analiseMes.comparacao.eficienciaVariacao >= 0,
                  label: `Meta batida: ${analiseMes.atual.diasComMeta}/${analiseMes.atual.totalDias} dias`
                }}
              />

              {/* Consistência */}
              <StatsCard
                title="Consistência"
                value={
                  <div className="flex items-center gap-2">
                    {getTrendIcon(analiseMes.comparacao.consistenciaVariacao)}
                    <span>{((analiseMes.atual.diasComMeta / analiseMes.atual.totalDias) * 100).toFixed(0)}%</span>
                  </div>
                }
                icon={<CheckCircle2 />}
                description={`${formatPercentage(analiseMes.comparacao.consistenciaVariacao)} vs mês anterior`}
                trend={{
                  value: Math.abs(analiseMes.comparacao.consistenciaVariacao),
                  positive: analiseMes.comparacao.consistenciaVariacao >= 0,
                  label: `Média diária: ${formatNumber(analiseMes.atual.mediaProducaoDiaria)} kg`
                }}
              />
            </div>

            {/* Progresso do Mês Atual */}
            <div className="p-4 bg-secondary/10 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso da Meta Mensal</span>
                <span className="text-sm text-muted-foreground">
                  {analiseMes.atual.producao} / {analiseMes.atual.meta} kg
                </span>
              </div>
              <Progress 
                value={Math.min(100, (analiseMes.atual.producao / analiseMes.atual.meta) * 100)} 
                className="h-3" 
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{((analiseMes.atual.producao / analiseMes.atual.meta) * 100).toFixed(1)}% concluído</span>
                <span>{analiseMes.atual.totalDias} dias processados</span>
              </div>
            </div>
          </div>
        )}

        {/* Comparação Anual */}
        {analiseAno && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2 pb-2">
              <Calendar className="h-4 w-4" />
              <h4 className="font-semibold">Comparação Anual</h4>
              <Badge variant={analiseAno.atual.tendencia === 'crescente' ? 'default' : 
                              analiseAno.atual.tendencia === 'decrescente' ? 'destructive' : 'secondary'}>
                Ano {analiseAno.atual.tendencia === 'crescente' ? 'Melhor' :
                      analiseAno.atual.tendencia === 'decrescente' ? 'Pior' : 'Similar'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Produção Anual */}
              <StatsCard
                title="Produção vs Ano Anterior"
                value={
                  <div className="flex items-center gap-2">
                    {getTrendIcon(analiseAno.comparacao.producaoVariacao)}
                    <span>{formatNumber(analiseAno.atual.producao)} kg</span>
                  </div>
                }
                icon={<BarChart3 />}
                description={`${formatPercentage(analiseAno.comparacao.producaoVariacao)} vs ano anterior`}
                trend={{
                  value: Math.abs(analiseAno.comparacao.producaoVariacao),
                  positive: analiseAno.comparacao.producaoVariacao >= 0,
                  label: `Ano anterior: ${formatNumber(analiseAno.anterior.producao)} kg`
                }}
              />

              {/* Performance Anual */}
              <StatsCard
                title="Performance Anual"
                value={
                  <div className="flex items-center gap-2">
                    {getStatusIcon(analiseAno.atual.eficiencia, 
                                   (analiseAno.atual.diasComMeta / analiseAno.atual.totalDias) * 100)}
                    <span>{analiseAno.atual.eficiencia.toFixed(1)}%</span>
                  </div>
                }
                icon={<Target />}
                description={`${formatPercentage(analiseAno.comparacao.eficienciaVariacao)} vs ano anterior`}
                trend={{
                  value: Math.abs(analiseAno.comparacao.eficienciaVariacao),
                  positive: analiseAno.comparacao.eficienciaVariacao >= 0,
                  label: `${analiseAno.atual.diasComMeta} dias com meta de ${analiseAno.atual.totalDias}`
                }}
              />
            </div>

            {/* Progresso do Ano Atual */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso da Meta Anual</span>
                <span className="text-sm text-muted-foreground">
                  {formatNumber(analiseAno.atual.producao)} / {formatNumber(analiseAno.atual.meta)} kg
                </span>
              </div>
              <Progress 
                value={Math.min(100, (analiseAno.atual.producao / analiseAno.atual.meta) * 100)} 
                className="h-3" 
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{((analiseAno.atual.producao / analiseAno.atual.meta) * 100).toFixed(1)}% do ano concluído</span>
                <span>Média: {formatNumber(analiseAno.atual.mediaProducaoDiaria)} kg/dia</span>
              </div>
            </div>
          </div>
        )}

        {/* Status geral */}
        {(analiseMes || analiseAno) && (
          <div className="border-t pt-4">
            <div className="text-center">
              <Badge variant="outline" className="text-sm">
                {analiseMes && analiseAno ? (
                  analiseMes.comparacao.producaoVariacao > 0 && analiseAno.comparacao.producaoVariacao > 0 ? 
                    'Tendência Positiva Sustentada' :
                  analiseMes.comparacao.producaoVariacao < 0 && analiseAno.comparacao.producaoVariacao < 0 ? 
                    'Necessita Atenção Imediata' :
                    'Performance Mista - Monitorar'
                ) : 'Análise Parcial'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};