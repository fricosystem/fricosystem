import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  Database,
  Save,
  RotateCcw,
  Mail,
  Activity,
  Loader2,
  Gauge,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useCQConfiguracoes, useCQKPIs, useCQUsuario } from "@/hooks/useCQ";
import type { CQConfiguracoes, GravidadeNC } from "@/types/typesCQ";

const GRAVIDADES: GravidadeNC[] = ["baixa", "media", "alta", "critica"];

const PADRAO: Omit<CQConfiguracoes, keyof import("@/types/typesCQ").CQBaseDocument> = {
  meta_conformidade: 95,
  meta_tempo_inspecao_min: 15,
  sla_nc_horas: { baixa: 168, media: 72, alta: 24, critica: 4 },
  aprovadores: [],
  alertas_email: false,
  alertas_destinatarios: [],
  bloquear_execucao_offline: false,
};

const ConfiguracoesCQ = () => {
  const usuario = useCQUsuario();
  const { data, loading, criar, atualizar } = useCQConfiguracoes();
  const { kpis } = useCQKPIs();

  const atual = useMemo(() => data[0] || null, [data]);
  const [form, setForm] = useState(PADRAO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (atual) {
      setForm({
        meta_conformidade: atual.meta_conformidade ?? PADRAO.meta_conformidade,
        meta_tempo_inspecao_min:
          atual.meta_tempo_inspecao_min ?? PADRAO.meta_tempo_inspecao_min,
        sla_nc_horas: { ...PADRAO.sla_nc_horas, ...(atual.sla_nc_horas || {}) },
        aprovadores: atual.aprovadores || [],
        alertas_email: !!atual.alertas_email,
        alertas_destinatarios: atual.alertas_destinatarios || [],
        bloquear_execucao_offline: !!atual.bloquear_execucao_offline,
      });
    }
  }, [atual]);

  const salvar = async () => {
    if (!usuario.uid) {
      toast.error("Sessão expirada");
      return;
    }
    setSalvando(true);
    try {
      if (atual) {
        await atualizar(atual.id, form);
      } else {
        await criar(form);
      }
      toast.success("Configurações de governança salvas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar configurações");
    } finally {
      setSalvando(false);
    }
  };

  const conformidadeVsMeta = kpis.taxaConformidade - form.meta_conformidade;

  return (
    <AppLayout title="Configurações e Governança do CQ">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Indicador real */}
        <Card className="bg-card border-border border-l-4 border-l-primary">
          <CardContent className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="relative h-16 w-16">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    className="stroke-muted fill-none"
                    strokeWidth="4"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-primary fill-none"
                    strokeWidth="4"
                    strokeDasharray={`${Math.min(kpis.taxaConformidade, 100)}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-semibold text-foreground text-xs">
                  {kpis.taxaConformidade.toFixed(0)}%
                </div>
              </div>
              <div>
                <h3 className="text-foreground font-bold text-lg">Conformidade atual</h3>
                <p className="text-xs text-muted-foreground">
                  {conformidadeVsMeta >= 0
                    ? `${conformidadeVsMeta.toFixed(1)} p.p. acima da meta definida (${form.meta_conformidade}%)`
                    : `${Math.abs(conformidadeVsMeta).toFixed(1)} p.p. abaixo da meta definida (${form.meta_conformidade}%)`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase font-semibold text-muted-foreground">NCs abertas</p>
              <p className="text-2xl font-semibold text-foreground">{kpis.ncsAbertas}</p>
            </div>
          </CardContent>
        </Card>

        {/* Metas */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2 font-bold">
              <Gauge className="h-5 w-5 text-success" />
              Metas de Qualidade
            </CardTitle>
            <CardDescription>
              Parâmetros usados pelos indicadores e alertas do módulo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Meta de conformidade (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                className="bg-background border-border"
                value={form.meta_conformidade}
                onChange={(e) =>
                  setForm({ ...form, meta_conformidade: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Tempo alvo por inspeção (min)
              </label>
              <Input
                type="number"
                min={1}
                className="bg-background border-border"
                value={form.meta_tempo_inspecao_min}
                onChange={(e) =>
                  setForm({ ...form, meta_tempo_inspecao_min: Number(e.target.value) || 0 })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* SLA por gravidade */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2 font-bold">
              <Activity className="h-5 w-5 text-warning" />
              SLA de tratativa de Não Conformidades (horas)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {GRAVIDADES.map((g) => (
              <div key={g} className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">{g}</label>
                <Input
                  type="number"
                  min={1}
                  className="bg-background border-border"
                  value={form.sla_nc_horas[g]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sla_nc_horas: { ...form.sla_nc_horas, [g]: Number(e.target.value) || 0 },
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Governança */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2 font-bold">
              <ShieldCheck className="h-5 w-5 text-success" />
              Governança e Aprovações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Aprovadores (e-mails separados por vírgula)
              </label>
              <Input
                className="bg-background border-border"
                value={form.aprovadores.join(", ")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    aprovadores: e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="qualidade@empresa.com, supervisor@empresa.com"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
              <div className="space-y-0.5">
                <p className="text-sm text-foreground font-bold">Bloquear execução offline</p>
                <p className="text-xs text-muted-foreground">
                  Exige conexão ativa para registrar inspeções e assinaturas.
                </p>
              </div>
              <Switch
                checked={form.bloquear_execucao_offline}
                onCheckedChange={(v) => setForm({ ...form, bloquear_execucao_offline: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2 font-bold">
              <Mail className="h-5 w-5 text-primary" />
              Alertas por E-mail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
              <div className="space-y-0.5">
                <p className="text-sm text-foreground font-bold">Notificar NCs críticas</p>
                <p className="text-xs text-muted-foreground">
                  Dispara aviso aos destinatários ao abrir uma NC de gravidade alta ou crítica.
                </p>
              </div>
              <Switch
                checked={form.alertas_email}
                onCheckedChange={(v) => setForm({ ...form, alertas_email: v })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Destinatários (separados por vírgula)
              </label>
              <Input
                className="bg-background border-border"
                disabled={!form.alertas_email}
                value={form.alertas_destinatarios.join(", ")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    alertas_destinatarios: e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="diretoria@empresa.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Origem dos dados */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2 font-bold">
              <Database className="h-5 w-5 text-primary" />
              Registro
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {loading
              ? "Carregando configurações..."
              : atual
                ? `Documento ativo v${atual.versao} · última alteração por ${atual.criado_por || "—"}`
                : "Nenhuma configuração salva ainda — os valores abaixo serão criados no primeiro salvamento."}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              setForm(
                atual
                  ? {
                      meta_conformidade: atual.meta_conformidade,
                      meta_tempo_inspecao_min: atual.meta_tempo_inspecao_min,
                      sla_nc_horas: { ...PADRAO.sla_nc_horas, ...(atual.sla_nc_horas || {}) },
                      aprovadores: atual.aprovadores || [],
                      alertas_email: !!atual.alertas_email,
                      alertas_destinatarios: atual.alertas_destinatarios || [],
                      bloquear_execucao_offline: !!atual.bloquear_execucao_offline,
                    }
                  : PADRAO,
              );
              toast.info("Alterações descartadas");
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Descartar
          </Button>
          <Button
            className="bg-success hover:bg-success/90 text-foreground font-bold px-8"
            onClick={salvar}
            disabled={salvando}
          >
            {salvando ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Governança
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ConfiguracoesCQ;
