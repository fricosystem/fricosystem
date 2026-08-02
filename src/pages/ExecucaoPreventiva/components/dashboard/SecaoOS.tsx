import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CircleDot, Play, CheckCircle2, Timer, Target, ClipboardCheck, Users, Building2, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { DashboardFilters } from "./DashboardFilters";
import { 
  FiltroData, 
  filtrarPorPeriodo, 
  formatarTempoHMS,
  timestampToDate,
  getDatasSemanaAtual
} from "./dashboardUtils";

interface OrdemServico {
  id: string;
  status: string;
  setor: string;
  equipamento: string;
  criadoEm: any;
  observacaoManutencao?: string;
  responsavel?: string;
}

interface OrdemServicoFinalizada {
  id: string;
  tempoTotal?: number;
  setor?: string;
  equipamento?: string;
  finalizadoEm?: any;
  responsavel?: string;
}

interface SecaoOSProps {
  ordensServico: OrdemServico[];
  ordensFinalizadas: OrdemServicoFinalizada[];
  filtro: FiltroData;
  onFiltroChange: (filtro: FiltroData) => void;
}

export function SecaoOS({ ordensServico, ordensFinalizadas, filtro, onFiltroChange }: SecaoOSProps) {
  // Filtra OS abertas por período
  const osAbertasFiltradas = filtrarPorPeriodo(
    ordensServico,
    filtro,
    (os) => os.criadoEm
  );

  // Filtra OS finalizadas por período
  const osFinalizadasFiltradas = filtrarPorPeriodo(
    ordensFinalizadas,
    filtro,
    (os) => os.finalizadoEm
  );

  // Estatísticas
  const osAbertas = osAbertasFiltradas.filter(os => os.status === "aberta").length;
  const osEmExecucao = osAbertasFiltradas.filter(os => os.status === "em_execucao").length;
  const osConcluidas = osFinalizadasFiltradas.length;
  const totalOS = osAbertas + osEmExecucao + osConcluidas;
  
  const percentualAbertas = totalOS > 0 ? Math.round((osAbertas / totalOS) * 100) : 0;
  const percentualFechadas = totalOS > 0 ? Math.round((osConcluidas / totalOS) * 100) : 0;

  // Tempo médio de execução de OS
  const tempoMedioOS = () => {
    const osComTempo = osFinalizadasFiltradas.filter(os => os.tempoTotal && os.tempoTotal > 0);
    if (osComTempo.length === 0) return 0;
    return Math.round(osComTempo.reduce((acc, os) => acc + (os.tempoTotal || 0), 0) / osComTempo.length / 60);
  };

  // Apropriação de horas por manutentor
  const apropriacaoHoras = () => {
    const manutentorHoras: Record<string, { total: number; os: number }> = {};
    
    osFinalizadasFiltradas.forEach(os => {
      const nome = os.responsavel || "Não identificado";
      if (!manutentorHoras[nome]) {
        manutentorHoras[nome] = { total: 0, os: 0 };
      }
      manutentorHoras[nome].total += (os.tempoTotal || 0) / 60; // Converter para minutos
      manutentorHoras[nome].os++;
    });

    return Object.entries(manutentorHoras)
      .filter(([nome]) => nome !== "Não identificado")
      .map(([nome, data]) => ({
        nome,
        horas: Math.round(data.total / 60 * 10) / 10,
        os: data.os,
        mediaPorOS: data.os > 0 ? Math.round(data.total / data.os) : 0
      }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 6);
  };

  // OS por setor
  const osPorSetorData = () => {
    const setorCount: Record<string, { abertas: number; fechadas: number }> = {};
    
    osAbertasFiltradas.forEach(os => {
      const setor = os.setor || "Outros";
      if (!setorCount[setor]) setorCount[setor] = { abertas: 0, fechadas: 0 };
      setorCount[setor].abertas++;
    });
    
    osFinalizadasFiltradas.forEach(os => {
      const setor = os.setor || "Outros";
      if (!setorCount[setor]) setorCount[setor] = { abertas: 0, fechadas: 0 };
      setorCount[setor].fechadas++;
    });

    return Object.entries(setorCount)
      .map(([name, data]) => ({ name, ...data, total: data.abertas + data.fechadas }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  };

  // OS Finalizadas por dia (semana atual)
  const osFinalizadasPorDiaData = () => {
    const { inicio, fim } = getDatasSemanaAtual();
    const dias: Record<string, number> = {};
    const diasOrdem = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    
    diasOrdem.forEach(dia => dias[dia] = 0);

    ordensFinalizadas.forEach(os => {
      const data = timestampToDate(os.finalizadoEm);
      if (data && data >= inicio && data <= fim) {
        const diaSemana = data.getDay();
        const diaLabel = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][diaSemana];
        if (dias[diaLabel] !== undefined) {
          dias[diaLabel]++;
        }
      }
    });

    return diasOrdem.map(name => ({ name, os: dias[name] }));
  };

  return (
    <div id="secao-os" className="space-y-4">
      {/* Header com filtro */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-bold">Ordens de Serviço</h2>
        </div>
        <DashboardFilters filtro={filtro} onFiltroChange={onFiltroChange} />
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-orange-500" />
              Abertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{osAbertas}</div>
            <p className="text-xs text-muted-foreground">Aguardando execução</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-500" />
              Em Execução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{osEmExecucao}</div>
            <p className="text-xs text-muted-foreground">Sendo executadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Finalizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{osConcluidas}</div>
            <p className="text-xs text-muted-foreground">No período</p>
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
            <div className="text-2xl font-bold text-purple-500">{tempoMedioOS()}<span className="text-sm">min</span></div>
            <p className="text-xs text-muted-foreground">Por execução</p>
          </CardContent>
        </Card>
      </div>

      {/* Disponibilidade Geral de OS */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            Disponibilidade Geral - Ordens de Serviço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">% Abertas</p>
              <div className="text-2xl font-bold text-orange-500">{percentualAbertas}%</div>
              <Progress value={percentualAbertas} className="h-2 mt-2" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">% Fechadas</p>
              <div className="text-2xl font-bold text-success">{percentualFechadas}%</div>
              <Progress value={percentualFechadas} className="h-2 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Apropriação de Horas */}
      {apropriacaoHoras().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Apropriação de Horas - OS
            </CardTitle>
            <CardDescription>Tempo trabalhado por manutentor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {apropriacaoHoras().map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">{item.os} OS</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-500">{item.horas}h</p>
                    <p className="text-xs text-muted-foreground">{item.mediaPorOS} min/OS</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OS por Setor */}
      {osPorSetorData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              OS por Setor
            </CardTitle>
            <CardDescription>Abertas vs Fechadas por setor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={osPorSetorData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={60} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <Bar dataKey="abertas" fill="hsl(var(--warning))" name="Abertas" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="fechadas" fill="hsl(var(--success))" name="Fechadas" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OS Finalizadas - Semana Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            OS Finalizadas - Semana Atual
          </CardTitle>
          <CardDescription>Ordens de serviço concluídas por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={osFinalizadasPorDiaData()}>
                <defs>
                  <linearGradient id="colorOS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221 83% 53%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0.1}/>
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
                  formatter={(value) => [`${value}`, 'OS']}
                />
                <Area 
                  type="monotone" 
                  dataKey="os" 
                  stroke="hsl(221 83% 53%)" 
                  fillOpacity={1} 
                  fill="url(#colorOS)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
