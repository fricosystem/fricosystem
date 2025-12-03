import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { Clock, Wrench, AlertTriangle, Timer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";

interface TarefaCardMobileProps {
  tarefa: TarefaManutencao;
  onClick?: () => void;
}

export function TarefaCardMobile({ tarefa, onClick }: TarefaCardMobileProps) {
  const [tempoDecorrido, setTempoDecorrido] = useState({ horas: 0, minutos: 0, segundos: 0 });
  
  const hoje = new Date().toISOString().split("T")[0];
  const isAtrasada = tarefa.proximaExecucao < hoje && tarefa.status === "pendente";
  const isHoje = tarefa.proximaExecucao === hoje;
  const isEmAndamento = tarefa.status === "em_andamento";

  // Cronômetro em tempo real quando em andamento
  useEffect(() => {
    if (!isEmAndamento || !tarefa.dataInicio) return;

    const calcularTempo = () => {
      const dataInicio = tarefa.dataInicio instanceof Timestamp 
        ? tarefa.dataInicio.toDate() 
        : new Date(tarefa.dataInicio as any);
      
      const agora = new Date();
      const diffMs = Math.max(0, agora.getTime() - dataInicio.getTime());
      
      const totalSegundos = Math.floor(diffMs / 1000);
      const horas = Math.floor(totalSegundos / 3600);
      const minutos = Math.floor((totalSegundos % 3600) / 60);
      const segundos = totalSegundos % 60;
      
      setTempoDecorrido({ horas, minutos, segundos });
    };

    calcularTempo();
    const interval = setInterval(calcularTempo, 1000);
    
    return () => clearInterval(interval);
  }, [isEmAndamento, tarefa.dataInicio]);

  const formatarCronometro = () => {
    const { horas, minutos, segundos } = tempoDecorrido;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  const statusColors = {
    pendente: "bg-muted text-muted-foreground",
    em_andamento: "bg-warning/10 text-warning border-warning",
    concluida: "bg-success/10 text-success border-success",
    cancelado: "bg-destructive/10 text-destructive border-destructive",
  };

  const statusLabels = {
    pendente: "Pendente",
    em_andamento: "Em Andamento",
    concluida: "Concluída",
    cancelado: "Cancelada",
  };

  const prioridadeColors = {
    baixa: "text-muted-foreground",
    media: "text-primary",
    alta: "text-warning",
    critica: "text-destructive",
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isAtrasada && "border-destructive/50",
        isEmAndamento && "border-warning ring-1 ring-warning/30",
        onClick && "active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Left side - Info */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Header badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {tarefa.ordemId && (
                <Badge variant="outline" className="text-xs font-mono">
                  {tarefa.ordemId}
                </Badge>
              )}
              {tarefa.prioridade && (
                <Badge
                  variant="outline"
                  className={cn("text-xs", prioridadeColors[tarefa.prioridade])}
                >
                  {tarefa.prioridade.toUpperCase()}
                </Badge>
              )}
            </div>
            
            {/* Title and description */}
            <div>
              <h4 className="font-semibold text-sm leading-tight truncate">
                {tarefa.maquinaNome}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {tarefa.descricaoTarefa}
              </p>
            </div>

            {/* Info Row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                <span>{tarefa.tipo}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{tarefa.periodoLabel || "Mensal"}</span>
              </div>
              {tarefa.setor && <span className="truncate">{tarefa.setor}</span>}
            </div>

            {/* Data */}
            <div className="flex items-center gap-2">
              {isAtrasada && <AlertTriangle className="h-4 w-4 text-destructive" />}
              <span className={cn("text-sm font-medium", isAtrasada && "text-destructive")}>
                {format(new Date(tarefa.proximaExecucao), "dd/MM/yyyy", { locale: ptBR })}
              </span>
              {tarefa.dataHoraAgendada && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(tarefa.dataHoraAgendada), "HH:mm", { locale: ptBR })}
                </span>
              )}
              {isHoje && !isAtrasada && !isEmAndamento && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary">
                  Hoje
                </Badge>
              )}
            </div>

            {/* Sistema/Componente */}
            <div className="text-xs text-muted-foreground">
              {tarefa.sistema} → {tarefa.componente}
            </div>
          </div>

          {/* Center - Timer (only when in progress) */}
          {isEmAndamento && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Timer className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span className="text-lg font-mono font-bold text-emerald-500 tracking-wide">
                {formatarCronometro()}
              </span>
            </div>
          )}

          {/* Right side - Status */}
          <Badge className={cn(statusColors[tarefa.status], "shrink-0")}>
            {statusLabels[tarefa.status]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
