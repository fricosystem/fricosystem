import { useTempoRestante } from "@/hooks/useParadaAlerts";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TempoRestanteIndicatorProps {
  hrFinal?: string;
  status: string;
}

export const TempoRestanteIndicator = ({ hrFinal, status }: TempoRestanteIndicatorProps) => {
  const { tempoRestante, isExpiring, isExpired } = useTempoRestante(hrFinal);

  // Só mostrar para paradas aguardando
  if (status !== "aguardando" || !tempoRestante) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
        isExpired && "bg-red-500/20 text-red-700 animate-pulse",
        isExpiring && !isExpired && "bg-amber-500/20 text-amber-700 animate-pulse",
        !isExpiring && !isExpired && "bg-blue-500/10 text-blue-600"
      )}
    >
      {isExpiring || isExpired ? (
        <AlertTriangle className="h-3.5 w-3.5" />
      ) : (
        <Clock className="h-3.5 w-3.5" />
      )}
      <span>{isExpired ? "Expirado" : `Resta: ${tempoRestante}`}</span>
    </div>
  );
};
