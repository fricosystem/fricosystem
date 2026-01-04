import { AlertTriangle, User, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type TabType = "paradas" | "os" | "perfil";

interface BottomNavigationParadaProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  badgeCount?: number;
}

export function BottomNavigationParada({ activeTab, onTabChange, badgeCount }: BottomNavigationParadaProps) {
  const tabs = [
    { id: "paradas" as const, label: "Paradas", icon: AlertTriangle, hasBadge: true },
    { id: "os" as const, label: "OS", icon: ClipboardList, hasBadge: false },
    { id: "perfil" as const, label: "Perfil", icon: User, hasBadge: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t pb-safe">
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
