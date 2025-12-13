import { AlertTriangle, History, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type TabType = "paradas" | "historico" | "perfil";

interface BottomNavigationParadaProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  badgeCount?: number;
}

export function BottomNavigationParada({ activeTab, onTabChange, badgeCount }: BottomNavigationParadaProps) {
  const tabs = [
    { id: "paradas" as const, label: "Paradas", icon: AlertTriangle, hasBadge: true },
    { id: "historico" as const, label: "Histórico", icon: History, hasBadge: false },
    { id: "perfil" as const, label: "Perfil", icon: User, hasBadge: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t pb-safe">
      <div className="flex justify-center py-3 px-4">
        <div className="inline-flex items-center bg-muted/30 rounded-xl p-1 backdrop-blur-sm border border-border/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const showBadge = tab.hasBadge && badgeCount !== undefined && badgeCount > 0;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 py-2.5 px-5 rounded-lg transition-all duration-200 relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {showBadge && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-3 h-4 min-w-[16px] flex items-center justify-center p-0 text-[10px] font-bold"
                    >
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
