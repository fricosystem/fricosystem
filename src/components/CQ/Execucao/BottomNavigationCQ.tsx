import { LayoutDashboard, ClipboardCheck, AlertOctagon, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type TabType = "dashboard" | "inspecoes" | "nc" | "agenda" | "perfil";

interface BottomNavigationCQProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  badgeCounts?: {
    inspecoes?: number;
    nc?: number;
    agenda?: number;
  };
}

export function BottomNavigationCQ({ activeTab, onTabChange, badgeCounts }: BottomNavigationCQProps) {
  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: LayoutDashboard },
    { id: "inspecoes" as TabType, label: "Inspeções", icon: ClipboardCheck, badgeKey: "inspecoes" as const },
    { id: "nc" as TabType, label: "Desvios", icon: AlertOctagon, badgeKey: "nc" as const },
    { id: "agenda" as TabType, label: "Agenda", icon: Calendar, badgeKey: "agenda" as const },
    { id: "perfil" as TabType, label: "Perfil", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <nav className="flex justify-around py-3 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount = tab.badgeKey && badgeCounts?.[tab.badgeKey];

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-2 px-3 rounded-2xl transition-all min-w-[64px] relative",
                isActive
                  ? "text-cyan-400 bg-cyan-500/10 shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-6 w-6 transition-transform", isActive && "scale-110")} />
                {badgeCount !== undefined && badgeCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-3 h-5 min-w-[18px] flex items-center justify-center p-0 text-[10px] font-black bg-rose-600 border-2 border-slate-950"
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tighter transition-colors",
                isActive ? "text-cyan-400" : "text-slate-600"
              )}>
                {tab.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 h-1 w-8 bg-cyan-500 rounded-full blur-[2px] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
