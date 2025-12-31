import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, RotateCcw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { toast } from "@/hooks/use-toast";

interface SetorOption {
  value: string;
  label: string;
}

interface EquipamentoOption {
  value: string;
  label: string;
}

interface OrigemParadaItem {
  id: string;
  nome: string;
  status: string;
}

interface NovaOrdemServicoProps {
  onSuccess?: () => void;
}

export function NovaOrdemServico({ onSuccess }: NovaOrdemServicoProps) {
  const { userData } = useAuth();
  
  const [setor, setSetor] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [linha, setLinha] = useState("");
  const [dataAberturaOS, setDataAberturaOS] = useState<Date | undefined>(new Date());
  const [descricaoOS, setDescricaoOS] = useState("");
  const [observacaoManutencao, setObservacaoManutencao] = useState("");
  const [outroOrigem, setOutroOrigem] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Dados das coleções
  const [setores, setSetores] = useState<SetorOption[]>([]);
  const [equipamentos, setEquipamentos] = useState<EquipamentoOption[]>([]);
  const [origensParada, setOrigensParada] = useState<OrigemParadaItem[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(true);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(true);
  const [loadingOrigensParada, setLoadingOrigensParada] = useState(true);
  
  // Estado para as origens selecionadas (dinâmico)
  const [origensSelecionadas, setOrigensSelecionadas] = useState<Record<string, boolean>>({});

  // Responsável pelo chamado é o nome do usuário autenticado
  const responsavelChamado = userData?.nome || "";

  // Buscar setores
  useEffect(() => {
    const fetchSetores = async () => {
      try {
        setLoadingSetores(true);
        const setoresRef = collection(db, "setores");
        const snapshot = await getDocs(setoresRef);
        const setoresData: SetorOption[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.nome) {
            setoresData.push({
              value: data.nome,
              label: data.nome
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
        const equipamentosData: EquipamentoOption[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.equipamento) {
            equipamentosData.push({
              value: data.equipamento,
              label: data.equipamento
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

  const handleOrigemChange = (nome: string, checked: boolean) => {
    setOrigensSelecionadas(prev => ({ ...prev, [nome]: checked }));
  };

  const handleLimpar = () => {
    setSetor("");
    setEquipamento("");
    setLinha("");
    setDataAberturaOS(new Date());
    setDescricaoOS("");
    setObservacaoManutencao("");
    setOutroOrigem("");
    setOrigensSelecionadas({});
  };

  const handleSalvar = async () => {
    if (!setor || !equipamento || !descricaoOS) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos Setor, Equipamento e Descrição da OS.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      // Converter origens selecionadas para array de nomes
      const origensArray = Object.entries(origensSelecionadas)
        .filter(([_, checked]) => checked)
        .map(([nome]) => nome);
      
      const ordemServico = {
        setor,
        equipamento,
        linha,
        dataAberturaOS: dataAberturaOS ? dataAberturaOS.toISOString() : null,
        descricaoOS,
        origensParada: origensArray,
        outroOrigem,
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
    <div className="space-y-4 pb-4">
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Controle de OS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Setor */}
          <div className="space-y-2">
            <Label htmlFor="setor">Setor</Label>
            <Combobox
              options={setores}
              value={setor}
              onChange={setSetor}
              placeholder="Selecione o setor"
              searchPlaceholder="Buscar setor..."
              loading={loadingSetores}
            />
          </div>

          {/* Equipamento */}
          <div className="space-y-2">
            <Label htmlFor="equipamento">Equipamento</Label>
            <Combobox
              options={equipamentos}
              value={equipamento}
              onChange={setEquipamento}
              placeholder="Selecione o equipamento"
              searchPlaceholder="Buscar equipamento..."
              loading={loadingEquipamentos}
            />
          </div>

          {/* Linha */}
          <div className="space-y-2">
            <Label htmlFor="linha">Linha</Label>
            <Input
              id="linha"
              value={linha}
              onChange={(e) => setLinha(e.target.value)}
              placeholder="Digite a linha"
            />
          </div>

          {/* Data Abertura OS */}
          <div className="space-y-2">
            <Label>Data Abertura OS</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataAberturaOS && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataAberturaOS ? format(dataAberturaOS, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataAberturaOS}
                  onSelect={setDataAberturaOS}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Responsável Pelo Chamado */}
          <div className="space-y-2">
            <Label htmlFor="responsavelChamado">Responsável Pelo Chamado</Label>
            <Input
              id="responsavelChamado"
              value={responsavelChamado}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Descrição da OS */}
          <div className="space-y-2">
            <Label htmlFor="descricaoOS">Descrição da OS</Label>
            <Textarea
              id="descricaoOS"
              value={descricaoOS}
              onChange={(e) => setDescricaoOS(e.target.value)}
              placeholder="Descreva o motivo da ordem de serviço..."
              className="min-h-[100px] resize-none"
            />
          </div>
          
          {/* Origem da Parada */}
          <div className="space-y-3">
            <Label>Origem da Parada</Label>
            <div className="p-3 border border-border rounded-lg bg-muted/30">
              {loadingOrigensParada ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando origens...
                </div>
              ) : origensParada.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma origem cadastrada.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {origensParada.map((origem) => (
                    <div key={origem.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`origem-${origem.id}`}
                        checked={origensSelecionadas[origem.nome] || false}
                        onCheckedChange={(checked) => handleOrigemChange(origem.nome, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`origem-${origem.id}`} 
                        className="cursor-pointer font-normal text-xs"
                      >
                        {origem.nome}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Campo "Outro" */}
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <Label htmlFor="outroOrigem" className="text-xs">Outro (especifique):</Label>
                <Input
                  id="outroOrigem"
                  value={outroOrigem}
                  onChange={(e) => setOutroOrigem(e.target.value)}
                  placeholder="Especifique outra origem..."
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Observação da Manutenção */}
          <div className="space-y-2">
            <Label htmlFor="observacaoManutencao">Observação da Manutenção</Label>
            <Textarea
              id="observacaoManutencao"
              value={observacaoManutencao}
              onChange={(e) => setObservacaoManutencao(e.target.value)}
              placeholder="Observações sobre a manutenção realizada..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleLimpar} disabled={saving} className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar
            </Button>
            <Button onClick={handleSalvar} disabled={saving} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Salvando..." : "Salvar OS"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
