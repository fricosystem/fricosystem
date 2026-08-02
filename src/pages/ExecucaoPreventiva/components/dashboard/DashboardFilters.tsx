import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PeriodoFiltro, PERIODO_LABELS, FiltroData } from "./dashboardUtils";

interface DashboardFiltersProps {
  filtro: FiltroData;
  onFiltroChange: (filtro: FiltroData) => void;
  className?: string;
}

export function DashboardFilters({ filtro, onFiltroChange, className }: DashboardFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const periodos: PeriodoFiltro[] = ["hoje", "semanal", "mensal", "anual", "personalizado"];

  const handlePeriodoChange = (periodo: PeriodoFiltro) => {
    if (periodo === "personalizado") {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
      onFiltroChange({ ...filtro, periodo });
    }
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      onFiltroChange({
        periodo: "personalizado",
        dataInicio: range.from,
        dataFim: range.to
      });
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex flex-wrap gap-1">
        {periodos.map((periodo) => (
          <Button
            key={periodo}
            variant={filtro.periodo === periodo ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => handlePeriodoChange(periodo)}
          >
            {PERIODO_LABELS[periodo]}
          </Button>
        ))}
      </div>

      {filtro.periodo === "personalizado" && (
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
            >
              <CalendarIcon className="h-3 w-3" />
              {filtro.dataInicio && filtro.dataFim ? (
                <>
                  {format(filtro.dataInicio, "dd/MM", { locale: ptBR })} - {format(filtro.dataFim, "dd/MM", { locale: ptBR })}
                </>
              ) : (
                "Selecionar datas"
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: filtro.dataInicio,
                to: filtro.dataFim
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  handleDateRangeChange({ from: range.from, to: range.to });
                  setShowDatePicker(false);
                }
              }}
              locale={ptBR}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
