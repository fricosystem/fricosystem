import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NovaOrdemServico from "@/components/NovaOrdemServico";
import ListaOrdensServico from "@/components/ListaOrdensServico";
import AppLayout from "@/layouts/AppLayout";

const OrdensServico = () => {
  return (
    <AppLayout title="Ordens de Serviço">
      <div className="flex flex-col h-[calc(100vh-64px)] w-full">
        <div className="flex-1 overflow-auto px-1 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4">
          <Tabs defaultValue="nova" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-2 sm:mb-3 md:mb-4 h-9 sm:h-10">
              <TabsTrigger value="nova" className="text-xs sm:text-sm">Nova Ordem</TabsTrigger>
              <TabsTrigger value="listar" className="text-xs sm:text-sm">Ordens Criadas</TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-auto min-h-0">
              <TabsContent value="nova" className="h-full mt-0">
                <NovaOrdemServico />
              </TabsContent>
              <TabsContent value="listar" className="h-full mt-0">
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