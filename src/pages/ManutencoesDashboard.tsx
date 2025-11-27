import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/AppLayout";
import { executarManutencaoManual } from "@/services/gerarOrdensManutencao";
import { toast } from "sonner";
import { Calendar, RefreshCw } from "lucide-react";

const ManutencoesDashboard = () => {
  const [loading, setLoading] = useState(false);

  const handleGerarOrdens = async () => {
    setLoading(true);
    try {
      const resultado = await executarManutencaoManual();
      if (resultado.success) {
        toast.success(
          `Verificação concluída! ${resultado.osGeradas} ordem(ns) gerada(s) de ${resultado.tarefasVerificadas} tarefa(s) verificada(s).`
        );
      } else {
        toast.error("Erro ao gerar ordens: " + resultado.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao executar geração de ordens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Dashboard de Manutenções">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Manutenção Preventiva Automática
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Este sistema verifica automaticamente as peças configuradas para manutenção preventiva
              e gera ordens de serviço quando estão próximas da data agendada.
            </p>
            
            <div className="p-4 bg-primary/5 rounded-lg border">
              <h3 className="font-semibold mb-2">Como funciona:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Configure intervalos de manutenção nas peças e sub-peças</li>
                <li>Ative a geração automática de ordens</li>
                <li>O sistema verifica diariamente e cria ordens pendentes</li>
                <li>Quando concluída, a próxima manutenção é calculada automaticamente</li>
              </ul>
            </div>

            <Button 
              onClick={handleGerarOrdens} 
              disabled={loading}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Verificando..." : "Executar Verificação Manual"}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Em produção, esta verificação deve rodar automaticamente via cron job diário.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ManutencoesDashboard;
