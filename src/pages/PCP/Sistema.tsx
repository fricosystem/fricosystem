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
    getCurrentMonth 
  } = usePCPConfig();
  const { toast } = useToast();

  const [diasTrabalhados, setDiasTrabalhados] = useState(0);
  const [diasParaFecharMes, setDiasParaFecharMes] = useState(0);
  const [totalProducao, setTotalProducao] = useState(0);
  const [volumeDiasRestantes, setVolumeDiasRestantes] = useState(0);
  const [metaDiariaRealizada, setMetaDiariaRealizada] = useState(0);
  const [progressoMensal, setProgressoMensal] = useState(0);

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
      form.reset({
        meta_minima_mensal: config.meta_minima_mensal || 0,
        dias_uteis_mes: config.dias_uteis_mes || 0,
      });

      // Carregar exceções para o calendário
      const excecoes = config.calendario_excecoes.map(dateStr => new Date(dateStr));
      setSelectedDates(excecoes);
    }
  }, [config, loading, form]);

  // Calcular valores derivados quando os inputs mudam
  useEffect(() => {
    const metaMinimaMensal = form.watch("meta_minima_mensal") || 0;
    const diasUteisMes = form.watch("dias_uteis_mes") || 0;
    
    // Cálculos simplificados (ajuste conforme sua lógica de negócio)
    const diasTrab = Math.min(diasUteisMes, 15); // Exemplo: assumindo que metade do mês já passou
    const diasRestantes = Math.max(0, diasUteisMes - diasTrab);
    const totalProd = metaMinimaMensal * 0.6; // Exemplo: 60% da meta já produzida
    const volumeRestante = Math.max(0, metaMinimaMensal - totalProd);
    const metaDiaria = diasUteisMes > 0 ? metaMinimaMensal / diasUteisMes : 0;
    const progresso = metaMinimaMensal > 0 ? (totalProd / metaMinimaMensal) * 100 : 0;

    setDiasTrabalhados(diasTrab);
    setDiasParaFecharMes(diasRestantes);
    setTotalProducao(totalProd);
    setVolumeDiasRestantes(volumeRestante);
    setMetaDiariaRealizada(metaDiaria);
    setProgressoMensal(progresso);
  }, [form.watch("meta_minima_mensal"), form.watch("dias_uteis_mes")]);

  const onSubmit = async (data: ConfigFormData) => {
    const selectedDatesStr = selectedDates.map(date => date.toISOString().split('T')[0]);
    
    const success = await saveConfig({
      ...data,
      calendario_excecoes: selectedDatesStr
    });

    if (success) {
      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram atualizadas com sucesso!",
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
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                            type="number"
                            min="1"
                            max="31"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Dias Trabalhados: {diasTrabalhados}</Label>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Dias para Fechar o Mês: {diasParaFecharMes}</Label>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Total Produção (KG): {totalProducao.toFixed(2)}</Label>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Volume dos Dias Restantes (KG): {volumeDiasRestantes.toFixed(2)}</Label>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Meta Diária Realizada (KG): {metaDiariaRealizada.toFixed(2)}</Label>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendário de Exceções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione as datas que não devem ser consideradas como dias úteis (feriados, manutenções, etc.)
                </p>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {selectedDates.length > 0 
                        ? `${selectedDates.length} data(s) selecionada(s)`
                        : "Selecionar datas de exceção"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={(dates) => setSelectedDates(dates || [])}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {selectedDates.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedDates.map((date, index) => (
                      <Badge key={index} variant="secondary">
                        {format(date, "dd/MM/yyyy", { locale: pt })}
                      </Badge>
                    ))}
                  </div>
                )}
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