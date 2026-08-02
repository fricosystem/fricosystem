import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import AppLayout from "@/layouts/AppLayout";
import { executarAutomacaoCompleta } from "@/services/automacaoManutencao";
import { toast } from "sonner";
import {
  Settings,
  Play,
  History,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { ConfiguracaoAutomacao, LogAutomacao, EstatisticasAutomacao } from "@/types/typesAlertasManutencao";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const AutomacaoManutencao = () => {
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoAutomacao | null>(null);
  const [logs, setLogs] = useState<LogAutomacao[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasAutomacao | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Carregar configuração
      const configSnapshot = await getDocs(collection(db, "configuracao_automacao"));
      if (!configSnapshot.empty) {
        const doc = configSnapshot.docs[0];
        setConfiguracao({ id: doc.id, ...doc.data() } as ConfiguracaoAutomacao);
      } else {
        // Criar configuração padrão
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
        setConfiguracao({ id: docRef.id, ...novaConfig } as ConfiguracaoAutomacao);
      }

      // Carregar logs recentes
      const logsRef = collection(db, "logs_automacao");
      const q = query(logsRef, orderBy("criadoEm", "desc"), limit(10));
      const logsSnapshot = await getDocs(q);
      const logsData = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogAutomacao[];
      setLogs(logsData);

      // Calcular estatísticas
      await calcularEstatisticas();
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar configurações");
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
      const alertas = alertasSnapshot.docs.map(doc => doc.data());
      const tarefasCriticas = alertas.filter((a: any) => a.urgencia === "critico").length;
      const tarefasProximas = alertas.filter((a: any) => a.urgencia === "alto" || a.urgencia === "medio").length;

      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      let osGeradasMes = 0;
      ordensSnapshot.docs.forEach(doc => {
        const ordem = doc.data();
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
      const sucessos = logsSnapshot.docs.filter(doc => doc.data().tipo !== "erro").length;
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

  const handleExecutar = async () => {
    setLoading(true);
    try {
      const resultado = await executarAutomacaoCompleta();
      if (resultado.success) {
        toast.success(
          `Automação executada! ${resultado.osGeradas} OS geradas, ${resultado.alertasCriados} alertas criados.`
        );
        await carregarDados();
      } else {
        toast.error("Erro: " + resultado.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao executar automação");
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarConfiguracao = async () => {
    if (!configuracao) return;

    setSalvando(true);
    try {
      await updateDoc(doc(db, "configuracao_automacao", configuracao.id), {
        ativo: configuracao.ativo,
        diasAntecedencia: configuracao.diasAntecedencia,
        gerarOSAutomatica: configuracao.gerarOSAutomatica,
        atualizadoEm: Timestamp.now(),
      });
      toast.success("Configurações salvas!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSalvando(false);
    }
  };

  if (!configuracao) {
    return (
      <AppLayout title="Automação de Manutenção">
        <div className="flex items-center justify-center h-full">
          <p>Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Automação de Manutenção">
      <div className="p-6 space-y-6">
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

        {/* Configurações */}
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
                checked={configuracao.ativo}
                onCheckedChange={(checked) =>
                  setConfiguracao({ ...configuracao, ativo: checked })
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
                checked={configuracao.gerarOSAutomatica}
                onCheckedChange={(checked) =>
                  setConfiguracao({ ...configuracao, gerarOSAutomatica: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Dias de Antecedência: {configuracao.diasAntecedencia} dia(s)</Label>
              <p className="text-sm text-muted-foreground">
                Criar alertas e OS com quantos dias de antecedência
              </p>
              <Slider
                value={[configuracao.diasAntecedencia]}
                onValueChange={(value) =>
                  setConfiguracao({ ...configuracao, diasAntecedencia: value[0] })
                }
                min={1}
                max={7}
                step={1}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSalvarConfiguracao} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar Configurações"}
              </Button>
              <Button onClick={handleExecutar} disabled={loading} variant="outline">
                <Play className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Executando..." : "Executar Agora"}
              </Button>
            </div>
          </CardContent>
        </Card>

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
      </div>
    </AppLayout>
  );
};

export default AutomacaoManutencao;
