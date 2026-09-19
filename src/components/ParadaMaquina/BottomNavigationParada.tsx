import { AlertTriangle, User, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type MainTabType = "paradas" | "os" | "perfil";
type SubTabType = "abertas" | "historico" | "nova-os" | "historico-os";

interface BottomNavigationParadaProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  badgeCount?: number;
  subTab?: SubTabType;
  onSubTabChange?: (subTab: SubTabType) => void;
  osBadgeCount?: number;
}

export function BottomNavigationParada({ 
  activeTab, 
  onTabChange, 
  badgeCount,
  subTab = "abertas",
  onSubTabChange,
  osBadgeCount
}: BottomNavigationParadaProps) {
  const tabs = [
    { id: "paradas" as const, label: "Paradas", icon: AlertTriangle, hasBadge: true },
    { id: "os" as const, label: "OS", icon: ClipboardList, hasBadge: false },
    { id: "perfil" as const, label: "Perfil", icon: User, hasBadge: false },
  ];

  const paradasSubTabs = [
    { id: "abertas" as SubTabType, label: "Abertas" },
    { id: "historico" as SubTabType, label: "Histórico" },
  ];

  const osSubTabs = [
    { id: "nova-os" as SubTabType, label: "Nova OS" },
    { id: "historico-os" as SubTabType, label: "Histórico" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t pb-safe">
      {/* Sub-abas - Paradas */}
      {activeTab === "paradas" && onSubTabChange && (
        <div className="flex justify-center py-3 px-4">
          <div className="inline-flex items-center bg-muted/30 rounded-xl p-1 backdrop-blur-sm border border-border/50">
            {paradasSubTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSubTabChange(tab.id)}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  subTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.id === "abertas" && badgeCount !== undefined && badgeCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] flex items-center justify-center p-0 text-xs font-bold">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sub-abas - OS */}
      {activeTab === "os" && onSubTabChange && (
        <div className="flex justify-center py-3 px-4">
          <div className="inline-flex items-center bg-muted/30 rounded-xl p-1 backdrop-blur-sm border border-border/50">
            {osSubTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSubTabChange(tab.id)}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  subTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.id === "historico-os" && osBadgeCount !== undefined && osBadgeCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] flex items-center justify-center p-0 text-xs font-bold">
                    {osBadgeCount > 99 ? "99+" : osBadgeCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Abas principais */}
      <div className="flex justify-around py-3 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.hasBadge && badgeCount !== undefined && badgeCount > 0;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-2 px-4 rounded-xl transition-all min-w-[72px] relative",
                isActive
                  ? "text-primary bg-primary/10 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {showBadge && (
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
      </div>
    </nav>
  );
}
