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

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Status Preventivas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" /> Status Preventivas
            </CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
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
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Paradas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" /> Status Paradas
            </CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
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
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}