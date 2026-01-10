import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wrench, AlertTriangle, ClipboardCheck, Target, BarChart3, ChevronUp, ChevronDown, Navigation } from "lucide-react";
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

  return (
    <Card
      className={cn(
        "fixed bottom-20 right-4 z-50 shadow-xl border-2 transition-all duration-300",
        isExpanded ? "p-3" : "p-2"
      )}
    >
      <div className="flex flex-col gap-2">
        {/* Botão de toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full flex items-center justify-between gap-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" />
            {isExpanded && <span className="text-xs font-medium">Navegação</span>}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>

        {/* Botões de seção */}
        {isExpanded && (
          <div className="flex flex-col gap-1">
            {SECOES_DASHBOARD.map((secao) => {
              const Icon = iconMap[secao.icon as keyof typeof iconMap];
              const isActive = activeSection === secao.id;
              
              return (
                <Button
                  key={secao.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 justify-start gap-2 text-xs",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleNavigate(secao.id)}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
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
