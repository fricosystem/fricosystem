import React, { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { usePlanejamentoDesenvolvimento } from '@/hooks/usePlanejamentoDesenvolvimento';
import { AddTarefaModal } from '@/components/Planejamento/AddTarefaModal';
import { EditTarefaModal } from '@/components/Planejamento/EditTarefaModal';
import { useToast } from '@/components/ui/use-toast';

export interface Tarefa {
  id: string;
  nome: string;
  detalhes: string;
  concluido: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

const PlanejamentoDesenvolvimento = () => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null);
  
  const {
    tarefas,
    loading,
    addTarefa,
    updateTarefa,
    deleteTarefa,
    toggleConcluido
  } = usePlanejamentoDesenvolvimento();

  const handleAddTarefa = async (tarefaData: Omit<Tarefa, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    try {
      await addTarefa(tarefaData);
      setIsAddModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Tarefa adicionada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditTarefa = async (id: string, tarefaData: Partial<Tarefa>) => {
    try {
      await updateTarefa(id, tarefaData);
      setIsEditModalOpen(false);
      setSelectedTarefa(null);
      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTarefa = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await deleteTarefa(id);
        toast({
          title: "Sucesso",
          description: "Tarefa excluída com sucesso!",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir tarefa. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleConcluido = async (id: string, concluido: boolean) => {
    try {
      await toggleConcluido(id, concluido);
      toast({
        title: "Sucesso",
        description: `Tarefa ${concluido ? 'marcada como concluída' : 'marcada como pendente'}!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (tarefa: Tarefa) => {
    setSelectedTarefa(tarefa);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <AppLayout title="Planejamento de Desenvolvimento">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const tarefasConcluidas = tarefas.filter(t => t.concluido).length;
  const tarefasPendentes = tarefas.length - tarefasConcluidas;

  return (
    <AppLayout title="Planejamento de Desenvolvimento">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Planejamento de Desenvolvimento</h1>
            <p className="text-muted-foreground">
              Gerencie suas tarefas de desenvolvimento
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tarefas.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{tarefasPendentes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{tarefasConcluidas}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Tarefas */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas</CardTitle>
            <CardDescription>
              Lista de todas as tarefas de desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tarefas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma tarefa encontrada.</p>
                <p className="text-sm">Clique em "Nova Tarefa" para começar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tarefas.map((tarefa) => (
                  <div
                    key={tarefa.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleToggleConcluido(tarefa.id, !tarefa.concluido)}
                        className={tarefa.concluido ? 'bg-green-50 border-green-200' : ''}
                      >
                        {tarefa.concluido ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium ${tarefa.concluido ? 'line-through text-muted-foreground' : ''}`}>
                            {tarefa.nome}
                          </h3>
                          <Badge variant={tarefa.concluido ? 'secondary' : 'default'}>
                            {tarefa.concluido ? 'Concluído' : 'Pendente'}
                          </Badge>
                        </div>
                        <p className={`text-sm text-muted-foreground mt-1 ${tarefa.concluido ? 'line-through' : ''}`}>
                          {tarefa.detalhes}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Criado em: {tarefa.criadoEm.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditModal(tarefa)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteTarefa(tarefa.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddTarefaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTarefa}
      />

      {selectedTarefa && (
        <EditTarefaModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTarefa(null);
          }}
          onSubmit={(data) => handleEditTarefa(selectedTarefa.id, data)}
          tarefa={selectedTarefa}
        />
      )}
    </AppLayout>
  );
};

export default PlanejamentoDesenvolvimento;