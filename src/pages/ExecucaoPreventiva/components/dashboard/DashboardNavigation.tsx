import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wrench, AlertTriangle, ClipboardCheck, Target, BarChart3, ChevronUp, ChevronDown, Navigation, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SecaoDashboard, SECOES_DASHBOARD } from "./dashboardUtils";

interface DashboardNavigationProps {
  activeSection?: SecaoDashboard;
  onNavigate: (sectionId: SecaoDashboard) => void;
}

const iconMap = {
  Wrench,
  AlertTriangle,
  ClipboardCheck,
  Target,
  BarChart3,
};

export function DashboardNavigation({ activeSection, onNavigate }: DashboardNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNavigate = (sectionId: SecaoDashboard) => {
    onNavigate(sectionId);
    setIsExpanded(false);
  };

  // Seções filtradas (removendo "indicadores" que está vazio)
  const secoesVisiveis = SECOES_DASHBOARD.filter(s => s.id !== "indicadores");

  return (
    <Card
      className={cn(
        "fixed bottom-20 right-4 z-50 shadow-xl border-2 transition-all duration-300 bg-background/95 backdrop-blur-sm",
        isExpanded ? "p-4 min-w-[200px]" : "p-2"
      )}
    >
      <div className="flex flex-col gap-2">
        {/* Botão de toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-full flex items-center justify-between gap-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" />
            {isExpanded && <span className="text-sm font-medium">Navegação Rápida</span>}
          </div>
          {isExpanded ? (
            <X className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>

        {/* Botões de seção */}
        {isExpanded && (
          <div className="flex flex-col gap-1.5 pt-1">
            {secoesVisiveis.map((secao) => {
              const Icon = iconMap[secao.icon as keyof typeof iconMap];
              const isActive = activeSection === secao.id;
              
              return (
                <Button
                  key={secao.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 justify-start gap-2 text-sm font-medium",
                    isActive && "bg-primary text-primary-foreground shadow-md"
                  )}
                  onClick={() => handleNavigate(secao.id)}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {secao.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
