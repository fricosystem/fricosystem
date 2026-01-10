import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle, Timer, Target, Wrench, TrendingUp, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { DashboardFilters } from "./DashboardFilters";
import { FiltroData, filtrarPorPeriodo, formatarTempoHMS, timestampToDate, getDatasSemanaAtual } from "./dashboardUtils";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { HistoricoExecucao } from "@/services/historicoExecucoes";

interface SecaoPreventivasProps {
  tarefas: TarefaManutencao[];
  historicoExecucoes: HistoricoExecucao[];
  stats: {
    hoje: number;
    atrasadas: number;
    concluidas: number;
    emAndamento: number;
    total: number;
  };
  filtro: FiltroData;
  onFiltroChange: (filtro: FiltroData) => void;
}

export function SecaoPreventivas({ 
  tarefas, 
  historicoExecucoes, 
  stats, 
  filtro, 
  onFiltroChange 
}: SecaoPreventivasProps) {
  // Filtra execuções por período
  const execucoesFiltradas = filtrarPorPeriodo(
    historicoExecucoes,
    filtro,
    (exec) => exec.dataExecucao
  );

  // Calcula estatísticas
  const totalConcluidas = execucoesFiltradas.length;
  const totalAbertas = tarefas.filter(t => t.status === "pendente").length;
  const totalEmAndamento = tarefas.filter(t => t.status === "em_andamento").length;
  const total = totalAbertas + totalEmAndamento + totalConcluidas;
  const percentualConclusao = total > 0 ? Math.round((totalConcluidas / total) * 100) : 0;

  // Apropriação de horas por manutentor
  const apropriacaoHoras = () => {
    const manutentorHoras: Record<string, { total: number; tarefas: number }> = {};
    
    execucoesFiltradas.forEach(exec => {
      const nome = exec.manutentorNome || "Não identificado";
      if (!manutentorHoras[nome]) {
        manutentorHoras[nome] = { total: 0, tarefas: 0 };
      }
      manutentorHoras[nome].total += exec.tempoRealizado || 0;
      manutentorHoras[nome].tarefas++;
    });

    return Object.entries(manutentorHoras)
      .map(([nome, data]) => ({
        nome,
        horas: Math.round(data.total / 60 * 10) / 10,
        tarefas: data.tarefas,
        mediaPorTarefa: data.tarefas > 0 ? Math.round(data.total / data.tarefas) : 0
      }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 6);
  };

  // Dados para gráfico de execuções por dia (semana atual)
  const execucoesPorDiaData = () => {
    const { inicio, fim } = getDatasSemanaAtual();
    const dias: Record<string, number> = {};
    const diasOrdem = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    
    diasOrdem.forEach(dia => dias[dia] = 0);

    historicoExecucoes.forEach(exec => {
      const data = timestampToDate(exec.dataExecucao);
      if (data && data >= inicio && data <= fim) {
        const diaSemana = data.getDay();
        const diaLabel = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][diaSemana];
        if (dias[diaLabel] !== undefined) {
          dias[diaLabel]++;
        }
      }
    });

    return diasOrdem.map(name => ({ name, preventivas: dias[name] }));
  };

  // Tempo médio de execução
  const tempoMedioExecucao = () => {
    const comTempo = execucoesFiltradas.filter(e => e.tempoRealizado && e.tempoRealizado > 0);
    if (comTempo.length === 0) return 0;
    return Math.round(comTempo.reduce((acc, e) => acc + (e.tempoRealizado || 0), 0) / comTempo.length);
  };

  return (
    <div id="secao-preventivas" className="space-y-4">
      {/* Header com filtro */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Manutenções Preventivas</h2>
          </div>
        </div>
        <DashboardFilters filtro={filtro} onFiltroChange={onFiltroChange} />
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              Abertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{totalAbertas}</div>
            <p className="text-xs text-muted-foreground">Aguardando execução</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalConcluidas}</div>
            <p className="text-xs text-muted-foreground">No período</p>
          </CardContent>
        </Card>
      </div>

      {/* Disponibilidade geral */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Disponibilidade Geral - Preventivas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-primary">{percentualConclusao}%</div>
            <div className="flex-1">
              <Progress value={percentualConclusao} className="h-3" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Abertas: {totalAbertas}</span>
            <span>Em andamento: {totalEmAndamento}</span>
            <span>Concluídas: {totalConcluidas}</span>
          </div>
        </CardContent>
      </Card>

      {/* Apropriação de Horas */}
      {apropriacaoHoras().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Apropriação de Horas - Preventivas
            </CardTitle>
            <CardDescription>Horas trabalhadas por manutentor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {apropriacaoHoras().map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">{item.tarefas} tarefas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{item.horas}h</p>
                    <p className="text-xs text-muted-foreground">{item.mediaPorTarefa} min/tarefa</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Execuções - Semana Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Execuções - Semana Atual
          </CardTitle>
          <CardDescription>Manutenções concluídas por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={execucoesPorDiaData()}>
                <defs>
                  <linearGradient id="colorPreventivas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--background))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                  formatter={(value) => [`${value}`, 'Preventivas']}
                />
                <Area 
                  type="monotone" 
                  dataKey="preventivas" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorPreventivas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Taxa Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{percentualConclusao}%</div>
            <p className="text-xs text-muted-foreground">Eficiência geral</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className="h-4 w-4 text-purple-500" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{tempoMedioExecucao()}<span className="text-sm">min</span></div>
            <p className="text-xs text-muted-foreground">Por execução</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
