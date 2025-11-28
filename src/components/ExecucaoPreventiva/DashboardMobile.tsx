import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { TarefaCardMobile } from "./TarefaCardMobile";

interface DashboardMobileProps {
  stats: {
    hoje: number;
    atrasadas: number;
    concluidas: number;
    emAndamento: number;
    total: number;
  };
  tarefasHoje: TarefaManutencao[];
  tarefasAtrasadas: TarefaManutencao[];
}

export function DashboardMobile({ stats, tarefasHoje, tarefasAtrasadas }: DashboardMobileProps) {
  const urgentes = [...tarefasAtrasadas, ...tarefasHoje].slice(0, 3);

  return (
    <div className="space-y-4 pb-20">
      {/* Cards de KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoje}</div>
            <p className="text-xs text-muted-foreground">Tarefas agendadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.atrasadas}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-warning" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.emAndamento}</div>
            <p className="text-xs text-muted-foreground">Em execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.concluidas}</div>
            <p className="text-xs text-muted-foreground">Total realizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tarefas Urgentes */}
      {urgentes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Tarefas Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentes.map((tarefa) => (
              <TarefaCardMobile key={tarefa.id} tarefa={tarefa} />
            ))}
          </CardContent>
        </Card>
      )}

      {urgentes.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-success mb-4" />
            <p className="text-center text-muted-foreground">
              Nenhuma tarefa urgente no momento!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
