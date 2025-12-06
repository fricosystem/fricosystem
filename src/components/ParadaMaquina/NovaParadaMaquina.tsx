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
import { Loader2, Search, Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

interface NovaParadaMaquinaProps {
  onSuccess?: () => void;
}

const NovaParadaMaquina = ({ onSuccess }: NovaParadaMaquinaProps) => {
  const { user, userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);
  const [collectionChecked, setCollectionChecked] = useState(false);
  const [setorPopoverOpen, setSetorPopoverOpen] = useState(false);
  const [equipamentoPopoverOpen, setEquipamentoPopoverOpen] = useState(false);
  
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
              <Popover open={setorPopoverOpen} onOpenChange={setSetorPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between text-left h-9 text-xs sm:text-sm",
                      !formData.setor && "text-muted-foreground"
                    )}
                    disabled={loadingSetores}
                  >
                    <span className="truncate">
                      {loadingSetores
                        ? "Carregando..."
                        : formData.setor || "Selecione o setor"}
                    </span>
                    <Search className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[95vw] sm:w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar setor..." className="h-9" />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                      <CommandGroup>
                        {setores.map((setor) => (
                          <CommandItem
                            key={setor.id}
                            value={setor.nome}
                            onSelect={() => {
                              handleSelectChange("setor", setor.nome);
                              setSetorPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.setor === setor.nome ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="text-xs sm:text-sm">{setor.nome}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label htmlFor="equipamento" className="text-xs sm:text-sm">Equipamento*</Label>
              <Popover open={equipamentoPopoverOpen} onOpenChange={setEquipamentoPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between text-left h-9 text-xs sm:text-sm",
                      !formData.equipamento && "text-muted-foreground"
                    )}
                    disabled={loadingEquipamentos}
                  >
                    <span className="truncate">
                      {loadingEquipamentos
                        ? "Carregando..."
                        : formData.equipamento
                          ? equipamentos.find(e => e.equipamento === formData.equipamento)?.patrimonio + " - " + formData.equipamento
                          : "Selecione o equipamento"}
                    </span>
                    <Search className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[95vw] sm:w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar equipamento..." className="h-9" />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      <CommandEmpty>Nenhum equipamento encontrado.</CommandEmpty>
                      <CommandGroup>
                        {equipamentos.map((equipamento) => (
                          <CommandItem
                            key={equipamento.id}
                            value={`${equipamento.patrimonio} ${equipamento.equipamento} ${equipamento.setor}`}
                            onSelect={() => {
                              setFormData(prev => ({
                                ...prev,
                                equipamento: equipamento.equipamento,
                                setor: equipamento.setor
                              }));
                              setEquipamentoPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.equipamento === equipamento.equipamento ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-xs sm:text-sm">{equipamento.patrimonio} - {equipamento.equipamento}</span>
                              <span className="text-[10px] text-muted-foreground">Setor: {equipamento.setor}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
              <Label htmlFor="tipoManutencao" className="text-xs sm:text-sm">Tipo</Label>
              <Select 
                value={formData.tipoManutencao} 
                onValueChange={(value) => handleSelectChange("tipoManutencao", value)}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Corretiva">Corretiva</SelectItem>
                  <SelectItem value="Preventiva">Preventiva</SelectItem>
                  <SelectItem value="Preditiva">Preditiva</SelectItem>
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