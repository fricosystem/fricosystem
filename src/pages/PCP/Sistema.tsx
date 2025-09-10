import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Settings, Calculator, Clock, Users, Save, RefreshCw, Edit, X, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { usePCPConfig } from "@/hooks/usePCPConfig";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const configSchema = z.object({
  meta_minima_mensal: z.number().min(1, "Meta mínima mensal deve ser maior que 0"),
  dias_uteis_mes: z.number().min(1, "Dias úteis deve ser maior que 0").max(31, "Máximo de 31 dias"),
});

type ConfigFormData = z.infer<typeof configSchema>;

// Funções utilitárias para formatação brasileira
const formatarNumero = (valor: number): string => {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatarNumeroInput = (valor: number): string => {
  return valor.toLocaleString('pt-BR');
};

const parseNumero = (valor: string): number => {
  // Remove pontos (separadores de milhares) e substitui vírgula por ponto
  const cleanValue = valor.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

const Sistema = () => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const { 
    config, 
    metaMensal, 
    loading, 
    error, 
    saveConfig, 
    gerarMetaMensal, 
    calcularDiasUteis,
    getCurrentMonth,
    carregarProducaoTotal,
    carregarMetaDiariaRealizada,
    contarDocumentosPCP,
    salvarConfigSistema
  } = usePCPConfig();
  const { toast } = useToast();

  const [diasTrabalhados, setDiasTrabalhados] = useState(0);
  const [diasParaFecharMes, setDiasParaFecharMes] = useState(0);
  const [totalProducao, setTotalProducao] = useState(0);
  const [volumeDiasRestantes, setVolumeDiasRestantes] = useState(0);
  const [metaDiariaRealizada, setMetaDiariaRealizada] = useState(0);
  const [progressoMensal, setProgressoMensal] = useState(0);

  // Estados para controlar valores formatados dos inputs
  const [metaMensalFormatada, setMetaMensalFormatada] = useState('0');
  const [diasUteisFormatados, setDiasUteisFormatados] = useState('0');
  
  // Estados para edição
  const [editandoMetaMensal, setEditandoMetaMensal] = useState(false);
  const [editandoDiasUteis, setEditandoDiasUteis] = useState(false);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      meta_minima_mensal: 0,
      dias_uteis_mes: 0,
    }
  });

  // Atualizar form quando config carrega
  useEffect(() => {
    if (!loading && config) {
      const metaMinima = config.meta_minima_mensal || 0;
      const diasUteis = config.dias_uteis_mes || 0;
      
      form.reset({
        meta_minima_mensal: metaMinima,
        dias_uteis_mes: diasUteis,
      });

      // Atualizar valores formatados
      setMetaMensalFormatada(formatarNumeroInput(metaMinima));
      setDiasUteisFormatados(formatarNumeroInput(diasUteis));

      // Carregar exceções para o calendário
      const excecoes = config.calendario_excecoes.map(dateStr => new Date(dateStr));
      setSelectedDates(excecoes);
    }
  }, [config, loading, form]);

  // Carregar dados reais do sistema
  useEffect(() => {
    const carregarDadosReais = async () => {
      try {
        // Carregar produção total dos Resultados Finais
        const producaoTotalReal = await carregarProducaoTotal();
        setTotalProducao(producaoTotalReal);

        // Carregar meta diária realizada do último processamento
        const metaDiariaReal = await carregarMetaDiariaRealizada();
        setMetaDiariaRealizada(metaDiariaReal);

        // Contar documentos PCP criados (dias trabalhados)
        const documentosCount = await contarDocumentosPCP();
        setDiasTrabalhados(documentosCount);
      } catch (error) {
        console.error('Erro ao carregar dados reais:', error);
      }
    };

    carregarDadosReais();
  }, [carregarProducaoTotal, carregarMetaDiariaRealizada, contarDocumentosPCP]);

  // Calcular valores derivados quando os inputs mudam
  useEffect(() => {
    const metaMinimaMensal = form.watch("meta_minima_mensal") || 0;
    const diasUteisMes = form.watch("dias_uteis_mes") || 0;
    
    // Cálculos baseados nos dados reais
    const diasRestantes = Math.max(0, diasUteisMes - diasTrabalhados);
    const volumeRestante = Math.max(0, metaMinimaMensal - totalProducao);
    const progresso = metaMinimaMensal > 0 ? (totalProducao / metaMinimaMensal) * 100 : 0;

    setDiasParaFecharMes(diasRestantes);
    setVolumeDiasRestantes(volumeRestante);
    setProgressoMensal(progresso);
  }, [form.watch("meta_minima_mensal"), form.watch("dias_uteis_mes"), diasTrabalhados, totalProducao]);

  const onSubmit = async (data: ConfigFormData) => {
    // Converter valores formatados para números
    const dataToSave = {
      meta_minima_mensal: parseNumero(metaMensalFormatada),
      dias_uteis_mes: parseNumero(diasUteisFormatados)
    };

    const success = await salvarConfigSistema(dataToSave);

    if (success) {
      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram salvas na coleção PCP_configuracoes!",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    }
  };

  const getCurrentMonthName = () => {
    const [ano, mes] = getCurrentMonth().split('-');
    const data = new Date(parseInt(ano), parseInt(mes) - 1);
    return format(data, "MMMM 'de' yyyy", { locale: pt });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando configurações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
      
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Controle e Progresso da Meta Mensal
              </CardTitle>
              <CardDescription>
                Configure parâmetros e acompanhe o progresso em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="meta_minima_mensal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta Mínima Mensal (KG)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={metaMensalFormatada}
                                onChange={(e) => {
                                  setMetaMensalFormatada(e.target.value);
                                  field.onChange(parseNumero(e.target.value));
                                }}
                                disabled={!editandoMetaMensal}
                                className={editandoMetaMensal ? "border-primary" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dias_uteis_mes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dias Úteis do Mês</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={diasUteisFormatados}
                                onChange={(e) => {
                                  setDiasUteisFormatados(e.target.value);
                                  field.onChange(parseNumero(e.target.value));
                                }}
                                disabled={!editandoDiasUteis}
                                className={editandoDiasUteis ? "border-primary" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      {!editandoMetaMensal && !editandoDiasUteis && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditandoMetaMensal(true);
                            setEditandoDiasUteis(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Editar Configurações
                        </Button>
                      )}
                      
                      {(editandoMetaMensal || editandoDiasUteis) && (
                        <>
                          <Button type="submit" className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Salvar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditandoMetaMensal(false);
                              setEditandoDiasUteis(false);
                              if (config) {
                                setMetaMensalFormatada(formatarNumeroInput(config.meta_minima_mensal || 0));
                                setDiasUteisFormatados(formatarNumeroInput(config.dias_uteis_mes || 0));
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </form>
              </Form>
              
              <Separator />
              
              {/* Resumo do Progresso Mensal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Resumo do Progresso Mensal
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">{diasTrabalhados}</div>
                    <div className="text-xs text-muted-foreground">Dias Trabalhados</div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-lg font-bold text-orange-600">{diasParaFecharMes}</div>
                    <div className="text-xs text-muted-foreground">Dias Restantes</div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">{formatarNumero(totalProducao)}</div>
                    <div className="text-xs text-muted-foreground">Total Produzido (kg)</div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-lg font-bold text-red-600">{formatarNumero(volumeDiasRestantes)}</div>
                    <div className="text-xs text-muted-foreground">Volume Restante (kg)</div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-lg font-bold text-purple-600">{formatarNumero(metaDiariaRealizada)}</div>
                    <div className="text-xs text-muted-foreground">Meta Diária Realizada (kg)</div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-lg font-bold text-teal-600">{progressoMensal.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Progresso Mensal</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Progresso Visual */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Progresso da Meta - {getCurrentMonthName()}
                </h3>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Produção vs Meta</span>
                  <span className="text-sm text-muted-foreground">
                    {formatarNumero(totalProducao)} / {formatarNumero(parseNumero(metaMensalFormatada))} kg
                  </span>
                </div>
                
                <Progress value={progressoMensal} className="h-3" />
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">0%</span>
                  <Badge variant={progressoMensal >= 100 ? 'default' : progressoMensal >= 80 ? 'secondary' : progressoMensal >= 60 ? 'outline' : 'destructive'}>
                    {progressoMensal.toFixed(1)}% da meta
                  </Badge>
                  <span className="text-muted-foreground">100%</span>
                </div>
              </div>
            </CardContent>
          </Card>


          <div className="flex justify-end">
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar Configurações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Sistema;