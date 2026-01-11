import { useState, useRef, RefObject } from "react";
import { SecaoDashboard } from "../dashboardUtils";

export interface SectionRefs {
  preventivas: RefObject<HTMLDivElement>;
  paradas: RefObject<HTMLDivElement>;
  os: RefObject<HTMLDivElement>;
  indicadores: RefObject<HTMLDivElement>;
  tabelas: RefObject<HTMLDivElement>;
}

export interface DashboardNavigationState {
  activeSection: SecaoDashboard;
  sectionRefs: SectionRefs;
  handleNavigate: (sectionId: SecaoDashboard) => void;
}

export function useDashboardNavigation(): DashboardNavigationState {
  const [activeSection, setActiveSection] = useState<SecaoDashboard>("preventivas");

  const sectionRefs: SectionRefs = {
    preventivas: useRef<HTMLDivElement>(null),
    paradas: useRef<HTMLDivElement>(null),
    os: useRef<HTMLDivElement>(null),
    indicadores: useRef<HTMLDivElement>(null),
    tabelas: useRef<HTMLDivElement>(null),
  };

  const handleNavigate = (sectionId: SecaoDashboard) => {
    setActiveSection(sectionId);
    const ref = sectionRefs[sectionId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return {
    activeSection,
    sectionRefs,
    handleNavigate
  };
}
