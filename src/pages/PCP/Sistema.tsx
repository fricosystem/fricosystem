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
  meta_diaria_global: z.number().min(1, "Meta diária deve ser maior que 0"),
  eficiencia_minima: z.number().min(1, "Eficiência mínima deve ser maior que 0").max(100, "Eficiência máxima é 100%"),
  horario_turno1_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)"),
  horario_turno1_fim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)"),
  horario_turno2_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)"),
  horario_turno2_fim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:MM)"),
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

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      meta_diaria_global: config.meta_diaria_global,
      eficiencia_minima: config.eficiencia_minima,
      horario_turno1_inicio: config.horario_turno1_inicio,
      horario_turno1_fim: config.horario_turno1_fim,
      horario_turno2_inicio: config.horario_turno2_inicio,
      horario_turno2_fim: config.horario_turno2_fim,
    }
  });

  // Atualizar form quando config carrega
  useEffect(() => {
    if (!loading && config) {
      form.reset({
        meta_diaria_global: config.meta_diaria_global,
        eficiencia_minima: config.eficiencia_minima,
        horario_turno1_inicio: config.horario_turno1_inicio,
        horario_turno1_fim: config.horario_turno1_fim,
        horario_turno2_inicio: config.horario_turno2_inicio,
        horario_turno2_fim: config.horario_turno2_fim,
      });

      // Carregar exceções para o calendário
      const excecoes = config.calendario_excecoes.map(dateStr => new Date(dateStr));
      setSelectedDates(excecoes);
    }
  }, [config, loading, form]);

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

  const handleGerarMeta = async () => {
    setIsGeneratingMeta(true);
    try {
      const novaMeta = await gerarMetaMensal();
      if (novaMeta) {
        toast({
          title: "Meta gerada",
          description: `Meta mensal de ${novaMeta.meta_mensal_global.toLocaleString()} kg gerada para ${novaMeta.dias_uteis} dias úteis.`,
        });
      }
    } finally {
      setIsGeneratingMeta(false);
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
                    name="meta_diaria_global"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Diária Global (kg)</FormLabel>
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
                    name="eficiencia_minima"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eficiência Mínima Aceitável (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
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
                    <Label className="text-sm font-medium">Horário 1° Turno</Label>
                    <div className="flex gap-2 mt-2">
                      <FormField
                        control={form.control}
                        name="horario_turno1_inicio"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="06:00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="horario_turno1_fim"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="14:00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Horário 2° Turno</Label>
                    <div className="flex gap-2 mt-2">
                      <FormField
                        control={form.control}
                        name="horario_turno2_inicio"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="14:00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="horario_turno2_fim"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="22:00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Metas Mensais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Mês Atual</Label>
                <p className="text-lg font-semibold">{getCurrentMonthName()}</p>
              </div>
              
              {metaMensal ? (
                <>
                  <div>
                    <Label className="text-sm font-medium">Dias Úteis</Label>
                    <p className="text-lg font-semibold">{metaMensal.dias_uteis} dias</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Meta Mensal</Label>
                    <p className="text-lg font-semibold">
                      {metaMensal.meta_mensal_global.toLocaleString()} kg
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant="default" className="ml-2">Meta Configurada</Badge>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">Nenhuma meta configurada para este mês</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <div>
                <Label className="text-sm font-medium">Gerar/Recalcular Meta</Label>
                <p className="text-sm text-muted-foreground">
                  Calcula automaticamente a meta mensal baseada nos dias úteis e meta diária
                </p>
              </div>
              
              <Button 
                onClick={handleGerarMeta} 
                disabled={isGeneratingMeta}
                className="flex items-center gap-2"
              >
                {isGeneratingMeta ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )}
                {isGeneratingMeta ? "Calculando..." : "Gerar Meta do Mês"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sistema;