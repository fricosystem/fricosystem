import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { TarefaCardMobile } from "./TarefaCardMobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface HistoricoMobileProps {
  tarefasConcluidas: TarefaManutencao[];
}

export function HistoricoMobile({ tarefasConcluidas }: HistoricoMobileProps) {
  const [periodo, setPeriodo] = useState<string>("30");

  const filtrarPorPeriodo = (tarefas: TarefaManutencao[], dias: number) => {
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() - dias);

    return tarefas.filter((t) => {
      if (!t.dataFim) return false;
      const dataFim = t.dataFim.toDate();
      return dataFim >= dataLimite;
    });
  };

  const tarefasFiltradas = periodo === "todos" 
    ? tarefasConcluidas 
    : filtrarPorPeriodo(tarefasConcluidas, parseInt(periodo));

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

      {/* Lista de Tarefas */}
      <div className="space-y-3">
        {tarefasFiltradas.length > 0 ? (
          tarefasFiltradas.map((tarefa) => (
            <TarefaCardMobile key={tarefa.id} tarefa={tarefa} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma tarefa concluída neste período
          </div>
        )}
      </div>
    </div>
  );
}
