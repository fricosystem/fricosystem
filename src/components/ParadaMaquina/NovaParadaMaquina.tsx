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

interface TipoManutencao {
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
  const [tiposManutencao, setTiposManutencao] = useState<TipoManutencao[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);
  const [loadingTiposManutencao, setLoadingTiposManutencao] = useState(false);
  const [collectionChecked, setCollectionChecked] = useState(false);
  
  const [formData, setFormData] = useState({
    setor: "",
    equipamento: "",
    hrInicial: "",
    hrFinal: "",
    descricaoMotivo: "",
    observacao: "",
    tipoManutencao: "",
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
    const fetchTiposManutencao = async () => {
      try {
        setLoadingTiposManutencao(true);
        const tiposRef = collection(db, "tipos_manutencao");
        const querySnapshot = await getDocs(tiposRef);
        
        const tiposData: TipoManutencao[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          tiposData.push({
            id: doc.id,
            nome: data.nome || "",
          });
        });
        
        setTiposManutencao(tiposData);
      } catch (error) {
        console.error("Erro ao buscar tipos de manutenção:", error);
        toast.error("Não foi possível carregar os tipos de manutenção.");
      } finally {
        setLoadingTiposManutencao(false);
      }
    };

    fetchTiposManutencao();
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
        descricaoMotivo: formData.descricaoMotivo,
        observacao: formData.observacao,
        origemParada: origemParada,
        tipoManutencao: formData.tipoManutencao,
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
        descricaoMotivo: "",
        observacao: "",
        tipoManutencao: "",
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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Setor e Equipamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="setor" className="text-sm sm:text-base font-medium">Setor*</Label>
              <Select
                value={formData.setor}
                onValueChange={(value) => handleSelectChange("setor", value)}
                disabled={loadingSetores}
              >
                <SelectTrigger className="h-12 sm:h-14 text-base">
                  <SelectValue placeholder={loadingSetores ? "Carregando..." : "Selecione o setor"} />
                </SelectTrigger>
                <SelectContent className="max-h-[250px] bg-background z-50">
                  {setores.map((setor) => (
                    <SelectItem key={setor.id} value={setor.nome} className="text-base py-3">
                      {setor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipamento" className="text-sm sm:text-base font-medium">Equipamento*</Label>
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
                <SelectTrigger className="h-12 sm:h-14 text-base">
                  <SelectValue placeholder={loadingEquipamentos ? "Carregando..." : "Selecione o equipamento"} />
                </SelectTrigger>
                <SelectContent className="max-h-[250px] bg-background z-50">
                  {equipamentos.map((equipamento) => (
                    <SelectItem key={equipamento.id} value={equipamento.equipamento} className="text-base py-3">
                      {equipamento.patrimonio} - {equipamento.equipamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hora Inicial e Hora Final */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hrInicial" className="text-sm sm:text-base font-medium">Hora Inicial</Label>
              <Input
                id="hrInicial"
                name="hrInicial"
                type="time"
                value={formData.hrInicial}
                onChange={handleChange}
                className="h-12 sm:h-14 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hrFinal" className="text-sm sm:text-base font-medium">Hora Fim</Label>
              <Input
                id="hrFinal"
                name="hrFinal"
                type="time"
                value={formData.hrFinal}
                onChange={handleChange}
                className="h-12 sm:h-14 text-base"
              />
            </div>
          </div>

          {/* Tipo Manutenção */}
          <div className="space-y-2">
            <Label htmlFor="tipoManutencao" className="text-sm sm:text-base font-medium">Tipo</Label>
            <Select 
              value={formData.tipoManutencao} 
              onValueChange={(value) => handleSelectChange("tipoManutencao", value)}
              disabled={loadingTiposManutencao}
            >
              <SelectTrigger className="h-12 sm:h-14 text-base">
                <SelectValue placeholder={loadingTiposManutencao ? "Carregando..." : "Selecione"} />
              </SelectTrigger>
              <SelectContent className="max-h-[250px] bg-background z-50">
                {tiposManutencao.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.nome} className="text-base py-3">
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricaoMotivo" className="text-sm sm:text-base font-medium">Descrição do Motivo*</Label>
            <Textarea
              id="descricaoMotivo"
              name="descricaoMotivo"
              placeholder="Descreva o motivo da parada..."
              value={formData.descricaoMotivo}
              onChange={handleChange}
              className="min-h-[80px] sm:min-h-[100px] text-base resize-none"
            />
          </div>


          {/* Origem da Parada */}
          <div className="space-y-3">
            <Label className="text-sm sm:text-base font-medium">Origem da Parada</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { key: "automatizacao", label: "Automação" },
                { key: "terceiros", label: "Terceiros" },
                { key: "eletrica", label: "Elétrica" },
                { key: "mecanica", label: "Mecânica" },
                { key: "outro", label: "Outro" },
              ].map((item) => (
                <div key={item.key} className="flex items-center space-x-2.5 p-3 border rounded-lg">
                  <Checkbox
                    id={item.key}
                    checked={origemParada[item.key as keyof typeof origemParada]}
                    onCheckedChange={(checked) => handleOrigemChange(item.key, checked as boolean)}
                    className="h-5 w-5"
                  />
                  <label htmlFor={item.key} className="text-sm sm:text-base cursor-pointer">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao" className="text-sm sm:text-base font-medium">Observações</Label>
            <Textarea
              id="observacao"
              name="observacao"
              placeholder="Observações adicionais..."
              value={formData.observacao}
              onChange={handleChange}
              className="min-h-[70px] sm:min-h-[80px] text-base resize-none"
            />
          </div>

          {/* Botão Submit */}
          <Button
            type="submit"
            className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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