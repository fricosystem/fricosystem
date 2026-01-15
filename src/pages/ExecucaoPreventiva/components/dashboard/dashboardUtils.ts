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

// Calcula disponibilidade real - considera apenas horas úteis (8h/dia)
export const calcularDisponibilidade = (
  tempoParadaMinutos: number,
  tempoDisponivelMinutos: number,
  usarHorasUteis: boolean = true
): number => {
  // Converte tempo disponível para horas úteis (8h por dia)
  let tempoUtil = tempoDisponivelMinutos;
  if (usarHorasUteis) {
    const diasDisponiveis = Math.ceil(tempoDisponivelMinutos / (24 * 60));
    tempoUtil = diasDisponiveis * 8 * 60; // 8 horas por dia em minutos
  }
  
  if (tempoUtil <= 0) return 100;
  if (tempoParadaMinutos <= 0) return 100;
  
  const disponibilidade = ((tempoUtil - tempoParadaMinutos) / tempoUtil) * 100;
  return Math.max(0, Math.min(100, disponibilidade));
};

// Calcula tempo de parada em minutos a partir de timestamps
export const calcularTempoParadaMinutos = (
  criadoEm: any,
  finalizadoEm: any
): number => {
  const dataInicio = timestampToDate(criadoEm);
  
  if (!dataInicio) return 0;
  
  // Se tem data de finalização, usa ela; senão usa a data atual
  const dataFim = timestampToDate(finalizadoEm);
  const fim = dataFim || new Date();
  
  const diffMs = fim.getTime() - dataInicio.getTime();
  const minutos = Math.max(0, Math.round(diffMs / (1000 * 60)));
  
  return minutos;
};

// Calcula tempo de parada considerando campo tempoParada ou timestamps
export const getTempoParadaReal = (parada: {
  tempoParada?: number;
  criadoEm?: any;
  finalizadoEm?: any;
}): number => {
  // Primeiro tenta usar o campo tempoParada se existir e for válido
  if (parada.tempoParada && parada.tempoParada > 0) {
    return parada.tempoParada;
  }
  // Senão calcula a partir dos timestamps
  return calcularTempoParadaMinutos(parada.criadoEm, parada.finalizadoEm);
};

// Formata minutos para HH:MM:SS
export const formatarTempoHMS = (valor: number): string => {
  if (!valor || valor <= 0) return "00:00:00";

  // IMPORTANT: Em alguns lugares o "tempoParada" vem persistido em SEGUNDOS.
  // Para manter compatibilidade, detectamos e normalizamos para segundos totais.
  const pareceSegundos = valor >= 24 * 60 && Number.isInteger(valor) && valor % 60 === 0;
  const totalSegundos = pareceSegundos ? valor : Math.round(valor * 60);

  const h = Math.floor(totalSegundos / 3600);
  const m = Math.floor((totalSegundos % 3600) / 60);
  const s = totalSegundos % 60;

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}`;
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
