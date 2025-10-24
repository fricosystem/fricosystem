import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  FileText,
  Tag,
  AlertCircle,
  Activity,
  CheckCircle2,
  Save,
} from 'lucide-react';
import type { Tarefa } from '@/hooks/usePlanejamentoDesenvolvimento';

interface EditTarefaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tarefaData: Partial<Tarefa>) => void;
  tarefa: Tarefa;
}

export const EditTarefaModal: React.FC<EditTarefaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tarefa,
}) => {
  const [nome, setNome] = useState('');
  const [detalhes, setDetalhes] = useState('');
  const [categoria, setCategoria] = useState<Tarefa['categoria']>('outro');
  const [prioridade, setPrioridade] = useState<Tarefa['prioridade']>('media');
  const [status, setStatus] = useState<Tarefa['status']>('planejamento');
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    if (tarefa) {
      setNome(tarefa.nome);
      setDetalhes(tarefa.detalhes);
      setCategoria(tarefa.categoria);
      setPrioridade(tarefa.prioridade);
      setStatus(tarefa.status);
      setConcluido(tarefa.concluido);
    }
  }, [tarefa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      return;
    }

    onSubmit({
      nome: nome.trim(),
      detalhes: detalhes.trim(),
      categoria,
      prioridade,
      status,
      concluido,
    });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Edit className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Editar Tarefa</DialogTitle>
              <DialogDescription>
                Atualize as informações da tarefa de desenvolvimento
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4">
            {/* Nome da Tarefa */}
            <div className="grid gap-2">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Nome da Tarefa *
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Implementar dashboard de vendas"
                required
                className="transition-all focus:ring-2 focus:ring-primary"
              />
              {!nome.trim() && nome.length > 0 && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Nome é obrigatório
                </p>
              )}
            </div>

            {/* Detalhes */}
            <div className="grid gap-2">
              <Label htmlFor="detalhes" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Descrição Detalhada
              </Label>
              <Textarea
                id="detalhes"
                value={detalhes}
                onChange={(e) => setDetalhes(e.target.value)}
                placeholder="Descreva as funcionalidades, requisitos e objetivos da tarefa..."
                rows={4}
                className="transition-all focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Categoria e Prioridade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="categoria" className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Categoria
                </Label>
                <Select value={categoria} onValueChange={(v) => setCategoria(v as Tarefa['categoria'])}>
                  <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500">Front</Badge>
                        Frontend
                      </div>
                    </SelectItem>
                    <SelectItem value="backend">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500">Back</Badge>
                        Backend
                      </div>
                    </SelectItem>
                    <SelectItem value="design">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-500">Design</Badge>
                        Design
                      </div>
                    </SelectItem>
                    <SelectItem value="teste">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-500">Teste</Badge>
                        Teste
                      </div>
                    </SelectItem>
                    <SelectItem value="documentacao">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-500">Docs</Badge>
                        Documentação
                      </div>
                    </SelectItem>
                    <SelectItem value="outro">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-500">Outro</Badge>
                        Outro
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="prioridade" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Prioridade
                </Label>
                <Select value={prioridade} onValueChange={(v) => setPrioridade(v as Tarefa['prioridade'])}>
                  <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                        Baixa
                      </div>
                    </SelectItem>
                    <SelectItem value="media">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        Média
                      </div>
                    </SelectItem>
                    <SelectItem value="alta">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                        Alta
                      </div>
                    </SelectItem>
                    <SelectItem value="urgente">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        Urgente
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status" className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Status
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Tarefa['status'])}>
                <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planejamento">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">📋 Planejamento</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="em_andamento">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">⚡ Em Andamento</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="revisao">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">🔍 Revisão</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="concluido">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">✅ Concluído</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="pausado">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">⏸️ Pausado</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Checkbox Concluído */}
            <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30">
              <Checkbox
                id="concluido"
                checked={concluido}
                onCheckedChange={(checked) => setConcluido(checked as boolean)}
              />
              <Label 
                htmlFor="concluido" 
                className="flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Marcar tarefa como concluída
              </Label>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                As etapas da tarefa podem ser gerenciadas diretamente no card expandido.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="hover-scale">
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};