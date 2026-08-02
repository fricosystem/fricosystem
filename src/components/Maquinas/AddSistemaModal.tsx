import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface Sistema {
  id: string;
  nome: string;
  x: number;
  y: number;
  tipo: string;
  status: "Normal" | "Atenção" | "Crítico";
  totalPecas: number;
  pecas?: any[];
}

interface AddSistemaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamentoId: string;
  sistemas: Sistema[];
  editingSistema?: Sistema | null;
  onSuccess: () => void;
}

export const AddSistemaModal = ({ 
  open, 
  onOpenChange, 
  equipamentoId, 
  sistemas,
  editingSistema, 
  onSuccess 
}: AddSistemaModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Sistema>>(
    editingSistema || {
      nome: "",
      x: 120,
      y: 150,
      tipo: "Mecânico",
      status: "Normal",
      totalPecas: 0,
      pecas: []
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome) {
      toast({
        title: "Erro",
        description: "Nome do sistema é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let novosSistemas = [...sistemas];
      
      if (editingSistema?.id) {
        // Atualizar sistema existente
        novosSistemas = sistemas.map(s => 
          s.id === editingSistema.id ? { ...s, ...formData } as Sistema : s
        );
      } else {
        // Adicionar novo sistema
        const novoSistema: Sistema = {
          id: `sistema-${Date.now()}`,
          nome: formData.nome || "",
          x: formData.x || 120,
          y: formData.y || 150,
          tipo: formData.tipo || "Mecânico",
          status: formData.status || "Normal",
          totalPecas: 0,
          pecas: []
        };
        novosSistemas.push(novoSistema);
      }

      // Atualizar documento no Firestore
      await updateDoc(doc(db, "equipamentos", equipamentoId), {
        sistemas: novosSistemas
      });

      toast({
        title: "Sucesso",
        description: editingSistema ? "Sistema atualizado com sucesso!" : "Sistema adicionado com sucesso!",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar sistema:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o sistema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingSistema ? "Editar Sistema" : "Adicionar Novo Sistema"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Sistema *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Sistema Principal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Input
              id="tipo"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              placeholder="Ex: Mecânico-Elétrico"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "Normal" | "Atenção" | "Crítico") =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Atenção">Atenção</SelectItem>
                <SelectItem value="Crítico">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="x">Posição X</Label>
              <Input
                id="x"
                type="number"
                value={formData.x}
                onChange={(e) => setFormData({ ...formData, x: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="y">Posição Y</Label>
              <Input
                id="y"
                type="number"
                value={formData.y}
                onChange={(e) => setFormData({ ...formData, y: Number(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editingSistema ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};