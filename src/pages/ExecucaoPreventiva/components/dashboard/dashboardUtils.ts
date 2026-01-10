// Tipos para o Dashboard
export type PeriodoFiltro = "hoje" | "semanal" | "mensal" | "anual" | "personalizado";

export interface FiltroData {
  periodo: PeriodoFiltro;
  dataInicio?: Date;
  dataFim?: Date;
}

// Converte Firestore Timestamp para Date
export const timestampToDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return null;
};

// Retorna as datas de início e fim da semana atual (segunda a domingo)
export const getDatasSemanaAtual = (): { inicio: Date; fim: Date } => {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() + diffParaSegunda);
  inicio.setHours(0, 0, 0, 0);
  
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);
  
  return { inicio, fim };
};

// Retorna as datas baseadas no período selecionado
export const getDatasPeriodo = (filtro: FiltroData): { inicio: Date; fim: Date } => {
  const hoje = new Date();
  const fim = new Date(hoje);
  fim.setHours(23, 59, 59, 999);
  
  let inicio = new Date(hoje);
  inicio.setHours(0, 0, 0, 0);
  
  switch (filtro.periodo) {
    case "hoje":
      // Já está configurado para hoje
      break;
    case "semanal":
      const semana = getDatasSemanaAtual();
      return semana;
    case "mensal":
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      break;
    case "anual":
      inicio = new Date(hoje.getFullYear(), 0, 1);
      break;
    case "personalizado":
      if (filtro.dataInicio && filtro.dataFim) {
        return { 
          inicio: new Date(filtro.dataInicio), 
          fim: new Date(filtro.dataFim) 
        };
      }
      break;
  }
  
  return { inicio, fim };
};

// Filtra dados por período
export const filtrarPorPeriodo = <T>(
  dados: T[],
  filtro: FiltroData,
  getCampoData: (item: T) => any
): T[] => {
  const { inicio, fim } = getDatasPeriodo(filtro);
  
  return dados.filter(item => {
    const data = timestampToDate(getCampoData(item));
    if (!data) return false;
    return data >= inicio && data <= fim;
  });
};

// Calcula tempo disponível em minutos baseado no período
export const getTempoDisponivelMinutos = (filtro: FiltroData): number => {
  const { inicio, fim } = getDatasPeriodo(filtro);
  const diffMs = fim.getTime() - inicio.getTime();
  return Math.ceil(diffMs / (1000 * 60));
};

// Calcula disponibilidade real
export const calcularDisponibilidade = (
  tempoParadaMinutos: number,
  tempoDisponivelMinutos: number
): number => {
  if (tempoDisponivelMinutos <= 0) return 100;
  const disponibilidade = ((tempoDisponivelMinutos - tempoParadaMinutos) / tempoDisponivelMinutos) * 100;
  return Math.max(0, Math.min(100, disponibilidade));
};

// Calcula tempo de parada em minutos a partir de timestamps
export const calcularTempoParadaMinutos = (
  criadoEm: any,
  finalizadoEm: any
): number => {
  const dataInicio = timestampToDate(criadoEm);
  const dataFim = timestampToDate(finalizadoEm);
  
  if (!dataInicio) return 0;
  
  const fim = dataFim || new Date();
  const diffMs = fim.getTime() - dataInicio.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60)));
};

// Formata minutos para HH:MM:SS
export const formatarTempoHMS = (minutos: number): string => {
  if (!minutos || minutos <= 0) return "0:00:00";
  const h = Math.floor(minutos / 60);
  const m = Math.floor(minutos % 60);
  const s = Math.round((minutos * 60) % 60);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Formata minutos para horas decimais
export const formatarHorasDecimais = (minutos: number): string => {
  if (!minutos || minutos <= 0) return "0.0";
  return (minutos / 60).toFixed(1);
};

// Cores do gráfico
export const COLORS = [
  'hsl(var(--primary))', 
  'hsl(var(--destructive))', 
  'hsl(var(--warning))', 
  '#00C49F', 
  '#FFBB28', 
  '#FF8042', 
  '#8884D8', 
  '#82ca9d', 
  '#ffc658', 
  '#a4de6c'
];

// Labels de período
export const PERIODO_LABELS: Record<PeriodoFiltro, string> = {
  hoje: "Hoje",
  semanal: "Esta Semana",
  mensal: "Este Mês",
  anual: "Este Ano",
  personalizado: "Personalizado"
};

// Seções do Dashboard
export const SECOES_DASHBOARD = [
  { id: "preventivas", label: "Preventivas", icon: "Wrench" },
  { id: "paradas", label: "Paradas", icon: "AlertTriangle" },
  { id: "os", label: "Ordens de Serviço", icon: "ClipboardCheck" },
  { id: "indicadores", label: "Indicadores", icon: "Target" },
  { id: "tabelas", label: "Tabelas", icon: "BarChart3" },
] as const;

export type SecaoDashboard = typeof SECOES_DASHBOARD[number]["id"];
