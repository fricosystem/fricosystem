import { useState } from "react";
import ParadasAbertas from "@/components/ParadaMaquina/ParadasAbertas";
import HistoricoParadas from "@/components/ParadaMaquina/HistoricoParadas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TabType = "abertas" | "historico";

interface ParadasTabProps {
  onCountChange?: (count: number) => void;
  onStatsChange?: (stats: { abertas: number; emAndamento: number; concluidas: number; total: number }) => void;
  openCount?: number;
}

export function ParadasTab({ onCountChange, onStatsChange, openCount = 0 }: ParadasTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>("abertas");

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="abertas" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Abertas
            {openCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] flex items-center justify-center p-0 text-xs font-bold">
                {openCount > 99 ? "99+" : openCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="abertas" className="mt-0">
          <ParadasAbertas 
            onCountChange={onCountChange}
            onStatsChange={onStatsChange}
          />
        </TabsContent>
        
        <TabsContent value="historico" className="mt-0">
          <HistoricoParadas />
        </TabsContent>
      </Tabs>
    </div>
  );
}
