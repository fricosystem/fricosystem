import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, CalendarDays, Trash2, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, doc, getDocs, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { format, isSameMonth, getMonth, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DiaTrabalhadoDoc {
  id: string;
  ano: number;
  mes: number;
  dias: number[];
  atualizadoEm: Timestamp;
}

export default function CalendarioDiasTrabalhados() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [diasSalvos, setDiasSalvos] = useState<Map<string, number[]>>(new Map());

  const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const mesesDoAno = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const anoAtual = new Date().getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => anoAtual - 2 + i);

  useEffect(() => {
    carregarDiasTrabalhados();
  }, []);

  useEffect(() => {
    const mesKey = `${getYear(currentMonth)}-${getMonth(currentMonth)}`;
    const diasDoMes = diasSalvos.get(mesKey) || [];
    setSelectedDays(new Set(diasDoMes));
  }, [currentMonth, diasSalvos]);

  const carregarDiasTrabalhados = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "calendario_manutencao"));
      const novosDisSalvos = new Map<string, number[]>();
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<DiaTrabalhadoDoc, 'id'>;
        const key = `${data.ano}-${data.mes}`;
        novosDisSalvos.set(key, data.dias);
      });
      
      setDiasSalvos(novosDisSalvos);
    } catch (error) {
      console.error("Erro ao carregar dias trabalhados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dias trabalhados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerar dias do mês (igual ao CalendarioManutencao)
  const diasDoMes = useMemo(() => {
    const ano = currentMonth.getFullYear();
    const mes = currentMonth.getMonth();
    
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    
    const dias = [];
    const diaSemanaInicio = primeiroDia.getDay();
    
    // Adicionar dias do mês anterior
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const dia = new Date(ano, mes, -i);
      dias.push({ data: dia, mesAtual: false });
    }
    
    // Adicionar dias do mês atual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const data = new Date(ano, mes, dia);
      dias.push({ data, mesAtual: true });
    }
    
    // Adicionar dias do próximo mês para completar a grade
    const diasRestantes = 42 - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const data = new Date(ano, mes + 1, dia);
      dias.push({ data, mesAtual: false });
    }
    
    return dias;
  }, [currentMonth]);

  const handleDayClick = (data: Date, mesAtual: boolean) => {
    if (!mesAtual) return;
    
    const dia = data.getDate();
    const novoSet = new Set(selectedDays);
    
    if (novoSet.has(dia)) {
      novoSet.delete(dia);
    } else {
      novoSet.add(dia);
    }
    
    setSelectedDays(novoSet);
  };

  const salvarDiasTrabalhados = async () => {
    try {
      setSaving(true);
      const ano = getYear(currentMonth);
      const mes = getMonth(currentMonth);
      const docId = `${ano}-${mes}`;
      
      const diasNumeros = Array.from(selectedDays).sort((a, b) => a - b);
      
      const docRef = doc(db, "calendario_manutencao", docId);
      await setDoc(docRef, {
        ano,
        mes,
        dias: diasNumeros,
        atualizadoEm: Timestamp.now()
      });
      
      const novosDisSalvos = new Map(diasSalvos);
      novosDisSalvos.set(`${ano}-${mes}`, diasNumeros);
      setDiasSalvos(novosDisSalvos);
      
      toast({
        title: "Sucesso",
        description: `${diasNumeros.length} dias trabalhados salvos para ${mesesDoAno[mes]} de ${ano}`
      });
    } catch (error) {
      console.error("Erro ao salvar dias trabalhados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dias trabalhados",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const limparSelecao = () => {
    setSelectedDays(new Set());
  };

  const selecionarDiasUteis = () => {
    const ano = currentMonth.getFullYear();
    const mes = currentMonth.getMonth();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const diasUteis = new Set<number>();
    
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const data = new Date(ano, mes, dia);
      const diaDaSemana = data.getDay();
      if (diaDaSemana !== 0 && diaDaSemana !== 6) {
        diasUteis.add(dia);
      }
    }
    
    setSelectedDays(diasUteis);
  };

  const proximoMes = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const mesAnterior = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const voltarHoje = () => {
    setCurrentMonth(new Date());
  };

  const mesKey = `${getYear(currentMonth)}-${getMonth(currentMonth)}`;
  const temDiasSalvos = diasSalvos.has(mesKey);
  const diasSelecionadosNoMes = selectedDays.size;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Selecione os dias trabalhados de cada mês clicando no calendário. Esses dias serão utilizados para calcular indicadores como MTTR, MTBF e disponibilidade.
        </AlertDescription>
      </Alert>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendário de Dias Trabalhados
            </CardTitle>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={temDiasSalvos ? "default" : "secondary"}>
                {temDiasSalvos ? `${diasSalvos.get(mesKey)?.length || 0} dias salvos` : "Não configurado"}
              </Badge>
              <Badge variant="outline">
                {diasSelecionadosNoMes} selecionados
              </Badge>
              <Button variant="outline" size="sm" onClick={selecionarDiasUteis}>
                Dias Úteis
              </Button>
              <Button variant="outline" size="sm" onClick={limparSelecao}>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar
              </Button>
              <Button variant="outline" size="sm" onClick={voltarHoje}>
                Hoje
              </Button>
              <Button onClick={salvarDiasTrabalhados} size="sm" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" size="icon" onClick={mesAnterior}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Select
                value={getYear(currentMonth).toString()}
                onValueChange={(value) => {
                  const novaData = new Date(parseInt(value), getMonth(currentMonth), 1);
                  setCurrentMonth(novaData);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <h3 className="text-lg font-semibold">
                {mesesDoAno[currentMonth.getMonth()]}
              </h3>
            </div>
            
            <Button variant="outline" size="icon" onClick={proximoMes}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Grade do Calendário */}
          <div className="grid grid-cols-7 gap-2">
            {/* Cabeçalho dos dias da semana */}
            {diasDaSemana.map(dia => (
              <div key={dia} className="text-center font-semibold text-sm py-2">
                {dia}
              </div>
            ))}
            
            {/* Dias do mês */}
            {diasDoMes.map(({ data, mesAtual }, index) => {
              const ehHoje = data.toDateString() === new Date().toDateString();
              const diaSelecionado = mesAtual && selectedDays.has(data.getDate());
              const diaDaSemana = data.getDay();
              const ehFimDeSemana = diaDaSemana === 0 || diaDaSemana === 6;
              
              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(data, mesAtual)}
                  className={`
                    min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all
                    ${mesAtual ? 'hover:border-primary' : 'opacity-40 cursor-not-allowed'}
                    ${ehHoje ? 'ring-2 ring-primary' : ''}
                    ${diaSelecionado ? 'bg-primary text-primary-foreground' : mesAtual ? 'bg-background' : 'bg-muted/30'}
                    ${ehFimDeSemana && mesAtual && !diaSelecionado ? 'bg-muted/50' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1 flex items-center justify-between
                    ${diaSelecionado ? 'text-primary-foreground' : mesAtual ? 'text-foreground' : 'text-muted-foreground'}
                  `}>
                    <span>{data.getDate()}</span>
                    {ehFimDeSemana && mesAtual && (
                      <span className={`text-xs ${diaSelecionado ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {diaDaSemana === 0 ? 'Dom' : 'Sáb'}
                      </span>
                    )}
                  </div>
                  
                  {mesAtual && diaSelecionado && (
                    <div className="flex items-center justify-center mt-2">
                      <Badge variant="secondary" className="text-xs bg-primary-foreground/20 text-primary-foreground">
                        Trabalho
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legenda */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <span className="text-sm">Dia Trabalhado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted/50 border rounded"></div>
              <span className="text-sm">Fim de Semana</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-background border rounded ring-2 ring-primary"></div>
              <span className="text-sm">Hoje</span>
            </div>
          </div>

          {/* Histórico de meses configurados */}
          <div className="mt-6 pt-4 border-t space-y-2">
            <Label>Meses configurados:</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from(diasSalvos.entries())
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 12)
                .map(([key, dias]) => {
                  const [ano, mes] = key.split("-").map(Number);
                  return (
                    <Badge
                      key={key}
                      variant={key === mesKey ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setCurrentMonth(new Date(ano, mes, 1))}
                    >
                      {mesesDoAno[mes].slice(0, 3)}/{ano} ({dias.length} dias)
                    </Badge>
                  );
                })
              }
              {diasSalvos.size === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum mês configurado ainda</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
