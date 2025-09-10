import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { CalendarIcon, Settings, Calculator, Clock, Users, Save, RefreshCw } from "lucide-react";
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Parâmetros de Produção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="meta_minima_mensal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Mínima Mensal (KG)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={metaMensalFormatada}
                            onChange={(e) => {
                              const valor = e.target.value;
                              setMetaMensalFormatada(valor);
                              field.onChange(parseNumero(valor));
                            }}
                            placeholder="Ex: 100.000"
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
                        <FormLabel>Dias Úteis no Mês</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            value={diasUteisFormatados}
                            onChange={(e) => {
                              const valor = e.target.value;
                              setDiasUteisFormatados(valor);
                              field.onChange(parseNumero(valor));
                            }}
                            placeholder="Ex: 22"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold">Dias Trabalhados: {diasTrabalhados}</Label>
                  </div>
                  
                  <div>
                    <Label className="text-lg font-semibold">Dias para Fechar o Mês: {diasParaFecharMes}</Label>
                  </div>

                  <div>
                    <Label className="text-lg font-semibold">Total Produção (KG): {formatarNumero(totalProducao)}</Label>
                  </div>

                  <div>
                    <Label className="text-lg font-semibold">Volume dos Dias Restantes (KG): {formatarNumero(volumeDiasRestantes)}</Label>
                  </div>

                  <div>
                    <Label className="text-lg font-semibold">Meta Diária Realizada (KG): {formatarNumero(metaDiariaRealizada)}</Label>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Progresso Mensal: {progressoMensal.toFixed(2)}%</Label>
                <Progress value={progressoMensal} className="w-full" />
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