import { useState } from "react";
import ParadasAbertas from "./ParadasAbertas";
import HistoricoParadas from "./HistoricoParadas";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TabType = "abertas" | "historico";

interface ParadasTabProps {
  onCountChange?: (count: number) => void;
  onStatsChange?: (stats: { abertas: number; emAndamento: number; concluidas: number; total: number }) => void;
  openCount?: number;
}

export function ParadasTab({ onCountChange, onStatsChange, openCount = 0 }: ParadasTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>("abertas");

  const tabs = [
    { id: "abertas" as TabType, label: "Abertas" },
    { id: "historico" as TabType, label: "Histórico" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs estilizadas */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center bg-muted/30 rounded-xl p-1 backdrop-blur-sm border border-border/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.id === "abertas" && openCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-[20px] flex items-center justify-center p-0 text-xs font-bold">
                  {openCount > 99 ? "99+" : openCount}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Conteúdo das Tabs */}
      {activeTab === "abertas" && (
        <ParadasAbertas 
          onCountChange={onCountChange}
          onStatsChange={onStatsChange}
        />
      )}
      
      {activeTab === "historico" && (
        <HistoricoParadas />
      )}
    </div>
  );
}
