import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateTarefa } from "@/types/typesTemplatesTarefas";
import { Clock, Wrench, Building, Settings, AlertTriangle } from "lucide-react";

interface TemplateDetalhesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateTarefa | null;
  onUsar: () => void;
}

export function TemplateDetalhesModal({ open, onOpenChange, template, onUsar }: TemplateDetalhesModalProps) {
  if (!template) return null;

  const getPrioridadeBadge = (prioridade: string) => {
    const styles = {
      baixa: "bg-green-500",
      media: "bg-yellow-500",
      alta: "bg-orange-500",
      critica: "bg-red-500"
    };
    const labels = {
      baixa: "Baixa",
      media: "Média",
      alta: "Alta",
      critica: "Crítica"
    };
    return <Badge className={styles[prioridade as keyof typeof styles]}>{labels[prioridade as keyof typeof labels]}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {template.titulo}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{template.tipo}</Badge>
            <Badge variant="secondary">{template.periodoLabel}</Badge>
            {getPrioridadeBadge(template.prioridade)}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Máquina:</span>
              <span className="font-medium">{template.maquinaNome}</span>
            </div>
            
            {template.setor && (
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Setor:</span>
                <span className="font-medium">{template.setor}</span>
              </div>
            )}
            
            {template.sistema && (
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sistema:</span>
                <span className="font-medium">{template.sistema}</span>
              </div>
            )}
            
            {template.tempoEstimado > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tempo:</span>
                <span className="font-medium">{template.tempoEstimado} min</span>
              </div>
            )}
          </div>

          {(template.componente || template.subconjunto) && (
            <div className="text-sm">
              {template.subconjunto && (
                <p><span className="text-muted-foreground">Subconjunto:</span> {template.subconjunto}</p>
              )}
              {template.componente && (
                <p><span className="text-muted-foreground">Componente:</span> {template.componente}</p>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Descrição da Tarefa</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{template.descricaoTarefa}</p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={onUsar}>
              Usar Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
