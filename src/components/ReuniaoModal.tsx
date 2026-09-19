import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reuniao, NovaReuniao } from "@/types/reuniao";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { format } from "date-fns";

interface ReuniaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reuniao: NovaReuniao) => void;
  reuniao?: Reuniao;
}

export function ReuniaoModal({ isOpen, onClose, onSave, reuniao }: ReuniaoModalProps) {
  const [tema, setTema] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [participantesSelecionados, setParticipantesSelecionados] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const { data: funcionarios = [] } = useFuncionarios();

  useEffect(() => {
    if (reuniao) {
      setTema(reuniao.tema);
      setDetalhes(reuniao.detalhes);
      setDataInicio(format(reuniao.dataInicio, "yyyy-MM-dd"));
      setHoraInicio(format(reuniao.dataInicio, "HH:mm"));
      setDataFim(format(reuniao.dataFim, "yyyy-MM-dd"));
      setHoraFim(format(reuniao.dataFim, "HH:mm"));
      setParticipantesSelecionados(reuniao.participantes);
    } else {
      // Reset form for new meeting
      setTema("");
      setDetalhes("");
      setDataInicio("");
      setHoraInicio("");
      setDataFim("");
      setHoraFim("");
      setParticipantesSelecionados([]);
    }
  }, [reuniao, isOpen]);

  const handleParticipanteToggle = (funcionarioId: string) => {
    setParticipantesSelecionados(prev => 
      prev.includes(funcionarioId)
        ? prev.filter(id => id !== funcionarioId)
        : [...prev, funcionarioId]
    );
  };

  const handleRemoveParticipante = (funcionarioId: string) => {
    setParticipantesSelecionados(prev => prev.filter(id => id !== funcionarioId));
  };

  const getParticipanteNome = (id: string) => {
    const funcionario = funcionarios.find(f => f.id === id);
    return funcionario ? `${funcionario.nome} - ${funcionario.cargo}` : "Usuário não encontrado";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataInicioCompleta = new Date(`${dataInicio}T${horaInicio}`);
    const dataFimCompleta = new Date(`${dataFim}T${horaFim}`);

    const novaReuniao: NovaReuniao = {
      tema,
      detalhes,
      dataInicio: dataInicioCompleta,
      dataFim: dataFimCompleta,
      participantes: participantesSelecionados,
    };

    onSave(novaReuniao);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {reuniao ? "Editar Reunião" : "Nova Reunião"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tema">Tema da Reunião</Label>
            <Input
              id="tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Digite o tema da reunião"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="detalhes">Detalhes</Label>
            <Textarea
              id="detalhes"
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              placeholder="Descreva os detalhes da reunião"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Hora de Início</Label>
              <Input
                id="horaInicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFim">Hora de Fim</Label>
              <Input
                id="horaFim"
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Participantes</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {participantesSelecionados.length > 0
                    ? `${participantesSelecionados.length} participante(s) selecionado(s)`
                    : "Selecionar participantes..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Pesquisar funcionários..." />
                  <CommandEmpty>Nenhum funcionário encontrado.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {funcionarios.map((funcionario) => (
                      <CommandItem
                        key={funcionario.id}
                        value={`${funcionario.nome} ${funcionario.cargo}`}
                        onSelect={() => handleParticipanteToggle(funcionario.id)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            participantesSelecionados.includes(funcionario.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {funcionario.nome} - {funcionario.cargo}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            
            {/* Lista de participantes selecionados */}
            {participantesSelecionados.length > 0 && (
              <div className="mt-3">
                <Label className="text-sm font-medium">Participantes selecionados:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {participantesSelecionados.map((participanteId) => (
                    <Badge key={participanteId} variant="secondary" className="flex items-center gap-1">
                      {getParticipanteNome(participanteId)}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleRemoveParticipante(participanteId)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {reuniao ? "Atualizar" : "Criar"} Reunião
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}