import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { Clock, Wrench, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistoricoMaquinaProps {
  maquinaId: string;
  maquinaNome: string;
  tarefas: TarefaManutencao[];
}

export function HistoricoMaquina({ maquinaId, maquinaNome, tarefas }: HistoricoMaquinaProps) {
  const tarefasMaquina = tarefas
    .filter(t => t.maquinaId === maquinaId)
    .sort((a, b) => {
      const dataA = a.dataFim?.toDate() || a.ultimaExecucao?.toDate() || new Date(a.proximaExecucao);
      const dataB = b.dataFim?.toDate() || b.ultimaExecucao?.toDate() || new Date(b.proximaExecucao);
      return dataB.getTime() - dataA.getTime();
    });

  const estatisticas = {
    total: tarefasMaquina.length,
    concluidas: tarefasMaquina.filter(t => t.status === "concluida").length,
    pendentes: tarefasMaquina.filter(t => t.status === "pendente").length,
    emAndamento: tarefasMaquina.filter(t => t.status === "em_andamento").length,
    tempoTotal: tarefasMaquina
      .filter(t => t.tempoRealizado)
      .reduce((acc, t) => acc + (t.tempoRealizado || 0), 0)
  };

  const formatarHoras = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "concluida":
        return <Badge className="bg-green-500">Concluída</Badge>;
      case "em_andamento":
        return <Badge className="bg-blue-500">Em Andamento</Badge>;
      case "cancelado":
        return <Badge variant="secondary">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
            <p className="text-xs text-muted-foreground">Manutenções</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.concluidas}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.total > 0 
                ? Math.round((estatisticas.concluidas / estatisticas.total) * 100) + '%'
                : '0%'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.pendentes}</div>
            <p className="text-xs text-muted-foreground">Aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarHoras(estatisticas.tempoTotal)}</div>
            <p className="text-xs text-muted-foreground">Em manutenções</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline de Manutenções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Manutenções - {maquinaNome}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {tarefasMaquina.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma manutenção registrada para esta máquina
                </p>
              ) : (
                tarefasMaquina.map((tarefa, index) => (
                  <div
                    key={tarefa.id}
                    className="relative pl-8 pb-8 border-l-2 border-border last:border-l-0 last:pb-0"
                  >
                    {/* Ponto na timeline */}
                    <div className="absolute left-[-9px] top-0">
                      <div className={`
                        w-4 h-4 rounded-full border-2 border-background
                        ${tarefa.status === "concluida" ? "bg-green-500" :
                          tarefa.status === "em_andamento" ? "bg-blue-500" :
                          tarefa.status === "cancelado" ? "bg-gray-500" :
                          "bg-orange-500"}
                      `} />
                    </div>

                    {/* Conteúdo */}
                    <div className="bg-card border rounded-lg p-4 ml-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(tarefa.status)}
                            <Badge variant="outline">{tarefa.tipo}</Badge>
                          </div>
                          <h4 className="font-semibold">{tarefa.descricaoTarefa}</h4>
                          <p className="text-sm text-muted-foreground">
                            {tarefa.sistema} - {tarefa.componente}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">
                            {new Date(tarefa.proximaExecucao).toLocaleDateString('pt-BR')}
                          </p>
                          {tarefa.tempoRealizado && (
                            <p className="text-muted-foreground">
                              {formatarHoras(tarefa.tempoRealizado)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Manutentor:</span>
                          <span>{tarefa.manutentorNome}</span>
                        </div>

                        {tarefa.materiaisUtilizados && tarefa.materiaisUtilizados.length > 0 && (
                          <div>
                            <p className="text-muted-foreground mb-1">Materiais utilizados:</p>
                            <ul className="list-disc list-inside pl-4 space-y-1">
                              {tarefa.materiaisUtilizados.map((mat) => (
                                <li key={mat.id}>
                                  {mat.nome} - {mat.quantidade} un.
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {tarefa.problemasEncontrados && (
                          <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2">
                            <p className="flex items-center gap-2 font-medium text-orange-600 dark:text-orange-400">
                              <AlertCircle className="h-4 w-4" />
                              Problemas Encontrados:
                            </p>
                            <p className="mt-1">{tarefa.problemasEncontrados}</p>
                          </div>
                        )}

                        {tarefa.requerAcompanhamento && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                            <p className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              Requer Acompanhamento
                            </p>
                            {tarefa.observacoesAcompanhamento && (
                              <p className="mt-1">{tarefa.observacoesAcompanhamento}</p>
                            )}
                          </div>
                        )}

                        {tarefa.checklist && tarefa.checklist.length > 0 && (
                          <div>
                            <p className="text-muted-foreground mb-1">Checklist:</p>
                            <ul className="space-y-1">
                              {tarefa.checklist.map((item) => (
                                <li key={item.id} className="flex items-center gap-2">
                                  {item.concluido ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <div className="h-4 w-4 border-2 rounded" />
                                  )}
                                  <span className={item.concluido ? "" : "text-muted-foreground"}>
                                    {item.descricao}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
