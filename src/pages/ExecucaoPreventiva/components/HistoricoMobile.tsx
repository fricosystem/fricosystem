import { HistoricoExecucao } from "@/services/historicoExecucoes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Wrench, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoricoMobileProps {
  historicoExecucoes: HistoricoExecucao[];
}

export function HistoricoMobile({ historicoExecucoes }: HistoricoMobileProps) {
  const [periodo, setPeriodo] = useState<string>("30");

  const filtrarPorPeriodo = (execucoes: HistoricoExecucao[], dias: number) => {
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() - dias);

    return execucoes.filter((e) => {
      if (!e.dataExecucao) return false;
      const dataExec = e.dataExecucao.toDate();
      return dataExec >= dataLimite;
    });
  };

  const execucoesFiltradas = periodo === "todos" 
    ? historicoExecucoes 
    : filtrarPorPeriodo(historicoExecucoes, parseInt(periodo));

  const formatarTempo = (minutos: number) => {
    if (minutos < 60) {
      return `${minutos}min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Filtro de Período */}
      <div>
        <label className="text-sm font-medium mb-2 block">Período</label>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contador */}
      <div className="text-sm text-muted-foreground">
        {execucoesFiltradas.length} execuções encontradas
      </div>

      {/* Lista de Execuções */}
      <div className="space-y-3">
        {execucoesFiltradas.length > 0 ? (
          execucoesFiltradas.map((execucao) => (
            <Card key={execucao.id} className="border-l-4 border-l-success">
              <CardContent className="p-4 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className="text-xs">
                        {execucao.tipo}
                      </Badge>
                      <Badge className="bg-success/10 text-success border-success text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluída
                      </Badge>
                    </div>
                    <h3 className="font-medium text-sm truncate">{execucao.maquinaNome}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {execucao.tarefaDescricao}
                    </p>
                  </div>
                </div>

                {/* Info Row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {execucao.dataExecucao && format(execucao.dataExecucao.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatarTempo(execucao.tempoRealizado)}
                  </div>
                </div>

                {/* Sistema/Componente */}
                {(execucao.sistema || execucao.componente) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wrench className="h-3 w-3" />
                    <span className="truncate">
                      {[execucao.sistema, execucao.componente].filter(Boolean).join(" • ")}
                    </span>
                  </div>
                )}

                {/* Observações */}
                {execucao.observacoes && (
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    {execucao.observacoes}
                  </p>
                )}

                {/* Problemas */}
                {execucao.problemasEncontrados && (
                  <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    ⚠️ {execucao.problemasEncontrados}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma execução registrada neste período
          </div>
        )}
      </div>
    </div>
  );
}
