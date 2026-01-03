import { useState } from "react";
import { Wrench, Factory, Cog, AlertTriangle, Activity, Settings, XCircle, Users, ClipboardList, MapPin, FileText } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SetoresTab from "@/components/GestaoManutencao/SetoresTab";
import EquipamentosTab from "@/components/GestaoManutencao/EquipamentosTab";
import GenericManutencaoTab from "@/components/GestaoManutencao/GenericManutencaoTab";
import ManutentoresTab from "@/components/GestaoManutencao/ManutentoresTab";
import TarefasTab from "@/components/GestaoManutencao/TarefasTab";
import ConfiguracoesTab from "@/components/GestaoManutencao/ConfiguracoesTab";

const GestaoSetores = () => {
  const [activeTab, setActiveTab] = useState("causas");

  return (
    <AppLayout title="Gestão de Manutenção">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto pb-2 lg:inline-flex w-full">
            <TabsTrigger value="causas" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Causas</span>
            </TabsTrigger>
            <TabsTrigger value="equipamentos" className="flex items-center gap-2">
              <Cog className="h-4 w-4" />
              <span className="hidden sm:inline">Equipamentos</span>
            </TabsTrigger>
            <TabsTrigger value="intervencoes" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Intervenções</span>
            </TabsTrigger>
            <TabsTrigger value="manutentores" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Manutentores</span>
            </TabsTrigger>
            <TabsTrigger value="setores" className="flex items-center gap-2">
              <Factory className="h-4 w-4" />
              <span className="hidden sm:inline">Setores</span>
            </TabsTrigger>
            <TabsTrigger value="sintomas" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Sintomas</span>
            </TabsTrigger>
            <TabsTrigger value="tarefas" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Tarefas</span>
            </TabsTrigger>
            <TabsTrigger value="tipos-falhas" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Tipos de Falhas</span>
            </TabsTrigger>
            <TabsTrigger value="tipos-manutencao" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Tipos de Manutenção</span>
            </TabsTrigger>
            <TabsTrigger value="origens-parada" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Origens de Parada</span>
            </TabsTrigger>
            <TabsTrigger value="motivos-os" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Motivos OS</span>
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setores" className="mt-6">
            <SetoresTab />
          </TabsContent>

          <TabsContent value="equipamentos" className="mt-6">
            <EquipamentosTab />
          </TabsContent>

          <TabsContent value="tipos-manutencao" className="mt-6">
            <GenericManutencaoTab
              collectionName="tipos_manutencao"
              title="Tipos de Manutenção"
              singularTitle="Tipo de Manutenção"
              icon={Settings}
              placeholder="Ex: Preventiva, Corretiva, Preditiva..."
            />
          </TabsContent>

          <TabsContent value="tipos-falhas" className="mt-6">
            <GenericManutencaoTab
              collectionName="tipos_falhas"
              title="Tipos de Falhas"
              singularTitle="Tipo de Falha"
              icon={XCircle}
              placeholder="Ex: Falha Mecânica, Falha Elétrica, Falha Operacional..."
            />
          </TabsContent>

          <TabsContent value="manutentores" className="mt-6">
            <ManutentoresTab />
          </TabsContent>

          <TabsContent value="tarefas" className="mt-6">
            <TarefasTab />
          </TabsContent>

          <TabsContent value="causas" className="mt-6">
            <GenericManutencaoTab
              collectionName="causas_manutencao"
              title="Causas"
              singularTitle="Causa"
              icon={AlertTriangle}
              placeholder="Ex: Desgaste, Falha Elétrica, Vazamento..."
            />
          </TabsContent>

          <TabsContent value="sintomas" className="mt-6">
            <GenericManutencaoTab
              collectionName="sintomas_manutencao"
              title="Sintomas"
              singularTitle="Sintoma"
              icon={Activity}
              placeholder="Ex: Ruído Anormal, Aquecimento, Vibração..."
            />
          </TabsContent>

          <TabsContent value="intervencoes" className="mt-6">
            <GenericManutencaoTab
              collectionName="intervencoes_manutencao"
              title="Intervenções"
              singularTitle="Intervenção"
              icon={Wrench}
              placeholder="Ex: Troca de Peça, Lubrificação, Ajuste..."
            />
          </TabsContent>

          <TabsContent value="origens-parada" className="mt-6">
            <GenericManutencaoTab
              collectionName="origens_parada"
              title="Origens de Parada"
              singularTitle="Origem de Parada"
              icon={MapPin}
              placeholder="Ex: Mecânica, Elétrica, Operacional..."
            />
          </TabsContent>

          <TabsContent value="motivos-os" className="mt-6">
            <GenericManutencaoTab
              collectionName="motivos_os"
              title="Motivos de OS"
              singularTitle="Motivo de OS"
              icon={FileText}
              placeholder="Ex: Manutenção Preventiva, Reparo Urgente, Inspeção..."
            />
          </TabsContent>

          <TabsContent value="configuracoes" className="mt-6">
            <ConfiguracoesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default GestaoSetores;
