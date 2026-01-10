import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pause, Play, Check, AlertTriangle, ShieldCheck, Timer, Target, Users, Gauge } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { DashboardFilters } from "./DashboardFilters";
import { 
  FiltroData, 
  filtrarPorPeriodo, 
  calcularDisponibilidade, 
  getTempoDisponivelMinutos, 
  getTempoParadaReal,
  formatarTempoHMS,
  timestampToDate,
  getDatasSemanaAtual,
  COLORS
} from "./dashboardUtils";

interface ParadaMaquinaData {
  id: string;
  setor: string;
  equipamento: string;
  tipoManutencao: string;
  status: string;
  origemParada?: {
    automatizacao?: boolean;
    terceiros?: boolean;
    eletrica?: boolean;
    mecanica?: boolean;
    outro?: boolean;
  };
  tempoParada?: number;
  criadoEm?: any;
  finalizadoEm?: any;
}

interface SecaoParadasProps {
  paradasMaquina: ParadaMaquinaData[];
  filtro: FiltroData;
  onFiltroChange: (filtro: FiltroData) => void;
}

export function SecaoParadas({ paradasMaquina, filtro, onFiltroChange }: SecaoParadasProps) {
  // Filtra paradas por período
  const paradasFiltradas = filtrarPorPeriodo(
    paradasMaquina,
    filtro,
    (parada) => parada.criadoEm
  );

  // Estatísticas
  const paradasAbertas = paradasFiltradas.filter(p => p.status !== "concluido" && p.status !== "cancelado").length;
  const paradasConcluidas = paradasFiltradas.filter(p => p.status === "concluido").length;
  const paradasPendentes = paradasFiltradas.filter(p => p.status === "pendente").length;
  const paradasEmAndamento = paradasFiltradas.filter(p => p.status === "em_andamento").length;
  const totalParadas = paradasFiltradas.length;
  const percentualConclusao = totalParadas > 0 ? Math.round((paradasConcluidas / totalParadas) * 100) : 0;

  // Calcula tempo de parada total (em minutos) usando função corrigida
  const tempoParadaTotal = paradasFiltradas.reduce((acc, p) => {
    return acc + getTempoParadaReal(p);
  }, 0);

  // Disponibilidade geral usando horas úteis
  const tempoDisponivel = getTempoDisponivelMinutos(filtro);
  const disponibilidadeGeral = calcularDisponibilidade(tempoParadaTotal, tempoDisponivel, true);

  // Tempo médio de parada
  const tempoMedioParada = totalParadas > 0 ? Math.round(tempoParadaTotal / totalParadas) : 0;

  // Apropriação de horas por manutentor (baseado em paradas concluídas)
  const apropriacaoHoras = () => {
    const manutentorHoras: Record<string, { total: number; paradas: number }> = {};
    
    paradasFiltradas.filter(p => p.status === "concluido").forEach(p => {
      const nome = (p as any).responsavelManutencao || "Não identificado";
      if (!manutentorHoras[nome]) {
        manutentorHoras[nome] = { total: 0, paradas: 0 };
      }
      // Usa a função corrigida para calcular tempo real
      const tempo = getTempoParadaReal(p);
      manutentorHoras[nome].total += tempo;
      manutentorHoras[nome].paradas++;
    });

    return Object.entries(manutentorHoras)
      .filter(([nome]) => nome !== "Não identificado")
      .map(([nome, data]) => ({
        nome,
        horas: Math.round(data.total / 60 * 10) / 10,
        paradas: data.paradas,
        mediaPorParada: data.paradas > 0 ? Math.round(data.total / data.paradas) : 0
      }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 6);
  };

  // Dados para gráfico de paradas por setor
  const paradasPorSetorData = () => {
    const setorCount: Record<string, number> = {};
    paradasFiltradas.forEach(p => {
      const setor = p.setor || "Outros";
      setorCount[setor] = (setorCount[setor] || 0) + 1;
    });
    return Object.entries(setorCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  // Origem das paradas
  const origemParadasData = () => {
    const origemCount: Record<string, number> = {
      "Elétrica": 0,
      "Mecânica": 0,
      "Automatização": 0,
      "Terceiros": 0,
      "Outro": 0
    };
    paradasFiltradas.forEach(p => {
      if (p.origemParada) {
        if (p.origemParada.eletrica) origemCount["Elétrica"]++;
        if (p.origemParada.mecanica) origemCount["Mecânica"]++;
        if (p.origemParada.automatizacao) origemCount["Automatização"]++;
        if (p.origemParada.terceiros) origemCount["Terceiros"]++;
        if (p.origemParada.outro) origemCount["Outro"]++;
      }
    });
    return Object.entries(origemCount)
      .filter(([_, value]) => value > 0)
      .map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }));
  };

  return (
    <div id="secao-paradas" className="space-y-4">
      {/* Header com filtro */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-bold">Paradas de Máquina</h2>
        </div>
        <DashboardFilters filtro={filtro} onFiltroChange={onFiltroChange} />
      </div>

      {/* KPIs Status */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <Pause className="h-3 w-3 text-warning" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-warning">{paradasPendentes}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <Play className="h-3 w-3 text-primary" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-primary">{paradasEmAndamento}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <Check className="h-3 w-3 text-success" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-success">{paradasConcluidas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Disponibilidade Geral */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gauge className="h-4 w-4 text-success" />
            Disponibilidade Geral - Paradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-success">{disponibilidadeGeral.toFixed(1)}%</div>
            <div className="flex-1">
              <Progress value={disponibilidadeGeral} className="h-3" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Abertas: {paradasAbertas}</span>
            <span>Concluídas: {paradasConcluidas}</span>
            <span>Total: {totalParadas}</span>
          </div>
        </CardContent>
      </Card>

      {/* KPIs estratégicos */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              % Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{percentualConclusao}%</div>
            <Progress value={percentualConclusao} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Paradas resolvidas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-500" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{tempoMedioParada}<span className="text-sm">min</span></div>
            <p className="text-xs text-muted-foreground mt-1">Por parada</p>
          </CardContent>
        </Card>
      </div>

      {/* Apropriação de Horas */}
      {apropriacaoHoras().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-warning" />
              Apropriação de Horas - Paradas
            </CardTitle>
            <CardDescription>Tempo de resolução por manutentor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {apropriacaoHoras().map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">{item.paradas} paradas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-warning">{item.horas}h</p>
                    <p className="text-xs text-muted-foreground">{item.mediaPorParada} min/parada</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Paradas por Setor */}
      {paradasPorSetorData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Paradas por Setor
            </CardTitle>
            <CardDescription>Distribuição de paradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paradasPorSetorData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value) => [`${value}`, 'Paradas']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Origem das Paradas */}
      {origemParadasData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Origem das Paradas
            </CardTitle>
            <CardDescription>Por tipo de origem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={origemParadasData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                  >
                    {origemParadasData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
