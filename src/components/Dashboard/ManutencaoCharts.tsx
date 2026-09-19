import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  StopCircle,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart2,
  Loader2
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
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
  AreaChart, 
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ComposedChart
} from "recharts";
import StatsCard from "@/components/StatsCard";
import { isStatusConcluido } from "@/types/typesParadaMaquina";
import { Factory, Zap, Settings } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A4DE6C', '#D0ED57', '#FFC658'];

interface ManutencaoChartsProps {
  period: "hoje" | "semana" | "mes" | "ano";
}

export function ManutencaoCharts({ period }: ManutencaoChartsProps) {
  const [loading, setLoading] = useState(true);
  const [tarefasManutencao, setTarefasManutencao] = useState<any[]>([]);
  const [historicoExecucoes, setHistoricoExecucoes] = useState<any[]>([]);
  const [paradasMaquina, setParadasMaquina] = useState<any[]>([]);
  const [manutentores, setManutentores] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tarefasSnap, historicoSnap, paradasSnap, manutentoresSnap] = await Promise.all([
          getDocs(collection(db, "tarefas_manutencao")),
          getDocs(collection(db, "historico_execucoes")),
          getDocs(collection(db, "paradas_maquina")),
          getDocs(collection(db, "manutentores"))
        ]);

        setTarefasManutencao(tarefasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setHistoricoExecucoes(historicoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setParadasMaquina(paradasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setManutentores(manutentoresSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Erro ao carregar dados de manutenção:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const convertTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
    if (typeof timestamp === 'string') return new Date(timestamp);
    return new Date();
  };

  const filterByPeriod = (date: Date) => {
    const now = new Date();
    switch (period) {
      case "hoje":
        return date.toDateString() === now.toDateString();
      case "semana":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return date >= startOfWeek;
      case "mes":
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case "ano":
        return date.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  const stats = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    
    const tarefasPendentes = tarefasManutencao.filter(t => t.status === "pendente");
    const tarefasAtrasadas = tarefasPendentes.filter(t => t.proximaExecucao < hoje);
    const tarefasHoje = tarefasPendentes.filter(t => t.proximaExecucao === hoje);
    const tarefasConcluidas = tarefasManutencao.filter(t => t.status === "concluida");

    const paradasAguardando = paradasMaquina.filter(p => p.status === "aguardando");
    const paradasEmAndamento = paradasMaquina.filter(p => p.status === "em_andamento");
    const paradasConcluidas = paradasMaquina.filter(p => isStatusConcluido(p.status));
    const paradasNaoExecutadas = paradasMaquina.filter(p => p.status === "nao_executada");

    return {
      totalTarefas: tarefasManutencao.length,
      tarefasPendentes: tarefasPendentes.length,
      tarefasAtrasadas: tarefasAtrasadas.length,
      tarefasHoje: tarefasHoje.length,
      tarefasConcluidas: tarefasConcluidas.length,
      execucoesRealizadas: historicoExecucoes.length,
      
      totalParadas: paradasMaquina.length,
      paradasAguardando: paradasAguardando.length,
      paradasEmAndamento: paradasEmAndamento.length,
      paradasConcluidas: paradasConcluidas.length,
      paradasNaoExecutadas: paradasNaoExecutadas.length,
      
      totalManutentores: manutentores.length,
      manutentoresAtivos: manutentores.filter(m => m.ativo).length
    };
  }, [tarefasManutencao, historicoExecucoes, paradasMaquina, manutentores]);

  const dadosStatusPreventivas = useMemo(() => {
    return [
      { name: 'Pendentes', value: stats.tarefasPendentes, fill: COLORS[0] },
      { name: 'Atrasadas', value: stats.tarefasAtrasadas, fill: COLORS[3] },
      { name: 'Concluídas', value: stats.tarefasConcluidas, fill: COLORS[1] }
    ];
  }, [stats]);

  const dadosStatusParadas = useMemo(() => {
    return [
      { name: 'Aguardando', value: stats.paradasAguardando, fill: COLORS[0] },
      { name: 'Em Andamento', value: stats.paradasEmAndamento, fill: COLORS[4] },
      { name: 'Concluídas', value: stats.paradasConcluidas, fill: COLORS[1] },
      { name: 'Não Executadas', value: stats.paradasNaoExecutadas, fill: COLORS[3] }
    ];
  }, [stats]);

  const dadosExecucoesPorPeriodo = useMemo(() => {
    const now = new Date();
    let labels: string[] = [];
    
    if (period === "hoje") {
      labels = Array.from({ length: 24 }, (_, i) => `${i}h`);
    } else if (period === "semana") {
      labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    } else if (period === "mes") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    } else {
      labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    }

    return labels.map((label, index) => {
      let preventivas = 0;
      let paradas = 0;

      historicoExecucoes.forEach(exec => {
        const data = convertTimestamp(exec.dataExecucao);
        if (!filterByPeriod(data)) return;
        
        let matches = false;
        if (period === "hoje") matches = data.getHours() === index;
        else if (period === "semana") matches = data.getDay() === index;
        else if (period === "mes") matches = data.getDate() === index + 1;
        else if (period === "ano") matches = data.getMonth() === index;
        
        if (matches) preventivas++;
      });

      paradasMaquina.filter(p => isStatusConcluido(p.status)).forEach(parada => {
        const data = convertTimestamp(parada.criadoEm);
        if (!filterByPeriod(data)) return;
        
        let matches = false;
        if (period === "hoje") matches = data.getHours() === index;
        else if (period === "semana") matches = data.getDay() === index;
        else if (period === "mes") matches = data.getDate() === index + 1;
        else if (period === "ano") matches = data.getMonth() === index;
        
        if (matches) paradas++;
      });

      return { name: label, preventivas, paradas };
    });
  }, [historicoExecucoes, paradasMaquina, period]);

  const dadosExecucoesPorManutentor = useMemo(() => {
    const contagem: Record<string, { preventivas: number; paradas: number }> = {};
    
    historicoExecucoes.forEach(exec => {
      const nome = exec.manutentorNome || 'Não atribuído';
      if (!contagem[nome]) contagem[nome] = { preventivas: 0, paradas: 0 };
      contagem[nome].preventivas++;
    });

    paradasMaquina.filter(p => isStatusConcluido(p.status)).forEach(parada => {
      const nome = parada.manutentorNome || 'Não atribuído';
      if (!contagem[nome]) contagem[nome] = { preventivas: 0, paradas: 0 };
      contagem[nome].paradas++;
    });

    return Object.entries(contagem)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => (b.preventivas + b.paradas) - (a.preventivas + a.paradas))
      .slice(0, 10);
  }, [historicoExecucoes, paradasMaquina]);

  const dadosSaudeManutencao = useMemo(() => {
    const taxaConclusao = stats.totalTarefas > 0 
      ? Math.min((stats.tarefasConcluidas / stats.totalTarefas) * 100, 100) 
      : 0;
    const taxaPontualidade = stats.totalTarefas > 0 
      ? Math.min(((stats.totalTarefas - stats.tarefasAtrasadas) / stats.totalTarefas) * 100, 100) 
      : 100;
    const taxaParadasConcluidas = stats.totalParadas > 0 
      ? Math.min((stats.paradasConcluidas / stats.totalParadas) * 100, 100) 
      : 0;
    const eficienciaEquipe = stats.totalManutentores > 0 
      ? Math.min((stats.manutentoresAtivos / stats.totalManutentores) * 100, 100) 
      : 0;
    const disponibilidade = 100 - (stats.paradasEmAndamento * 10);

    return [
      { subject: 'Conclusão', A: taxaConclusao, fullMark: 100 },
      { subject: 'Pontualidade', A: taxaPontualidade, fullMark: 100 },
      { subject: 'Paradas OK', A: taxaParadasConcluidas, fullMark: 100 },
      { subject: 'Equipe', A: eficienciaEquipe, fullMark: 100 },
      { subject: 'Disponibilidade', A: Math.max(disponibilidade, 0), fullMark: 100 }
    ];
  }, [stats]);

  const dadosTarefasPorMaquina = useMemo(() => {
    const contagem: Record<string, number> = {};
    
    tarefasManutencao.forEach(tarefa => {
      const maquina = tarefa.maquinaNome || 'Não definida';
      contagem[maquina] = (contagem[maquina] || 0) + 1;
    });

    return Object.entries(contagem)
      .map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [tarefasManutencao]);

  // Evolução mensal de paradas (últimos 6 meses)
  const dadosEvolucaoMensalParadas = useMemo(() => {
    const now = new Date();
    const meses: Record<string, number> = {};
    
    for (let i = 5; i >= 0; i--) {
      const mes = new Date(now);
      mes.setMonth(mes.getMonth() - i);
      const key = mes.toLocaleDateString('pt-BR', { month: 'short' });
      meses[key] = 0;
    }

    paradasMaquina.forEach(parada => {
      const data = convertTimestamp(parada.criadoEm);
      if (data) {
        const diffTime = now.getTime() - data.getTime();
        const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
        
        if (diffMonths >= 0 && diffMonths < 6) {
          const key = data.toLocaleDateString('pt-BR', { month: 'short' });
          if (meses[key] !== undefined) {
            meses[key]++;
          }
        }
      }
    });

    return Object.entries(meses).map(([name, value]) => ({ name, paradas: value }));
  }, [paradasMaquina]);

  // Comparativo Preventivas vs Paradas (últimos 6 meses)
  const dadosComparativoPreventivasParadas = useMemo(() => {
    const now = new Date();
    const meses: Record<string, { preventivas: number; paradas: number }> = {};
    
    for (let i = 5; i >= 0; i--) {
      const mes = new Date(now);
      mes.setMonth(mes.getMonth() - i);
      const key = mes.toLocaleDateString('pt-BR', { month: 'short' });
      meses[key] = { preventivas: 0, paradas: 0 };
    }

    historicoExecucoes.forEach(exec => {
      const data = convertTimestamp(exec.dataExecucao);
      if (data) {
        const key = data.toLocaleDateString('pt-BR', { month: 'short' });
        if (meses[key] !== undefined) {
          meses[key].preventivas++;
        }
      }
    });

    paradasMaquina.forEach(parada => {
      const data = convertTimestamp(parada.criadoEm);
      if (data) {
        const key = data.toLocaleDateString('pt-BR', { month: 'short' });
        if (meses[key] !== undefined) {
          meses[key].paradas++;
        }
      }
    });

    return Object.entries(meses).map(([name, data]) => ({ name, ...data }));
  }, [historicoExecucoes, paradasMaquina]);

  // Origem das Paradas
  const dadosOrigemParadas = useMemo(() => {
    const origemCount: Record<string, number> = {
      "Elétrica": 0,
      "Mecânica": 0,
      "Automatização": 0,
      "Terceiros": 0,
      "Outro": 0
    };
    paradasMaquina.forEach(parada => {
      if (parada.origemParada) {
        if (parada.origemParada.eletrica) origemCount["Elétrica"]++;
        if (parada.origemParada.mecanica) origemCount["Mecânica"]++;
        if (parada.origemParada.automatizacao) origemCount["Automatização"]++;
        if (parada.origemParada.terceiros) origemCount["Terceiros"]++;
        if (parada.origemParada.outro) origemCount["Outro"]++;
      }
    });
    return Object.entries(origemCount)
      .filter(([_, value]) => value > 0)
      .map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }));
  }, [paradasMaquina]);

  // Prioridades das tarefas pendentes
  const dadosPrioridadesPendentes = useMemo(() => {
    const prioridadeCount: Record<string, number> = { "critica": 0, "alta": 0, "media": 0, "baixa": 0 };
    tarefasManutencao.filter(t => t.status === "pendente").forEach(t => {
      const prioridade = t.prioridade || "baixa";
      prioridadeCount[prioridade]++;
    });
    return [
      { name: "Crítica", value: prioridadeCount["critica"], fill: '#FF0000' },
      { name: "Alta", value: prioridadeCount["alta"], fill: '#FF8042' },
      { name: "Média", value: prioridadeCount["media"], fill: '#FFBB28' },
      { name: "Baixa", value: prioridadeCount["baixa"], fill: '#00C49F' },
    ].filter(item => item.value > 0);
  }, [tarefasManutencao]);

  // Paradas por Setor
  const dadosParadasPorSetor = useMemo(() => {
    const setorCount: Record<string, number> = {};
    paradasMaquina.forEach(parada => {
      const setor = parada.setor || "Outros";
      setorCount[setor] = (setorCount[setor] || 0) + 1;
    });
    return Object.entries(setorCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [paradasMaquina]);

  // Paradas por Equipamento (Top 10)
  const dadosParadasPorEquipamento = useMemo(() => {
    const equipCount: Record<string, number> = {};
    paradasMaquina.forEach(p => {
      const equip = p.equipamento || "Outros";
      equipCount[equip] = (equipCount[equip] || 0) + 1;
    });
    return Object.entries(equipCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [paradasMaquina]);

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
          <p className="text-lg font-medium">Carregando dados de manutenção...</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard 
          title="Preventivas Pendentes" 
          value={stats.tarefasPendentes.toString()} 
          icon={<Wrench className="h-5 w-5" />}
          trend={{
            value: stats.tarefasHoje,
            positive: stats.tarefasHoje === 0,
            label: `${stats.tarefasHoje} para hoje`
          }}
          description="Tarefas agendadas"
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10"
        />
        <StatsCard 
          title="Preventivas Atrasadas" 
          value={stats.tarefasAtrasadas.toString()} 
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          trend={{
            value: stats.tarefasAtrasadas,
            positive: stats.tarefasAtrasadas === 0,
            label: stats.tarefasAtrasadas === 0 ? 'Tudo em dia!' : 'Requer atenção'
          }}
          description="Precisam de ação urgente"
          className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/10"
        />
        <StatsCard 
          title="Paradas em Andamento" 
          value={stats.paradasEmAndamento.toString()} 
          icon={<StopCircle className="h-5 w-5 text-orange-500" />}
          trend={{
            value: stats.paradasAguardando,
            positive: stats.paradasAguardando === 0,
            label: `${stats.paradasAguardando} aguardando`
          }}
          description="Máquinas em manutenção"
          className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/10"
        />
        <StatsCard 
          title="Execuções Realizadas" 
          value={stats.execucoesRealizadas.toString()} 
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          trend={{
            value: stats.paradasConcluidas,
            positive: true,
            label: `${stats.paradasConcluidas} paradas concluídas`
          }}
          description="Total de manutenções"
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/10"
        />
      </div>

      {/* Primeira linha de gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Execuções por período - Área */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Execuções por Período
            </CardTitle>
            <CardDescription>
              {period === "hoje" ? "Hoje por hora" : period === "semana" ? "Esta semana por dia" : period === "mes" ? "Este mês por dia" : "Este ano por mês"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosExecucoesPorPeriodo}>
                  <defs>
                    <linearGradient id="colorPreventivasMan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorParadasMan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00C49F" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="preventivas" name="Preventivas" stroke="#0088FE" fillOpacity={1} fill="url(#colorPreventivasMan)" />
                  <Area type="monotone" dataKey="paradas" name="Paradas" stroke="#00C49F" fillOpacity={1} fill="url(#colorParadasMan)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Saúde da manutenção - Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" /> Saúde da Manutenção
            </CardTitle>
            <CardDescription>Indicadores de performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dadosSaudeManutencao}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Tooltip {...tooltipStyle} formatter={value => [`${Number(value).toFixed(0)}%`, 'Índice']} />
                  <Radar name="Performance" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Status Preventivas - Pizza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" /> Status Preventivas
            </CardTitle>
            <CardDescription>Distribuição das tarefas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={dadosStatusPreventivas} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={false}
                    outerRadius={80} 
                    innerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosStatusPreventivas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={value => [`${value} tarefas`, 'Quantidade']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Paradas - Pizza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StopCircle className="h-5 w-5" /> Status Paradas
            </CardTitle>
            <CardDescription>Distribuição das paradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={dadosStatusParadas} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={false}
                    outerRadius={80} 
                    innerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosStatusParadas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={value => [`${value} paradas`, 'Quantidade']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tarefas por Máquina - Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" /> Tarefas por Máquina
            </CardTitle>
            <CardDescription>Distribuição de tarefas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={dadosTarefasPorMaquina} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip {...tooltipStyle} formatter={value => [`${value} tarefas`, 'Quantidade']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terceira linha - Execuções por Manutentor */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" /> Execuções por Manutentor
            </CardTitle>
            <CardDescription>Performance da equipe de manutenção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosExecucoesPorManutentor}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                  <YAxis />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Bar dataKey="preventivas" name="Preventivas" fill="#0088FE" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paradas" name="Paradas" fill="#00C49F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quarta linha - Evolução e Comparativo */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Evolução Mensal de Paradas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Evolução Mensal de Paradas
            </CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosEvolucaoMensalParadas}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip {...tooltipStyle} formatter={value => [`${value} paradas`, 'Quantidade']} />
                  <Legend />
                  <Line type="monotone" dataKey="paradas" name="Paradas" stroke="#FF8042" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Comparativo Preventivas vs Paradas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" /> Preventivas vs Paradas
            </CardTitle>
            <CardDescription>Comparativo últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dadosComparativoPreventivasParadas}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Bar dataKey="preventivas" name="Preventivas" fill="#0088FE" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="paradas" name="Paradas" stroke="#FF8042" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quinta linha - Origem e Prioridades */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Origem das Paradas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" /> Origem das Paradas
            </CardTitle>
            <CardDescription>Tipo de falha</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={dadosOrigemParadas} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={false}
                    outerRadius={80} 
                    innerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosOrigemParadas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={value => [`${value} paradas`, 'Quantidade']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Prioridades Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Prioridades Pendentes
            </CardTitle>
            <CardDescription>Tarefas por prioridade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={dadosPrioridadesPendentes} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={false}
                    outerRadius={80} 
                    innerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosPrioridadesPendentes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={value => [`${value} tarefas`, 'Quantidade']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Paradas por Setor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" /> Paradas por Setor
            </CardTitle>
            <CardDescription>Distribuição por área</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={dadosParadasPorSetor} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip {...tooltipStyle} formatter={value => [`${value} paradas`, 'Quantidade']} />
                  <Bar dataKey="value" fill="#FF8042" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sexta linha - Equipamentos problemáticos */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" /> Equipamentos com Mais Paradas
            </CardTitle>
            <CardDescription>Top 8 equipamentos que mais pararam</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosParadasPorEquipamento}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                  <YAxis />
                  <Tooltip {...tooltipStyle} formatter={value => [`${value} paradas`, 'Quantidade']} />
                  <Bar dataKey="value" name="Paradas" fill="#FF8042" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
