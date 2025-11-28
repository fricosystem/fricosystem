import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { Clock, Wrench, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TarefaCardMobileProps {
  tarefa: TarefaManutencao;
  onClick?: () => void;
}

export function TarefaCardMobile({ tarefa, onClick }: TarefaCardMobileProps) {
  const hoje = new Date().toISOString().split("T")[0];
  const isAtrasada = tarefa.proximaExecucao < hoje && tarefa.status === "pendente";
  const isHoje = tarefa.proximaExecucao === hoje;

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
        onClick && "active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
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
            <h4 className="font-semibold text-sm leading-tight truncate">
              {tarefa.maquinaNome}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {tarefa.descricaoTarefa}
            </p>
          </div>
          <Badge className={statusColors[tarefa.status]}>
            {statusLabels[tarefa.status]}
          </Badge>
        </div>

        {/* Info Row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            <span>{tarefa.tipo}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{tarefa.tempoEstimado}min</span>
          </div>
          {tarefa.setor && (
            <div className="flex items-center gap-1 truncate">
              <span className="truncate">{tarefa.setor}</span>
            </div>
          )}
        </div>

        {/* Data */}
        <div className="flex items-center justify-between">
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
          </div>
          {isHoje && !isAtrasada && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary">
              Hoje
            </Badge>
          )}
        </div>

        {/* Sistema/Componente */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            {tarefa.sistema} → {tarefa.componente}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
