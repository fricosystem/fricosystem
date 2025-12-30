import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, TrendingUp, Wrench, AlertTriangle, Calendar, Target, Timer, Activity, ListChecks, Layers, BarChart3, PieChartIcon, Settings2, Factory, Users, TrendingDown, Gauge, Zap, ShieldCheck, ArrowUpRight, ArrowDownRight, Percent, CalendarClock, Award, Cog, Building2, FileCheck, CircleDot, Ban, Play, Pause, RotateCcw, ClipboardCheck } from "lucide-react";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { HistoricoExecucao } from "@/services/historicoExecucoes";
import { TemplateTarefa } from "@/types/typesTemplatesTarefas";
import { useState, useEffect } from "react";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend, RadialBarChart, RadialBar, LineChart, Line, ComposedChart, Scatter, ScatterChart, ZAxis, Treemap, FunnelChart, Funnel, LabelList } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#a4de6c'];

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
  descricao?: string;
}

interface EquipamentoData {
  id: string;
  equipamento: string;
  setor: string;
  patrimonio: string;
  status: string;
  tag?: string;
}

interface SetorData {
  id: string;
  nome: string;
  unidade: string;
  status: string;
}

interface ManutentorData {
  id: string;
  nome: string;
  email: string;
  funcao: string;
  ativo: boolean;
  capacidadeDiaria: number;
  ordemPrioridade: number;
}

