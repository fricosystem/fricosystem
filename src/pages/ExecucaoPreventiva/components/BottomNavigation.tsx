import { LayoutDashboard, Calendar, User, AlertTriangle, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MainTabType = "dashboard" | "preventiva" | "paradas" | "os" | "perfil";
type SubTabType = "lista" | "calendario" | "historico" | "criadas" | "historico-paradas" | "os-abertas" | "os-historico";
type TabType = "dashboard" | "timeline" | "calendario" | "historico" | "perfil" | "paradas" | "historico-paradas" | "os-abertas" | "os-historico";

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  badgeCounts?: {
    preventivas?: number;
    paradas?: number;
    os?: number;
  };
}

const getMainTab = (tab: TabType): MainTabType => {
  if (tab === "dashboard") return "dashboard";
  if (tab === "perfil") return "perfil";
  if (tab === "timeline" || tab === "calendario" || tab === "historico") return "preventiva";
  if (tab === "paradas" || tab === "historico-paradas") return "paradas";
  if (tab === "os-abertas" || tab === "os-historico") return "os";
  return "dashboard";
};

const getSubTab = (tab: TabType): SubTabType | null => {
  if (tab === "timeline") return "lista";
  if (tab === "calendario") return "calendario";
  if (tab === "historico") return "historico";
  if (tab === "paradas") return "criadas";
  if (tab === "historico-paradas") return "historico-paradas";
  if (tab === "os-abertas") return "os-abertas";
  if (tab === "os-historico") return "os-historico";
  return null;
};

export function BottomNavigation({ activeTab, onTabChange, badgeCounts }: BottomNavigationProps) {
  const mainTab = getMainTab(activeTab);

  const mainTabs = [
    { id: "dashboard" as MainTabType, label: "Dashboard", icon: LayoutDashboard },
    { id: "preventiva" as MainTabType, label: "Preventiva", icon: Calendar, badgeKey: "preventivas" as const },
    { id: "paradas" as MainTabType, label: "Paradas", icon: AlertTriangle, badgeKey: "paradas" as const },
    { id: "os" as MainTabType, label: "OS", icon: ClipboardList, badgeKey: "os" as const },
    { id: "perfil" as MainTabType, label: "Perfil", icon: User },
  ];

  const paradasSubTabs: { id: SubTabType; label: string; tabValue: TabType }[] = [
    { id: "criadas", label: "Abertas", tabValue: "paradas" },
    { id: "historico-paradas", label: "Histórico", tabValue: "historico-paradas" },
  ];

  const osSubTabs: { id: SubTabType; label: string; tabValue: TabType }[] = [
    { id: "os-abertas", label: "Abertas", tabValue: "os-abertas" },
    { id: "os-historico", label: "Histórico", tabValue: "os-historico" },
  ];

  const handleMainTabClick = (tab: MainTabType) => {
    if (tab === "dashboard") {
      onTabChange("dashboard");
    } else if (tab === "perfil") {
      onTabChange("perfil");
    } else if (tab === "preventiva") {
      if (mainTab !== "preventiva") {
        onTabChange("timeline");
      }
    } else if (tab === "paradas") {
      if (mainTab !== "paradas") {
        onTabChange("paradas");
      }
    } else if (tab === "os") {
      if (mainTab !== "os") {
        onTabChange("os-abertas");
      }
    }
  };

  const currentSubTab = getSubTab(activeTab);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t pb-safe">
      {/* Sub-abas - aparecem apenas quando Paradas está ativa */}
      {mainTab === "paradas" && (
        <div className="py-3 px-4">
          <Tabs value={currentSubTab || "criadas"} onValueChange={(v) => {
            const tab = paradasSubTabs.find(t => t.id === v);
            if (tab) onTabChange(tab.tabValue);
          }}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <TabsTrigger value="criadas" className="flex items-center gap-2 rounded-l-lg rounded-r-none">
                Abertas
              </TabsTrigger>
              <TabsTrigger value="historico-paradas" className="flex items-center gap-2 rounded-r-lg rounded-l-none">
                Histórico
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Sub-abas - aparecem apenas quando OS está ativa */}
      {mainTab === "os" && (
        <div className="py-3 px-4">
          <Tabs value={currentSubTab || "os-abertas"} onValueChange={(v) => {
            const tab = osSubTabs.find(t => t.id === v);
            if (tab) onTabChange(tab.tabValue);
          }}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <TabsTrigger value="os-abertas" className="flex items-center gap-2 rounded-l-lg rounded-r-none">
                Abertas
              </TabsTrigger>
              <TabsTrigger value="os-historico" className="flex items-center gap-2 rounded-r-lg rounded-l-none">
                Histórico
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
