import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatsCard } from '@/components/ui/StatsCard';
import { 
  Target, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Activity,
  Clock,
  Zap
} from 'lucide-react';
import { PrevisaoAvancada, MetricasConsistencia } from '@/hooks/useHistoricoAvancado';

interface PrevisaoRecomendacoesCardProps {
  previsao?: PrevisaoAvancada | null;
  metricas?: MetricasConsistencia | null;
  loading?: boolean;
}

export const PrevisaoRecomendacoesCard: React.FC<PrevisaoRecomendacoesCardProps> = ({
  previsao,
  metricas,
  loading = false
}) => {
  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const getProbabilidadeColor = (prob: number) => {
    if (prob >= 80) return 'text-green-600';
    if (prob >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProbabilidadeIcon = (prob: number) => {
    if (prob >= 80) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (prob >= 60) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getConsistenciaStatus = (indice: number) => {
    if (indice >= 80) return { label: 'Excelente', color: 'text-green-600', variant: 'default' as const };
    if (indice >= 65) return { label: 'Boa', color: 'text-yellow-600', variant: 'secondary' as const };
    if (indice >= 50) return { label: 'Regular', color: 'text-orange-600', variant: 'secondary' as const };
    return { label: 'Baixa', color: 'text-red-600', variant: 'destructive' as const };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Previsões e Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Calculando previsões...</p>
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
          <Target className="h-5 w-5" />
          Previsões e Recomendações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Probabilidades de Meta */}
        {previsao && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatsCard
              title="Probabilidade Meta Mensal"
              value={
                <div className="flex items-center gap-2">
                  {getProbabilidadeIcon(previsao.probabilidadeMetaMensal)}
                  <span className={getProbabilidadeColor(previsao.probabilidadeMetaMensal)}>
                    {previsao.probabilidadeMetaMensal.toFixed(0)}%
                  </span>
                </div>
              }
              icon={<Calendar />}
              description={`${previsao.diasRestantesMes} dias restantes no mês`}
              trend={{
                value: previsao.probabilidadeMetaMensal,
                positive: previsao.probabilidadeMetaMensal >= 70,
                label: `Necessário: ${formatNumber(previsao.producaoNecessariaDiaria)} kg/dia`
              }}
            />

            <StatsCard
              title="Probabilidade Meta Anual"
              value={
                <div className="flex items-center gap-2">
                  {getProbabilidadeIcon(previsao.probabilidadeMetaAnual)}
                  <span className={getProbabilidadeColor(previsao.probabilidadeMetaAnual)}>
                    {previsao.probabilidadeMetaAnual.toFixed(0)}%
                  </span>
                </div>
              }
              icon={<TrendingUp />}
              description={`${previsao.diasRestantesAno} dias restantes no ano`}
              trend={{
                value: previsao.probabilidadeMetaAnual,
                positive: previsao.probabilidadeMetaAnual >= 70,
                label: 'Baseado em tendência histórica'
              }}
            />
          </div>
        )}

        {/* Cenários de Produção */}
        {previsao && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Activity className="h-4 w-4" />
              <h4 className="font-semibold">Cenários de Produção Diária</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Cenário Conservador */}
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">Conservador</span>
                </div>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">
                  {formatNumber(previsao.cenarios.conservador)} kg/dia
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Cenário com baixa performance
                </p>
              </div>

              {/* Cenário Realista */}
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Realista</span>
                </div>
                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                  {formatNumber(previsao.cenarios.realista)} kg/dia
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Baseado na média atual
                </p>
              </div>

              {/* Cenário Otimista */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Otimista</span>
                </div>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  {formatNumber(previsao.cenarios.otimista)} kg/dia
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Com melhorias na produção
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Métricas de Consistência */}
        {metricas && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2 pb-2">
              <Activity className="h-4 w-4" />
              <h4 className="font-semibold">Análise de Consistência</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {/* Índice de Confiabilidade */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Índice de Confiabilidade</span>
                  <Badge variant={getConsistenciaStatus(metricas.indiceConfiabilidade).variant}>
                    {getConsistenciaStatus(metricas.indiceConfiabilidade).label}
                  </Badge>
                </div>
                <Progress value={metricas.indiceConfiabilidade} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{metricas.indiceConfiabilidade.toFixed(1)}%</span>
                  <span>Baseado em variabilidade e metas</span>
                </div>

                {/* Frequência de Bater Meta */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Frequência de Metas</span>
                  <span className="text-sm font-bold">
                    {metricas.frequenciaBateMeta.toFixed(0)}%
                  </span>
                </div>
                <Progress value={metricas.frequenciaBateMeta} className="h-2" />
              </div>

              <div className="space-y-3">
                {/* Coeficiente de Variação */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Variabilidade</span>
                    <span className="text-sm">
                      {metricas.coeficienteVariacao.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metricas.coeficienteVariacao < 15 ? 'Produção muito consistente' :
                     metricas.coeficienteVariacao < 25 ? 'Produção moderadamente consistente' :
                     'Produção irregular - necessita atenção'}
                  </p>
                </div>

                {/* Sequências */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Melhor Sequência</span>
                    <span className="text-sm font-bold text-green-600">
                      {metricas.maiorSequenciaPositiva} dias
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pior Sequência</span>
                    <span className="text-sm font-bold text-red-600">
                      {metricas.maiorSequenciaNegativa} dias
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recomendações */}
        {previsao && previsao.recomendacoes.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <h4 className="font-semibold">Recomendações</h4>
            </div>
            
            <div className="space-y-2">
              {previsao.recomendacoes.map((recomendacao, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {recomendacao}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerta de Ação */}
        {previsao && (previsao.probabilidadeMetaMensal < 60 || previsao.probabilidadeMetaAnual < 50) && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-red-800 dark:text-red-200 mb-1">
                  Ação Imediata Necessária
                </h5>
                <p className="text-sm text-red-700 dark:text-red-300">
                  As probabilidades de atingir as metas estão baixas. 
                  É necessário implementar melhorias nos processos produtivos imediatamente.
                </p>
                {previsao.producaoNecessariaDiaria > previsao.cenarios.realista && (
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                    <strong>Meta diária necessária:</strong> {formatNumber(previsao.producaoNecessariaDiaria)} kg/dia
                    ({formatNumber(previsao.producaoNecessariaDiaria - previsao.cenarios.realista)} kg acima da média atual)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};