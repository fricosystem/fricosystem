import React, { useState, useEffect } from "react";
import { collection, Timestamp, getDocs, query, limit, doc, writeBatch } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Equipamento {
  id: string;
  patrimonio: string;
  equipamento: string;
  setor: string;
  tag: string;
}

interface Setor {
  id: string;
  nome: string;
}

interface TipoFalha {
  id: string;
  nome: string;
}

interface InitialData {
  setor: string;
  equipamento: string;
}

interface NovaParadaMaquinaProps {
  onSuccess?: () => void;
  initialData?: InitialData | null;
}

const NovaParadaMaquina = ({ onSuccess, initialData }: NovaParadaMaquinaProps) => {
  const { user, userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [tiposFalhas, setTiposFalhas] = useState<TipoFalha[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);
  const [loadingTiposFalhas, setLoadingTiposFalhas] = useState(false);
  const [collectionChecked, setCollectionChecked] = useState(false);
  
  const [formData, setFormData] = useState({
    setor: "",
    equipamento: "",
    hrInicial: "",
    hrFinal: "",
    linhaParada: "",
    descricaoMotivo: "",
    observacao: "",
    tipoManutencao: "",
    solucaoAplicada: "",
  });

  // Apply initial data from QR scan - aguarda equipamentos carregarem
  useEffect(() => {
    if (initialData && !loadingEquipamentos && equipamentos.length > 0) {
      // Busca o equipamento na lista para pegar o setor correto
      const equipamentoEncontrado = equipamentos.find(
        e => e.equipamento.toLowerCase() === initialData.equipamento?.toLowerCase()
      );
      
      if (equipamentoEncontrado) {
        setFormData(prev => ({
          ...prev,
          setor: equipamentoEncontrado.setor,
          equipamento: equipamentoEncontrado.equipamento
        }));
      } else {
        // Se não encontrar na lista, usa os dados do initialData diretamente
        setFormData(prev => ({
          ...prev,
          setor: initialData.setor || "",
          equipamento: initialData.equipamento || ""
        }));
      }
    }
  }, [initialData, loadingEquipamentos, equipamentos]);

  const [origemParada, setOrigemParada] = useState({
    automatizacao: false,
    terceiros: false,
    eletrica: false,
    mecanica: false,
    outro: false
  });

  useEffect(() => {
    const checkCollection = async () => {
      try {
        const q = query(collection(db, "paradas_maquina"), limit(1));
        await getDocs(q);
        setCollectionChecked(true);
      } catch (error) {
        toast.error("Erro ao verificar estrutura do banco de dados");
      }
    };

    if (!collectionChecked) {
      checkCollection();
    }
  }, [collectionChecked]);


  useEffect(() => {
    const fetchEquipamentos = async () => {
      try {
        setLoadingEquipamentos(true);
        const equipamentosRef = collection(db, "equipamentos");
        const querySnapshot = await getDocs(equipamentosRef);
        
        const equipamentosData: Equipamento[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          equipamentosData.push({
            id: doc.id,
            patrimonio: data.patrimonio || "",
            equipamento: data.equipamento || "",
            setor: data.setor || "",
            tag: data.tag || "",
          });
        });
        
        setEquipamentos(equipamentosData);
      } catch (error) {
        console.error("Erro ao buscar equipamentos:", error);
        toast.error("Não foi possível carregar a lista de equipamentos.");
      } finally {
        setLoadingEquipamentos(false);
      }
    };

    fetchEquipamentos();
  }, []);


  useEffect(() => {
    const fetchSetores = async () => {
      try {
        setLoadingSetores(true);
        const setoresRef = collection(db, "setores");
        const querySnapshot = await getDocs(setoresRef);
        
        const setoresData: Setor[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          setoresData.push({
            id: doc.id,
            nome: data.nome || "",
          });
        });
        
        setSetores(setoresData);
      } catch (error) {
        console.error("Erro ao buscar setores:", error);
        toast.error("Não foi possível carregar a lista de setores.");
      } finally {
        setLoadingSetores(false);
      }
    };

    fetchSetores();
  }, []);

  useEffect(() => {
    const fetchTiposFalhas = async () => {
      try {
        setLoadingTiposFalhas(true);
        const tiposFalhasRef = collection(db, "tipos_falhas");
        const querySnapshot = await getDocs(tiposFalhasRef);
        
        const tiposFalhasData: TipoFalha[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          tiposFalhasData.push({
            id: doc.id,
            nome: data.nome || "",
          });
        });
        
        setTiposFalhas(tiposFalhasData);
      } catch (error) {
        console.error("Erro ao buscar tipos de falhas:", error);
        toast.error("Não foi possível carregar a lista de tipos de falhas.");
      } finally {
        setLoadingTiposFalhas(false);
      }
    };

    fetchTiposFalhas();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    setIsSubmitting(true);
    
    try {
      if (!formData.equipamento || !formData.descricaoMotivo) {
        toast.error("Por favor, preencha os campos obrigatórios");
        setIsSubmitting(false);
        return;
      }
      
      const batch = writeBatch(db);
      
      const paradaData = {
        setor: formData.setor,
        equipamento: formData.equipamento,
        hrInicial: formData.hrInicial,
        hrFinal: formData.hrFinal,
        linhaParada: formData.linhaParada,
        descricaoMotivo: formData.descricaoMotivo,
        observacao: formData.observacao,
        origemParada: origemParada,
        tipoManutencao: formData.tipoManutencao,
        solucaoAplicada: formData.solucaoAplicada,
        criadoPor: user?.uid || "",
        criadoEm: Timestamp.now(),
        status: "pendente"
      };
      
      const paradaRef = doc(collection(db, "paradas_maquina"));
      batch.set(paradaRef, paradaData);
      
      await batch.commit();
      
      toast.success("Parada de máquina registrada com sucesso!");
      
      setFormData({
        setor: "",
        equipamento: "",
        hrInicial: "",
        hrFinal: "",
        linhaParada: "",
        descricaoMotivo: "",
        observacao: "",
        tipoManutencao: "",
        solucaoAplicada: "",
      });
      
      setOrigemParada({
        automatizacao: false,
        terceiros: false,
        eletrica: false,
        mecanica: false,
        outro: false
      });
      
      onSuccess?.();
      
    } catch (error) {
      console.error("Erro ao registrar parada de máquina:", error);
      toast.error("Erro ao registrar parada de máquina");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Setor e Equipamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="setor" className="text-xs sm:text-sm">Setor*</Label>
              <Select
                value={formData.setor}
                onValueChange={(value) => handleSelectChange("setor", value)}
                disabled={loadingSetores}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <SelectValue placeholder={loadingSetores ? "Carregando..." : "Selecione o setor"} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] bg-background z-50">
                  {setores.map((setor) => (
                    <SelectItem key={setor.id} value={setor.nome} className="text-xs sm:text-sm">
                      {setor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="equipamento" className="text-xs sm:text-sm">Equipamento*</Label>
              <Select
                value={formData.equipamento}
                onValueChange={(value) => {
                  const equipamento = equipamentos.find(e => e.equipamento === value);
                  if (equipamento) {
                    setFormData(prev => ({
                      ...prev,
                      equipamento: equipamento.equipamento,
                      setor: equipamento.setor
                    }));
                  }
                }}
                disabled={loadingEquipamentos}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <SelectValue placeholder={loadingEquipamentos ? "Carregando..." : "Selecione o equipamento"} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] bg-background z-50">
                  {equipamentos.map((equipamento) => (
                    <SelectItem key={equipamento.id} value={equipamento.equipamento} className="text-xs sm:text-sm">
                      {equipamento.patrimonio} - {equipamento.equipamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hora Inicial e Hora Final */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="hrInicial" className="text-xs sm:text-sm">Hora Inicial</Label>
              <Input
                id="hrInicial"
                name="hrInicial"
                type="time"
                value={formData.hrInicial}
                onChange={handleChange}
                className="h-9 text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hrFinal" className="text-xs sm:text-sm">Hora Fim</Label>
              <Input
                id="hrFinal"
                name="hrFinal"
                type="time"
                value={formData.hrFinal}
                onChange={handleChange}
                className="h-9 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Linha Parada e Tipo Manutenção */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="linhaParada" className="text-xs sm:text-sm">Linha Parada</Label>
              <Select 
                value={formData.linhaParada} 
                onValueChange={(value) => handleSelectChange("linhaParada", value)}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="tipoManutencao" className="text-xs sm:text-sm">Tipo de Falha</Label>
              <Select 
                value={formData.tipoManutencao} 
                onValueChange={(value) => handleSelectChange("tipoManutencao", value)}
                disabled={loadingTiposFalhas}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <SelectValue placeholder={loadingTiposFalhas ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] bg-background z-50">
                  {tiposFalhas.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.nome} className="text-xs sm:text-sm">
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="descricaoMotivo" className="text-xs sm:text-sm">Descrição do Motivo*</Label>
            <Textarea
              id="descricaoMotivo"
              name="descricaoMotivo"
              placeholder="Descreva o motivo da parada..."
              value={formData.descricaoMotivo}
              onChange={handleChange}
              className="min-h-[60px] text-xs sm:text-sm resize-none"
            />
          </div>

          {/* Solução */}
          <div className="space-y-1">
            <Label htmlFor="solucaoAplicada" className="text-xs sm:text-sm">Solução Aplicada</Label>
            <Textarea
              id="solucaoAplicada"
              name="solucaoAplicada"
              placeholder="Descreva a solução aplicada..."
              value={formData.solucaoAplicada}
              onChange={handleChange}
              className="min-h-[60px] text-xs sm:text-sm resize-none"
            />
          </div>

          {/* Origem da Parada */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Origem da Parada</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { key: "automatizacao", label: "Automação" },
                { key: "terceiros", label: "Terceiros" },
                { key: "eletrica", label: "Elétrica" },
                { key: "mecanica", label: "Mecânica" },
                { key: "outro", label: "Outro" },
              ].map((item) => (
                <div key={item.key} className="flex items-center space-x-1.5">
                  <Checkbox
                    id={item.key}
                    checked={origemParada[item.key as keyof typeof origemParada]}
                    onCheckedChange={(checked) => handleOrigemChange(item.key, checked as boolean)}
                  />
                  <label htmlFor={item.key} className="text-[10px] sm:text-xs cursor-pointer">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-1">
            <Label htmlFor="observacao" className="text-xs sm:text-sm">Observações</Label>
            <Textarea
              id="observacao"
              name="observacao"
              placeholder="Observações adicionais..."
              value={formData.observacao}
              onChange={handleChange}
              className="min-h-[50px] text-xs sm:text-sm resize-none"
            />
          </div>

          {/* Botão Submit */}
          <Button
            type="submit"
            className="w-full h-10 sm:h-11 text-sm sm:text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar Parada"
            )}
        </Button>
      </form>
  );
};

export default NovaParadaMaquina;