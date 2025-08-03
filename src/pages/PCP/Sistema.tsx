import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const Sistema = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros de Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Meta Diária</Label>
                <Input placeholder="2000" />
              </div>
              <div>
                <Label>Eficiência Mínima Aceitável</Label>
                <Input placeholder="80" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Horário 1° Turno</Label>
                <div className="flex gap-2">
                  <Input placeholder="06:00" />
                  <Input placeholder="14:00" />
                </div>
              </div>
              <div>
                <Label>Horário 2° Turno</Label>
                <div className="flex gap-2">
                  <Input placeholder="14:00" />
                  <Input placeholder="22:00" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Integrações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>ERP</Label>
                <p className="text-sm text-muted-foreground">
                  Integração com sistema ERP
                </p>
              </div>
              <Button variant="outline">Configurar</Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>MES</Label>
                <p className="text-sm text-muted-foreground">
                  Sistema de Execução de Manufatura
                </p>
              </div>
              <Button variant="outline">Configurar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sistema;