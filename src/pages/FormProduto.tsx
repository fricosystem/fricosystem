
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, Upload } from "lucide-react";

import AppLayout from "@/layouts/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const FormProduto = () => {
  const [loading, setLoading] = useState(false);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulação de envio
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Produto salvo",
        description: "O produto foi salvo com sucesso.",
      });
      navigate("/produtos");
    }, 1500);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <AppLayout title="Cadastrar Produto">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Coluna 1 */}
              <div className="space-y-6">
                <FormItem>
                  <FormLabel>Código*</FormLabel>
                  <FormControl>
                    <Input placeholder="Código do produto" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                
                <FormItem>
                  <FormLabel>Nome*</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do produto" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                
                <FormItem>
                  <FormLabel>Centro de Custo*</FormLabel>
                  <Select>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o centro de custo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="alimentos-basicos">Alimentos Básicos</SelectItem>
                      <SelectItem value="hortifruti">Produtos Hortifrúti</SelectItem>
                      <SelectItem value="congelados">Congelados</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </div>
              
              {/* Coluna 2 */}
              <div className="space-y-6">
                <FormItem>
                  <FormLabel>Quantidade Atual*</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                
                <FormItem>
                  <FormLabel>Quantidade Mínima*</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                
                <FormItem>
                  <FormLabel>Valor Unitário*</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
              
              {/* Coluna 3 */}
              <div className="space-y-6">
                <FormItem>
                  <FormLabel>Depósito/Localização*</FormLabel>
                  <Select>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o depósito" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="deposito-a">Depósito A</SelectItem>
                      <SelectItem value="deposito-b">Depósito B</SelectItem>
                      <SelectItem value="deposito-c">Depósito C</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
                
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição do produto" className="resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                
                <FormItem>
                  <FormLabel>Imagem do Produto</FormLabel>
                  <div className="flex flex-col space-y-4">
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/50 cursor-pointer"
                      onClick={() => document.getElementById("imagem-produto")?.click()}
                    >
                      {imagemPreview ? (
                        <img 
                          src={imagemPreview} 
                          alt="Preview" 
                          className="w-full h-32 object-contain mb-2" 
                        />
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Clique para fazer upload
                          </p>
                        </>
                      )}
                      <Input 
                        id="imagem-produto"
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/produtos")}
              >
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default FormProduto;
