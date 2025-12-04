import { LayoutDashboard, Calendar, CalendarDays, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: "dashboard" | "timeline" | "calendario" | "historico" | "perfil";
  onTabChange: (tab: "dashboard" | "timeline" | "calendario" | "historico" | "perfil") => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "timeline" as const, label: "Timeline", icon: Calendar },
    { id: "calendario" as const, label: "Calendário", icon: CalendarDays },
    { id: "historico" as const, label: "Histórico", icon: History },
    { id: "perfil" as const, label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t pb-safe">
      <div className="flex justify-around py-2 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
