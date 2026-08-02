import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export interface ParadaMaquinaData {
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

export interface SetorData {
  id: string;
  nome: string;
  unidade: string;
  status: string;
}

export interface DashboardData {
  paradasMaquina: ParadaMaquinaData[];
  setores: SetorData[];
  ordensServico: any[];
  ordensFinalizadas: any[];
  loading: boolean;
}

export function useDashboardData(): DashboardData {
  const [paradasMaquina, setParadasMaquina] = useState<ParadaMaquinaData[]>([]);
  const [setores, setSetores] = useState<SetorData[]>([]);
  const [ordensServico, setOrdensServico] = useState<any[]>([]);
  const [ordensFinalizadas, setOrdensFinalizadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return {
    paradasMaquina,
    setores,
    ordensServico,
    ordensFinalizadas,
    loading
  };
}
