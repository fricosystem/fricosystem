import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Hourglass, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TempoInicioIndicatorProps {
  hrInicial?: string;
  hrFinal?: string;
  status: string;
}

export const TempoInicioIndicator = ({ hrInicial, hrFinal, status }: TempoInicioIndicatorProps) => {
  const [state, setState] = useState<{
    type: "countdown" | "expired" | "past_end" | null;
    display: string;
  }>({ type: null, display: "" });

  useEffect(() => {
    if (!hrInicial && !hrFinal) {
      setState({ type: null, display: "" });
      return;
    }

    // Só exibir para paradas aguardando ou em andamento
    if (!["aguardando", "em_andamento"].includes(status)) {
      setState({ type: null, display: "" });
      return;
    }

    const calcular = () => {
      const agora = new Date();
      const horaAtualMin = agora.getHours() * 60 + agora.getMinutes();
      const segundosAtuais = agora.getSeconds();

      // Verificar se passou do hora fim
      if (hrFinal) {
        const [hF, mF] = hrFinal.split(":").map(Number);
        const fimMinutos = hF * 60 + mF;
        
        if (horaAtualMin > fimMinutos || (horaAtualMin === fimMinutos && segundosAtuais > 0)) {
          setState({ type: "past_end", display: "Passou do fim" });
          return;
        }
      }

      // Contagem regressiva para início (apenas se <= 15 minutos) - status aguardando
      if (hrInicial && status === "aguardando") {
        const [hI, mI] = hrInicial.split(":").map(Number);
        const inicioMinutos = hI * 60 + mI;
        const diffMinutos = inicioMinutos - horaAtualMin;
        
        if (diffMinutos < 0) {
          // Já passou do horário de início mas ainda não começou
          const atraso = Math.abs(diffMinutos);
          setState({ 
            type: "expired", 
            display: atraso >= 60 
              ? `${Math.floor(atraso / 60)}h ${atraso % 60}min atrasado` 
              : `${atraso}min atrasado` 
          });
          return;
        } else if (diffMinutos === 0) {
          // Exatamente no horário de início
          setState({ type: "countdown", display: "Hora de iniciar!" });
          return;
        } else if (diffMinutos <= 15) {
          // Menos de 15 minutos para início
          setState({ type: "countdown", display: `Inicia em ${diffMinutos}min` });
          return;
        }
      }

      // Se não se encaixa em nenhuma condição, não mostrar
      setState({ type: null, display: "" });
    };

    calcular();
    const interval = setInterval(calcular, 10000); // Atualiza a cada 10 segundos
    
    return () => clearInterval(interval);
  }, [hrInicial, hrFinal, status]);

  if (!state.type || !state.display) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
        state.type === "past_end" && "bg-red-500/20 text-red-700 animate-pulse",
        state.type === "expired" && "bg-orange-500/20 text-orange-700 animate-pulse",
        state.type === "countdown" && "bg-amber-500/15 text-amber-700"
      )}
    >
      {state.type === "past_end" && <XCircle className="h-3.5 w-3.5" />}
      {state.type === "expired" && <AlertTriangle className="h-3.5 w-3.5" />}
      {state.type === "countdown" && <Hourglass className="h-3.5 w-3.5" />}
      <span>{state.display}</span>
    </div>
  );
};
