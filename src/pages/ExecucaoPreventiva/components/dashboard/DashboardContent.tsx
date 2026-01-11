import { RefObject } from "react";
import { Separator } from "@/components/ui/separator";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { HistoricoExecucao } from "@/services/historicoExecucoes";
import { FiltroData } from "./dashboardUtils";
import { SecaoPreventivas } from "./SecaoPreventivas";
import { SecaoParadas } from "./SecaoParadas";
import { SecaoOS } from "./SecaoOS";
import { TabelasResumo } from "./TabelasResumo";
import { DashboardNavigation } from "./DashboardNavigation";
import { SecaoDashboard } from "./dashboardUtils";
import { ParadaMaquinaData, SetorData } from "./hooks/useDashboardData";
import { SectionRefs } from "./hooks/useDashboardNavigation";

interface DashboardContentProps {
  // Dados de preventivas
  tarefas: TarefaManutencao[];
  historicoExecucoes: HistoricoExecucao[];
  stats: {
    hoje: number;
    atrasadas: number;
    concluidas: number;
    emAndamento: number;
    total: number;
  };
  
  // Dados gerais
  paradasMaquina: ParadaMaquinaData[];
  setores: SetorData[];
  ordensServico: any[];
  ordensFinalizadas: any[];
  
  // Filtros
  filtroPreventivas: FiltroData;
  onFiltroPreventivesChange: (filtro: FiltroData) => void;
  filtroParadas: FiltroData;
  onFiltroParadasChange: (filtro: FiltroData) => void;
  filtroOS: FiltroData;
  onFiltroOSChange: (filtro: FiltroData) => void;
  filtroTabelas: FiltroData;
  onFiltroTabelasChange: (filtro: FiltroData) => void;
  
  // Navegação
  sectionRefs: SectionRefs;
  activeSection: SecaoDashboard;
  onNavigate: (sectionId: SecaoDashboard) => void;
}

export function DashboardContent({
  tarefas,
  historicoExecucoes,
  stats,
  paradasMaquina,
  setores,
  ordensServico,
  ordensFinalizadas,
  filtroPreventivas,
  onFiltroPreventivesChange,
  filtroParadas,
  onFiltroParadasChange,
  filtroOS,
  onFiltroOSChange,
  filtroTabelas,
  onFiltroTabelasChange,
  sectionRefs,
  activeSection,
  onNavigate
}: DashboardContentProps) {
  return (
    <div className="space-y-6 pb-24">
      {/* Seção: Manutenções Preventivas */}
      <div ref={sectionRefs.preventivas}>
        <SecaoPreventivas
          tarefas={tarefas}
          historicoExecucoes={historicoExecucoes}
          stats={stats}
          filtro={filtroPreventivas}
          onFiltroChange={onFiltroPreventivesChange}
        />
      </div>

      <Separator className="my-6" />

      {/* Seção: Paradas de Máquina */}
      <div ref={sectionRefs.paradas}>
        <SecaoParadas
          paradasMaquina={paradasMaquina}
          filtro={filtroParadas}
          onFiltroChange={onFiltroParadasChange}
        />
      </div>

      <Separator className="my-6" />

      {/* Seção: Ordens de Serviço */}
      <div ref={sectionRefs.os}>
        <SecaoOS
          ordensServico={ordensServico}
          ordensFinalizadas={ordensFinalizadas}
          filtro={filtroOS}
          onFiltroChange={onFiltroOSChange}
        />
      </div>

      <Separator className="my-6" />

      {/* Seção: Tabelas de Resumo */}
      <div ref={sectionRefs.tabelas}>
        <TabelasResumo
          paradasMaquina={paradasMaquina}
          setores={setores}
          historicoExecucoes={historicoExecucoes}
          filtro={filtroTabelas}
          onFiltroChange={onFiltroTabelasChange}
        />
      </div>

      {/* Card de navegação flutuante */}
      <DashboardNavigation
        activeSection={activeSection}
        onNavigate={onNavigate}
      />
    </div>
  );
}
