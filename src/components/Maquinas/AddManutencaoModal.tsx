import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface AddManutencaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamentoId: string;
  pecas: any[];
  onSuccess: () => void;
}

export const AddManutencaoModal = ({ 
  open, 
  onOpenChange, 
  equipamentoId,
  pecas,
  onSuccess 
}: AddManutencaoModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pecaId: "",
    data: new Date().toISOString().split('T')[0],
    tipo: "Preventiva" as "Preventiva" | "Corretiva",
    custo: 0,
    tecnico: "",
    descricao: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.data || !formData.tecnico) {
      toast({
        title: "Erro",
        description: "Data e técnico são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "manutencoes"), {
        equipamentoId,
        pecaId: formData.pecaId || null,
        data: new Date(formData.data),
        tipo: formData.tipo,
        custo: Number(formData.custo),
        tecnico: formData.tecnico,
        descricao: formData.descricao,
        criadoEm: serverTimestamp(),
      });

      toast({
        title: "Sucesso",
        description: "Manutenção registrada com sucesso!",
      });
      
      onSuccess();
      onOpenChange(false);
      setFormData({
        pecaId: "",
        data: new Date().toISOString().split('T')[0],
        tipo: "Preventiva",
        custo: 0,
        tecnico: "",
        descricao: "",
      });
    } catch (error) {
      console.error("Erro ao registrar manutenção:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a manutenção.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Manutenção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Manutenção</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: "Preventiva" | "Corretiva") =>
                setFormData({ ...formData, tipo: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Preventiva">Preventiva</SelectItem>
                <SelectItem value="Corretiva">Corretiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pecaId">Peça (opcional)</Label>
            <Select
              value={formData.pecaId}
              onValueChange={(value) => setFormData({ ...formData, pecaId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma peça" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhuma peça específica</SelectItem>
                {pecas.map((peca) => (
                  <SelectItem key={peca.id} value={peca.id}>
                    {peca.nome} ({peca.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custo">Custo (R$)</Label>
              <Input
                id="custo"
                type="number"
                step="0.01"
                value={formData.custo}
                onChange={(e) => setFormData({ ...formData, custo: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tecnico">Técnico Responsável *</Label>
            <Input
              id="tecnico"
              value={formData.tecnico}
              onChange={(e) => setFormData({ ...formData, tecnico: e.target.value })}
              placeholder="Nome do técnico"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição detalhada da manutenção"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
