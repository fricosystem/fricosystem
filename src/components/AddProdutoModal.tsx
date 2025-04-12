import { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
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

interface AddProdutoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  codigo: string;
  codigoEstoque: string;
  nome: string;
  unidade: string;
  deposito: string;
  quantidade: string;
  quantidadeMinima: string;
  detalhes: string;
  imagem: string;
  unidadeMedida: string;
  valorUnitario: string;
}

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeKqG3o3Ii74NRthA9yIjqdnQuKQwKJV0CBH8PNFVzeY5MTwg/formResponse";

const AddProdutoModal = ({ open, onOpenChange, onSuccess }: AddProdutoModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Initialize react-hook-form
  const form = useForm<FormData>({
    defaultValues: {
      codigo: "",
      codigoEstoque: "",
      nome: "",
      unidade: "",
      deposito: "",
      quantidade: "",
      quantidadeMinima: "",
      detalhes: "",
      imagem: "",
      unidadeMedida: "",
      valorUnitario: "",
    }
  });

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);

    try {
      // Monta a URL com os parâmetros para o Google Forms
      // Os entry.XXXXX são os IDs dos campos no formulário
      const url = `${GOOGLE_FORM_URL}?` +
        `entry.1845532124=${encodeURIComponent(formData.codigo)}` +
        `&entry.122319208=${encodeURIComponent(formData.codigoEstoque)}` +
        `&entry.1615179481=${encodeURIComponent(formData.nome)}` +
        `&entry.299583938=${encodeURIComponent(formData.unidade)}` +
        `&entry.448760118=${encodeURIComponent(formData.deposito)}` +
        `&entry.1830771148=${encodeURIComponent(formData.quantidade)}` +
        `&entry.1553940355=${encodeURIComponent(formData.quantidadeMinima)}` +
        `&entry.1835465159=${encodeURIComponent(formData.detalhes)}` +
        `&entry.378487173=${encodeURIComponent(formData.imagem)}` +
        `&entry.589741230=${encodeURIComponent(formData.unidadeMedida)}` +
        `&entry.2144116999=${encodeURIComponent(formData.valorUnitario)}`;

      // Usamos um iframe oculto para submeter o formulário
      // Isso é necessário porque o Google Forms não permite CORS diretamente
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      iframe.src = url;

      // Mostramos uma mensagem de sucesso após um tempo
      setTimeout(() => {
        setLoading(false);
        toast({
          title: "Produto adicionado",
          description: "O produto foi adicionado com sucesso à planilha.",
        });
        document.body.removeChild(iframe);
        onOpenChange(false);
        onSuccess();
        
        // Limpar formulário
        form.reset();
      }, 2000);
    } catch (error) {
      setLoading(false);
      console.error("Erro ao adicionar produto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto à planilha.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha os dados do produto para adicionar ao inventário.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 04-000.001" 
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
                name="codigoEstoque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Estoque*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 1" 
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome do produto" 
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: FR01" 
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
                name="unidadeMedida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida*</FormLabel>
                    <Select 
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="UN">UN</SelectItem>
                        <SelectItem value="CX">CX</SelectItem>
                        <SelectItem value="PC">PC</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Atual*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="Ex: 100" 
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
                name="quantidadeMinima"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Mínima*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="Ex: 10" 
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="deposito"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Depósito/Localização*</FormLabel>
                  <Select 
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o depósito" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                      <SelectItem value="Depósito A">Depósito A</SelectItem>
                      <SelectItem value="Depósito B">Depósito B</SelectItem>
                      <SelectItem value="Depósito C">Depósito C</SelectItem>
                      <SelectItem value="Cozinha">Cozinha</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="valorUnitario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Unitário*</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder="Ex: 15,75" 
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
              name="detalhes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição ou detalhes do produto" 
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="imagem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://exemplo.com/imagem.jpg" 
                      {...field}
                    />
                  </FormControl>
                  {field.value && (
                    <div className="mt-2 border rounded-md p-2 w-32 h-32 flex items-center justify-center overflow-hidden">
                      <img 
                        src={field.value} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    </div>
                  )}
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
                    Salvar Produto
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

export default AddProdutoModal;
