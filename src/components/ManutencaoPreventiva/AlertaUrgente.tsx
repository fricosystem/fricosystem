import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { AlertaManutencao } from "@/types/typesAlertasManutencao";

interface AlertaUrgenteProps {
  alerta: AlertaManutencao | null;
  open: boolean;
  onClose: () => void;
  onVerDetalhes: () => void;
}

export const AlertaUrgente = ({ alerta, open, onClose, onVerDetalhes }: AlertaUrgenteProps) => {
  if (!alerta) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-6 w-6" />
            <DialogTitle>Manutenção Crítica!</DialogTitle>
          </div>
          <DialogDescription className="pt-4">
            <div className="space-y-2">
              <p className="font-semibold text-foreground">{alerta.tarefaNome}</p>
              <p className="text-sm">
                Equipamento: <span className="font-medium">{alerta.maquinaNome}</span>
              </p>
              <p className="text-sm">
                {alerta.diasRestantes < 0 
                  ? `Atrasada há ${Math.abs(alerta.diasRestantes)} dia(s)`
                  : `Vence ${alerta.diasRestantes === 0 ? 'hoje' : `em ${alerta.diasRestantes} dia(s)`}`
                }
              </p>
              {alerta.ordemServicoId && (
                <p className="text-sm">
                  Ordem de Serviço já foi gerada automaticamente.
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Entendido
          </Button>
          <Button onClick={onVerDetalhes}>
            Ver Detalhes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
