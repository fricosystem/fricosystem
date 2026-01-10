import { useState, useEffect, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { HistoricoExecucao } from "@/services/historicoExecucoes";
import { Separator } from "@/components/ui/separator";
import { 
  FiltroData, 
  SecaoDashboard,
  DashboardNavigation,
  SecaoPreventivas,
  SecaoParadas,
  SecaoOS,
  TabelasResumo
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

interface ParadaMaquinaData {
  id: string;
  setor: string;
  equipamento: string;
  tipoManutencao: string;
  status: string;
  origemParada?: any;
  tempoParada?: number;
  criadoEm?: any;
  finalizadoEm?: any;
}

interface SetorData {
  id: string;
  nome: string;
  unidade: string;
  status: string;
}

export function DashboardMobile({ stats, tarefasHoje, tarefasAtrasadas, execucoesPorTarefa = {}, tarefas = [], historicoExecucoes = [] }: DashboardMobileProps) {
  // Estados de dados
  const [paradasMaquina, setParadasMaquina] = useState<ParadaMaquinaData[]>([]);
  const [setores, setSetores] = useState<SetorData[]>([]);
  const [ordensServico, setOrdensServico] = useState<any[]>([]);
  const [ordensFinalizadas, setOrdensFinalizadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtros por seção
  const [filtroPreventivas, setFiltroPreventivas] = useState<FiltroData>({ periodo: "mensal" });
  const [filtroParadas, setFiltroParadas] = useState<FiltroData>({ periodo: "mensal" });
  const [filtroOS, setFiltroOS] = useState<FiltroData>({ periodo: "mensal" });
  const [filtroTabelas, setFiltroTabelas] = useState<FiltroData>({ periodo: "mensal" });

  // Estado de navegação
  const [activeSection, setActiveSection] = useState<SecaoDashboard>("preventivas");

  // Refs para scroll
  const sectionRefs = {
    preventivas: useRef<HTMLDivElement>(null),
    paradas: useRef<HTMLDivElement>(null),
    os: useRef<HTMLDivElement>(null),
    indicadores: useRef<HTMLDivElement>(null),
    tabelas: useRef<HTMLDivElement>(null),
  };

  // Buscar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paradasSnap, setoresSnap, osSnap, osFinalizadasSnap] = await Promise.all([
          getDocs(collection(db, "paradas_maquina")),
          getDocs(collection(db, "setores")),
          getDocs(collection(db, "ordens_servicos")),
          getDocs(collection(db, "ordens_servico_finalizada"))
        ]);

        setParadasMaquina(paradasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ParadaMaquinaData[]);
        setSetores(setoresSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SetorData[]);
        setOrdensServico(osSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setOrdensFinalizadas(osFinalizadasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Navegação entre seções
  const handleNavigate = (sectionId: SecaoDashboard) => {
    setActiveSection(sectionId);
    const ref = sectionRefs[sectionId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Seção: Manutenções Preventivas */}
      <div ref={sectionRefs.preventivas}>
        <SecaoPreventivas
          tarefas={tarefas}
          historicoExecucoes={historicoExecucoes}
          stats={stats}
          filtro={filtroPreventivas}
          onFiltroChange={setFiltroPreventivas}
        />
      </div>

      <Separator className="my-6" />

      {/* Seção: Paradas de Máquina */}
      <div ref={sectionRefs.paradas}>
        <SecaoParadas
          paradasMaquina={paradasMaquina}
          filtro={filtroParadas}
          onFiltroChange={setFiltroParadas}
        />
      </div>

      <Separator className="my-6" />

      {/* Seção: Ordens de Serviço */}
      <div ref={sectionRefs.os}>
        <SecaoOS
          ordensServico={ordensServico}
          ordensFinalizadas={ordensFinalizadas}
          filtro={filtroOS}
          onFiltroChange={setFiltroOS}
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
          onFiltroChange={setFiltroTabelas}
        />
      </div>

      {/* Card de navegação flutuante */}
      <DashboardNavigation
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
