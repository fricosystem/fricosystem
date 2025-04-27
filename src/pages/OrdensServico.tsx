import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NovaOrdemServico from "@/components/NovaOrdemServico";
import ListaOrdensServico from "@/components/ListaOrdensServico";
import AppLayout from "@/layouts/AppLayout";

const OrdensServico = () => {
  return (
    <AppLayout title="Ordens de Serviço">
      <div className="container mx-auto py-6">
        <Tabs defaultValue="nova" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="nova">Nova Ordem</TabsTrigger>
            <TabsTrigger value="listar">Listar Ordens</TabsTrigger>
          </TabsList>
          <TabsContent value="nova">
            <NovaOrdemServico />
          </TabsContent>
          <TabsContent value="listar">
            <ListaOrdensServico />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default OrdensServico;