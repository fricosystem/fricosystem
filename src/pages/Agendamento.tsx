import React, { useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReuniaoModal } from "@/components/ReuniaoModal";
import { useReunioes } from "@/hooks/useReunioes";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useAuth } from "@/contexts/AuthContext";
import { Reuniao, NovaReuniao } from "@/types/reuniao";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Users, Edit, Trash2, Plus } from "lucide-react";

export default function Agendamento() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reuniaoParaEditar, setReuniaoParaEditar] = useState<Reuniao | undefined>();
  const [reuniaoParaExcluir, setReuniaoParaExcluir] = useState<Reuniao | undefined>();
  
  const { reunioes, loading, adicionarReuniao, atualizarReuniao, excluirReuniao } = useReunioes();
  const { data: funcionarios = [] } = useFuncionarios();
  const { user } = useAuth();

  const handleNovaReuniao = (novaReuniao: NovaReuniao) => {
    if (user?.uid) {
      adicionarReuniao(novaReuniao, user.uid);
    }
  };

  const handleEditarReuniao = (reuniao: Reuniao) => {
    setReuniaoParaEditar(reuniao);
    setIsModalOpen(true);
  };

  const handleSalvarEdicao = (reuniaoAtualizada: NovaReuniao) => {
    if (reuniaoParaEditar) {
      atualizarReuniao(reuniaoParaEditar.id, reuniaoAtualizada);
      setReuniaoParaEditar(undefined);
    }
  };

  const handleExcluirReuniao = (reuniao: Reuniao) => {
    setReuniaoParaExcluir(reuniao);
  };

  const confirmarExclusao = () => {
    if (reuniaoParaExcluir) {
      excluirReuniao(reuniaoParaExcluir.id);
      setReuniaoParaExcluir(undefined);
    }
  };

  const getNomeParticipante = (id: string) => {
    const funcionario = funcionarios.find(f => f.id === id);
    return funcionario?.nome || "Usuário não encontrado";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setReuniaoParaEditar(undefined);
  };

  if (loading) {
    return (
      <AppLayout title="Agendamento de Reuniões">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Agendamento de Reuniões">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Agendamento de Reuniões</h1>
            <p className="text-muted-foreground">
              Gerencie suas reuniões e compromissos
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Reunião
          </Button>
        </div>

        <div className="grid gap-4">
          {reunioes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma reunião agendada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece criando sua primeira reunião
                </p>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Reunião
                </Button>
              </CardContent>
            </Card>
          ) : (
            reunioes.map((reuniao) => (
              <Card key={reuniao.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{reuniao.tema}</CardTitle>
                      <p className="text-muted-foreground mt-1">{reuniao.detalhes}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditarReuniao(reuniao)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExcluirReuniao(reuniao)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Data</p>
                        <p className="text-sm text-muted-foreground">
                          {format(reuniao.dataInicio, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Horário</p>
                        <p className="text-sm text-muted-foreground">
                          {format(reuniao.dataInicio, "HH:mm")} - {format(reuniao.dataFim, "HH:mm")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Participantes</p>
                        <p className="text-sm text-muted-foreground">
                          {reuniao.participantes.length} participante(s)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {reuniao.participantes.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Lista de Participantes:</p>
                      <div className="flex flex-wrap gap-2">
                        {reuniao.participantes.map((participanteId) => (
                          <span
                            key={participanteId}
                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                          >
                            {getNomeParticipante(participanteId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <ReuniaoModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSave={reuniaoParaEditar ? handleSalvarEdicao : handleNovaReuniao}
          reuniao={reuniaoParaEditar}
        />

        <AlertDialog 
          open={!!reuniaoParaExcluir} 
          onOpenChange={() => setReuniaoParaExcluir(undefined)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a reunião "{reuniaoParaExcluir?.tema}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmarExclusao}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}