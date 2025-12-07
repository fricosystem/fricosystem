import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, TrendingUp, Wrench, AlertTriangle, Calendar } from "lucide-react";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { HistoricoExecucao } from "@/services/historicoExecucoes";
import { useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from "recharts";

interface DashboardMobileProps {
  stats: {
    hoje: number;
    atrasadas: number;
    concluidas: number;
    emAndamento: number;
    total: number;
  };
  tarefasHoje: TarefaManutencao[];
  tarefasAtrasadas: TarefaManutencao[];
  execucoesPorTarefa?: Record<string, number>;
  tarefas?: TarefaManutencao[];
  historicoExecucoes?: HistoricoExecucao[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
  criadoEm?: any;
}

export function DashboardMobile({ stats, tarefasHoje, tarefasAtrasadas, execucoesPorTarefa = {}, tarefas = [], historicoExecucoes = [] }: DashboardMobileProps) {
  const [paradasMaquina, setParadasMaquina] = useState<ParadaMaquinaData[]>([]);
  const [loadingParadas, setLoadingParadas] = useState(true);

  useEffect(() => {
    const fetchParadas = async () => {
      try {
        const paradasRef = collection(db, "paradas_maquina");
        const snapshot = await getDocs(query(paradasRef));
        const paradas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ParadaMaquinaData[];
        setParadasMaquina(paradas);
      } catch (error) {
        console.error("Erro ao buscar paradas:", error);
      } finally {
        setLoadingParadas(false);
      }
    };
    fetchParadas();
  }, []);

  // Dados para gráfico de Status das Tarefas (Pie)
  const statusTarefasData = [
    { name: "Concluídas", value: stats.concluidas, fill: "hsl(var(--success))" },
    { name: "Pendentes", value: stats.hoje + stats.atrasadas, fill: "hsl(var(--warning))" },
    { name: "Em Andamento", value: stats.emAndamento, fill: "hsl(var(--primary))" },
    { name: "Atrasadas", value: stats.atrasadas, fill: "hsl(var(--destructive))" },
  ].filter(item => item.value > 0);

  // Dados para gráfico de Tipos de Manutenção (Bar)
  const tiposManutencaoData = () => {
    const tiposCount: Record<string, number> = {};
    tarefas.forEach(tarefa => {
      const tipo = tarefa.tipo || "Outros";
      tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
    });
    return Object.entries(tiposCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  // Dados para gráfico de Paradas por Setor (Bar)
  const paradasPorSetorData = () => {
    const setorCount: Record<string, number> = {};
    paradasMaquina.forEach(parada => {
      const setor = parada.setor || "Outros";
      setorCount[setor] = (setorCount[setor] || 0) + 1;
    });
    return Object.entries(setorCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  // Dados para gráfico de Origem das Paradas (Pie)
  const origemParadasData = () => {
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
  };

  // Dados para gráfico de Execuções por Período (Últimos 7 dias)
  const execucoesPorDiaData = () => {
    const hoje = new Date();
    const dias: Record<string, number> = {};
    
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const key = data.toLocaleDateString('pt-BR', { weekday: 'short' });
      dias[key] = 0;
    }

    historicoExecucoes.forEach(exec => {
      if (exec.dataExecucao) {
        let dataExec: Date;
        const timestamp = exec.dataExecucao as any;
        if (typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
          dataExec = timestamp.toDate();
        } else if (timestamp instanceof Date) {
          dataExec = timestamp;
        } else {
          return;
        }
        
        const diffTime = hoje.getTime() - dataExec.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays < 7) {
          const key = dataExec.toLocaleDateString('pt-BR', { weekday: 'short' });
          if (dias[key] !== undefined) {
            dias[key]++;
          }
        }
      }
    });

    return Object.entries(dias).map(([name, value]) => ({ name, preventivas: value }));
  };

  // Stats de Paradas
  const paradasPendentes = paradasMaquina.filter(p => p.status === "pendente").length;
  const paradasEmAndamento = paradasMaquina.filter(p => p.status === "em_andamento").length;
  const paradasConcluidas = paradasMaquina.filter(p => p.status === "concluido").length;

  return (
    <div className="space-y-4 pb-20">
      {/* Cards de KPIs - Preventivas */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoje}</div>
            <p className="text-xs text-muted-foreground">Tarefas agendadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.atrasadas}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-warning" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.emAndamento}</div>
            <p className="text-xs text-muted-foreground">Em execução</p>
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
            <div className="text-2xl font-bold text-success">{stats.concluidas}</div>
            <p className="text-xs text-muted-foreground">Total realizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs de Paradas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Resumo de Paradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-warning">{paradasPendentes}</div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
            <div>
              <div className="text-xl font-bold text-primary">{paradasEmAndamento}</div>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </div>
            <div>
              <div className="text-xl font-bold text-success">{paradasConcluidas}</div>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Status das Tarefas */}
      {statusTarefasData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Status das Preventivas
            </CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusTarefasData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusTarefasData.map((entry, index) => (
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Execuções nos últimos 7 dias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Execuções - Últimos 7 Dias
          </CardTitle>
          <CardDescription>Manutenções concluídas por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
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

      {/* Gráfico de Tipos de Manutenção */}
      {tiposManutencaoData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Tipos de Manutenção
            </CardTitle>
            <CardDescription>Tarefas por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tiposManutencaoData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={11} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value) => [`${value}`, 'Tarefas']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
            <div className="h-[200px]">
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

      {/* Gráfico de Origem das Paradas */}
      {origemParadasData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-5 w-5 text-destructive" />
              Origem das Paradas
            </CardTitle>
            <CardDescription>Por tipo de origem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={origemParadasData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
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
