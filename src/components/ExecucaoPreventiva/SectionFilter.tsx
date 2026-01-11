import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, CalendarDays, BarChart2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePeriodoChange = (periodo: PeriodoFiltro) => {
    if (periodo === "personalizado") {
      setShowDatePicker(true);
      onFiltroChange({ ...filtro, periodo });
    } else {
      setShowDatePicker(false);
      onFiltroChange({ periodo });
    }
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
              <label className="text-xs font-medium text-muted-foreground">Data de Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-9"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {filtro.dataInicio ? (
                      format(filtro.dataInicio, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span className="text-muted-foreground">Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filtro.dataInicio}
                    onSelect={(date) => {
                      if (date) {
                        onFiltroChange({
                          ...filtro,
                          dataInicio: date,
                        });
                      }
                    }}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data de Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-9"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {filtro.dataFim ? (
                      format(filtro.dataFim, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span className="text-muted-foreground">Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filtro.dataFim}
                    onSelect={(date) => {
                      if (date) {
                        onFiltroChange({
                          ...filtro,
                          dataFim: date,
                        });
                      }
                    }}
                    locale={ptBR}
                    disabled={(date) => filtro.dataInicio ? date < filtro.dataInicio : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
