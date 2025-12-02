import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { Users, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HistoricoManutentorModal } from "./HistoricoManutentorModal";

interface ProximosManutentoresProps {
  tarefas: TarefaManutencao[];
}

interface ManutentorProximo {
  manutentorId: string;
  manutentorNome: string;
  proximaTarefa: TarefaManutencao;
}

export function ProximosManutentores({ tarefas }: ProximosManutentoresProps) {
  const [manutentorSelecionado, setManutentorSelecionado] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filtrar tarefas pendentes e em andamento
  const tarefasPendentes = tarefas.filter(
    t => t.status === "pendente" || t.status === "em_andamento"
  );

  // Agrupar por manutentor e pegar a próxima tarefa de cada
  const manutentoresMap = new Map<string, ManutentorProximo>();

  tarefasPendentes.forEach(tarefa => {
    if (!tarefa.manutentorId || !tarefa.manutentorNome) return;

    const existing = manutentoresMap.get(tarefa.manutentorId);
    
    if (!existing) {
      manutentoresMap.set(tarefa.manutentorId, {
        manutentorId: tarefa.manutentorId,
        manutentorNome: tarefa.manutentorNome,
        proximaTarefa: tarefa
      });
    } else {
      // Pegar a tarefa com data mais próxima
      const dataExisting = new Date(existing.proximaTarefa.proximaExecucao);
      const dataAtual = new Date(tarefa.proximaExecucao);
      
      if (dataAtual < dataExisting) {
        manutentoresMap.set(tarefa.manutentorId, {
          manutentorId: tarefa.manutentorId,
          manutentorNome: tarefa.manutentorNome,
          proximaTarefa: tarefa
        });
      }
    }
  });

  const proximosManutentores = Array.from(manutentoresMap.values())
    .sort((a, b) => {
      const dataA = new Date(a.proximaTarefa.proximaExecucao);
      const dataB = new Date(b.proximaTarefa.proximaExecucao);
      return dataA.getTime() - dataB.getTime();
    })
    .slice(0, 8); // Mostrar os 8 primeiros

  const getPrioridadeColor = (prioridade?: string) => {
    switch (prioridade) {
      case "critica": return "destructive";
      case "alta": return "default";
      case "media": return "secondary";
      case "baixa": return "outline";
      default: return "secondary";
    }
  };

  const getPrioridadeLabel = (prioridade?: string) => {
    switch (prioridade) {
      case "critica": return "Crítica";
      case "alta": return "Alta";
      case "media": return "Média";
      case "baixa": return "Baixa";
      default: return "Média";
    }
  };

  const handleManutentorClick = (manutentorId: string) => {
    setManutentorSelecionado(manutentorId);
    setModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Próximos Manutentores em Ação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proximosManutentores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhuma tarefa pendente no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {proximosManutentores.map((item) => (
                <div
                  key={item.manutentorId}
                  onClick={() => handleManutentorClick(item.manutentorId)}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary">
                      {item.manutentorNome}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(item.proximaTarefa.proximaExecucao), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      {item.proximaTarefa.dataHoraAgendada && (
                        <span>
                          às {format(new Date(item.proximaTarefa.dataHoraAgendada), "HH:mm")}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={getPrioridadeColor(item.proximaTarefa.prioridade)}>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {getPrioridadeLabel(item.proximaTarefa.prioridade)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.proximaTarefa.tipo}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                      {item.proximaTarefa.maquinaNome}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {manutentorSelecionado && (
        <HistoricoManutentorModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          manutentorId={manutentorSelecionado}
          tarefas={tarefas}
        />
      )}
    </>
  );
}
