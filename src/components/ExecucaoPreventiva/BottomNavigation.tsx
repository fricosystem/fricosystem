import { LayoutDashboard, Calendar, CalendarDays, History, User, AlertTriangle, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type TabType = "dashboard" | "timeline" | "calendario" | "historico" | "perfil" | "paradas" | "historico-paradas";

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  badgeCounts?: {
    preventivas?: number;
    paradas?: number;
  };
}

export function BottomNavigation({ activeTab, onTabChange, badgeCounts }: BottomNavigationProps) {
  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "timeline" as const, label: "Preventivas", icon: Calendar, badgeKey: "preventivas" as const },
    { id: "paradas" as const, label: "Paradas", icon: AlertTriangle, badgeKey: "paradas" as const },
    { id: "calendario" as const, label: "Calendário", icon: CalendarDays },
    { id: "historico" as const, label: "Histórico", icon: History },
    { id: "historico-paradas" as const, label: "Hist. Paradas", icon: ClipboardCheck },
    { id: "perfil" as const, label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t pb-safe">
      <div className="flex justify-start md:justify-center py-2 px-2 overflow-x-auto scrollbar-hide gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount = tab.badgeKey && badgeCounts?.[tab.badgeKey];
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors flex-shrink-0 min-w-[70px] relative",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badgeCount !== undefined && badgeCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-3 h-4 min-w-[16px] flex items-center justify-center p-0 text-[10px]"
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
