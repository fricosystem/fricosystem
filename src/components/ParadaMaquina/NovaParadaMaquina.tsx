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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { HistoricoAcao } from "@/types/typesParadaMaquina";
import { v4 as uuidv4 } from "uuid";

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

interface TipoManutencao {
  id: string;
  nome: string;
}

interface OrigemParada {
  id: string;
  nome: string;
  status: string;
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
  const [tiposManutencao, setTiposManutencao] = useState<TipoManutencao[]>([]);
  const [origensParada, setOrigensParada] = useState<OrigemParada[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);
  const [loadingTiposFalhas, setLoadingTiposFalhas] = useState(false);
  const [loadingTiposManutencao, setLoadingTiposManutencao] = useState(false);
  const [loadingOrigensParada, setLoadingOrigensParada] = useState(false);
  const [collectionChecked, setCollectionChecked] = useState(false);
  
  const hoje = new Date();
  const dataAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  
  const [formData, setFormData] = useState({
    setor: "",
    equipamento: "",
    dataProgramada: dataAtual,
    horaInicio: "",
    descricaoMotivo: "",
    observacao: "",
    tipoFalha: "",
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

  const [origemParada, setOrigemParada] = useState("");

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

  useEffect(() => {
    const fetchTiposManutencao = async () => {
      try {
        setLoadingTiposManutencao(true);
        const tiposManutencaoRef = collection(db, "tipos_manutencao");
        const querySnapshot = await getDocs(tiposManutencaoRef);
        
        const tiposManutencaoData: TipoManutencao[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          tiposManutencaoData.push({
            id: doc.id,
            nome: data.nome || "",
          });
        });
        
        setTiposManutencao(tiposManutencaoData);
      } catch (error) {
        console.error("Erro ao buscar tipos de manutenção:", error);
        toast.error("Não foi possível carregar a lista de tipos de manutenção.");
      } finally {
        setLoadingTiposManutencao(false);
      }
    };

    fetchTiposManutencao();
  }, []);

  useEffect(() => {
    const fetchOrigensParada = async () => {
      try {
        setLoadingOrigensParada(true);
        const origensRef = collection(db, "origens_parada");
        const querySnapshot = await getDocs(origensRef);
        
        const origensData: OrigemParada[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "Ativo") {
            origensData.push({
              id: doc.id,
              nome: data.nome || "",
              status: data.status || "Ativo",
            });
          }
        });
        
        setOrigensParada(origensData);
      } catch (error) {
        console.error("Erro ao buscar origens de parada:", error);
        toast.error("Não foi possível carregar a lista de origens de parada.");
      } finally {
        setLoadingOrigensParada(false);
      }
    };

    fetchOrigensParada();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOrigemChange = (value: string) => {
    setOrigemParada(value);
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

      if (!formData.dataProgramada || !formData.horaInicio) {
        toast.error("Por favor, preencha a data e hora programada");
        setIsSubmitting(false);
        return;
      }
      
      const batch = writeBatch(db);
      const paradaId = uuidv4();
      const paradaRef = doc(db, "paradas_maquina", paradaId);
      
      // Criar timestamp do horário programado
      const [ano, mes, dia] = formData.dataProgramada.split('-').map(Number);
      const [hora, minuto] = formData.horaInicio.split(':').map(Number);
      const horarioProgramado = new Date(ano, mes - 1, dia, hora, minuto);
      
      // Primeira ação do histórico
      const primeiraAcao: HistoricoAcao = {
        id: uuidv4(),
        acao: "criado",
        userId: user?.uid || "",
        userName: userData?.nome || user?.email || "Sistema",
        timestamp: Timestamp.now(),
        observacao: "Parada de máquina registrada",
        tentativa: 1,
      };
      
      const paradaData = {
        id: paradaId,
        setor: formData.setor,
        equipamento: formData.equipamento,
        dataProgramada: formData.dataProgramada,
        horarioProgramado: Timestamp.fromDate(horarioProgramado),
        hrInicial: formData.horaInicio,
        hrFinal: "",
        descricaoMotivo: formData.descricaoMotivo,
        observacao: formData.observacao || "",
        tipoFalha: formData.tipoFalha || "",
        tipoManutencao: formData.tipoManutencao || "",
        origemParada: origemParada || "",
        status: "aguardando",
        criadoEm: Timestamp.now(),
        criadoPor: user?.uid || "",
        encarregadoNome: userData?.nome || user?.email || "",
        encarregadoId: user?.uid || "",
        tentativaAtual: 1,
        historicoAcoes: [primeiraAcao],
      };
      
      batch.set(paradaRef, paradaData);
      await batch.commit();
      
      toast.success("Parada de máquina registrada com sucesso!");
      
      setFormData({
        setor: "",
        equipamento: "",
        dataProgramada: dataAtual,
        horaInicio: "",
        descricaoMotivo: "",
        observacao: "",
        tipoFalha: "",
        tipoManutencao: "",
      });
      
      setOrigemParada("");
      
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
                  {[...setores].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((setor) => (
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
                  {equipamentos
                    .filter((e) => !formData.setor || e.setor === formData.setor)
                    .sort((a, b) => a.equipamento.localeCompare(b.equipamento, 'pt-BR'))
                    .map((equipamento) => (
                      <SelectItem key={equipamento.id} value={equipamento.equipamento} className="text-xs sm:text-sm">
                        {equipamento.patrimonio} - {equipamento.equipamento}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data e Hora Início */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="dataProgramada" className="text-xs sm:text-sm">Data Programada*</Label>
              <Input
                id="dataProgramada"
                name="dataProgramada"
                type="date"
                value={formData.dataProgramada}
                onChange={handleChange}
                className="h-9 text-xs sm:text-sm"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="horaInicio" className="text-xs sm:text-sm">Hora Início*</Label>
              <Input
                id="horaInicio"
                name="horaInicio"
                type="time"
                value={formData.horaInicio}
                onChange={handleChange}
                className="h-9 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Tipo de Falha e Tipo de Manutenção */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="tipoFalha" className="text-xs sm:text-sm">Tipo de Falha</Label>
              <Select 
                value={formData.tipoFalha} 
                onValueChange={(value) => handleSelectChange("tipoFalha", value)}
                disabled={loadingTiposFalhas}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <SelectValue placeholder={loadingTiposFalhas ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] bg-background z-50">
                  {[...tiposFalhas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.nome} className="text-xs sm:text-sm">
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="tipoManutencao" className="text-xs sm:text-sm">Tipo de Manutenção</Label>
              <Select 
                value={formData.tipoManutencao} 
                onValueChange={(value) => handleSelectChange("tipoManutencao", value)}
                disabled={loadingTiposManutencao}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <SelectValue placeholder={loadingTiposManutencao ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] bg-background z-50">
                  {[...tiposManutencao].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((tipo) => (
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

          {/* Origem da Parada */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Origem da Parada</Label>
            {loadingOrigensParada ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Carregando...
              </div>
            ) : origensParada.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma origem cadastrada.</p>
            ) : (
              <RadioGroup
                value={origemParada}
                onValueChange={handleOrigemChange}
                className="flex flex-wrap gap-3"
              >
                {[...origensParada].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((item) => (
                  <div key={item.id} className="flex items-center space-x-1.5">
                    <RadioGroupItem value={item.nome} id={`origem-${item.id}`} />
                    <label htmlFor={`origem-${item.id}`} className="text-[10px] sm:text-xs cursor-pointer">
                      {item.nome}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            )}
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