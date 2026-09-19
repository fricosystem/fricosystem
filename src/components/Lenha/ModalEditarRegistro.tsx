import { useState, useEffect } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { MedidaLenha } from "@/types/typesLenha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalEditarRegistroProps {
  medida: MedidaLenha;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void; // Add this line
}

// Schema de validação do formulário
const formSchema = z.object({
  data: z.date({
    required_error: "A data é obrigatória",
  }),
  metrosCubicos: z.coerce.number({
    required_error: "O volume em metros cúbicos é obrigatório",
    invalid_type_error: "O valor deve ser um número",
  }).positive("O valor deve ser positivo"),
  fornecedor: z.string().min(2, "O fornecedor deve ter no mínimo 2 caracteres"),
  nfe: z.string().optional(),
  responsavel: z.string().min(2, "O responsável deve ter no mínimo 2 caracteres"),
  valorUnitario: z.coerce.number({
    required_error: "O valor unitário é obrigatório",
    invalid_type_error: "O valor deve ser um número",
  }).nonnegative("O valor deve ser positivo ou zero"),
});

type FormValues = z.infer<typeof formSchema>;

const ModalEditarRegistro = ({ medida, isOpen, onClose, onSaveSuccess }: ModalEditarRegistroProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Inicializar o formulário sem valores padrão iniciais
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });
  
  // Atualizar valores do formulário quando a medida mudar
  useEffect(() => {
    if (medida && isOpen) {
      // Reset completo do formulário com os novos valores
      form.reset({
        data: medida.data,
        metrosCubicos: medida.metrosCubicos,
        fornecedor: medida.fornecedor,
        nfe: medida.nfe || "",
        responsavel: medida.responsavel,
        valorUnitario: medida.valorUnitario,
      });
    }
  }, [medida, isOpen, form]);

  // Limpar formulário quando o modal for fechado
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);
  
  // Calcular valor total baseado no volume e valor unitário
  const valorTotal = (
    form.watch("metrosCubicos") || 0
  ) * (
    form.watch("valorUnitario") || 0
  );
  
  // Salvar alterações no Firestore
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Calcular o valor total antes de salvar
      const valorTotal = data.metrosCubicos * data.valorUnitario;
      
      // Referência para o documento a ser atualizado
      const registroRef = doc(db, "medidas_lenha", medida.id);
      
      // Atualizar documento
      await updateDoc(registroRef, {
        data: Timestamp.fromDate(data.data),
        metrosCubicos: data.metrosCubicos,
        fornecedor: data.fornecedor,
        nfe: data.nfe || null,
        responsavel: data.responsavel,
        valorUnitario: data.valorUnitario,
        valorTotal: valorTotal,
        // Mantém medidas, usuário e status_envio originais
        medidas: medida.medidas,
        usuario: medida.usuario,
        status_envio: medida.status_envio || "pendente"
      });
      
      toast({
        title: "Registro atualizado",
        description: "O registro foi atualizado com sucesso",
      });
      
      // Primeiro chama onSaveSuccess para atualizar os dados
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      // Depois fecha o modal
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar registro:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o registro",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Registro</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data */}
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Metros Cúbicos */}
              <FormField
                control={form.control}
                name="metrosCubicos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metros Cúbicos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Fornecedor */}
              <FormField
                control={form.control}
                name="fornecedor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do fornecedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* NFe */}
              <FormField
                control={form.control}
                name="nfe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Fiscal (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Número da NFe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Responsável */}
              <FormField
                control={form.control}
                name="responsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Valor Unitário */}
              <FormField
                control={form.control}
                name="valorUnitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Unitário (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Valor Total - Campo calculado (não editável) */}
            <div className="border rounded-md p-3">
              <div className="font-medium">Valor Total</div>
              <div className="text-2xl font-bold">
                {valorTotal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalEditarRegistro;