import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImageToCloudinary } from '@/Cloudinary/cloudinaryUploadProdutos';

interface EnvioRetornoFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const EnvioRetornoForm = ({ onSubmit, onCancel }: EnvioRetornoFormProps) => {
  const [formData, setFormData] = useState({
    produto: '',
    descricao: '',
    quantidade: 1,
    unidade: 'unidade',
    motivoEnvio: '',
    fornecedor: '',
    contatoFornecedor: '',
    observacoes: '',
  });
  
  const [fotos, setFotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (fotos.length + files.length > 3) {
      toast({
        title: 'Limite excedido',
        description: 'Máximo de 3 fotos permitido.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const newFotos: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        if (fotos.length + newFotos.length >= 3) break;
        
        const file = files[i];
        const imageUrl = await uploadImageToCloudinary(file);
        newFotos.push(imageUrl);
      }

      setFotos(prev => [...prev, ...newFotos]);
      
      toast({
        title: 'Sucesso',
        description: `${newFotos.length} foto(s) carregada(s) com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar as fotos.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (fotos.length === 0) {
      toast({
        title: 'Atenção',
        description: 'É necessário adicionar pelo menos uma foto do produto.',
        variant: 'destructive',
      });
      return;
    }

    onSubmit({
      ...formData,
      fotosEnvio: fotos,
      quantidade: Number(formData.quantidade),
    });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Envio para Conserto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="produto">Produto *</Label>
              <Input
                id="produto"
                name="produto"
                value={formData.produto}
                onChange={handleInputChange}
                placeholder="Nome do produto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                name="quantidade"
                type="number"
                min="1"
                value={formData.quantidade}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade *</Label>
              <Select
                value={formData.unidade}
                onValueChange={(value) => handleSelectChange('unidade', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidade">Unidade</SelectItem>
                  <SelectItem value="caixa">Caixa</SelectItem>
                  <SelectItem value="par">Par</SelectItem>
                  <SelectItem value="kit">Kit</SelectItem>
                  <SelectItem value="rolo">Rolo</SelectItem>
                  <SelectItem value="metro">Metro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor *</Label>
              <Input
                id="fornecedor"
                name="fornecedor"
                value={formData.fornecedor}
                onChange={handleInputChange}
                placeholder="Nome do fornecedor"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contatoFornecedor">Contato do Fornecedor</Label>
              <Input
                id="contatoFornecedor"
                name="contatoFornecedor"
                value={formData.contatoFornecedor}
                onChange={handleInputChange}
                placeholder="Telefone/Email do fornecedor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivoEnvio">Motivo do Envio *</Label>
              <Select
                value={formData.motivoEnvio}
                onValueChange={(value) => handleSelectChange('motivoEnvio', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conserto">Conserto</SelectItem>
                  <SelectItem value="calibracao">Calibração</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="garantia">Garantia</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição do Produto *</Label>
            <Textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleInputChange}
              placeholder="Descreva o produto, modelo, número de série, etc."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleInputChange}
              placeholder="Informações adicionais sobre o envio"
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <Label>Fotos do Produto * (Máximo 3)</Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {fotos.map((foto, index) => (
                <div key={index} className="relative group">
                  <img
                    src={foto}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {fotos.length < 3 && (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors">
                  <div className="text-center p-4">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
                    <span className="text-sm text-muted-foreground">
                      Adicionar Foto
                    </span>
                    <span className="text-xs text-muted-foreground block mt-1">
                      {3 - fotos.length} restante(s)
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>

            {isUploading && (
              <div className="text-sm text-muted-foreground flex items-center">
                <Camera className="h-4 w-4 mr-2 animate-pulse" />
                Carregando fotos...
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              Registrar Envio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnvioRetornoForm;