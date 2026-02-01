import { useState } from "react";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { TarefaCardMobile } from "./TarefaCardMobile";
import { IniciarTarefaModal } from "./IniciarTarefaModal";
import { ConcluirTarefaModal } from "./ConcluirTarefaModal";
import { CalendarioMobile } from "./CalendarioMobile";
import { HistoricoMobile } from "./HistoricoMobile";
import { HistoricoExecucao } from "@/services/historicoExecucoes";
import { cn } from "@/lib/utils";

interface TimelineMobileProps {
  tarefas: TarefaManutencao[];
  execucoesPorTarefa?: Record<string, number>;
  historicoExecucoes?: HistoricoExecucao[];
}

type ViewType = "lista" | "calendario" | "historico";
type FilterType = "hoje" | "semana" | "todas";

export function TimelineMobile({ tarefas, execucoesPorTarefa = {}, historicoExecucoes = [] }: TimelineMobileProps) {
  const [selectedTarefa, setSelectedTarefa] = useState<TarefaManutencao | null>(null);
  const [modalType, setModalType] = useState<"iniciar" | "concluir" | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("lista");
  const [activeFilter, setActiveFilter] = useState<FilterType>("hoje");

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

  const getFilteredTarefas = () => {
    switch (activeFilter) {
      case "hoje":
        return tarefasHoje;
      case "semana":
        return tarefasSemana;
      case "todas":
        return todasTarefas;
      default:
        return tarefasHoje;
    }
  };

  const viewTabs = [
    { id: "lista" as ViewType, label: "Lista" },
    { id: "calendario" as ViewType, label: "Calendário" },
    { id: "historico" as ViewType, label: "Histórico" },
  ];

  const filterTabs = [
    { id: "hoje" as FilterType, label: "Hoje", count: tarefasHoje.length },
    { id: "semana" as FilterType, label: "Semana", count: tarefasSemana.length },
    { id: "todas" as FilterType, label: "Todas", count: todasTarefas.length },
  ];

  // Render view based on activeView
  if (activeView === "calendario") {
    return (
      <div className="flex flex-col h-[calc(100vh-180px)] pb-20">
      {/* Abas de visualização */}
        <div className="flex justify-center py-3 mb-2 flex-shrink-0">
          <div className="inline-flex items-center bg-muted/30 rounded-xl p-1 backdrop-blur-sm border border-border/50">
            {viewTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  activeView === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <CalendarioMobile tarefas={tarefas} execucoesPorTarefa={execucoesPorTarefa} />
        </div>
      </div>
    );
  }

  if (activeView === "historico") {
    return (
      <div className="pb-20">
        {/* Abas de visualização */}
        <div className="flex justify-center py-3 mb-4">
          <div className="inline-flex items-center bg-muted/30 rounded-xl p-1 backdrop-blur-sm border border-border/50">
            {viewTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  activeView === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <HistoricoMobile historicoExecucoes={historicoExecucoes} />
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Abas de visualização (Lista, Calendário, Histórico) */}
      <div className="flex justify-center py-3 mb-2">
        <div className="inline-flex items-center bg-muted/30 rounded-xl p-1 backdrop-blur-sm border border-border/50">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeView === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro de período (Hoje, Semana, Todas) */}
      <div className="flex justify-center py-2 mb-4">
        <div className="inline-flex items-center gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                activeFilter === tab.id
                  ? "bg-primary/10 text-primary border-primary/50"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Lista de tarefas filtradas */}
      <div className="space-y-3">
        {getFilteredTarefas().length > 0 ? (
          getFilteredTarefas().map((tarefa) => (
            <TarefaCardMobile
              key={tarefa.id}
              tarefa={tarefa}
              onClick={() => handleCardClick(tarefa)}
              execucoesAnteriores={execucoesPorTarefa[tarefa.id] || 0}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {activeFilter === "hoje" && "Nenhuma tarefa para hoje"}
            {activeFilter === "semana" && "Nenhuma tarefa para esta semana"}
            {activeFilter === "todas" && "Nenhuma tarefa disponível"}
          </div>
        )}
      </div>

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
