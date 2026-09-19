import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Wrench,
} from "lucide-react";
import { format, differenceInDays, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DetalhesMaquinaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maquinaId: string;
  maquinaNome: string;
  tarefas: TarefaManutencao[];
}

export function DetalhesMaquinaModal({
  open,
  onOpenChange,
  maquinaId,
  maquinaNome,
  tarefas,
}: DetalhesMaquinaModalProps) {
  const [metricas, setMetricas] = useState({
    taxaConclusao: 0,
    totalTarefas: 0,
    tarefasConcluidas: 0,
    tarefasPendentes: 0,
    custoTotal: 0,
    custoPorMes: 0,
    tempoMedioExecucao: 0,
    vidaUtil: 0,
    frequenciaManutencao: 0,
    ultimaManutencao: null as Date | null,
    proximaManutencao: null as Date | null,
  });

  const [historico, setHistorico] = useState<TarefaManutencao[]>([]);

  useEffect(() => {
    if (!open) return;

    // Filtrar tarefas da máquina
    const tarefasMaquina = tarefas.filter((t) => t.maquinaId === maquinaId);
    
    // Separar por status
    const concluidas = tarefasMaquina.filter((t) => t.status === "concluida");
    const pendentes = tarefasMaquina.filter(
      (t) => t.status === "pendente" || t.status === "em_andamento"
    );

    // Calcular taxa de conclusão
    const taxaConclusao =
      tarefasMaquina.length > 0
        ? (concluidas.length / tarefasMaquina.length) * 100
        : 0;

    // Calcular custos
    const custoTotal = concluidas.reduce((acc, tarefa) => {
      const custoMateriais = tarefa.materiaisUtilizados?.reduce(
        (sum, material) => sum + (material.valorUnitario || 0) * material.quantidade,
        0
      ) || 0;
      return acc + custoMateriais;
    }, 0);

    // Calcular custo por mês (considerando os últimos 12 meses)
    const mesesAtivos = tarefasMaquina.length > 0 
      ? Math.max(
          differenceInMonths(
            new Date(),
            new Date(
              Math.min(
                ...tarefasMaquina
                  .filter((t) => t.ultimaExecucao)
                  .map((t) => t.ultimaExecucao!.toDate().getTime())
              )
            )
          ),
          1
        )
      : 1;
    
    const custoPorMes = custoTotal / mesesAtivos;

    // Calcular tempo médio de execução
    const tarefasComTempo = concluidas.filter((t) => t.tempoRealizado);
    const tempoMedioExecucao =
      tarefasComTempo.length > 0
        ? tarefasComTempo.reduce((acc, t) => acc + (t.tempoRealizado || 0), 0) /
          tarefasComTempo.length
        : 0;

    // Calcular vida útil (baseado na frequência de manutenções críticas/altas)
    const manutencoesFrequentes = concluidas.filter(
      (t) => t.prioridade === "critica" || t.prioridade === "alta"
    );
    
    const frequenciaManutencao = concluidas.length > 0 
      ? (manutencoesFrequentes.length / concluidas.length) * 100 
      : 0;

    // Estimativa de vida útil (quanto menor a frequência de manutenções críticas, maior a vida útil)
    const vidaUtil = Math.max(100 - frequenciaManutencao, 0);

    // Última e próxima manutenção
    const ultimaManutencao = concluidas.length > 0
      ? new Date(
          Math.max(
            ...concluidas
              .filter((t) => t.dataFim)
              .map((t) => t.dataFim!.toDate().getTime())
          )
        )
      : null;

    const proximaManutencao = pendentes.length > 0
      ? new Date(
          Math.min(
            ...pendentes.map((t) => new Date(t.proximaExecucao).getTime())
          )
        )
      : null;

    setMetricas({
      taxaConclusao,
      totalTarefas: tarefasMaquina.length,
      tarefasConcluidas: concluidas.length,
      tarefasPendentes: pendentes.length,
      custoTotal,
      custoPorMes,
      tempoMedioExecucao,
      vidaUtil,
      frequenciaManutencao,
      ultimaManutencao,
      proximaManutencao,
    });

    // Ordenar histórico por data mais recente
    const historicoOrdenado = [...tarefasMaquina].sort((a, b) => {
      const dataA = a.dataFim?.toDate() || new Date(a.proximaExecucao);
      const dataB = b.dataFim?.toDate() || new Date(b.proximaExecucao);
      return dataB.getTime() - dataA.getTime();
    });

    setHistorico(historicoOrdenado);
  }, [open, maquinaId, tarefas]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluida":
        return "default";
      case "em_andamento":
        return "secondary";
      case "pendente":
        return "outline";
      default:
        return "destructive";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "concluida":
        return "Concluída";
      case "em_andamento":
        return "Em Andamento";
      case "pendente":
        return "Pendente";
      default:
        return "Cancelada";
    }
  };

  const getPrioridadeColor = (prioridade?: string) => {
    switch (prioridade) {
      case "critica":
        return "destructive";
      case "alta":
        return "default";
      case "media":
        return "secondary";
      case "baixa":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Detalhes - {maquinaNome}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          {/* KPIs principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Taxa de Conclusão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricas.taxaConclusao.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metricas.tarefasConcluidas} de {metricas.totalTarefas} tarefas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Custo Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {metricas.custoTotal.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Média: R$ {metricas.custoPorMes.toFixed(2)}/mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Vida Útil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricas.vidaUtil.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Baseado em manutenções críticas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Métricas adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tempo Médio de Execução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {Math.floor(metricas.tempoMedioExecucao / 60)}h{" "}
                  {Math.floor(metricas.tempoMedioExecucao % 60)}min
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Freq. Manutenções Críticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {metricas.frequenciaManutencao.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Última Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {metricas.ultimaManutencao
                    ? format(metricas.ultimaManutencao, "dd/MM/yyyy", {
                        locale: ptBR,
                      })
                    : "Nenhuma"}
                </div>
                {metricas.ultimaManutencao && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Há {differenceInDays(new Date(), metricas.ultimaManutencao)}{" "}
                    dias
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Próxima Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {metricas.proximaManutencao
                    ? format(metricas.proximaManutencao, "dd/MM/yyyy", {
                        locale: ptBR,
                      })
                    : "Nenhuma agendada"}
                </div>
                {metricas.proximaManutencao && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Em {differenceInDays(metricas.proximaManutencao, new Date())}{" "}
                    dias
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Manutenções */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Manutenções</CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma manutenção registrada
                </p>
              ) : (
                <div className="space-y-4">
                  {historico.slice(0, 10).map((tarefa) => (
                    <div
                      key={tarefa.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            {tarefa.descricaoTarefa}
                          </p>
                          <Badge variant={getStatusColor(tarefa.status)}>
                            {getStatusLabel(tarefa.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Badge variant={getPrioridadeColor(tarefa.prioridade)}>
                            {tarefa.prioridade}
                          </Badge>
                          <span>•</span>
                          <span>{tarefa.tipo}</span>
                          <span>•</span>
                          <span>{tarefa.manutentorNome}</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {tarefa.dataFim
                              ? format(tarefa.dataFim.toDate(), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })
                              : format(
                                  new Date(tarefa.proximaExecucao),
                                  "dd/MM/yyyy",
                                  { locale: ptBR }
                                )}
                          </div>
                          {tarefa.tempoRealizado && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(tarefa.tempoRealizado / 60)}h{" "}
                              {Math.floor(tarefa.tempoRealizado % 60)}min
                            </div>
                          )}
                          {tarefa.materiaisUtilizados &&
                            tarefa.materiaisUtilizados.length > 0 && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                R${" "}
                                {tarefa.materiaisUtilizados
                                  .reduce(
                                    (sum, m) =>
                                      sum +
                                      (m.valorUnitario || 0) * m.quantidade,
                                    0
                                  )
                                  .toFixed(2)}
                              </div>
                            )}
                        </div>

                        {tarefa.problemasEncontrados && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            <span className="font-medium">Problemas:</span>{" "}
                            {tarefa.problemasEncontrados}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {historico.length > 10 && (
                    <p className="text-center text-xs text-muted-foreground pt-2">
                      Mostrando 10 de {historico.length} manutenções
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
