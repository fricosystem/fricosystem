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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImportedProduct } from "@/types/typesImportarPlanilha";
import { useToast } from "@/components/ui/use-toast";

interface EditProductModalProps {
  product: ImportedProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: ImportedProduct) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ 
  product, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ImportedProduct>({
    codigo_estoque: "",
    nome: "",
    quantidade: 0,
    unidade_de_medida: "",
    detalhes: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        codigo_estoque: product.codigo_estoque || "",
        nome: product.nome || "",
        quantidade: Number(product.quantidade) || 0,
        unidade_de_medida: product.unidade_de_medida || "",
        detalhes: product.detalhes || ""
      });
      setErrors({});
    }
  }, [product]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.codigo_estoque.trim()) {
      newErrors.codigo_estoque = "Código de estoque é obrigatório";
    }
    
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }
    
    if (isNaN(formData.quantidade)) {
      newErrors.quantidade = "Quantidade deve ser um número válido";
    } else if (formData.quantidade < 0) {
      newErrors.quantidade = "Quantidade não pode ser negativa";
    }
    
    if (!formData.unidade_de_medida.trim()) {
      newErrors.unidade_de_medida = "Unidade de medida é obrigatória";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === "quantidade" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos destacados",
        variant: "destructive",
      });
      return;
    }
    
    onSave({
      ...formData,
      quantidade: Number(formData.quantidade)
    });
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="codigo_estoque">Código Estoque</Label>
              <Input
                id="codigo_estoque"
                name="codigo_estoque"
                value={formData.codigo_estoque}
                onChange={handleChange}
                className={errors.codigo_estoque ? "border-red-500" : ""}
              />
              {errors.codigo_estoque && (
                <p className="text-sm text-red-500">{errors.codigo_estoque}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={errors.nome ? "border-red-500" : ""}
              />
              {errors.nome && (
                <p className="text-sm text-red-500">{errors.nome}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  name="quantidade"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantidade}
                  onChange={handleChange}
                  className={errors.quantidade ? "border-red-500" : ""}
                />
                {errors.quantidade && (
                  <p className="text-sm text-red-500">{errors.quantidade}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="unidade_de_medida">Unidade de Medida</Label>
                <Input
                  id="unidade_de_medida"
                  name="unidade_de_medida"
                  value={formData.unidade_de_medida}
                  onChange={handleChange}
                  className={errors.unidade_de_medida ? "border-red-500" : ""}
                />
                {errors.unidade_de_medida && (
                  <p className="text-sm text-red-500">{errors.unidade_de_medida}</p>
                )}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="detalhes">Detalhes</Label>
              <Textarea
                id="detalhes"
                name="detalhes"
                value={formData.detalhes}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;