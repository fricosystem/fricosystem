import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NovaOrdemServico from "@/components/NovaOrdemServico";
import ListaOrdensServico from "@/components/ListaOrdensServico";
import AppLayout from "@/layouts/AppLayout";

const OrdensServico = () => {
  return (
    <AppLayout title="Ordens de Serviço">
      <div className="w-full">
        <Tabs defaultValue="nova" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nova">Nova Ordem</TabsTrigger>
            <TabsTrigger value="lista">Listar Ordens</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nova">
            <NovaOrdemServico />
          </TabsContent>
          
          <TabsContent value="lista">
            <ListaOrdensServico />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default OrdensServico;