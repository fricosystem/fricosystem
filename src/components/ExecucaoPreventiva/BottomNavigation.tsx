import { LayoutDashboard, Calendar, User, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type MainTabType = "dashboard" | "preventiva" | "paradas" | "perfil";
type SubTabType = "lista" | "calendario" | "historico" | "criadas" | "historico-paradas";
type TabType = "dashboard" | "timeline" | "calendario" | "historico" | "perfil" | "paradas" | "historico-paradas";

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  badgeCounts?: {
    preventivas?: number;
    paradas?: number;
  };
}

const getMainTab = (tab: TabType): MainTabType => {
  if (tab === "dashboard") return "dashboard";
  if (tab === "perfil") return "perfil";
  if (tab === "timeline" || tab === "calendario" || tab === "historico") return "preventiva";
  if (tab === "paradas" || tab === "historico-paradas") return "paradas";
  return "dashboard";
};

const getSubTab = (tab: TabType): SubTabType | null => {
  if (tab === "timeline") return "lista";
  if (tab === "calendario") return "calendario";
  if (tab === "historico") return "historico";
  if (tab === "paradas") return "criadas";
  if (tab === "historico-paradas") return "historico-paradas";
  return null;
};

export function BottomNavigation({ activeTab, onTabChange, badgeCounts }: BottomNavigationProps) {
  const mainTab = getMainTab(activeTab);

  const mainTabs = [
    { id: "dashboard" as MainTabType, label: "Dashboard", icon: LayoutDashboard },
    { id: "preventiva" as MainTabType, label: "Preventiva", icon: Calendar, badgeKey: "preventivas" as const },
    { id: "paradas" as MainTabType, label: "Paradas", icon: AlertTriangle, badgeKey: "paradas" as const },
    { id: "perfil" as MainTabType, label: "Perfil", icon: User },
  ];

  // Sub-abas de preventiva removidas - agora estão dentro do TimelineMobile

  const paradasSubTabs: { id: SubTabType; label: string; tabValue: TabType }[] = [
    { id: "criadas", label: "Abertas", tabValue: "paradas" },
    { id: "historico-paradas", label: "Histórico", tabValue: "historico-paradas" },
  ];

  const handleMainTabClick = (tab: MainTabType) => {
    if (tab === "dashboard") {
      onTabChange("dashboard");
    } else if (tab === "perfil") {
      onTabChange("perfil");
    } else if (tab === "preventiva") {
      // Se já está em preventiva, mantém a sub-aba atual, senão vai para Lista
      if (mainTab !== "preventiva") {
        onTabChange("timeline");
      }
    } else if (tab === "paradas") {
      // Se já está em paradas, mantém a sub-aba atual, senão vai para Criadas
      if (mainTab !== "paradas") {
        onTabChange("paradas");
      }
    }
  };

  const currentSubTab = getSubTab(activeTab);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t pb-safe">
      {/* Sub-abas - aparecem apenas quando Paradas está ativa */}
      {mainTab === "paradas" && (
        <div className="flex justify-center py-3 px-4">
          <div className="inline-flex items-center bg-muted/30 rounded-xl p-1 backdrop-blur-sm border border-border/50">
            {paradasSubTabs.map((subTab) => (
              <button
                key={subTab.id}
                onClick={() => onTabChange(subTab.tabValue)}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  currentSubTab === subTab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {subTab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Abas principais */}
      <nav className="flex justify-around py-3 px-4">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = mainTab === tab.id;
          const badgeCount = tab.badgeKey && badgeCounts?.[tab.badgeKey];

          return (
            <button
              key={tab.id}
              onClick={() => handleMainTabClick(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-2 px-4 rounded-xl transition-all min-w-[72px] relative",
                isActive
                  ? "text-primary bg-primary/10 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {badgeCount !== undefined && badgeCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-4 h-5 min-w-[20px] flex items-center justify-center p-0 text-xs font-bold"
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-semibold whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
