import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Pause,
  ListTodo,
  Filter,
  Search,
  BarChart3,
  Zap,
  Rocket,
} from 'lucide-react';
import { usePlanejamentoDesenvolvimento } from '@/hooks/usePlanejamentoDesenvolvimento';
import type { Tarefa as TarefaModel, Etapa } from '@/hooks/usePlanejamentoDesenvolvimento';
import { AddTarefaModal } from '@/components/Planejamento/AddTarefaModal';
import { EditTarefaModal } from '@/components/Planejamento/EditTarefaModal';
import { EtapaModal } from '@/components/Planejamento/EtapaModal';
import { TarefaCard } from '@/components/Planejamento/TarefaCard';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PlanejamentoDesenvolvimento = () => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [selectedTarefa, setSelectedTarefa] = useState<TarefaModel | null>(null);
  const [selectedEtapa, setSelectedEtapa] = useState<Etapa | null>(null);
  const [currentTarefaId, setCurrentTarefaId] = useState<string>('');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPrioridade, setFilterPrioridade] = useState<string>('all');
  
  const {
    tarefas,
    loading,
    addTarefa,
    updateTarefa,
    deleteTarefa,
  } = usePlanejamentoDesenvolvimento();

  // Types tied to hook signatures to avoid cross-module mismatch
  type AddTarefaInput = Parameters<typeof addTarefa>[0];
  type UpdateTarefaInput = Parameters<typeof updateTarefa>[1];

  const handleAddTarefa = async (tarefaData: AddTarefaInput) => {
    try {
      await addTarefa(tarefaData);
      setIsAddModalOpen(false);
      toast({
        title: "✅ Sucesso",
        description: "Tarefa criada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Erro ao adicionar tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditTarefa = async (id: string, tarefaData: UpdateTarefaInput) => {
    try {
      await updateTarefa(id, tarefaData);
      setIsEditModalOpen(false);
      setSelectedTarefa(null);
      toast({
        title: "✅ Sucesso",
        description: "Tarefa atualizada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
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
          title: "✅ Sucesso",
          description: "Tarefa excluída com sucesso!",
        });
      } catch (error) {
        toast({
          title: "❌ Erro",
          description: "Erro ao excluir tarefa. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const openEditModal = (tarefa: TarefaModel) => {
    setSelectedTarefa(tarefa);
    setIsEditModalOpen(true);
  };

  // Gestão de Etapas
  const handleAddEtapa = (tarefaId: string) => {
    setCurrentTarefaId(tarefaId);
    setSelectedEtapa(null);
    setIsEtapaModalOpen(true);
  };

  const handleEditEtapa = (tarefaId: string, etapa: Etapa) => {
    setCurrentTarefaId(tarefaId);
    setSelectedEtapa(etapa);
    setIsEtapaModalOpen(true);
  };

  const handleDeleteEtapa = async (tarefaId: string, etapaId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta etapa?')) {
      try {
        const tarefa = tarefas.find(t => t.id === tarefaId);
        if (!tarefa) return;

        const novasEtapas = tarefa.etapas.filter(e => e.id !== etapaId);
        await updateTarefa(tarefaId, { etapas: novasEtapas });

        toast({
          title: "✅ Sucesso",
          description: "Etapa excluída com sucesso!",
        });
      } catch (error) {
        toast({
          title: "❌ Erro",
          description: "Erro ao excluir etapa. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateEtapaStatus = async (tarefaId: string, etapaId: string, status: Etapa['status']) => {
    try {
      const tarefa = tarefas.find(t => t.id === tarefaId);
      if (!tarefa) return;

      const novasEtapas = tarefa.etapas.map(e => 
        e.id === etapaId ? { ...e, status } : e
      );

      await updateTarefa(tarefaId, { etapas: novasEtapas });

      toast({
        title: "✅ Sucesso",
        description: "Status da etapa atualizado!",
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Erro ao atualizar status. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEtapaSubmit = async (etapaData: Partial<Etapa>) => {
    try {
      const tarefa = tarefas.find(t => t.id === currentTarefaId);
      if (!tarefa) return;

      let novasEtapas: Etapa[];
      
      if (selectedEtapa) {
        // Editar etapa existente
        novasEtapas = tarefa.etapas.map(e => 
          e.id === selectedEtapa.id ? { ...e, ...etapaData } as Etapa : e
        );
      } else {
        // Adicionar nova etapa
        novasEtapas = [...tarefa.etapas, etapaData as Etapa];
      }

      await updateTarefa(currentTarefaId, { etapas: novasEtapas });
      setIsEtapaModalOpen(false);
      setSelectedEtapa(null);
      
      toast({
        title: "✅ Sucesso",
        description: selectedEtapa ? "Etapa atualizada!" : "Etapa adicionada!",
      });
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Erro ao salvar etapa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Filtros aplicados
  const tarefasFiltradas = useMemo(() => {
    return tarefas.filter(tarefa => {
      const matchSearch = tarefa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tarefa.detalhes.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategoria = filterCategoria === 'all' || tarefa.categoria === filterCategoria;
      const matchStatus = filterStatus === 'all' || tarefa.status === filterStatus;
      const matchPrioridade = filterPrioridade === 'all' || tarefa.prioridade === filterPrioridade;
      
      return matchSearch && matchCategoria && matchStatus && matchPrioridade;
    });
  }, [tarefas, searchTerm, filterCategoria, filterStatus, filterPrioridade]);

  // Métricas avançadas
  const metrics = useMemo(() => {
    const total = tarefas.length;
    const concluidas = tarefas.filter(t => t.status === 'concluido').length;
    const emAndamento = tarefas.filter(t => t.status === 'em_andamento').length;
    const pausadas = tarefas.filter(t => t.status === 'pausado').length;
    const planejamento = tarefas.filter(t => t.status === 'planejamento').length;
    
    const totalEtapas = tarefas.reduce((acc, t) => acc + t.etapas.length, 0);
    const etapasConcluidas = tarefas.reduce((acc, t) => 
      acc + t.etapas.filter(e => e.status === 'concluido').length, 0
    );
    
    const tempoTotal = tarefas.reduce((acc, t) => 
      acc + t.etapas.reduce((sum, e) => sum + (e.tempoEstimado || 0), 0), 0
    );
    
    const tempoGasto = tarefas.reduce((acc, t) => 
      acc + t.etapas.reduce((sum, e) => sum + (e.tempoGasto || 0), 0), 0
    );

    const progressoGeral = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return {
      total,
      concluidas,
      emAndamento,
      pausadas,
      planejamento,
      totalEtapas,
      etapasConcluidas,
      tempoTotal,
      tempoGasto,
      progressoGeral,
    };
  }, [tarefas]);

  if (loading) {
    return (
      <AppLayout title="Planejamento de Desenvolvimento">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4 animate-fade-in">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Carregando planejamentos...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Planejamento de Desenvolvimento">
      <div className="space-y-6 animate-fade-in">
        {/* Header Corporativo */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Rocket className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Planejamento de Desenvolvimento
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie projetos com controle total de etapas e métricas
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            size="lg"
            className="hover-scale shadow-lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nova Tarefa
          </Button>
        </div>

        {/* Métricas Avançadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-primary hover:shadow-lg transition-all hover-scale animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
              <ListTodo className="h-5 w-5 text-primary animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.progressoGeral}% concluído
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all hover-scale animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics.concluidas}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.etapasConcluidas} etapas finalizadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all hover-scale animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Zap className="h-5 w-5 text-blue-600 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{metrics.emAndamento}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.planejamento} em planejamento
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all hover-scale animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Estimado</CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{metrics.tempoTotal}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.tempoGasto}h gastos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all hover-scale animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Etapas</CardTitle>
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{metrics.totalEtapas}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.pausadas} projetos pausados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle>Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="teste">Teste</SelectItem>
                  <SelectItem value="documentacao">Documentação</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="planejamento">Planejamento</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="revisao">Revisão</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Prioridades</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || filterCategoria !== 'all' || filterStatus !== 'all' || filterPrioridade !== 'all') && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="animate-fade-in">
                  {tarefasFiltradas.length} resultado(s)
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategoria('all');
                    setFilterStatus('all');
                    setFilterPrioridade('all');
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grid de Tarefas */}
        <div className="space-y-4">
          {tarefasFiltradas.length === 0 ? (
            <Card className="animate-fade-in">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                  <Target className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhuma tarefa encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterCategoria !== 'all' || filterStatus !== 'all' || filterPrioridade !== 'all'
                    ? 'Tente ajustar os filtros para ver mais resultados.'
                    : 'Comece criando sua primeira tarefa de desenvolvimento.'}
                </p>
                {!searchTerm && filterCategoria === 'all' && filterStatus === 'all' && filterPrioridade === 'all' && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Tarefa
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            tarefasFiltradas.map((tarefa) => (
              <TarefaCard
                key={tarefa.id}
                tarefa={tarefa}
                onEdit={() => openEditModal(tarefa)}
                onDelete={() => handleDeleteTarefa(tarefa.id)}
                onAddEtapa={() => handleAddEtapa(tarefa.id)}
                onEditEtapa={(etapa) => handleEditEtapa(tarefa.id, etapa)}
                onDeleteEtapa={(etapaId) => handleDeleteEtapa(tarefa.id, etapaId)}
                onUpdateEtapaStatus={(etapaId, status) => handleUpdateEtapaStatus(tarefa.id, etapaId, status)}
              />
            ))
          )}
        </div>
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

      <EtapaModal
        isOpen={isEtapaModalOpen}
        onClose={() => {
          setIsEtapaModalOpen(false);
          setSelectedEtapa(null);
        }}
        onSubmit={handleEtapaSubmit}
        etapa={selectedEtapa}
        ordemAtual={(tarefas.find(t => t.id === currentTarefaId)?.etapas.length || 0) + 1}
      />
    </AppLayout>
  );
};

export default PlanejamentoDesenvolvimento;
