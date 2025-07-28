import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NovaOrdemServico from "@/components/NovaOrdemServico";
import ListaOrdensServico from "@/components/ListaOrdensServico";
import AppLayout from "@/layouts/AppLayout";

const OrdensServico = () => {
  return (
    <AppLayout title="Ordens de Serviço">
      <div className="flex flex-col h-[calc(100vh-64px)]"> {/* 64px é a altura do header */}
        <div className="flex-1 overflow-auto px-4 py-4 md:px-6">
          <Tabs defaultValue="nova" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="nova">Nova Ordem</TabsTrigger>
              <TabsTrigger value="listar">Ordens criadas</TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-auto">
              <TabsContent value="nova" className="h-full">
                <NovaOrdemServico />
              </TabsContent>
              <TabsContent value="listar" className="h-full">
                <ListaOrdensServico />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default OrdensServico;