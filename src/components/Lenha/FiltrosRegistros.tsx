import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { MedidaLenha } from "@/types/typesLenha";

type PeriodoPreset = "hoje" | "semanal" | "quinzenal" | "mensal" | "anual" | "personalizado" | "todos";

interface FiltrosRegistrosProps {
  registros: MedidaLenha[];
  onFiltrar: (registrosFiltrados: MedidaLenha[]) => void;
}

const FiltrosRegistros = ({ registros, onFiltrar }: FiltrosRegistrosProps) => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoPreset>("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string>("todos");
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<string>("todos");

  // Extrair fornecedores e responsáveis únicos
  const fornecedores = useMemo(() => {
    const unique = [...new Set(registros.map(r => r.fornecedor).filter(Boolean))];
    return unique.sort();
  }, [registros]);

  const responsaveis = useMemo(() => {
    const unique = [...new Set(registros.map(r => r.responsavel).filter(Boolean))];
    return unique.sort();
  }, [registros]);

  const getDateRangeFromPreset = (preset: PeriodoPreset): { start: Date; end: Date } | null => {
    const hoje = new Date();
    
    switch (preset) {
      case "hoje":
        return { start: startOfDay(hoje), end: endOfDay(hoje) };
      case "semanal":
        return { start: startOfWeek(hoje, { weekStartsOn: 1 }), end: endOfDay(hoje) };
      case "quinzenal":
        return { start: subDays(hoje, 15), end: endOfDay(hoje) };
      case "mensal":
        return { start: startOfMonth(hoje), end: endOfDay(hoje) };
      case "anual":
        return { start: startOfYear(hoje), end: endOfDay(hoje) };
      case "personalizado":
        if (dateRange?.from) {
          return { 
            start: startOfDay(dateRange.from), 
            end: dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from) 
          };
        }
        return null;
      default:
        return null;
    }
  };

  const aplicarFiltros = () => {
    let filtrados = [...registros];
    
    // Filtrar por período
    const range = getDateRangeFromPreset(periodoSelecionado);
    if (range) {
      filtrados = filtrados.filter(r => {
        const dataRegistro = r.data instanceof Date ? r.data : new Date(r.data);
        return dataRegistro >= range.start && dataRegistro <= range.end;
      });
    }
    
    // Filtrar por fornecedor
    if (fornecedorSelecionado !== "todos") {
      filtrados = filtrados.filter(r => r.fornecedor === fornecedorSelecionado);
    }
    
    // Filtrar por responsável
    if (responsavelSelecionado !== "todos") {
      filtrados = filtrados.filter(r => r.responsavel === responsavelSelecionado);
    }
    
    onFiltrar(filtrados);
  };

  // Aplicar filtros automaticamente quando mudar
  useEffect(() => {
    aplicarFiltros();
  }, [periodoSelecionado, dateRange, fornecedorSelecionado, responsavelSelecionado, registros]);

  const temFiltrosAtivos = 
    periodoSelecionado !== "todos" || 
    fornecedorSelecionado !== "todos" || 
    responsavelSelecionado !== "todos";

  const limparFiltros = () => {
    setPeriodoSelecionado("todos");
    setDateRange(undefined);
    setFornecedorSelecionado("todos");
    setResponsavelSelecionado("todos");
  };

  const handlePeriodoChange = (value: PeriodoPreset) => {
    setPeriodoSelecionado(value);
    if (value !== "personalizado") {
      setDateRange(undefined);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Header dos filtros */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Filtros</span>
        {temFiltrosAtivos && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limparFiltros}
            className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-0.5" />
            Limpar
          </Button>
        )}
      </div>
      
      {/* Grid de filtros - sempre horizontal */}
      <div className="flex flex-row flex-wrap items-center gap-2">
        {/* Filtro por Período */}
        <Select value={periodoSelecionado} onValueChange={handlePeriodoChange}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="todos">Todos períodos</SelectItem>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semanal">Esta semana</SelectItem>
            <SelectItem value="quinzenal">15 dias</SelectItem>
            <SelectItem value="mensal">Este mês</SelectItem>
            <SelectItem value="anual">Este ano</SelectItem>
            <SelectItem value="personalizado">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Pickers separados para período personalizado */}
        {periodoSelecionado === "personalizado" && (
          <div className="flex items-center gap-2">
            {/* Data Inicial */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8 w-auto justify-start text-left font-normal text-xs px-2",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {dateRange?.from ? format(dateRange.from, "dd/MM/yy", { locale: ptBR }) : "Início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange?.from}
                  onSelect={(date) => setDateRange({ from: date, to: dateRange?.to })}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <span className="text-xs text-muted-foreground">até</span>

            {/* Data Final */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8 w-auto justify-start text-left font-normal text-xs px-2",
                    !dateRange?.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {dateRange?.to ? format(dateRange.to, "dd/MM/yy", { locale: ptBR }) : "Fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange?.to}
                  onSelect={(date) => setDateRange({ from: dateRange?.from, to: date })}
                  disabled={(date) => dateRange?.from ? date < dateRange.from : false}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Filtro por Fornecedor */}
        <Select value={fornecedorSelecionado} onValueChange={setFornecedorSelecionado}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="Fornecedor" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50 max-h-60">
            <SelectItem value="todos">Todos fornecedores</SelectItem>
            {fornecedores.map((fornecedor) => (
              <SelectItem key={fornecedor} value={fornecedor}>
                {fornecedor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por Responsável */}
        <Select value={responsavelSelecionado} onValueChange={setResponsavelSelecionado}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50 max-h-60">
            <SelectItem value="todos">Todos responsáveis</SelectItem>
            {responsaveis.map((responsavel) => (
              <SelectItem key={responsavel} value={responsavel}>
                {responsavel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FiltrosRegistros;
