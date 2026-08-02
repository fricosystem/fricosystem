import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Wrench,
  TrendingUp,
  Award
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface HistoricoManutentorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manutentorId: string;
  tarefas: TarefaManutencao[];
}

export function HistoricoManutentorModal({
  open,
  onOpenChange,
  manutentorId,
  tarefas
}: HistoricoManutentorModalProps) {
  // Filtrar tarefas do manutentor
  const tarefasManutentor = tarefas.filter(t => t.manutentorId === manutentorId);
  
  const tarefasConcluidas = tarefasManutentor.filter(t => t.status === "concluida");
  const tarefasPendentes = tarefasManutentor.filter(t => t.status === "pendente");
  const tarefasEmAndamento = tarefasManutentor.filter(t => t.status === "em_andamento");
  
  const manutentorNome = tarefasManutentor[0]?.manutentorNome || "Manutentor";
  
  // Calcular estatísticas
  const tempoMedio = tarefasConcluidas.length > 0
    ? tarefasConcluidas.reduce((acc, t) => acc + (t.tempoRealizado || 0), 0) / tarefasConcluidas.length
    : 0;
  
  const taxaConclusao = tarefasManutentor.length > 0
    ? Math.round((tarefasConcluidas.length / tarefasManutentor.length) * 100)
    : 0;

  const formatarTempo = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return `${horas}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  const getPrioridadeColor = (prioridade?: string) => {
    switch (prioridade) {
      case "critica": return "destructive";
      case "alta": return "default";
      case "media": return "secondary";
      case "baixa": return "outline";
      default: return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Histórico de {manutentorNome}
          </DialogTitle>
        </DialogHeader>

        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{tarefasConcluidas.length}</p>
                  <p className="text-xs text-muted-foreground">Concluídas</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{tarefasPendentes.length}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{formatarTempo(tempoMedio)}</p>
                  <p className="text-xs text-muted-foreground">Tempo Médio</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{taxaConclusao}%</p>
                  <p className="text-xs text-muted-foreground">Taxa Conclusão</p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Tarefas Em Andamento */}
        {tarefasEmAndamento.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Em Andamento ({tarefasEmAndamento.length})
            </h3>
            {tarefasEmAndamento.map((tarefa) => (
              <Card key={tarefa.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{tarefa.maquinaNome}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tarefa.descricaoTarefa}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{tarefa.tipo}</Badge>
                        <Badge variant={getPrioridadeColor(tarefa.prioridade)}>
                          {tarefa.prioridade || "média"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(tarefa.proximaExecucao), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tarefas Pendentes */}
        {tarefasPendentes.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendentes ({tarefasPendentes.length})
            </h3>
            {tarefasPendentes.slice(0, 5).map((tarefa) => (
              <Card key={tarefa.id} className="border-l-4 border-l-orange-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{tarefa.maquinaNome}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {tarefa.descricaoTarefa}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{tarefa.tipo}</Badge>
                        <Badge variant={getPrioridadeColor(tarefa.prioridade)}>
                          {tarefa.prioridade || "média"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(tarefa.proximaExecucao), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {tarefasPendentes.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                + {tarefasPendentes.length - 5} tarefas pendentes
              </p>
            )}
          </div>
        )}

        {/* Últimas Tarefas Concluídas */}
        {tarefasConcluidas.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Últimas Concluídas ({tarefasConcluidas.length})
            </h3>
            {tarefasConcluidas
              .sort((a, b) => {
                const dataA = a.dataFim?.toMillis() || 0;
                const dataB = b.dataFim?.toMillis() || 0;
                return dataB - dataA;
              })
              .slice(0, 5)
              .map((tarefa) => (
                <Card key={tarefa.id} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{tarefa.maquinaNome}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {tarefa.descricaoTarefa}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{tarefa.tipo}</Badge>
                          {tarefa.tempoRealizado && (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatarTempo(tarefa.tempoRealizado)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {tarefa.dataFim && (
                          <p className="flex items-center gap-1 text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3" />
                            {format(tarefa.dataFim.toDate(), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {tarefasConcluidas.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                + {tarefasConcluidas.length - 5} tarefas concluídas anteriormente
              </p>
            )}
          </div>
        )}

        {tarefasManutentor.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma tarefa encontrada para este manutentor</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
