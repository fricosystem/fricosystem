import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addManutentor } from "@/firebase/manutencaoPreventiva";
import { TipoManutencao } from "@/types/typesManutencaoPreventiva";

interface NovoManutentorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TIPOS_MANUTENCAO: TipoManutencao[] = [
  "Elétrica",
  "Mecânica",
  "Hidráulica",
  "Pneumática",
  "Lubrificação",
  "Calibração",
  "Inspeção"
];

export function NovoManutentorModal({ open, onOpenChange, onSuccess }: NovoManutentorModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState<TipoManutencao>("Mecânica");
  const [ativo, setAtivo] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await addManutentor({
        nome: nome.trim(),
        funcao,
        ativo
      });

      toast({
        title: "Sucesso",
        description: "Manutentor cadastrado com sucesso"
      });

      setNome("");
      setFuncao("Mecânica");
      setAtivo(true);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar manutentor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Manutentor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do manutentor"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="funcao">Função *</Label>
            <Select value={funcao} onValueChange={(v) => setFuncao(v as TipoManutencao)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_MANUTENCAO.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={setAtivo}
            />
            <Label htmlFor="ativo">Ativo</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
