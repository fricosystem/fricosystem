import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface AddMetricaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamentoId: string;
  onSuccess: () => void;
}

export const AddMetricaModal = ({ 
  open, 
  onOpenChange, 
  equipamentoId,
  onSuccess 
}: AddMetricaModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    mes: String(currentDate.getMonth() + 1).padStart(2, '0'),
    ano: currentDate.getFullYear(),
    disponibilidade: 0,
    performance: 0,
    qualidade: 0,
    custoPreventiva: 0,
    custoCorretiva: 0,
  });

  const meses = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const anos = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.disponibilidade < 0 || formData.disponibilidade > 100 ||
        formData.performance < 0 || formData.performance > 100 ||
        formData.qualidade < 0 || formData.qualidade > 100) {
      toast({
        title: "Erro",
        description: "Os valores percentuais devem estar entre 0 e 100.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "metricas_equipamento"), {
        equipamentoId,
        mes: formData.mes,
        ano: Number(formData.ano),
        disponibilidade: Number(formData.disponibilidade),
        performance: Number(formData.performance),
        qualidade: Number(formData.qualidade),
        custoPreventiva: Number(formData.custoPreventiva),
        custoCorretiva: Number(formData.custoCorretiva),
        criadoEm: serverTimestamp(),
      });

      toast({
        title: "Sucesso",
        description: "Métrica registrada com sucesso!",
      });
      
      onSuccess();
      onOpenChange(false);
      setFormData({
        mes: String(currentDate.getMonth() + 1).padStart(2, '0'),
        ano: currentDate.getFullYear(),
        disponibilidade: 0,
        performance: 0,
        qualidade: 0,
        custoPreventiva: 0,
        custoCorretiva: 0,
      });
    } catch (error) {
      console.error("Erro ao registrar métrica:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a métrica.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const oee = ((formData.disponibilidade / 100) * (formData.performance / 100) * (formData.qualidade / 100) * 100).toFixed(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Métrica de Performance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mes">Mês</Label>
              <Select
                value={formData.mes}
                onValueChange={(value) => setFormData({ ...formData, mes: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Select
                value={String(formData.ano)}
                onValueChange={(value) => setFormData({ ...formData, ano: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((ano) => (
                    <SelectItem key={ano} value={String(ano)}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="disponibilidade">Disponibilidade (%)</Label>
              <Input
                id="disponibilidade"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.disponibilidade}
                onChange={(e) => setFormData({ ...formData, disponibilidade: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="performance">Performance (%)</Label>
              <Input
                id="performance"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.performance}
                onChange={(e) => setFormData({ ...formData, performance: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualidade">Qualidade (%)</Label>
              <Input
                id="qualidade"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.qualidade}
                onChange={(e) => setFormData({ ...formData, qualidade: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <Label>OEE Calculado</Label>
            <p className="text-2xl font-bold">{oee}%</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="custoPreventiva">Custo Preventiva (R$)</Label>
              <Input
                id="custoPreventiva"
                type="number"
                step="0.01"
                value={formData.custoPreventiva}
                onChange={(e) => setFormData({ ...formData, custoPreventiva: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custoCorretiva">Custo Corretiva (R$)</Label>
              <Input
                id="custoCorretiva"
                type="number"
                step="0.01"
                value={formData.custoCorretiva}
                onChange={(e) => setFormData({ ...formData, custoCorretiva: Number(e.target.value) })}
              />
            </div>
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
