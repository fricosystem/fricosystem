import { useState, useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Loader2, ClipboardPlus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { toast } from "@/hooks/use-toast";

interface Setor {
  id: string;
  nome: string;
}

interface Equipamento {
  id: string;
  patrimonio: string;
  equipamento: string;
  setor: string;
}

interface OrigemParadaItem {
  id: string;
  nome: string;
  status: string;
}

interface MotivoOS {
  id: string;
  nome: string;
  status: string;
}

interface NovaOrdemServicoProps {
  onSuccess?: () => void;
}

export function NovaOrdemServico({ onSuccess }: NovaOrdemServicoProps) {
  const { userData } = useAuth();
  
  // Gerar data/hora atual formatada
  const getDataHoraAtual = () => {
    const agora = new Date();
    return format(agora, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };
  
  const [setor, setSetor] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [linha, setLinha] = useState("");
  const [dataAberturaOS, setDataAberturaOS] = useState(getDataHoraAtual());
  const [descricaoOS, setDescricaoOS] = useState("");
  const [observacaoManutencao, setObservacaoManutencao] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Dados das coleções
  const [setores, setSetores] = useState<Setor[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [origensParada, setOrigensParada] = useState<OrigemParadaItem[]>([]);
  const [motivosOS, setMotivosOS] = useState<MotivoOS[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(true);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(true);
  const [loadingOrigensParada, setLoadingOrigensParada] = useState(true);
  const [loadingMotivosOS, setLoadingMotivosOS] = useState(true);
  
  // Estado para a origem selecionada (seleção única)
  const [origemSelecionada, setOrigemSelecionada] = useState<string>("");

  // Responsável pelo chamado é o nome do usuário autenticado
  const responsavelChamado = userData?.nome || "";

  // Buscar setores
  useEffect(() => {
    const fetchSetores = async () => {
      try {
        setLoadingSetores(true);
        const setoresRef = collection(db, "setores");
        const snapshot = await getDocs(setoresRef);
        const setoresData: Setor[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.nome) {
            setoresData.push({
              id: doc.id,
              nome: data.nome
            });
          }
        });
        
        setSetores(setoresData);
      } catch (error) {
        console.error("Erro ao buscar setores:", error);
      } finally {
        setLoadingSetores(false);
      }
    };

    fetchSetores();
  }, []);

  // Buscar equipamentos
  useEffect(() => {
    const fetchEquipamentos = async () => {
      try {
        setLoadingEquipamentos(true);
        const equipamentosRef = collection(db, "equipamentos");
        const snapshot = await getDocs(equipamentosRef);
        const equipamentosData: Equipamento[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.equipamento) {
            equipamentosData.push({
              id: doc.id,
              patrimonio: data.patrimonio || "",
              equipamento: data.equipamento,
              setor: data.setor || ""
            });
          }
        });
        
        setEquipamentos(equipamentosData);
      } catch (error) {
        console.error("Erro ao buscar equipamentos:", error);
      } finally {
        setLoadingEquipamentos(false);
      }
    };

    fetchEquipamentos();
  }, []);

  // Handler para seleção de setor
  const handleSetorChange = (value: string) => {
    setSetor(value);
    // Limpar equipamento se o novo setor for diferente do setor do equipamento atual
    const equipamentoAtual = equipamentos.find(e => e.equipamento === equipamento);
    if (equipamentoAtual && equipamentoAtual.setor !== value) {
      setEquipamento("");
    }
  };

  // Handler para seleção de equipamento - auto seleciona o setor
  const handleEquipamentoChange = (value: string) => {
    const equipamentoSelecionado = equipamentos.find(e => e.equipamento === value);
    if (equipamentoSelecionado) {
      setEquipamento(equipamentoSelecionado.equipamento);
      setSetor(equipamentoSelecionado.setor);
    }
  };

  // Filtrar equipamentos pelo setor selecionado
  const equipamentosFiltrados = setor 
    ? equipamentos.filter(e => e.setor === setor)
    : equipamentos;

  // Buscar origens de parada
  useEffect(() => {
    const fetchOrigensParada = async () => {
      try {
        setLoadingOrigensParada(true);
        const origensRef = collection(db, "origens_parada");
        const snapshot = await getDocs(origensRef);
        const origensData: OrigemParadaItem[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "Ativo") {
            origensData.push({
              id: doc.id,
              nome: data.nome || "",
              status: data.status || "Ativo"
            });
          }
        });
        
        // Ordenar alfabeticamente
        origensData.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setOrigensParada(origensData);
      } catch (error) {
        console.error("Erro ao buscar origens de parada:", error);
      } finally {
        setLoadingOrigensParada(false);
      }
    };

    fetchOrigensParada();
  }, []);

  // Buscar motivos de OS
  useEffect(() => {
    const fetchMotivosOS = async () => {
      try {
        setLoadingMotivosOS(true);
        const motivosRef = collection(db, "motivos_os");
        const snapshot = await getDocs(motivosRef);
        const motivosData: MotivoOS[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "Ativo") {
            motivosData.push({
              id: doc.id,
              nome: data.nome || "",
              status: data.status || "Ativo"
            });
          }
        });
        
        // Ordenar alfabeticamente
        motivosData.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setMotivosOS(motivosData);
      } catch (error) {
        console.error("Erro ao buscar motivos de OS:", error);
      } finally {
        setLoadingMotivosOS(false);
      }
    };

    fetchMotivosOS();
  }, []);

  const handleOrigemChange = (nome: string) => {
    setOrigemSelecionada(nome);
  };

  const handleLimpar = () => {
    setSetor("");
    setEquipamento("");
    setLinha("");
    setDataAberturaOS(getDataHoraAtual());
    setDescricaoOS("");
    setObservacaoManutencao("");
    setOrigemSelecionada("");
  };

  const handleSalvar = async () => {
    // Verificar se uma origem foi selecionada
    const temOrigemSelecionada = origemSelecionada !== "";
    
    if (!setor || !equipamento || !linha || !descricaoOS || !temOrigemSelecionada || !observacaoManutencao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios marcados com *.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      const ordemServico = {
        setor,
        equipamento,
        linha,
        dataAberturaOS: new Date().toISOString(),
        descricaoOS,
        origensParada: [origemSelecionada],
        observacaoManutencao,
        responsavelChamado,
        status: "aberta",
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      };

      await addDoc(collection(db, "ordens_servicos"), ordemServico);

      toast({
        title: "OS salva com sucesso!",
        description: "A ordem de serviço foi registrada.",
      });

      handleLimpar();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar OS:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a ordem de serviço.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Setor e Equipamento */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="setor" className="text-sm font-medium">Setor *</Label>
          <Select
            value={setor}
            onValueChange={handleSetorChange}
            disabled={loadingSetores}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={loadingSetores ? "Carregando..." : "Selecione o setor"} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] bg-background z-50">
              {[...setores].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((s) => (
                <SelectItem key={s.id} value={s.nome}>
                  {s.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="equipamento" className="text-sm font-medium">Equipamento *</Label>
          <Select
            value={equipamento}
            onValueChange={handleEquipamentoChange}
            disabled={loadingEquipamentos}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={loadingEquipamentos ? "Carregando..." : "Selecione o equipamento"} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] bg-background z-50">
              {equipamentosFiltrados
                .sort((a, b) => a.equipamento.localeCompare(b.equipamento, 'pt-BR'))
                .map((e) => (
                  <SelectItem key={e.id} value={e.equipamento}>
                    {e.patrimonio ? `${e.patrimonio} - ${e.equipamento}` : e.equipamento}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linha */}
      <div className="space-y-1.5">
        <Label htmlFor="linha" className="text-sm font-medium">Linha *</Label>
        <Input
          id="linha"
          value={linha}
          onChange={(e) => setLinha(e.target.value)}
          placeholder="Digite a linha"
          className="h-11"
        />
      </div>

      {/* Data e Responsável em grid para mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Data Abertura</Label>
          <Input
            value={dataAberturaOS}
            disabled
            className="bg-muted h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="responsavelChamado" className="text-sm font-medium">Responsável</Label>
          <Input
            id="responsavelChamado"
            value={responsavelChamado}
            disabled
            className="bg-muted h-11"
          />
        </div>
      </div>

      {/* Origem da Parada */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Origem da Parada *</Label>
        <div className="p-4 border border-border rounded-xl bg-muted/20">
          {loadingOrigensParada ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando origens...
            </div>
          ) : origensParada.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma origem cadastrada.</p>
          ) : (
            <RadioGroup
              value={origemSelecionada}
              onValueChange={handleOrigemChange}
              className="grid grid-cols-2 gap-3"
            >
              {origensParada.map((origem) => (
                <div key={origem.id} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={origem.nome}
                    id={`origem-${origem.id}`}
                  />
                  <Label 
                    htmlFor={`origem-${origem.id}`} 
                    className="cursor-pointer font-normal text-sm leading-tight"
                  >
                    {origem.nome}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      </div>

      {/* Motivo da Manutenção */}
      <div className="space-y-1.5">
        <Label htmlFor="observacaoManutencao" className="text-sm font-medium">Motivo da Manutenção *</Label>
        <Select
          value={observacaoManutencao}
          onValueChange={setObservacaoManutencao}
          disabled={loadingMotivosOS}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder={loadingMotivosOS ? "Carregando..." : "Selecione o motivo"} />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] bg-background z-50">
            {motivosOS.map((motivo) => (
              <SelectItem key={motivo.id} value={motivo.nome}>
                {motivo.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Descrição da OS */}
      <div className="space-y-1.5">
        <Label htmlFor="descricaoOS" className="text-sm font-medium">Descrição da OS *</Label>
        <Textarea
          id="descricaoOS"
          value={descricaoOS}
          onChange={(e) => setDescricaoOS(e.target.value)}
          placeholder="Descreva o motivo da ordem de serviço..."
          className="min-h-[100px] resize-none"
        />
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={handleLimpar} disabled={saving} className="flex-1 h-12">
          <RotateCcw className="mr-2 h-4 w-4" />
          Limpar
        </Button>
        <Button onClick={handleSalvar} disabled={saving} className="flex-1 h-12">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar OS"}
        </Button>
      </div>
    </div>
  );
}
