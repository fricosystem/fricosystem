import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Clock, CalendarDays, BarChart2, TrendingUp } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type PeriodoFiltro = "hoje" | "semanal" | "mensal" | "anual" | "personalizado";

export interface FiltroData {
  periodo: PeriodoFiltro;
  dataInicio?: Date;
  dataFim?: Date;
}

interface SectionFilterProps {
  filtro: FiltroData;
  onFiltroChange: (filtro: FiltroData) => void;
  className?: string;
}

const PERIODO_CONFIG: { id: PeriodoFiltro; label: string; icon: React.ElementType }[] = [
  { id: "hoje", label: "Hoje", icon: Clock },
  { id: "semanal", label: "Semana", icon: CalendarDays },
  { id: "mensal", label: "Mês", icon: BarChart2 },
  { id: "anual", label: "Ano", icon: TrendingUp },
  { id: "personalizado", label: "Personalizado", icon: CalendarIcon },
];

export function SectionFilter({ filtro, onFiltroChange, className }: SectionFilterProps) {
  const [inicioInput, setInicioInput] = useState("");
  const [fimInput, setFimInput] = useState("");
  const [errors, setErrors] = useState<{ inicio?: string; fim?: string; range?: string }>({});

  useEffect(() => {
    if (filtro.periodo !== "personalizado") return;

    setInicioInput(filtro.dataInicio ? format(filtro.dataInicio, "dd/MM/yyyy") : "");
    setFimInput(filtro.dataFim ? format(filtro.dataFim, "dd/MM/yyyy") : "");
  }, [filtro.periodo, filtro.dataInicio, filtro.dataFim]);

  const sanitizeDateInput = (value: string) => value.replace(/[^0-9/]/g, "").slice(0, 10);

  const parseInputDate = (value: string): Date | undefined => {
    if (!value || value.length !== 10) return undefined;
    const parsed = parse(value, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : undefined;
  };

  const handlePeriodoChange = (periodo: PeriodoFiltro) => {
    setErrors({});

    if (periodo === "personalizado") {
      onFiltroChange({ ...filtro, periodo });
    } else {
      onFiltroChange({ periodo });
    }
  };

  const startDate = parseInputDate(inicioInput);
  const endDate = parseInputDate(fimInput);

  const handleApply = () => {
    const nextErrors: { inicio?: string; fim?: string; range?: string } = {};

    if (inicioInput && !startDate) nextErrors.inicio = "Data início inválida";
    if (fimInput && !endDate) nextErrors.fim = "Data fim inválida";
    if (startDate && endDate && endDate < startDate) {
      nextErrors.range = "Data fim deve ser maior/igual à data início";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onFiltroChange({
      ...filtro,
      periodo: "personalizado",
      dataInicio: startDate,
      dataFim: endDate,
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Botões de período */}
      <div className="flex flex-wrap gap-1 p-1 bg-muted/50 rounded-lg">
        {PERIODO_CONFIG.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={filtro.periodo === id ? "default" : "ghost"}
            size="sm"
            className={cn(
              "flex-1 min-w-[60px] h-8 text-xs gap-1.5 transition-all",
              filtro.periodo === id 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "hover:bg-muted"
            )}
            onClick={() => handlePeriodoChange(id)}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.slice(0, 3)}</span>
          </Button>
        ))}
      </div>

      {/* Seletor de datas personalizadas */}
      {filtro.periodo === "personalizado" && (
        <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-3">
          <div className="text-sm font-medium">Período Personalizado</div>
          <p className="text-xs text-muted-foreground">Selecione o intervalo de datas desejado</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data Início</label>
              <div className="relative">
                <Input
                  placeholder="01/01/2026"
                  inputMode="numeric"
                  value={inicioInput}
                  onChange={(e) => {
                    setInicioInput(sanitizeDateInput(e.target.value));
                    setErrors((prev) => ({ ...prev, inicio: undefined, range: undefined }));
                  }}
                  className="h-9 pr-9"
                />

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Selecionar data início"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                    >
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (!date) return;
                        setInicioInput(format(date, "dd/MM/yyyy"));
                        setErrors((prev) => ({ ...prev, inicio: undefined, range: undefined }));
                      }}
                      locale={ptBR}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {errors.inicio && <p className="text-xs text-destructive">{errors.inicio}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data Fim</label>
              <div className="relative">
                <Input
                  placeholder="01/01/2026"
                  inputMode="numeric"
                  value={fimInput}
                  onChange={(e) => {
                    setFimInput(sanitizeDateInput(e.target.value));
                    setErrors((prev) => ({ ...prev, fim: undefined, range: undefined }));
                  }}
                  className="h-9 pr-9"
                />

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Selecionar data fim"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                    >
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        if (!date) return;
                        setFimInput(format(date, "dd/MM/yyyy"));
                        setErrors((prev) => ({ ...prev, fim: undefined, range: undefined }));
                      }}
                      locale={ptBR}
                      disabled={(date) => (startDate ? date < startDate : false)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {errors.fim && <p className="text-xs text-destructive">{errors.fim}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button type="button" onClick={handleApply} className="h-9">
              Aplicar
            </Button>
            {errors.range && <p className="text-xs text-destructive">{errors.range}</p>}
            <p className="text-xs text-muted-foreground">
              As datas só serão aplicadas após clicar em “Aplicar”.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
