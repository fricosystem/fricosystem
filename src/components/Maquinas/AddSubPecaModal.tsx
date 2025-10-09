import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface SubPeca {
  id?: string;
  nome: string;
  codigo: string;
  status: "Normal" | "Atenção" | "Crítico";
  emEstoque: number;
  estoqueMinimo: number;
  pecaId: string;
  valorUnitario: number;
  fornecedor: string;
  descricao: string;
}

interface AddSubPecaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamentoId: string;
  sistemaId: string;
  pecaId: string;
  sistemas: any[];
  editingSubPeca?: SubPeca | null;
  onSuccess: () => void;
}

export const AddSubPecaModal = ({ 
  open, 
  onOpenChange, 
  equipamentoId,
  sistemaId,
  pecaId, 
  sistemas,
  editingSubPeca, 
  onSuccess 
}: AddSubPecaModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<SubPeca>>(
    editingSubPeca || {
      nome: "",
      codigo: "",
      status: "Normal",
      emEstoque: 0,
      estoqueMinimo: 0,
      pecaId,
      valorUnitario: 0,
      fornecedor: "",
      descricao: "",
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.codigo) {
      toast({
        title: "Erro",
        description: "Nome e código são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const novosSistemas = sistemas.map(sistema => {
        if (sistema.id === sistemaId) {
          const pecas = (sistema.pecas || []).map((peca: any) => {
            if (peca.id === pecaId) {
              const subPecas = peca.subPecas || [];
              
              if (editingSubPeca?.id) {
                // Atualizar sub-peça existente
                return {
                  ...peca,
                  subPecas: subPecas.map((sp: any) => 
                    sp.id === editingSubPeca.id ? { ...sp, ...formData } : sp
                  )
                };
              } else {
                // Adicionar nova sub-peça
                const novaSubPeca = {
                  id: `subpeca-${Date.now()}`,
                  ...formData
                };
                return {
                  ...peca,
                  subPecas: [...subPecas, novaSubPeca]
                };
              }
            }
            return peca;
          });
          
          return { ...sistema, pecas };
        }
        return sistema;
      });

      // Atualizar documento no Firestore
      await updateDoc(doc(db, "equipamentos", equipamentoId), {
        sistemas: novosSistemas
      });

      toast({
        title: "Sucesso",
        description: editingSubPeca ? "Sub-peça atualizada com sucesso!" : "Sub-peça cadastrada com sucesso!",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar sub-peça:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a sub-peça.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingSubPeca ? "Editar Sub-peça" : "Adicionar Nova Sub-peça"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Sub-peça *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Rolamento Frontal"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: MOT-001-A"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da sub-peça"
              rows={3}
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
              <Label htmlFor="emEstoque">Em Estoque</Label>
              <Input
                id="emEstoque"
                type="number"
                value={formData.emEstoque}
                onChange={(e) => setFormData({ ...formData, emEstoque: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
              <Input
                id="estoqueMinimo"
                type="number"
                value={formData.estoqueMinimo}
                onChange={(e) => setFormData({ ...formData, estoqueMinimo: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorUnitario">Valor Unitário (R$)</Label>
              <Input
                id="valorUnitario"
                type="number"
                step="0.01"
                value={formData.valorUnitario}
                onChange={(e) => setFormData({ ...formData, valorUnitario: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input
                id="fornecedor"
                value={formData.fornecedor}
                onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                placeholder="Nome do fornecedor"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editingSubPeca ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
