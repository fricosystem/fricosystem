import { useState, useEffect } from "react";
import { Loader2, Save, X, Calculator, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Usuario {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  ativo: string;
}

interface AddParadaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  equipamento: string;
  origemParada: string;
  descricaoProblema: string;
  horaInicial: string;
  horaFinal: string;
  tempoParada: string;
  responsavelManutencao: string;
  tipoManutencao: string;
  solucaoAplicada: string;
  observacoes: string;
}

const AddParadaModal = ({ open, onOpenChange, onSuccess }: AddParadaModalProps) => {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [responsavelPopoverOpen, setResponsavelPopoverOpen] = useState(false);
  const { toast } = useToast();

  // Initialize react-hook-form
  const form = useForm<FormData>({
    defaultValues: {
      equipamento: "",
      origemParada: "",
      descricaoProblema: "",
      horaInicial: "",
      horaFinal: "",
      tempoParada: "",
      responsavelManutencao: "",
      tipoManutencao: "",
      solucaoAplicada: "",
      observacoes: "",
    },
  });

  // Carregar usuários do Firebase
  useEffect(() => {
    const fetchUsuarios = async () => {
      if (!open) return; // Só carregar quando o modal estiver aberto
      
      try {
        setLoadingUsuarios(true);
        const usuariosRef = collection(db, "usuarios");
        const querySnapshot = await getDocs(usuariosRef);
        
        const usuariosData: Usuario[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          usuariosData.push({
            id: doc.id,
            nome: data.nome || "",
            cargo: data.cargo || "",
            email: data.email || "",
            ativo: data.ativo || "",
          });
        });
        
        // Filtrar apenas usuários ativos
        const usuariosAtivos = usuariosData.filter(u => u.ativo === "sim");
        setUsuarios(usuariosAtivos);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de usuários.",
          variant: "destructive",
        });
      } finally {
        setLoadingUsuarios(false);
      }
    };

    fetchUsuarios();
  }, [open, toast]);

  // Observar mudanças na hora inicial e final para cálculo automático
  const horaInicial = form.watch("horaInicial");
  const horaFinal = form.watch("horaFinal");
  
  // Função para calcular o tempo de parada
  const calcularTempoParada = () => {
    if (horaInicial && horaFinal) {
      try {
        const dataInicial = new Date(`2000-01-01T${horaInicial}`);
        const dataFinal = new Date(`2000-01-01T${horaFinal}`);
        
        // Se a hora final for menor que a inicial, assumimos que passou para o dia seguinte
        let diff = dataFinal.getTime() - dataInicial.getTime();
        if (diff < 0) {
          dataFinal.setDate(dataFinal.getDate() + 1);
          diff = dataFinal.getTime() - dataInicial.getTime();
        }
        
        // Converter a diferença para horas e minutos
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        // Formatar o resultado
        const tempoFormatado = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        form.setValue("tempoParada", tempoFormatado);
      } catch (error) {
        console.error("Erro ao calcular tempo de parada:", error);
      }
    }
  };

  // Effect para calcular tempo sempre que hora inicial ou final mudar
  useEffect(() => {
    calcularTempoParada();
  }, [horaInicial, horaFinal]);

  // Get selected usuário name for display
  const getSelectedUsuarioName = () => {
    const selectedId = form.watch("responsavelManutencao");
    if (!selectedId) return null;
    
    const selectedUsuario = usuarios.find(u => u.id === selectedId);
    return selectedUsuario ? `${selectedUsuario.nome} (${selectedUsuario.cargo})` : null;
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      // Validação básica
      if (!formData.equipamento || !formData.origemParada || !formData.descricaoProblema ||
          !formData.horaInicial || !formData.horaFinal || !formData.responsavelManutencao ||
          !formData.tipoManutencao || !formData.solucaoAplicada) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Prepare data for Firestore
      const paradaData = {
        equipamento: formData.equipamento,
        origem_parada: formData.origemParada,
        descricao_problema: formData.descricaoProblema,
        hora_inicial: formData.horaInicial,
        hora_final: formData.horaFinal,
        tempo_parada: formData.tempoParada,
        responsavel_manutencao: formData.responsavelManutencao,
        tipo_manutencao: formData.tipoManutencao,
        solucao_aplicada: formData.solucaoAplicada,
        observacoes: formData.observacoes,
        data_registro: new Date().toISOString(),
      };

      // Add the record to Firestore
      await addDoc(collection(db, "ordens_de_servicos"), paradaData);

      // Show success message
      toast({
        title: "Parada registrada",
        description: "O registro de parada foi adicionado com sucesso.",
      });

      // Close modal and reset form
      onOpenChange(false);
      onSuccess();
      form.reset();
    } catch (error) {
      console.error("Erro ao adicionar registro de parada:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o registro de parada.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Parada de Manutenção</DialogTitle>
          <DialogDescription>
            Preencha os dados da parada para registro no sistema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="equipamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipamento*</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o equipamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Linha 1">Linha 1</SelectItem>
                      <SelectItem value="Linha 2">Linha 2</SelectItem>
                      <SelectItem value="Linha 3">Linha 3</SelectItem>
                      <SelectItem value="Dobradeira">Dobradeira</SelectItem>
                      <SelectItem value="Prensa">Prensa</SelectItem>
                      <SelectItem value="Compressor">Compressor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="origemParada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origem da Parada*</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mecânica">Mecânica</SelectItem>
                      <SelectItem value="Elétrica">Elétrica</SelectItem>
                      <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                      <SelectItem value="Operacional">Operacional</SelectItem>
                      <SelectItem value="Higienização">Higienização</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricaoProblema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Problema*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o problema identificado"
                      className="resize-none"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Horários e tempo de parada */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="horaInicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Inicial*</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="horaFinal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Final*</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tempoParada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo de Parada (hh:mm)*</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Input 
                          placeholder="00:00" 
                          {...field} 
                          readOnly 
                          className="bg-muted"
                          required
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="ml-2 px-3"
                          onClick={calcularTempoParada}
                          title="Recalcular tempo de parada"
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Responsável pela manutenção com pesquisa */}
            <FormField
              control={form.control}
              name="responsavelManutencao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável pela Manutenção*</FormLabel>
                  <Popover 
                    open={responsavelPopoverOpen} 
                    onOpenChange={setResponsavelPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={loadingUsuarios}
                        >
                          {loadingUsuarios
                            ? "Carregando usuários..."
                            : field.value
                              ? getSelectedUsuarioName()
                              : "Selecione o responsável"}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full md:w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar usuário..." className="h-9" />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                          <CommandGroup>
                            {usuarios.map((usuario) => (
                              <CommandItem
                                key={usuario.id}
                                value={`${usuario.nome} ${usuario.cargo} ${usuario.email}`}
                                onSelect={() => {
                                  form.setValue("responsavelManutencao", usuario.id);
                                  setResponsavelPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === usuario.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{usuario.nome}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {usuario.cargo} • {usuario.email}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipoManutencao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Manutenção*</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Corretiva">Corretiva</SelectItem>
                      <SelectItem value="Preventiva">Preventiva</SelectItem>
                      <SelectItem value="Preditiva">Preditiva</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="solucaoAplicada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solução Aplicada*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a solução aplicada"
                      className="resize-none"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Registrar Parada
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddParadaModal;