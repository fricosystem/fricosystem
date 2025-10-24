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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Etapa } from '@/hooks/usePlanejamentoDesenvolvimento';

interface EtapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (etapaData: Partial<Etapa>) => void;
  etapa?: Etapa | null;
  ordemAtual: number;
}

export const EtapaModal: React.FC<EtapaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  etapa,
  ordemAtual,
}) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<Etapa['status']>('pendente');
  const [prioridade, setPrioridade] = useState<Etapa['prioridade']>('media');
  const [responsavel, setResponsavel] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tempoEstimado, setTempoEstimado] = useState('');
  const [tempoGasto, setTempoGasto] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (etapa) {
      setTitulo(etapa.titulo);
      setDescricao(etapa.descricao);
      setStatus(etapa.status);
      setPrioridade(etapa.prioridade);
      setResponsavel(etapa.responsavel || '');
      setDataInicio(etapa.dataInicio ? etapa.dataInicio.toISOString().split('T')[0] : '');
      setDataFim(etapa.dataFim ? etapa.dataFim.toISOString().split('T')[0] : '');
      setTempoEstimado(etapa.tempoEstimado?.toString() || '');
      setTempoGasto(etapa.tempoGasto?.toString() || '');
      setTags(etapa.tags?.join(', ') || '');
    } else {
      resetForm();
    }
  }, [etapa, isOpen]);

  const resetForm = () => {
    setTitulo('');
    setDescricao('');
    setStatus('pendente');
    setPrioridade('media');
    setResponsavel('');
    setDataInicio('');
    setDataFim('');
    setTempoEstimado('');
    setTempoGasto('');
    setTags('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      return;
    }

    const etapaData: Partial<Etapa> = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      status,
      prioridade,
      responsavel: responsavel.trim() || undefined,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      tempoEstimado: tempoEstimado ? parseFloat(tempoEstimado) : undefined,
      tempoGasto: tempoGasto ? parseFloat(tempoGasto) : undefined,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      ordem: etapa?.ordem ?? ordemAtual,
    };

    if (!etapa) {
      etapaData.id = `etapa-${Date.now()}`;
    }

    onSubmit(etapaData);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{etapa ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle>
          <DialogDescription>
            {etapa 
              ? 'Edite as informações da etapa do desenvolvimento.'
              : 'Adicione uma nova etapa ao planejamento do desenvolvimento.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="titulo">Título da Etapa *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Implementar tela de login"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva os detalhes desta etapa"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Etapa['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={prioridade} onValueChange={(v) => setPrioridade(v as Etapa['prioridade'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dataFim">Data de Término</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tempoEstimado">Tempo Estimado (horas)</Label>
                <Input
                  id="tempoEstimado"
                  type="number"
                  step="0.5"
                  min="0"
                  value={tempoEstimado}
                  onChange={(e) => setTempoEstimado(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tempoGasto">Tempo Gasto (horas)</Label>
                <Input
                  id="tempoGasto"
                  type="number"
                  step="0.5"
                  min="0"
                  value={tempoGasto}
                  onChange={(e) => setTempoGasto(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ex: React, TypeScript, API"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {etapa ? 'Salvar Alterações' : 'Adicionar Etapa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
