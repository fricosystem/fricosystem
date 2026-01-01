import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Loader2 } from "lucide-react";
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

  const handleOrigemChange = (nome: string, checked: boolean) => {
    setOrigensSelecionadas(prev => ({ ...prev, [nome]: checked }));
  };

  const handleLimpar = () => {
    setSetor("");
    setEquipamento("");
    setLinha("");
    setDataAberturaOS(getDataHoraAtual());
    setDescricaoOS("");
    setObservacaoManutencao("");
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
        dataAberturaOS: new Date().toISOString(),
        descricaoOS,
        origensParada: origensArray,
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
          {/* Setor e Equipamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="setor">Setor</Label>
              <Select
                value={setor}
                onValueChange={handleSetorChange}
                disabled={loadingSetores}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="equipamento">Equipamento</Label>
              <Select
                value={equipamento}
                onValueChange={handleEquipamentoChange}
                disabled={loadingEquipamentos}
              >
                <SelectTrigger>
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
            <Input
              value={dataAberturaOS}
              disabled
              className="bg-muted"
            />
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
