import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Clock, 
  Factory, 
  Boxes, 
  Layers,
  BarChart2,
  Loader2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import StatsCard from "@/components/StatsCard";
import { usePCPOptimized } from "@/hooks/usePCPOptimized";

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
  "#06B6D4", "#F97316", "#84CC16", "#EC4899", "#6366F1"
];

interface PCPChartsProps {
  period: "hoje" | "semana" | "mes" | "ano";
}

export function PCPCharts({ period }: PCPChartsProps) {
  const {
    pcpData,
    loading,
    error,
    fetchPCPData,
    getMetrics,
    getChartData
  } = usePCPOptimized();

  useEffect(() => {
    fetchPCPData(period);
  }, [period, fetchPCPData]);

  const metrics = useMemo(() => {
    if (error || !getMetrics) {
      return {
        produtosCadastrados: 0,
        produtosSemClassificacao: 0,
        totalOrdens: 0,
        ordensEmProducao: 0,
        ordensCompletas: 0,
        eficienciaMedia: 0,
        producaoTotal: 0,
        producaoPorTurno: {} as Record<string, { quantidade: number; eficiencia: number; count: number }>,
        producaoPorSetor: {} as Record<string, number>
      };
    }
    try {
      return getMetrics(period);
    } catch (err) {
      console.error('Erro ao calcular métricas PCP:', err);
      return {
        produtosCadastrados: 0,
        produtosSemClassificacao: 0,
        totalOrdens: 0,
        ordensEmProducao: 0,
        ordensCompletas: 0,
        eficienciaMedia: 0,
        producaoTotal: 0,
        producaoPorTurno: {} as Record<string, { quantidade: number; eficiencia: number; count: number }>,
        producaoPorSetor: {} as Record<string, number>
      };
    }
  }, [error, getMetrics, period]);

  const chartData = useMemo(() => {
    if (error || !getChartData) {
      return {
        turnosChart: [],
        setoresChart: [],
        performanceChart: [],
        performanceClassificacaoChart: []
      };
    }
    try {
      return getChartData;
    } catch (err) {
      console.error('Erro ao gerar dados dos gráficos PCP:', err);
      return {
        turnosChart: [],
        setoresChart: [],
        performanceChart: [],
        performanceClassificacaoChart: []
      };
    }
  }, [error, getChartData]);

  // Calcular eficiência
  const eficienciaMedia = useMemo(() => {
    const totalPlanejado = pcpData.reduce((acc, item) => acc + (item.quantidade_planejada || 0), 0);
    const totalProduzido = metrics.producaoTotal;
    return totalPlanejado > 0 ? Math.round((totalProduzido / totalPlanejado) * 100) : 0;
  }, [pcpData, metrics.producaoTotal]);

  // Dados para gráfico de produção por turno
  const dadosProducaoPorTurno = useMemo(() => {
    const turno1 = (metrics.producaoPorTurno['1° Turno'] as any)?.quantidade || 0;
    const turno2 = (metrics.producaoPorTurno['2° Turno'] as any)?.quantidade || 0;
    return [
      { name: '1° Turno', value: turno1, fill: '#3B82F6' },
      { name: '2° Turno', value: turno2, fill: '#10B981' }
    ].filter(item => item.value > 0);
  }, [metrics.producaoPorTurno]);

  // Dados para gráfico de eficiência por turno
  const dadosEficienciaPorTurno = useMemo(() => {
    if (!pcpData || pcpData.length === 0) return [];
    
    const turnoMap: Record<string, { planejado: number; produzido: number }> = {
      '1° Turno': { planejado: 0, produzido: 0 },
      '2° Turno': { planejado: 0, produzido: 0 }
    };
    
    pcpData.forEach(item => {
      const turno = item.turno === '1_turno' ? '1° Turno' : '2° Turno';
      turnoMap[turno].planejado += item.quantidade_planejada || 0;
      turnoMap[turno].produzido += item.quantidade_produzida || 0;
    });

    return Object.entries(turnoMap).map(([name, data]) => ({
      name,
      planejado: Math.round(data.planejado),
      produzido: Math.round(data.produzido),
      eficiencia: data.planejado > 0 ? Math.round((data.produzido / data.planejado) * 100) : 0
    }));
  }, [pcpData]);

  const tooltipStyle = {
    contentStyle: {
      background: 'hsl(var(--background))',
      borderColor: 'hsl(var(--border))',
      borderRadius: 'var(--radius)'
    },
    labelStyle: { color: 'hsl(var(--foreground))' },
    itemStyle: { color: '#82ca9d' }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Carregando dados de produção...</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard 
          title="Produção Total" 
          value={`${metrics.producaoTotal.toLocaleString()} kg`} 
          icon={<Package className="h-5 w-5" />}
          description="Total produzido no período"
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10"
        />
        <StatsCard 
          title="Eficiência Média" 
          value={`${eficienciaMedia}%`} 
          icon={<Boxes className="h-5 w-5" />}
          trend={{
            value: eficienciaMedia,
            positive: eficienciaMedia >= 90,
            label: eficienciaMedia >= 100 ? 'Acima da meta' : eficienciaMedia >= 90 ? 'Dentro da meta' : 'Abaixo da meta'
          }}
          description="Produzido / Planejado"
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/10"
        />
        <StatsCard 
          title="1° Turno" 
          value={`${((metrics.producaoPorTurno['1° Turno'] as any)?.quantidade || 0).toLocaleString()} kg`} 
          icon={<Clock className="h-5 w-5" />}
          description="Produção do 1° turno"
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/10"
        />
        <StatsCard 
          title="2° Turno" 
          value={`${((metrics.producaoPorTurno['2° Turno'] as any)?.quantidade || 0).toLocaleString()} kg`} 
          icon={<Clock className="h-5 w-5" />}
          description="Produção do 2° turno"
          className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/10"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Produção por Turno - Pizza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Produção por Turno
            </CardTitle>
            <CardDescription>Distribuição entre turnos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={dadosProducaoPorTurno} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={false}
                    outerRadius={80} 
                    innerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosProducaoPorTurno.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={value => [`${Number(value).toLocaleString()} kg`, 'Produção']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Eficiência por Turno - Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" /> Planejado vs Produzido
            </CardTitle>
            <CardDescription>Comparativo por turno</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosEficienciaPorTurno}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => value.toLocaleString()} />
                  <Tooltip 
                    {...tooltipStyle} 
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toLocaleString()} kg (${props.payload.eficiencia}%)`,
                      name
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="planejado" name="Planejado" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="produzido" name="Produzido" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}