export function DashboardMobile({ stats, tarefasHoje, tarefasAtrasadas, execucoesPorTarefa = {}, tarefas = [], historicoExecucoes = [] }: DashboardMobileProps) {
  const { userData } = useAuth();
  const [paradasMaquina, setParadasMaquina] = useState<ParadaMaquinaData[]>([]);
  const [templates, setTemplates] = useState<TemplateTarefa[]>([]);
  const [loadingParadas, setLoadingParadas] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [filtrarPorUsuario, setFiltrarPorUsuario] = useState(false);

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

  const [equipamentos, setEquipamentos] = useState<EquipamentoData[]>([]);
  const [setores, setSetores] = useState<SetorData[]>([]);
  const [manutentores, setManutentores] = useState<ManutentorData[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  // Buscar templates da coleção lista_tarefas_manutencao
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templatesRef = collection(db, "lista_tarefas_manutencao");
        const snapshot = await getDocs(query(templatesRef));
        const templatesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TemplateTarefa[];
        setTemplates(templatesData);
      } catch (error) {
        console.error("Erro ao buscar templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // Buscar equipamentos, setores e manutentores
  useEffect(() => {
    const fetchExtras = async () => {
      try {
        const [equipamentosSnap, setoresSnap, manutentoresSnap] = await Promise.all([
          getDocs(collection(db, "equipamentos")),
          getDocs(collection(db, "setores")),
          getDocs(collection(db, "manutentores"))
        ]);
        
        setEquipamentos(equipamentosSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EquipamentoData[]);
        
        setSetores(setoresSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SetorData[]);
        
        setManutentores(manutentoresSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ManutentorData[]);
      } catch (error) {
        console.error("Erro ao buscar dados extras:", error);
      } finally {
        setLoadingExtras(false);
      }
    };
    fetchExtras();
  }, []);

  // Filtrar tarefas do usuário logado se necessário
  const tarefasFiltradas = filtrarPorUsuario 
    ? tarefas.filter(t => t.manutentorEmail === userData?.email)
    : tarefas;

  const historicoFiltrado = filtrarPorUsuario
    ? historicoExecucoes.filter(h => h.manutentorEmail === userData?.email)
    : historicoExecucoes;

  // Templates ativos e inativos
  const templatesAtivos = templates.filter(t => t.ativo);
  const templatesInativos = templates.filter(t => !t.ativo);

  // Stats filtradas
  const statsFiltradas = filtrarPorUsuario ? {
    hoje: tarefasFiltradas.filter(t => t.proximaExecucao === new Date().toISOString().split("T")[0] && t.status === "pendente").length,
    atrasadas: tarefasFiltradas.filter(t => t.proximaExecucao < new Date().toISOString().split("T")[0] && t.status === "pendente").length,
    concluidas: historicoFiltrado.length,
    emAndamento: tarefasFiltradas.filter(t => t.status === "em_andamento").length,
    total: tarefasFiltradas.length
  } : stats;

  // Dados para gráfico de Status das Tarefas (Pie)
  const statusTarefasData = [
    { name: "Concluídas", value: statsFiltradas.concluidas, fill: "hsl(var(--success))" },
    { name: "Pendentes", value: statsFiltradas.hoje + statsFiltradas.atrasadas, fill: "hsl(var(--warning))" },
    { name: "Em Andamento", value: statsFiltradas.emAndamento, fill: "hsl(var(--primary))" },
    { name: "Atrasadas", value: statsFiltradas.atrasadas, fill: "hsl(var(--destructive))" },
  ].filter(item => item.value > 0);

  // Dados para gráfico de Tipos de Manutenção (Bar)
  const tiposManutencaoData = () => {
    const tiposCount: Record<string, number> = {};
    tarefasFiltradas.forEach(tarefa => {
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

    historicoFiltrado.forEach(exec => {
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

  // ========== NOVAS MÉTRICAS BASEADAS NOS TEMPLATES ==========

  // Templates por Prioridade
  const templatesPorPrioridadeData = () => {
    const prioridadeCount: Record<string, number> = { "crítica": 0, "alta": 0, "média": 0, "baixa": 0 };
    templatesAtivos.forEach(t => {
      const prioridade = t.prioridade || "baixa";
      if (prioridade === "critica") prioridadeCount["crítica"]++;
      else if (prioridade === "alta") prioridadeCount["alta"]++;
      else if (prioridade === "media") prioridadeCount["média"]++;
      else prioridadeCount["baixa"]++;
    });
    return [
      { name: "Crítica", value: prioridadeCount["crítica"], fill: "hsl(var(--destructive))" },
      { name: "Alta", value: prioridadeCount["alta"], fill: "#FF8042" },
      { name: "Média", value: prioridadeCount["média"], fill: "hsl(var(--warning))" },
      { name: "Baixa", value: prioridadeCount["baixa"], fill: "hsl(var(--success))" },
    ].filter(item => item.value > 0);
  };

  // Templates por Período
  const templatesPorPeriodoData = () => {
    const periodoCount: Record<string, number> = {};
    templatesAtivos.forEach(t => {
      const periodo = t.periodoLabel || "Outros";
      periodoCount[periodo] = (periodoCount[periodo] || 0) + 1;
    });
    return Object.entries(periodoCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Templates por Máquina (Top 5)
  const templatesPorMaquinaData = () => {
    const maquinaCount: Record<string, number> = {};
    templatesAtivos.forEach(t => {
      const maquina = t.maquinaNome || "Outros";
      maquinaCount[maquina] = (maquinaCount[maquina] || 0) + 1;
    });
    return Object.entries(maquinaCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  // Templates por Tipo de Manutenção
  const templatesPorTipoData = () => {
    const tipoCount: Record<string, number> = {};
    templatesAtivos.forEach(t => {
      const tipo = t.tipo || "Outros";
      tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
    });
    return Object.entries(tipoCount)
      .map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }));
  };

  // Templates por Setor
  const templatesPorSetorData = () => {
    const setorCount: Record<string, number> = {};
    templatesAtivos.forEach(t => {
      const setor = t.setor || "Não definido";
      setorCount[setor] = (setorCount[setor] || 0) + 1;
    });
    return Object.entries(setorCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  // Tempo estimado total por tipo
  const tempoEstimadoPorTipoData = () => {
    const tipoTempo: Record<string, number> = {};
    templatesAtivos.forEach(t => {
      const tipo = t.tipo || "Outros";
      tipoTempo[tipo] = (tipoTempo[tipo] || 0) + (t.tempoEstimado || 0);
    });
    return Object.entries(tipoTempo)
      .map(([name, value]) => ({ name, horas: Math.round(value / 60 * 10) / 10 }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 5);
  };

  // Média de tempo estimado por prioridade
  const tempoMedioPorPrioridadeData = () => {
    const prioridadeTempo: Record<string, { total: number; count: number }> = {
      "Crítica": { total: 0, count: 0 },
      "Alta": { total: 0, count: 0 },
      "Média": { total: 0, count: 0 },
      "Baixa": { total: 0, count: 0 }
    };
    templatesAtivos.forEach(t => {
      const tempo = t.tempoEstimado || 0;
      if (t.prioridade === "critica") { prioridadeTempo["Crítica"].total += tempo; prioridadeTempo["Crítica"].count++; }
      else if (t.prioridade === "alta") { prioridadeTempo["Alta"].total += tempo; prioridadeTempo["Alta"].count++; }
      else if (t.prioridade === "media") { prioridadeTempo["Média"].total += tempo; prioridadeTempo["Média"].count++; }
      else { prioridadeTempo["Baixa"].total += tempo; prioridadeTempo["Baixa"].count++; }
    });
    return Object.entries(prioridadeTempo)
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({ 
        name, 
        minutos: Math.round(data.total / data.count)
      }));
  };

  // Taxa de conclusão (baseada nas tarefas filtradas)
  const taxaConclusao = tarefasFiltradas.length > 0 
    ? Math.round((statsFiltradas.concluidas / (statsFiltradas.concluidas + tarefasFiltradas.filter(t => t.status !== 'concluida').length)) * 100) 
    : 0;

  // Tempo médio de execução (baseado no histórico)
  const tempoMedioExecucao = () => {
    const execucoesComTempo = historicoFiltrado.filter(h => h.tempoRealizado && h.tempoRealizado > 0);
    if (execucoesComTempo.length === 0) return 0;
    const total = execucoesComTempo.reduce((acc, h) => acc + (h.tempoRealizado || 0), 0);
    return Math.round(total / execucoesComTempo.length);
  };

  // Desvio de tempo (estimado vs realizado)
  const desvioTempoData = () => {
    const execucoesComTempo = historicoFiltrado.filter(h => h.tempoRealizado && h.tempoEstimado);
    if (execucoesComTempo.length === 0) return [];
    
    return execucoesComTempo.slice(0, 10).map((h, index) => ({
      name: `#${index + 1}`,
      estimado: h.tempoEstimado || 0,
      realizado: h.tempoRealizado || 0
    }));
  };

  // Produtividade semanal (tarefas concluídas por semana)
  const produtividadeSemanalData = () => {
    const hoje = new Date();
    const semanas: Record<string, number> = {};
    
    for (let i = 3; i >= 0; i--) {
      const semana = new Date(hoje);
      semana.setDate(semana.getDate() - (i * 7));
      const weekLabel = `Sem ${4 - i}`;
      semanas[weekLabel] = 0;
    }

    historicoFiltrado.forEach(exec => {
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
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        
        if (diffWeeks >= 0 && diffWeeks < 4) {
          const weekLabel = `Sem ${4 - diffWeeks}`;
          if (semanas[weekLabel] !== undefined) {
            semanas[weekLabel]++;
          }
        }
      }
    });

    return Object.entries(semanas).map(([name, value]) => ({ name, tarefas: value }));
  };

  // Carga de trabalho por período (tarefas agendadas)
  const cargaTrabalhoPorPeriodoData = () => {
    const periodoCount: Record<string, number> = {};
    tarefasFiltradas.forEach(t => {
      if (t.status === "pendente") {
        const periodo = t.periodoLabel || "Outros";
        periodoCount[periodo] = (periodoCount[periodo] || 0) + 1;
      }
    });
    return Object.entries(periodoCount)
      .map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }));
  };

  // Progresso radial
  const progressoRadialData = [
    {
      name: "Concluídas",
      value: taxaConclusao,
      fill: "hsl(var(--success))"
    }
  ];

  // ========== NOVAS MÉTRICAS PARA REDUÇÃO DE PARADAS ==========

  // Equipamentos ativos e inativos
  const equipamentosAtivos = equipamentos.filter(e => e.status === "Ativa").length;
  const equipamentosInativos = equipamentos.filter(e => e.status === "Inativa").length;

  // Setores ativos
  const setoresAtivos = setores.filter(s => s.status === "Ativo").length;

  // Manutentores ativos
  const manutentoresAtivos = manutentores.filter(m => m.ativo).length;
  const capacidadeTotalDiaria = manutentores.filter(m => m.ativo).reduce((acc, m) => acc + (m.capacidadeDiaria || 0), 0);

  // Taxa de paradas (Meta: diminuir)
  const totalParadas = paradasMaquina.length;
  const paradasAbertas = paradasMaquina.filter(p => p.status !== "concluido" && p.status !== "cancelado").length;
  const taxaResolucaoParadas = totalParadas > 0 ? Math.round(((totalParadas - paradasAbertas) / totalParadas) * 100) : 100;

  // Tempo médio de parada
  const tempoMedioParada = () => {
    const paradasComTempo = paradasMaquina.filter(p => p.tempoParada && p.tempoParada > 0);
    if (paradasComTempo.length === 0) return 0;
    return Math.round(paradasComTempo.reduce((acc, p) => acc + (p.tempoParada || 0), 0) / paradasComTempo.length);
  };

  // Paradas por Equipamento (Top 10 - equipamentos problemáticos)
  const paradasPorEquipamentoData = () => {
    const equipCount: Record<string, number> = {};
    paradasMaquina.forEach(p => {
      const equip = p.equipamento || "Outros";
      equipCount[equip] = (equipCount[equip] || 0) + 1;
    });
    return Object.entries(equipCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  // Paradas por Tipo de Manutenção
  const paradasPorTipoManutencaoData = () => {
    const tipoCount: Record<string, number> = {};
    paradasMaquina.forEach(p => {
      const tipo = p.tipoManutencao || "Outros";
      tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
    });
    return Object.entries(tipoCount)
      .map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }));
  };

  // Evolução mensal de paradas (últimos 6 meses)
  const evolucaoMensalParadasData = () => {
    const hoje = new Date();
    const meses: Record<string, number> = {};
    
    for (let i = 5; i >= 0; i--) {
      const mes = new Date(hoje);
      mes.setMonth(mes.getMonth() - i);
      const key = mes.toLocaleDateString('pt-BR', { month: 'short' });
      meses[key] = 0;
    }

    paradasMaquina.forEach(parada => {
      if (parada.criadoEm) {
        let dataParada: Date;
        const timestamp = parada.criadoEm as any;
        if (typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
          dataParada = timestamp.toDate();
        } else if (timestamp instanceof Date) {
          dataParada = timestamp;
        } else {
          return;
        }
        
        const diffTime = hoje.getTime() - dataParada.getTime();
        const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
        
        if (diffMonths >= 0 && diffMonths < 6) {
          const key = dataParada.toLocaleDateString('pt-BR', { month: 'short' });
          if (meses[key] !== undefined) {
            meses[key]++;
          }
        }
      }
    });

    return Object.entries(meses).map(([name, value]) => ({ name, paradas: value }));
  };

  // Comparativo Preventivas vs Paradas (últimos 6 meses)
  const comparativoPreventivasParadasData = () => {
    const hoje = new Date();
    const meses: Record<string, { preventivas: number; paradas: number }> = {};
    
    for (let i = 5; i >= 0; i--) {
      const mes = new Date(hoje);
      mes.setMonth(mes.getMonth() - i);
      const key = mes.toLocaleDateString('pt-BR', { month: 'short' });
      meses[key] = { preventivas: 0, paradas: 0 };
    }

    historicoFiltrado.forEach(exec => {
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
        
        const key = dataExec.toLocaleDateString('pt-BR', { month: 'short' });
        if (meses[key] !== undefined) {
          meses[key].preventivas++;
        }
      }
    });

    paradasMaquina.forEach(parada => {
      if (parada.criadoEm) {
        let dataParada: Date;
        const timestamp = parada.criadoEm as any;
        if (typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
          dataParada = timestamp.toDate();
        } else if (timestamp instanceof Date) {
          dataParada = timestamp;
        } else {
          return;
        }
        
        const key = dataParada.toLocaleDateString('pt-BR', { month: 'short' });
        if (meses[key] !== undefined) {
          meses[key].paradas++;
        }
      }
    });

    return Object.entries(meses).map(([name, data]) => ({ name, ...data }));
  };

  // Performance por Manutentor
  const performanceManutentorData = () => {
    const manutentorStats: Record<string, { concluidas: number; tempoMedio: number; count: number }> = {};
    
    historicoFiltrado.forEach(exec => {
      const nome = exec.manutentorNome || "Outros";
      if (!manutentorStats[nome]) {
        manutentorStats[nome] = { concluidas: 0, tempoMedio: 0, count: 0 };
      }
      manutentorStats[nome].concluidas++;
      if (exec.tempoRealizado) {
        manutentorStats[nome].tempoMedio += exec.tempoRealizado;
        manutentorStats[nome].count++;
      }
    });

    return Object.entries(manutentorStats)
      .map(([name, stats]) => ({
        name,
        concluidas: stats.concluidas,
        tempoMedio: stats.count > 0 ? Math.round(stats.tempoMedio / stats.count) : 0
      }))
      .sort((a, b) => b.concluidas - a.concluidas)
      .slice(0, 8);
  };

  // Cobertura de Preventivas por Equipamento
  const coberturaPorEquipamentoData = () => {
    const cobertura: Record<string, { templates: number; execucoes: number }> = {};
    
    templatesAtivos.forEach(t => {
      const maquina = t.maquinaNome || "Outros";
      if (!cobertura[maquina]) {
        cobertura[maquina] = { templates: 0, execucoes: 0 };
      }
      cobertura[maquina].templates++;
    });

    historicoFiltrado.forEach(exec => {
      const maquina = exec.maquinaNome || "Outros";
      if (!cobertura[maquina]) {
        cobertura[maquina] = { templates: 0, execucoes: 0 };
      }
      cobertura[maquina].execucoes++;
    });

    return Object.entries(cobertura)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.templates - a.templates)
      .slice(0, 8);
  };

  // Eficiência de Tempo (% de tarefas dentro do tempo estimado)
  const eficienciaTempo = () => {
    const execucoesComTempo = historicoFiltrado.filter(h => h.tempoRealizado && h.tempoEstimado);
    if (execucoesComTempo.length === 0) return 0;
    const dentroDoPrazo = execucoesComTempo.filter(h => (h.tempoRealizado || 0) <= (h.tempoEstimado || 0) * 1.1);
    return Math.round((dentroDoPrazo.length / execucoesComTempo.length) * 100);
  };

  // Distribuição de Prioridades das Tarefas Pendentes
  const prioridadesPendentesData = () => {
    const prioridadeCount: Record<string, number> = { "critica": 0, "alta": 0, "media": 0, "baixa": 0 };
    tarefasFiltradas.filter(t => t.status === "pendente").forEach(t => {
      const prioridade = t.prioridade || "baixa";
      prioridadeCount[prioridade]++;
    });
    return [
      { name: "Crítica", value: prioridadeCount["critica"], fill: "hsl(var(--destructive))" },
      { name: "Alta", value: prioridadeCount["alta"], fill: "#FF8042" },
      { name: "Média", value: prioridadeCount["media"], fill: "hsl(var(--warning))" },
      { name: "Baixa", value: prioridadeCount["baixa"], fill: "hsl(var(--success))" },
    ].filter(item => item.value > 0);
  };

  // Tempo de Parada por Setor
  const tempoParadaPorSetorData = () => {
    const setorTempo: Record<string, number> = {};
    paradasMaquina.forEach(p => {
      const setor = p.setor || "Outros";
      setorTempo[setor] = (setorTempo[setor] || 0) + (p.tempoParada || 0);
    });
    return Object.entries(setorTempo)
      .map(([name, value]) => ({ name, horas: Math.round(value / 60 * 10) / 10 }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 6);
  };

  // Tarefas por Manutentor (carga de trabalho)
  const tarefasPorManutentorData = () => {
    const manutentorCount: Record<string, number> = {};
    tarefasFiltradas.filter(t => t.status === "pendente").forEach(t => {
      const nome = t.manutentorNome || "Sem designação";
      manutentorCount[nome] = (manutentorCount[nome] || 0) + 1;
    });
    return Object.entries(manutentorCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  // Funções por Tipo
  const funcoesPorTipoData = () => {
    const funcaoCount: Record<string, number> = {};
    manutentores.filter(m => m.ativo).forEach(m => {
      const funcao = m.funcao || "Outros";
      funcaoCount[funcao] = (funcaoCount[funcao] || 0) + 1;
    });
    return Object.entries(funcaoCount)
      .map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }));
  };

  // Taxa de Atendimento (previsão vs realizado)
  const taxaAtendimentoData = () => {
    const hoje = new Date();
    const semanas: Record<string, { previsto: number; realizado: number }> = {};
    
    for (let i = 3; i >= 0; i--) {
      const weekLabel = `Sem ${4 - i}`;
      semanas[weekLabel] = { previsto: 0, realizado: 0 };
    }

    tarefasFiltradas.forEach(t => {
      if (t.proximaExecucao) {
        const dataExec = new Date(t.proximaExecucao);
        const diffTime = hoje.getTime() - dataExec.getTime();
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        
        if (diffWeeks >= 0 && diffWeeks < 4) {
          const weekLabel = `Sem ${4 - diffWeeks}`;
          if (semanas[weekLabel] !== undefined) {
            semanas[weekLabel].previsto++;
          }
        }
      }
    });

    historicoFiltrado.forEach(exec => {
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
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        
        if (diffWeeks >= 0 && diffWeeks < 4) {
          const weekLabel = `Sem ${4 - diffWeeks}`;
          if (semanas[weekLabel] !== undefined) {
            semanas[weekLabel].realizado++;
          }
        }
      }
    });

    return Object.entries(semanas).map(([name, data]) => ({ name, ...data }));
  };

  // Status das Paradas (Funil)
  const statusParadasFunnelData = () => {
    const statusCount: Record<string, number> = {};
    paradasMaquina.forEach(p => {
      const status = p.status || "pendente";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    return [
      { name: "Total", value: paradasMaquina.length, fill: "hsl(var(--muted-foreground))" },
      { name: "Pendentes", value: statusCount["pendente"] || 0, fill: "hsl(var(--warning))" },
      { name: "Em Andamento", value: statusCount["em_andamento"] || 0, fill: "hsl(var(--primary))" },
      { name: "Concluídas", value: statusCount["concluido"] || 0, fill: "hsl(var(--success))" },
    ].filter(item => item.value > 0);
  };

  // Média de tarefas por dia da semana
  const tarefasPorDiaSemanaData = () => {
    const diasSemana: Record<string, number> = {
      "Dom": 0, "Seg": 0, "Ter": 0, "Qua": 0, "Qui": 0, "Sex": 0, "Sáb": 0
    };
    
    historicoFiltrado.forEach(exec => {
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
        
        const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const diaSemana = dias[dataExec.getDay()];
        diasSemana[diaSemana]++;
      }
    });

    return Object.entries(diasSemana).map(([name, value]) => ({ name, execucoes: value }));
  };

  // OEE Simplificado (disponibilidade com base nas paradas)
  const oeeSimplificado = () => {
    if (equipamentos.length === 0) return 100;
    const disponibilidade = (equipamentosAtivos / equipamentos.length) * 100;
    return Math.round(disponibilidade);
  };
  return (
    <div className="space-y-4 pb-20">
      {/* Filtro por Usuário */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <Label htmlFor="filtro-usuario" className="text-sm font-medium">
                Filtrar apenas minhas tarefas
              </Label>
            </div>
            <Switch
              id="filtro-usuario"
              checked={filtrarPorUsuario}
              onCheckedChange={setFiltrarPorUsuario}
            />
          </div>
          {filtrarPorUsuario && (
            <p className="text-xs text-muted-foreground mt-2">
              Mostrando apenas dados de: {userData?.nome || userData?.email}
            </p>
          )}
        </CardContent>
      </Card>

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
            <div className="text-2xl font-bold">{statsFiltradas.hoje}</div>
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
            <div className="text-2xl font-bold text-destructive">{statsFiltradas.atrasadas}</div>
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
            <div className="text-2xl font-bold text-warning">{statsFiltradas.emAndamento}</div>
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
            <div className="text-2xl font-bold text-success">{statsFiltradas.concluidas}</div>
            <p className="text-xs text-muted-foreground">Total realizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs de Produtividade */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Taxa Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{taxaConclusao}%</div>
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

      {/* KPIs de Templates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Gestão de Templates
          </CardTitle>
          <CardDescription>Visão geral dos templates de manutenção</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-primary">{templates.length}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <div className="text-xl font-bold text-success">{templatesAtivos.length}</div>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
            <div>
              <div className="text-xl font-bold text-muted-foreground">{templatesInativos.length}</div>
              <p className="text-xs text-muted-foreground">Inativos</p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Gráfico de Progresso Radial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-success" />
            Progresso Geral
          </CardTitle>
          <CardDescription>Taxa de conclusão de tarefas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="100%" 
                barSize={20} 
                data={progressoRadialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: 'hsl(var(--muted))' }}
                  dataKey="value"
                  cornerRadius={10}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
                  <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold">{taxaConclusao}%</tspan>
                  <tspan x="50%" dy="1.5em" fontSize="12" className="fill-muted-foreground">concluído</tspan>
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
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
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusTarefasData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--success))' }}
                    formatter={(value, name, props) => [`${value} tarefas`, props.payload.name]}
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
          <div className="h-[300px]">
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

      {/* Gráfico de Produtividade Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Produtividade Semanal
          </CardTitle>
          <CardDescription>Tarefas concluídas por semana</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={produtividadeSemanalData()}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--background))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                  formatter={(value) => [`${value}`, 'Tarefas']}
                />
                <Line 
                  type="monotone" 
                  dataKey="tarefas" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Templates por Prioridade */}
      {templatesPorPrioridadeData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Templates por Prioridade
            </CardTitle>
            <CardDescription>Distribuição de templates ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={templatesPorPrioridadeData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                  >
                    {templatesPorPrioridadeData().map((entry, index) => (
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

      {/* Gráfico de Templates por Período */}
      {templatesPorPeriodoData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Templates por Período
            </CardTitle>
            <CardDescription>Frequência de manutenção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={templatesPorPeriodoData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={11} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value) => [`${value}`, 'Templates']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Templates por Máquina */}
      {templatesPorMaquinaData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Factory className="h-5 w-5 text-warning" />
              Top 5 Máquinas
            </CardTitle>
            <CardDescription>Com mais templates de manutenção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={templatesPorMaquinaData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={60} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value) => [`${value}`, 'Templates']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Templates por Tipo */}
      {templatesPorTipoData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Templates por Tipo
            </CardTitle>
            <CardDescription>Distribuição por tipo de manutenção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={templatesPorTipoData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                  >
                    {templatesPorTipoData().map((entry, index) => (
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

      {/* Gráfico de Tempo Estimado por Tipo */}
      {tempoEstimadoPorTipoData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="h-5 w-5 text-purple-500" />
              Tempo Estimado por Tipo
            </CardTitle>
            <CardDescription>Horas totais planejadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tempoEstimadoPorTipoData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={11} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value) => [`${value}h`, 'Tempo']}
                  />
                  <Bar dataKey="horas" fill="#8884D8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Tempo Médio por Prioridade */}
      {tempoMedioPorPrioridadeData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Tempo Médio por Prioridade
            </CardTitle>
            <CardDescription>Minutos estimados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tempoMedioPorPrioridadeData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value) => [`${value} min`, 'Média']}
                  />
                  <Bar dataKey="minutos" fill="#00C49F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Carga de Trabalho */}
      {cargaTrabalhoPorPeriodoData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Carga de Trabalho Pendente
            </CardTitle>
            <CardDescription>Tarefas por período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cargaTrabalhoPorPeriodoData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                  >
                    {cargaTrabalhoPorPeriodoData().map((entry, index) => (
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

      {/* Gráfico de Desvio de Tempo */}
      {desvioTempoData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="h-5 w-5 text-warning" />
              Desvio de Tempo
            </CardTitle>
            <CardDescription>Estimado vs Realizado (últimas 10)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={desvioTempoData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value) => [`${value} min`]}
                  />
                  <Legend />
                  <Bar dataKey="estimado" fill="hsl(var(--muted-foreground))" name="Estimado" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizado" fill="hsl(var(--primary))" name="Realizado" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Tipos de Manutenção (Tarefas) */}
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
          <div className="h-[300px]">
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
          <div className="h-[300px]">
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
            <div className="h-[300px]">
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

      {/* Templates por Setor */}
      {templatesPorSetorData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-5 w-5 text-success" />
              Templates por Setor
            </CardTitle>
            <CardDescription>Distribuição por área</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={templatesPorSetorData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={60} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value) => [`${value}`, 'Templates']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== SEÇÃO: METAS E INDICADORES ========== */}
      <Separator className="my-6" />
      <div className="space-y-2 mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Metas e Indicadores Estratégicos
        </h2>
        <p className="text-xs text-muted-foreground">Foco: Diminuir paradas e manter preventivas em dia</p>
      </div>

      {/* KPIs Estratégicos */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gauge className="h-4 w-4 text-emerald-500" />
              OEE Disponib.
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{oeeSimplificado()}%</div>
            <Progress value={oeeSimplificado()} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Equipamentos ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-500" />
              Eficiência Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-500">{eficienciaTempo()}%</div>
            <Progress value={eficienciaTempo()} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Dentro do prazo</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Resolução Paradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{taxaResolucaoParadas}%</div>
            <Progress value={taxaResolucaoParadas} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Paradas resolvidas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-500" />
              Tempo Médio Parada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{tempoMedioParada()}<span className="text-sm">min</span></div>
            <p className="text-xs text-muted-foreground mt-1">Meta: reduzir</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Recursos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Visão Geral de Recursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <Cog className="h-4 w-4 text-muted-foreground" />
                  Equipamentos
                </span>
                <Badge variant="outline">{equipamentos.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Ativos</span>
                <span className="text-sm font-medium text-success">{equipamentosAtivos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Inativos</span>
                <span className="text-sm font-medium text-destructive">{equipamentosInativos}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Manutentores
                </span>
                <Badge variant="outline">{manutentores.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Ativos</span>
                <span className="text-sm font-medium text-success">{manutentoresAtivos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Cap. Diária</span>
                <span className="text-sm font-medium">{capacidadeTotalDiaria}</span>
              </div>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Factory className="h-4 w-4 text-muted-foreground" />
                Setores Ativos
              </span>
              <Badge variant="default">{setoresAtivos}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Paradas Abertas
              </span>
              <Badge variant="destructive">{paradasAbertas}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparativo Preventivas vs Paradas */}
      {comparativoPreventivasParadasData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Preventivas vs Paradas
            </CardTitle>
            <CardDescription>Comparativo mensal - Meta: mais preventivas, menos paradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={comparativoPreventivasParadasData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="preventivas" fill="hsl(var(--success))" name="Preventivas" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="paradas" stroke="hsl(var(--destructive))" name="Paradas" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evolução de Paradas */}
      {evolucaoMensalParadasData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Evolução de Paradas
            </CardTitle>
            <CardDescription>Últimos 6 meses - Meta: tendência de queda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucaoMensalParadasData()}>
                  <defs>
                    <linearGradient id="colorParadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
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
                  <Area type="monotone" dataKey="paradas" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorParadas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paradas por Equipamento (Top 10) */}
      {paradasPorEquipamentoData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cog className="h-5 w-5 text-destructive" />
              Top 10 Equipamentos com Paradas
            </CardTitle>
            <CardDescription>Equipamentos problemáticos - Priorizar manutenção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paradasPorEquipamentoData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={9} width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value) => [`${value}`, 'Paradas']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paradas por Tipo de Manutenção */}
      {paradasPorTipoManutencaoData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-5 w-5 text-warning" />
              Paradas por Tipo de Manutenção
            </CardTitle>
            <CardDescription>Identificar causas raiz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paradasPorTipoManutencaoData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                  >
                    {paradasPorTipoManutencaoData().map((entry, index) => (
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

      {/* Tempo de Parada por Setor */}
      {tempoParadaPorSetorData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Tempo de Parada por Setor
            </CardTitle>
            <CardDescription>Horas acumuladas de parada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tempoParadaPorSetorData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={60} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value) => [`${value}h`, 'Tempo']}
                  />
                  <Bar dataKey="horas" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance por Manutentor */}
      {performanceManutentorData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Performance por Manutentor
            </CardTitle>
            <CardDescription>Tarefas concluídas e tempo médio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performanceManutentorData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={10} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="concluidas" fill="hsl(var(--primary))" name="Concluídas" radius={[0, 4, 4, 0]} />
                  <Line type="monotone" dataKey="tempoMedio" stroke="hsl(var(--warning))" name="Tempo Médio (min)" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cobertura de Preventivas por Equipamento */}
      {coberturaPorEquipamentoData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-success" />
              Cobertura de Preventivas
            </CardTitle>
            <CardDescription>Templates vs Execuções por equipamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coberturaPorEquipamentoData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={9} angle={-15} textAnchor="end" height={70} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="templates" fill="hsl(var(--muted-foreground))" name="Templates" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="execucoes" fill="hsl(var(--success))" name="Execuções" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prioridades Pendentes */}
      {prioridadesPendentesData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Prioridades Pendentes
            </CardTitle>
            <CardDescription>Tarefas aguardando execução</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prioridadesPendentesData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                  >
                    {prioridadesPendentesData().map((entry, index) => (
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

      {/* Carga por Manutentor */}
      {tarefasPorManutentorData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Carga de Trabalho
            </CardTitle>
            <CardDescription>Tarefas pendentes por manutentor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tarefasPorManutentorData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={10} width={100} />
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

      {/* Funções por Tipo */}
      {funcoesPorTipoData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Manutentores por Função
            </CardTitle>
            <CardDescription>Distribuição da equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={funcoesPorTipoData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                  >
                    {funcoesPorTipoData().map((entry, index) => (
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

      {/* Taxa de Atendimento */}
      {taxaAtendimentoData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Taxa de Atendimento
            </CardTitle>
            <CardDescription>Previsto vs Realizado por semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taxaAtendimentoData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="previsto" fill="hsl(var(--muted-foreground))" name="Previsto" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizado" fill="hsl(var(--success))" name="Realizado" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execuções por Dia da Semana */}
      {tarefasPorDiaSemanaData().some(d => d.execucoes > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Execuções por Dia da Semana
            </CardTitle>
            <CardDescription>Padrão de produtividade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tarefasPorDiaSemanaData()}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    formatter={(value) => [`${value}`, 'Execuções']}
                  />
                  <Bar dataKey="execucoes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status das Paradas */}
      {statusParadasFunnelData().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-warning" />
              Status das Paradas
            </CardTitle>
            <CardDescription>Fluxo de resolução</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusParadasFunnelData().map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-muted-foreground">{item.name}</div>
                  <div className="flex-1">
                    <div 
                      className="h-8 rounded flex items-center justify-center text-sm font-medium text-white"
                      style={{ 
                        backgroundColor: item.fill,
                        width: `${Math.max((item.value / (statusParadasFunnelData()[0]?.value || 1)) * 100, 20)}%`
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Final */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Resumo Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-success">{historicoFiltrado.length}</div>
              <p className="text-xs text-muted-foreground">Preventivas Realizadas</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-destructive">{totalParadas}</div>
              <p className="text-xs text-muted-foreground">Total de Paradas</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-primary">{templatesAtivos.length}</div>
              <p className="text-xs text-muted-foreground">Templates Ativos</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-warning">{statsFiltradas.atrasadas}</div>
              <p className="text-xs text-muted-foreground">Tarefas Atrasadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
