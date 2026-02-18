import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/AppLayout';
import { EnvioRetorno } from '@/types/typesEnvioRetorno';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Truck, PackageCheck, History } from 'lucide-react';
import EnvioRetornoForm from '@/components/EnvioRetorno/EnvioRetornoForm';
import EnvioRetornoList from '@/components/EnvioRetorno/EnvioRetornoList';
import EnvioRetornoModal from '@/components/EnvioRetorno/EnvioRetornoModal';

const EnvioRetornoPage = () => {
  const [envios, setEnvios] = useState<EnvioRetorno[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnvio, setSelectedEnvio] = useState<EnvioRetorno | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const q = query(
      collection(db, 'conserto_manutencao'),
      orderBy('dataCadastro', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const enviosData: EnvioRetorno[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          enviosData.push({
            id: doc.id,
            ...data,
            dataCadastro: data.dataCadastro?.toDate(),
            dataEnvio: data.dataEnvio?.toDate(),
            dataRetorno: data.dataRetorno?.toDate(),
            atualizadoEm: data.atualizadoEm?.toDate(),
          } as EnvioRetorno);
        });
        setEnvios(enviosData);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar envios:', error);
        setLoading(false);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar os envios para conserto.',
          variant: 'destructive',
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const handleCreateEnvio = async (data: any) => {
    try {
      await addDoc(collection(db, 'conserto_manutencao'), {
        ...data,
        status: 'aguardando_envio',
        dataCadastro: serverTimestamp(),
        criadoPor: user?.email || 'Sistema',
        atualizadoPor: user?.email || 'Sistema',
        atualizadoEm: serverTimestamp(),
      });

      toast({
        title: 'Sucesso',
        description: 'Envio para conserto registrado com sucesso!',
      });
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao criar envio:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao registrar o envio para conserto.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (envioId: string, status: EnvioRetorno['status'], fotosRetorno?: string[]) => {
    try {
      const updateData: any = {
        status,
        atualizadoPor: user?.email || 'Sistema',
        atualizadoEm: serverTimestamp(),
      };

      if (status === 'enviado') {
        updateData.dataEnvio = serverTimestamp();
      } else if (status === 'retornou' && fotosRetorno) {
        updateData.dataRetorno = serverTimestamp();
        updateData.fotosRetorno = fotosRetorno;
      }

      await updateDoc(doc(db, 'conserto_manutencao', envioId), updateData);

      toast({
        title: 'Sucesso',
        description: `Status atualizado para ${status.replace('_', ' ')}!`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar o status.',
        variant: 'destructive',
      });
    }
  };

  const aguardandoEnvio = envios.filter(e => e.status === 'aguardando_envio');
  const enviados = envios.filter(e => e.status === 'enviado');
  const retornados = envios.filter(e => e.status === 'retornou');

  return (
    <AppLayout title="Envio/Retorno - Manutenção">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Envio/Retorno</h1>
            <p className="text-muted-foreground">
              Gerenciamento de materiais enviados para conserto e retorno
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Envio
          </Button>
        </div>

        <Tabs defaultValue="aguardando" className="space-y-4">
          <TabsList>
            <TabsTrigger value="aguardando">
              <PackageCheck className="h-4 w-4 mr-2" />
              Aguardando Envio ({aguardandoEnvio.length})
            </TabsTrigger>
            <TabsTrigger value="enviados">
              <Truck className="h-4 w-4 mr-2" />
              Enviados ({enviados.length})
            </TabsTrigger>
            <TabsTrigger value="retornados">
              <History className="h-4 w-4 mr-2" />
              Retornados ({retornados.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aguardando">
            <EnvioRetornoList
              envios={aguardandoEnvio}
              loading={loading}
              onSelectEnvio={setSelectedEnvio}
              onUpdateStatus={handleUpdateStatus}
            />
          </TabsContent>

          <TabsContent value="enviados">
            <EnvioRetornoList
              envios={enviados}
              loading={loading}
              onSelectEnvio={setSelectedEnvio}
              onUpdateStatus={handleUpdateStatus}
            />
          </TabsContent>

          <TabsContent value="retornados">
            <EnvioRetornoList
              envios={retornados}
              loading={loading}
              onSelectEnvio={setSelectedEnvio}
              onUpdateStatus={handleUpdateStatus}
            />
          </TabsContent>
        </Tabs>

        {isFormOpen && (
          <EnvioRetornoForm
            onSubmit={handleCreateEnvio}
            onCancel={() => setIsFormOpen(false)}
          />
        )}

        {selectedEnvio && (
          <EnvioRetornoModal
            envio={selectedEnvio}
            onClose={() => setSelectedEnvio(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default EnvioRetornoPage;