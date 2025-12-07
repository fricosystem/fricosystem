import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Settings, Save, Play, History, TrendingUp, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import {
  getConfiguracaoEmpresa,
  atualizarTiposManutencao,
  atualizarPeriodosCustomizados,
  atualizarCategoriasEquipamento,
} from "@/firebase/configuracoesManutencao";
import {
  ConfiguracaoEmpresa,
  TipoManutencaoCustom,
  PeriodoCustomizado,
  CategoriaEquipamento,
} from "@/types/typesManutencaoPreventiva";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { executarAutomacaoCompleta } from "@/services/automacaoManutencao";
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { ConfiguracaoAutomacao, LogAutomacao, EstatisticasAutomacao } from "@/types/typesAlertasManutencao";

export default function ConfiguracoesTab() {
  const { toast } = useToast();
  
  // Estado para Configurações
  const [config, setConfig] = useState<ConfiguracaoEmpresa | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Estado para Automação
  const [loadingAutomacao, setLoadingAutomacao] = useState(false);
  const [salvandoAutomacao, setSalvandoAutomacao] = useState(false);
  const [configuracaoAutomacao, setConfiguracaoAutomacao] = useState<ConfiguracaoAutomacao | null>(null);
  const [logs, setLogs] = useState<LogAutomacao[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasAutomacao | null>(null);

  useEffect(() => {
    carregarConfiguracao();
    carregarDadosAutomacao();
  }, []);

  // ========== Funções de Configuração ==========
  const carregarConfiguracao = async () => {
    try {
      const data = await getConfiguracaoEmpresa();
      setConfig(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const adicionarTipo = () => {
    if (!config) return;
    const novoTipo: TipoManutencaoCustom = {
      id: `tipo_${Date.now()}`,
      nome: "",
      cor: "#6b7280",
      ativo: true
    };
    setConfig({
      ...config,
      tiposManutencao: [...config.tiposManutencao, novoTipo]
    });
  };

  const removerTipo = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      tiposManutencao: config.tiposManutencao.filter(t => t.id !== id)
    });
  };

  const atualizarTipo = (id: string, campo: keyof TipoManutencaoCustom, valor: any) => {
    if (!config) return;
    setConfig({
      ...config,
      tiposManutencao: config.tiposManutencao.map(t =>
        t.id === id ? { ...t, [campo]: valor } : t
      )
    });
  };

  const salvarTipos = async () => {
    if (!config) return;
    try {
      await atualizarTiposManutencao(config.tiposManutencao);
      toast({ title: "Sucesso", description: "Tipos atualizados" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao salvar", variant: "destructive" });
    }
  };

  const adicionarPeriodo = () => {
    if (!config) return;
    const novoPeriodo: PeriodoCustomizado = {
      id: `periodo_${Date.now()}`,
      nome: "",
      dias: 30,
      ativo: true
    };
    setConfig({
      ...config,
      periodosCustomizados: [...config.periodosCustomizados, novoPeriodo]
    });
  };

  const removerPeriodo = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      periodosCustomizados: config.periodosCustomizados.filter(p => p.id !== id)
    });
  };

  const atualizarPeriodo = (id: string, campo: keyof PeriodoCustomizado, valor: any) => {
    if (!config) return;
    setConfig({
      ...config,
      periodosCustomizados: config.periodosCustomizados.map(p =>
        p.id === id ? { ...p, [campo]: valor } : p
      )
    });
  };

  const salvarPeriodos = async () => {
    if (!config) return;
    try {
      await atualizarPeriodosCustomizados(config.periodosCustomizados);
      toast({ title: "Sucesso", description: "Períodos atualizados" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao salvar", variant: "destructive" });
    }
  };

  const adicionarCategoria = () => {
    if (!config) return;
    const novaCategoria: CategoriaEquipamento = {
      id: `cat_${Date.now()}`,
      nome: "",
      cor: "#6b7280",
      ativo: true
    };
    setConfig({
      ...config,
      categoriasEquipamento: [...config.categoriasEquipamento, novaCategoria]
    });
  };

  const removerCategoria = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      categoriasEquipamento: config.categoriasEquipamento.filter(c => c.id !== id)
    });
  };

  const atualizarCategoria = (id: string, campo: keyof CategoriaEquipamento, valor: any) => {
    if (!config) return;
    setConfig({
      ...config,
      categoriasEquipamento: config.categoriasEquipamento.map(c =>
        c.id === id ? { ...c, [campo]: valor } : c
      )
    });
  };

  const salvarCategorias = async () => {
    if (!config) return;
    try {
      await atualizarCategoriasEquipamento(config.categoriasEquipamento);
      toast({ title: "Sucesso", description: "Categorias atualizadas" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao salvar", variant: "destructive" });
    }
  };

  // ========== Funções de Automação ==========
  const carregarDadosAutomacao = async () => {
    try {
      const configSnapshot = await getDocs(collection(db, "configuracao_automacao"));
      if (!configSnapshot.empty) {
        const docData = configSnapshot.docs[0];
        setConfiguracaoAutomacao({ id: docData.id, ...docData.data() } as ConfiguracaoAutomacao);
      } else {
        const novaConfig: Omit<ConfiguracaoAutomacao, "id"> = {
          ativo: true,
          diasAntecedencia: 3,
          gerarOSAutomatica: true,
          horarioExecucao: "06:00",
          notificarPorEmail: false,
          emailsNotificacao: [],
          configuracoesPorTipo: {},
          criadoEm: Timestamp.now(),
          atualizadoEm: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, "configuracao_automacao"), novaConfig);
        setConfiguracaoAutomacao({ id: docRef.id, ...novaConfig } as ConfiguracaoAutomacao);
      }

      const logsRef = collection(db, "logs_automacao");
      const q = query(logsRef, orderBy("criadoEm", "desc"), limit(10));
      const logsSnapshot = await getDocs(q);
      const logsData = logsSnapshot.docs.map(docData => ({
        id: docData.id,
        ...docData.data()
      })) as LogAutomacao[];
      setLogs(logsData);

      await calcularEstatisticas();
    } catch (error) {
      console.error("Erro ao carregar dados de automação:", error);
    }
  };

  const calcularEstatisticas = async () => {
    try {
      const tarefasSnapshot = await getDocs(collection(db, "tarefas_manutencao"));
      const alertasSnapshot = await getDocs(collection(db, "alertas_manutencao"));
      const ordensSnapshot = await getDocs(query(
        collection(db, "ordens_servicos"),
        orderBy("criadoEm", "desc"),
        limit(100)
      ));

      const totalTarefas = tarefasSnapshot.size;
      const alertas = alertasSnapshot.docs.map(docData => docData.data());
      const tarefasCriticas = alertas.filter((a: any) => a.urgencia === "critico").length;
      const tarefasProximas = alertas.filter((a: any) => a.urgencia === "alto" || a.urgencia === "medio").length;

      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      let osGeradasMes = 0;
      ordensSnapshot.docs.forEach(docData => {
        const ordem = docData.data();
        if (ordem.geradaAutomaticamente && ordem.criadoEm) {
          const dataOrdem = ordem.criadoEm.toDate();
          if (dataOrdem.getMonth() === mesAtual && dataOrdem.getFullYear() === anoAtual) {
            osGeradasMes++;
          }
        }
      });

      const logsSnapshot = await getDocs(query(
        collection(db, "logs_automacao"),
        orderBy("criadoEm", "desc"),
        limit(30)
      ));
      const sucessos = logsSnapshot.docs.filter(docData => docData.data().tipo !== "erro").length;
      const taxaSucesso = logsSnapshot.size > 0 ? (sucessos / logsSnapshot.size) * 100 : 100;

      setEstatisticas({
        totalTarefasAutomatizadas: totalTarefas,
        osGeradasMes,
        taxaSucesso,
        proximasVerificacoes: [],
        tarefasCriticas,
        tarefasProximas,
      });
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error);
    }
  };

  const handleExecutarAutomacao = async () => {
    setLoadingAutomacao(true);
    try {
      const resultado = await executarAutomacaoCompleta();
      if (resultado.success) {
        sonnerToast.success(
          `Automação executada! ${resultado.osGeradas} OS geradas, ${resultado.alertasCriados} alertas criados.`
        );
        await carregarDadosAutomacao();
      } else {
        sonnerToast.error("Erro: " + resultado.error);
      }
    } catch (error) {
      console.error(error);
      sonnerToast.error("Erro ao executar automação");
    } finally {
      setLoadingAutomacao(false);
    }
  };

  const handleSalvarAutomacao = async () => {
    if (!configuracaoAutomacao) return;

    setSalvandoAutomacao(true);
    try {
      await updateDoc(doc(db, "configuracao_automacao", configuracaoAutomacao.id), {
        ativo: configuracaoAutomacao.ativo,
        diasAntecedencia: configuracaoAutomacao.diasAntecedencia,
        gerarOSAutomatica: configuracaoAutomacao.gerarOSAutomatica,
        atualizadoEm: Timestamp.now(),
      });
      sonnerToast.success("Configurações de automação salvas!");
    } catch (error) {
      console.error(error);
      sonnerToast.error("Erro ao salvar configurações");
    } finally {
      setSalvandoAutomacao(false);
    }
  };

  if (loadingConfig || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Personalize tipos, períodos, categorias e automação para sua empresa
      </p>

      <Tabs defaultValue="tipos" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="tipos">Tipos de Manutenção</TabsTrigger>
          <TabsTrigger value="periodos">Períodos</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="automacao">Automação</TabsTrigger>
        </TabsList>

        {/* Tipos de Manutenção */}
        <TabsContent value="tipos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tipos de Manutenção Personalizados</CardTitle>
              <div className="flex gap-2">
                <Button onClick={adicionarTipo} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
                <Button onClick={salvarTipos} size="sm" variant="default">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.tiposManutencao.map((tipo) => (
                <div key={tipo.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={tipo.nome}
                        onChange={(e) => atualizarTipo(tipo.id, "nome", e.target.value)}
                        placeholder="Ex: Ferramentaria"
                      />
                    </div>
                    <div>
                      <Label>Cor</Label>
                      <Input
                        type="color"
                        value={tipo.cor}
                        onChange={(e) => atualizarTipo(tipo.id, "cor", e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <Switch
                        checked={tipo.ativo}
                        onCheckedChange={(checked) => atualizarTipo(tipo.id, "ativo", checked)}
                      />
                      <Label>Ativo</Label>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removerTipo(tipo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Períodos */}
        <TabsContent value="periodos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Períodos Personalizados</CardTitle>
              <div className="flex gap-2">
                <Button onClick={adicionarPeriodo} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
                <Button onClick={salvarPeriodos} size="sm" variant="default">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.periodosCustomizados.map((periodo) => (
                <div key={periodo.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={periodo.nome}
                        onChange={(e) => atualizarPeriodo(periodo.id, "nome", e.target.value)}
                        placeholder="Ex: A cada 45 dias"
                      />
                    </div>
                    <div>
                      <Label>Dias</Label>
                      <Input
                        type="number"
                        value={periodo.dias}
                        onChange={(e) => atualizarPeriodo(periodo.id, "dias", parseInt(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <Switch
                        checked={periodo.ativo}
                        onCheckedChange={(checked) => atualizarPeriodo(periodo.id, "ativo", checked)}
                      />
                      <Label>Ativo</Label>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removerPeriodo(periodo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categorias */}
        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Categorias de Equipamentos</CardTitle>
              <div className="flex gap-2">
                <Button onClick={adicionarCategoria} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
                <Button onClick={salvarCategorias} size="sm" variant="default">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.categoriasEquipamento.map((categoria) => (
                <div key={categoria.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={categoria.nome}
                        onChange={(e) => atualizarCategoria(categoria.id, "nome", e.target.value)}
                        placeholder="Ex: Produção"
                      />
                    </div>
                    <div>
                      <Label>Cor</Label>
                      <Input
                        type="color"
                        value={categoria.cor}
                        onChange={(e) => atualizarCategoria(categoria.id, "cor", e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <Switch
                        checked={categoria.ativo}
                        onCheckedChange={(checked) => atualizarCategoria(categoria.id, "ativo", checked)}
                      />
                      <Label>Ativo</Label>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removerCategoria(categoria.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automação */}
        <TabsContent value="automacao" className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tarefas Automatizadas</p>
                    <p className="text-2xl font-bold">{estatisticas?.totalTarefasAutomatizadas || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">OS Geradas (Mês)</p>
                    <p className="text-2xl font-bold">{estatisticas?.osGeradasMes || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold">{estatisticas?.taxaSucesso.toFixed(0)}%</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alertas Críticos</p>
                    <p className="text-2xl font-bold">{estatisticas?.tarefasCriticas || 0}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configurações de Automação */}
          {configuracaoAutomacao && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações de Automação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sistema de Automação</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar/desativar todo o sistema de automação
                    </p>
                  </div>
                  <Switch
                    checked={configuracaoAutomacao.ativo}
                    onCheckedChange={(checked) =>
                      setConfiguracaoAutomacao({ ...configuracaoAutomacao, ativo: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Gerar OS Automaticamente</Label>
                    <p className="text-sm text-muted-foreground">
                      Criar ordens de serviço automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={configuracaoAutomacao.gerarOSAutomatica}
                    onCheckedChange={(checked) =>
                      setConfiguracaoAutomacao({ ...configuracaoAutomacao, gerarOSAutomatica: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dias de Antecedência: {configuracaoAutomacao.diasAntecedencia} dia(s)</Label>
                  <p className="text-sm text-muted-foreground">
                    Criar alertas e OS com quantos dias de antecedência
                  </p>
                  <Slider
                    value={[configuracaoAutomacao.diasAntecedencia]}
                    onValueChange={(value) =>
                      setConfiguracaoAutomacao({ ...configuracaoAutomacao, diasAntecedencia: value[0] })
                    }
                    min={1}
                    max={7}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSalvarAutomacao} disabled={salvandoAutomacao}>
                    {salvandoAutomacao ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                  <Button onClick={handleExecutarAutomacao} disabled={loadingAutomacao} variant="outline">
                    <Play className={`h-4 w-4 mr-2 ${loadingAutomacao ? "animate-spin" : ""}`} />
                    {loadingAutomacao ? "Executando..." : "Executar Agora"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Execuções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum log registrado ainda
                    </p>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={log.tipo === "erro" ? "destructive" : "default"}
                            >
                              {log.tipo}
                            </Badge>
                            <p className="text-sm font-medium">{log.descricao}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.criadoEm.toDate().toLocaleString("pt-BR")}
                          </p>
                          {log.tipo !== "erro" && (
                            <p className="text-xs text-muted-foreground">
                              {log.tarefasVerificadas} tarefas • {log.osGeradas} OS • {log.alertasCriados} alertas
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
