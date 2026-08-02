import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Settings, Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/layouts/AppLayout";
import {
  getConfiguracaoEmpresa,
  atualizarTiposManutencao,
  atualizarPeriodosCustomizados,
  atualizarCategoriasEquipamento,
  atualizarChecklistsPadrao
} from "@/firebase/configuracoesManutencao";
import {
  ConfiguracaoEmpresa,
  TipoManutencaoCustom,
  PeriodoCustomizado,
  CategoriaEquipamento,
  ChecklistPadrao,
  ChecklistItemPadrao
} from "@/types/typesManutencaoPreventiva";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function ConfiguracoesManutencao() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [config, setConfig] = useState<ConfiguracaoEmpresa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarConfiguracao();
  }, []);

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
      setLoading(false);
    }
  };

  // Gerenciar Tipos de Manutenção
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

  // Gerenciar Períodos
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

  // Gerenciar Categorias
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

  if (loading || !config) {
    return (
      <AppLayout title="Configurações de Manutenção">
        <div className="flex items-center justify-center h-64">
          <p>Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Configurações de Manutenção">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/manutencao-preventiva")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <p className="text-muted-foreground">
              Personalize tipos, períodos e categorias para sua empresa
            </p>
          </div>
        </div>

        <Tabs defaultValue="tipos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tipos">Tipos de Manutenção</TabsTrigger>
            <TabsTrigger value="periodos">Períodos</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
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
                    <div className="flex-1 grid grid-cols-3 gap-4">
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
                    <div className="flex-1 grid grid-cols-3 gap-4">
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
                    <div className="flex-1 grid grid-cols-3 gap-4">
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
        </Tabs>
      </div>
    </AppLayout>
  );
}
