import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { DetalhesMaquinaModal } from "./DetalhesMaquinaModal";

interface TarefaTimeline {
  id: string;
  nome: string;
  maquina: string;
  maquinaId: string;
  data: string;
  dataHora?: string; // ISO string completo com data e hora
  diasRestantes: number;
  urgencia: "critico" | "alto" | "medio" | "baixo";
}

interface TimelineManutencaoProps {
  tarefas: TarefaTimeline[];
  todasTarefas: TarefaManutencao[];
}

export const TimelineManutencao = ({ tarefas, todasTarefas }: TimelineManutencaoProps) => {
  const [maquinaSelecionada, setMaquinaSelecionada] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleTarefaClick = (maquinaId: string, maquinaNome: string) => {
    setMaquinaSelecionada({ id: maquinaId, nome: maquinaNome });
    setModalOpen(true);
  };

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case "critico":
        return "bg-red-500";
      case "alto":
        return "bg-orange-500";
      case "medio":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const tarefasOrdenadas = [...tarefas].sort((a, b) => a.diasRestantes - b.diasRestantes);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline - Próximas 30 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tarefasOrdenadas.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma manutenção programada para os próximos 30 dias
              </p>
            ) : (
              <>
                {tarefasOrdenadas.map((tarefa) => (
                  <div 
                    key={tarefa.id} 
                    className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    onClick={() => handleTarefaClick(tarefa.maquinaId, tarefa.maquina)}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${getUrgenciaColor(tarefa.urgencia)}`} />
                      <div className="w-0.5 h-16 bg-border" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{tarefa.nome}</p>
                        <Badge 
                          variant="outline"
                          className="text-xs"
                        >
                          {tarefa.diasRestantes === 0
                            ? "Hoje"
                            : tarefa.diasRestantes < 0
                            ? `${Math.abs(tarefa.diasRestantes)}d atrasado`
                            : `${tarefa.diasRestantes}d`}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{tarefa.maquina}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {tarefa.dataHora 
                          ? new Date(tarefa.dataHora).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : new Date(tarefa.data).toLocaleDateString("pt-BR")
                        }
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Indicador de fim da lista */}
                <div className="flex items-center gap-3 pt-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-muted border-2 border-dashed border-border" />
                  </div>
                  <div className="flex-1 text-center py-4 border-t border-dashed border-border">
                    <p className="text-muted-foreground text-sm">
                      📋 Fim das manutenções agendadas
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Próximas verificações serão atualizadas automaticamente
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {maquinaSelecionada && (
        <DetalhesMaquinaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          maquinaId={maquinaSelecionada.id}
          maquinaNome={maquinaSelecionada.nome}
          tarefas={todasTarefas}
        />
      )}
    </>
  );
};
