import { useState } from "react";
import { FiltroData } from "../dashboardUtils";

export interface DashboardFiltersState {
  filtroPreventivas: FiltroData;
  setFiltroPreventivas: (filtro: FiltroData) => void;
  filtroParadas: FiltroData;
  setFiltroParadas: (filtro: FiltroData) => void;
  filtroOS: FiltroData;
  setFiltroOS: (filtro: FiltroData) => void;
  filtroTabelas: FiltroData;
  setFiltroTabelas: (filtro: FiltroData) => void;
}

export function useDashboardFilters(): DashboardFiltersState {
  const [filtroPreventivas, setFiltroPreventivas] = useState<FiltroData>({ periodo: "mensal" });
  const [filtroParadas, setFiltroParadas] = useState<FiltroData>({ periodo: "mensal" });
  const [filtroOS, setFiltroOS] = useState<FiltroData>({ periodo: "mensal" });
  const [filtroTabelas, setFiltroTabelas] = useState<FiltroData>({ periodo: "mensal" });

  return {
    filtroPreventivas,
    setFiltroPreventivas,
    filtroParadas,
    setFiltroParadas,
    filtroOS,
    setFiltroOS,
    filtroTabelas,
    setFiltroTabelas
  };
}
