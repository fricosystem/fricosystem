import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { iniciarTarefa } from "@/firebase/manutencaoPreventiva";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IniciarTarefaModalProps {
  tarefa: TarefaManutencao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IniciarTarefaModal({ tarefa, open, onOpenChange }: IniciarTarefaModalProps) {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleIniciar = async () => {
    if (!userData?.email) return;

    setLoading(true);
    try {
      await iniciarTarefa(tarefa.id, userData.email);
      toast({
        title: "Tarefa Iniciada",
        description: "A manutenção foi iniciada com sucesso.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao iniciar tarefa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível iniciar a tarefa.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar Manutenção</DialogTitle>
          <DialogDescription>
            Confirme o início da manutenção preventiva
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ordem de Serviço */}
          {tarefa.ordemId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium font-mono">{tarefa.ordemId}</p>
            </div>
          )}

          {/* Máquina */}
          <div>
            <p className="text-sm font-medium mb-1">Máquina</p>
            <p className="text-sm text-muted-foreground">{tarefa.maquinaNome}</p>
          </div>

          {/* Descrição */}
          <div>
            <p className="text-sm font-medium mb-1">Descrição</p>
            <p className="text-sm text-muted-foreground">{tarefa.descricaoTarefa}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Wrench className="h-4 w-4" />
                <span>Tipo</span>
              </div>
              <p className="text-sm font-medium">{tarefa.tipo}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span>Data Agendada</span>
              </div>
              <p className="text-sm font-medium">
                {format(new Date(tarefa.proximaExecucao), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>

            {tarefa.setor && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Setor</p>
                <p className="text-sm font-medium">{tarefa.setor}</p>
              </div>
            )}
          </div>

          {/* Sistema/Componente */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Sistema e Componente</p>
            <p className="text-sm font-medium">
              {tarefa.sistema} → {tarefa.subconjunto} → {tarefa.componente}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleIniciar} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Iniciando..." : "Iniciar Manutenção"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
