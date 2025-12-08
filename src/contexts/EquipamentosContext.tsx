import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface Equipamento {
  id: string;
  patrimonio: string;
  equipamento: string;
  setor: string;
  tag: string;
}

interface Maquina {
  id: string;
  equipamento: string;
  patrimonio: string;
  setor: string;
  tag: string;
  imagemUrl: string;
  status: "Ativa" | "Inativa";
  descricao?: string;
  createdAt: any;
  updatedAt: any;
}

interface EquipamentosContextData {
  maquinas: Maquina[];
  equipamentos: Equipamento[];
  loading: boolean;
  fetchData: (forceRefresh?: boolean) => Promise<void>;
  invalidateCache: () => void;
}

const EquipamentosContext = createContext<EquipamentosContextData>({} as EquipamentosContextData);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function EquipamentosProvider({ children }: { children: ReactNode }) {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(false);
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef<boolean>(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheValid = now - lastFetchTime.current < CACHE_DURATION;
    
    // Se cache válido e não forçar refresh, retorna dados existentes
    if (cacheValid && maquinas.length > 0 && !forceRefresh) {
      return;
    }

    // Evita chamadas duplicadas
    if (isFetching.current) {
      return;
    }

    try {
      isFetching.current = true;
      setLoading(true);
      
      const equipamentosRef = collection(db, "equipamentos");
      const snapshot = await getDocs(equipamentosRef);
      
      const maquinasData: Maquina[] = [];
      const equipamentosData: Equipamento[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        maquinasData.push({
          id: doc.id,
          equipamento: data.equipamento || "",
          patrimonio: data.patrimonio || "",
          setor: data.setor || "",
          tag: data.tag || "",
          imagemUrl: data.imagemUrl || "",
          status: data.status || "Ativa",
          descricao: data.descricao || "",
          createdAt: data.createdAt || data.dataCriacao || null,
          updatedAt: data.updatedAt || data.dataAtualizacao || null,
        });
        
        equipamentosData.push({
          id: doc.id,
          patrimonio: data.patrimonio || "",
          equipamento: data.equipamento || "",
          setor: data.setor || "",
          tag: data.tag || "",
        });
      });
      
      maquinasData.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.seconds - a.createdAt.seconds;
      });
      
      setMaquinas(maquinasData);
      setEquipamentos(equipamentosData);
      lastFetchTime.current = Date.now();
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [maquinas.length]);

  const invalidateCache = useCallback(() => {
    lastFetchTime.current = 0;
  }, []);

  return (
    <EquipamentosContext.Provider value={{ maquinas, equipamentos, loading, fetchData, invalidateCache }}>
      {children}
    </EquipamentosContext.Provider>
  );
}

export function useEquipamentos() {
  const context = useContext(EquipamentosContext);
  if (!context) {
    throw new Error("useEquipamentos deve ser usado dentro de EquipamentosProvider");
  }
  return context;
}
