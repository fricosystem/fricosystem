import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tarefa } from '@/pages/Planejamento/PlanejamentoDesenvolvimento';

interface AddTarefaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tarefaData: Omit<Tarefa, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
}

export const AddTarefaModal: React.FC<AddTarefaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [nome, setNome] = useState('');
  const [detalhes, setDetalhes] = useState('');
  const [concluido, setConcluido] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      return;
    }

    onSubmit({
      nome: nome.trim(),
      detalhes: detalhes.trim(),
      concluido,
    });

    // Reset form
    setNome('');
    setDetalhes('');
    setConcluido(false);
  };

  const handleClose = () => {
    setNome('');
    setDetalhes('');
    setConcluido(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>
            Adicione uma nova tarefa ao planejamento de desenvolvimento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da Página</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite o nome da tarefa"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="detalhes">Detalhes</Label>
              <Textarea
                id="detalhes"
                value={detalhes}
                onChange={(e) => setDetalhes(e.target.value)}
                placeholder="Descreva os detalhes da tarefa"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="concluido"
                checked={concluido}
                onCheckedChange={(checked) => setConcluido(checked as boolean)}
              />
              <Label htmlFor="concluido">Marcar como concluído</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar Tarefa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};