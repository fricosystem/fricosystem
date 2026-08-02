import React, { useState } from "react";
import { Bell, X, AlertTriangle, Clock, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useManutencaoAlerts } from "@/contexts/ManutencaoAlertsContext";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

export const NotificacoesWidget = () => {
  const { alertas, alertasNaoLidos, marcarComoLido, marcarTodosComoLidos } = useManutencaoAlerts();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case "critico":
        return "text-red-500";
      case "alto":
        return "text-orange-500";
      case "medio":
        return "text-yellow-500";
      default:
        return "text-green-500";
    }
  };

  const getUrgenciaIcon = (urgencia: string) => {
    switch (urgencia) {
      case "critico":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "alto":
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-yellow-500" />;
    }
  };

  const handleAlertaClick = (alerta: any) => {
    marcarComoLido(alerta.id);
    setOpen(false);
    navigate("/manutencao-preventiva");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {alertasNaoLidos > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {alertasNaoLidos}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-semibold">Alertas de Manutenção</h3>
          {alertasNaoLidos > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={marcarTodosComoLidos}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todos
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {alertas.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum alerta pendente</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {alertas.map((alerta) => (
              <DropdownMenuItem
                key={alerta.id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent"
                onClick={() => handleAlertaClick(alerta)}
              >
                <div className="flex items-start gap-2 w-full">
                  {getUrgenciaIcon(alerta.urgencia)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {alerta.tarefaNome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alerta.maquinaNome}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getUrgenciaColor(alerta.urgencia)}`}
                      >
                        {alerta.diasRestantes === 0
                          ? "Hoje"
                          : alerta.diasRestantes < 0
                          ? `${Math.abs(alerta.diasRestantes)}d atrasado`
                          : `${alerta.diasRestantes}d restantes`}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer justify-center"
          onClick={() => {
            setOpen(false);
            navigate("/automacao-manutencao");
          }}
        >
          Ver todas as configurações
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
