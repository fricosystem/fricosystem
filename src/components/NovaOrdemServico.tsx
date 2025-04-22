import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NovaOrdemServico = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    setor: "",
    equipamento: "",
    hrInicial: "",
    hrFinal: "",
    tempoParada: "",
    linhaParada: "",
    descricaoMotivo: "",
    observacao: "",
    origem: "",
    responsavelManutencao: ""
  });
  
  const [origemParada, setOrigemParada] = useState({
    automatizacao: false,
    terceiros: false,
    eletrica: false,
    mecanica: false,
    outro: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOrigemChange = (origem: string, checked: boolean) => {
    setOrigemParada(prev => ({
      ...prev,
      [origem]: checked
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.setor || !formData.equipamento || !formData.descricaoMotivo) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const ordemData = {
        ...formData,
        origemParada,
        criadoPor: currentUser?.uid,
        criadoEm: Timestamp.now(),
        status: "pendente"
      };
      
      await addDoc(collection(db, "ordens_servicos"), ordemData);
      
      toast.success("Ordem de serviço criada com sucesso!");
      
      // Reseta o formulário
      setFormData({
        setor: "",
        equipamento: "",
        hrInicial: "",
        hrFinal: "",
        tempoParada: "",
        linhaParada: "",
        descricaoMotivo: "",
        observacao: "",
        origem: "",
        responsavelManutencao: ""
      });
      
      setOrigemParada({
        automatizacao: false,
        terceiros: false,
        eletrica: false,
        mecanica: false,
        outro: false
      });
      
    } catch (error) {
      console.error("Erro ao criar ordem de serviço:", error);
      toast.error("Erro ao criar ordem de serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Nova Ordem de Serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="setor">Setor*</Label>
              <Select 
                value={formData.setor} 
                onValueChange={(value) => handleSelectChange("setor", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Produção">Produção</SelectItem>
                  <SelectItem value="Embalagem">Embalagem</SelectItem>
                  <SelectItem value="Expedição">Expedição</SelectItem>
                  <SelectItem value="Armazenamento">Armazenamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="equipamento">Equipamento*</Label>
              <Input
                id="equipamento"
                name="equipamento"
                value={formData.equipamento}
                onChange={handleChange}
                placeholder="Digite o equipamento"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hrInicial">Hora Inicial</Label>
              <Input
                id="hrInicial"
                name="hrInicial"
                type="time"
                value={formData.hrInicial}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hrFinal">Hora Final</Label>
              <Input
                id="hrFinal"
                name="hrFinal"
                type="time"
                value={formData.hrFinal}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tempoParada">Tempo de Parada</Label>
              <Input
                id="tempoParada"
                name="tempoParada"
                value={formData.tempoParada}
                onChange={handleChange}
                placeholder="Tempo em minutos"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linhaParada">Linha Parada</Label>
              <Input
                id="linhaParada"
                name="linhaParada"
                value={formData.linhaParada}
                onChange={handleChange}
                placeholder="Digite a linha"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descricaoMotivo">Descrição do Motivo da Parada*</Label>
            <Textarea
              id="descricaoMotivo"
              name="descricaoMotivo"
              value={formData.descricaoMotivo}
              onChange={handleChange}
              rows={4}
              placeholder="Descreva detalhadamente o motivo da parada"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Origem da Parada</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="automatizacao" 
                  checked={origemParada.automatizacao}
                  onCheckedChange={(checked) => handleOrigemChange("automatizacao", checked as boolean)}
                />
                <Label htmlFor="automatizacao">Automatização</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terceiros" 
                  checked={origemParada.terceiros}
                  onCheckedChange={(checked) => handleOrigemChange("terceiros", checked as boolean)}
                />
                <Label htmlFor="terceiros">Terceiros</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="eletrica" 
                  checked={origemParada.eletrica}
                  onCheckedChange={(checked) => handleOrigemChange("eletrica", checked as boolean)}
                />
                <Label htmlFor="eletrica">Elétrica</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="mecanica" 
                  checked={origemParada.mecanica}
                  onCheckedChange={(checked) => handleOrigemChange("mecanica", checked as boolean)}
                />
                <Label htmlFor="mecanica">Mecânica</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="outro" 
                  checked={origemParada.outro}
                  onCheckedChange={(checked) => handleOrigemChange("outro", checked as boolean)}
                />
                <Label htmlFor="outro">Outro</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="responsavelManutencao">Responsável pela Manutenção</Label>
            <Input
              id="responsavelManutencao"
              name="responsavelManutencao"
              value={formData.responsavelManutencao}
              onChange={handleChange}
              placeholder="Nome do responsável"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação da Manutenção</Label>
            <Textarea
              id="observacao"
              name="observacao"
              value={formData.observacao}
              onChange={handleChange}
              rows={3}
              placeholder="Observações adicionais"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Salvar Ordem de Serviço"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NovaOrdemServico;
