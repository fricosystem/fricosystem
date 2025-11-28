import { useState } from "react";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { TarefaCardMobile } from "./TarefaCardMobile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IniciarTarefaModal } from "./IniciarTarefaModal";
import { ConcluirTarefaModal } from "./ConcluirTarefaModal";

interface TimelineMobileProps {
  tarefas: TarefaManutencao[];
}

export function TimelineMobile({ tarefas }: TimelineMobileProps) {
  const [selectedTarefa, setSelectedTarefa] = useState<TarefaManutencao | null>(null);
  const [modalType, setModalType] = useState<"iniciar" | "concluir" | null>(null);

  const hoje = new Date().toISOString().split("T")[0];

  const tarefasHoje = tarefas.filter(
    (t) => t.proximaExecucao === hoje && t.status !== "concluida" && t.status !== "cancelado"
  );

  const tarefasSemana = tarefas.filter((t) => {
    const dataExecucao = new Date(t.proximaExecucao);
    const hoje = new Date();
    const seteDias = new Date();
    seteDias.setDate(hoje.getDate() + 7);
    return (
      dataExecucao >= hoje &&
      dataExecucao <= seteDias &&
      t.status !== "concluida" &&
      t.status !== "cancelado"
    );
  });

  const todasTarefas = tarefas.filter(
    (t) => t.status !== "concluida" && t.status !== "cancelado"
  );

  const handleCardClick = (tarefa: TarefaManutencao) => {
    setSelectedTarefa(tarefa);
    if (tarefa.status === "pendente") {
      setModalType("iniciar");
    } else if (tarefa.status === "em_andamento") {
      setModalType("concluir");
    }
  };

  const handleCloseModal = () => {
    setSelectedTarefa(null);
    setModalType(null);
  };

  return (
    <div className="pb-20">
      <Tabs defaultValue="hoje" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hoje">Hoje ({tarefasHoje.length})</TabsTrigger>
          <TabsTrigger value="semana">Semana ({tarefasSemana.length})</TabsTrigger>
          <TabsTrigger value="todas">Todas ({todasTarefas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="hoje" className="space-y-3 mt-4">
          {tarefasHoje.length > 0 ? (
            tarefasHoje.map((tarefa) => (
              <TarefaCardMobile
                key={tarefa.id}
                tarefa={tarefa}
                onClick={() => handleCardClick(tarefa)}
              />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma tarefa para hoje
            </div>
          )}
        </TabsContent>

        <TabsContent value="semana" className="space-y-3 mt-4">
          {tarefasSemana.length > 0 ? (
            tarefasSemana.map((tarefa) => (
              <TarefaCardMobile
                key={tarefa.id}
                tarefa={tarefa}
                onClick={() => handleCardClick(tarefa)}
              />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma tarefa para esta semana
            </div>
          )}
        </TabsContent>

        <TabsContent value="todas" className="space-y-3 mt-4">
          {todasTarefas.length > 0 ? (
            todasTarefas.map((tarefa) => (
              <TarefaCardMobile
                key={tarefa.id}
                tarefa={tarefa}
                onClick={() => handleCardClick(tarefa)}
              />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma tarefa disponível
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modais */}
      {selectedTarefa && modalType === "iniciar" && (
        <IniciarTarefaModal
          tarefa={selectedTarefa}
          open={true}
          onOpenChange={handleCloseModal}
        />
      )}

      {selectedTarefa && modalType === "concluir" && (
        <ConcluirTarefaModal
          tarefa={selectedTarefa}
          open={true}
          onOpenChange={handleCloseModal}
        />
      )}
    </div>
  );
}
