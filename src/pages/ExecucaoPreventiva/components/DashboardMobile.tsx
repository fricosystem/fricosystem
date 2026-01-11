import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { HistoricoExecucao } from "@/services/historicoExecucoes";
import { 
  DashboardLoading,
  DashboardContent,
  useDashboardData,
  useDashboardFilters,
  useDashboardNavigation
} from "./dashboard";

interface DashboardMobileProps {
  stats: {
    hoje: number;
    atrasadas: number;
    concluidas: number;
    emAndamento: number;
    total: number;
  };
  tarefasHoje: TarefaManutencao[];
  tarefasAtrasadas: TarefaManutencao[];
  execucoesPorTarefa?: Record<string, number>;
  tarefas?: TarefaManutencao[];
  historicoExecucoes?: HistoricoExecucao[];
}

export function DashboardMobile({ 
  stats, 
  tarefasHoje, 
  tarefasAtrasadas, 
  execucoesPorTarefa = {}, 
  tarefas = [], 
  historicoExecucoes = [] 
}: DashboardMobileProps) {
  const { paradasMaquina, setores, ordensServico, ordensFinalizadas, loading } = useDashboardData();
  const filters = useDashboardFilters();
  const navigation = useDashboardNavigation();

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <DashboardContent
      tarefas={tarefas}
      historicoExecucoes={historicoExecucoes}
      stats={stats}
      paradasMaquina={paradasMaquina}
      setores={setores}
      ordensServico={ordensServico}
      ordensFinalizadas={ordensFinalizadas}
      filtroPreventivas={filters.filtroPreventivas}
      onFiltroPreventivesChange={filters.setFiltroPreventivas}
      filtroParadas={filters.filtroParadas}
      onFiltroParadasChange={filters.setFiltroParadas}
      filtroOS={filters.filtroOS}
      onFiltroOSChange={filters.setFiltroOS}
      filtroTabelas={filters.filtroTabelas}
      onFiltroTabelasChange={filters.setFiltroTabelas}
      sectionRefs={navigation.sectionRefs}
      activeSection={navigation.activeSection}
      onNavigate={navigation.handleNavigate}
    />
  );
}
