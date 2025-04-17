import React, { useState } from "react";
import { Product, useProducts } from "@/contexts/ProductContext";
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
import { Pencil, Save, X } from "lucide-react";

interface ProductEditDialogProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const ProductEditDialog: React.FC<ProductEditDialogProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { updateProduct } = useProducts();
  const [formData, setFormData] = useState<Partial<Product>>({
    nome: product.nome,
    codigoEstoque: product.codigoEstoque || "",
    deposito: product.deposito || "",
    quantidade: product.quantidade,
    quantidadeMinima: product.quantidadeMinima,
    detalhes: product.detalhes || "",
    unidadeMedida: product.unidadeMedida || "",
    valorUnitario: product.valorUnitario,
    prateleira: product.prateleira || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Converter valores numéricos
    if (name === "quantidade" || name === "quantidadeMinima" || name === "valorUnitario") {
      setFormData({
        ...formData,
        [name]: value === "" ? undefined : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProduct(product.id, formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Produto
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" value={product.codigo} disabled />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigoEstoque">Código Estoque</Label>
                <Input
                  id="codigoEstoque"
                  name="codigoEstoque"
                  value={formData.codigoEstoque}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deposito">Depósito</Label>
                <Input
                  id="deposito"
                  name="deposito"
                  value={formData.deposito}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  name="quantidade"
                  type="number"
                  value={formData.quantidade || ""}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantidadeMinima">Quantidade Mínima</Label>
                <Input
                  id="quantidadeMinima"
                  name="quantidadeMinima"
                  type="number"
                  value={formData.quantidadeMinima || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unidadeMedida">Unidade de Medida</Label>
                <Input
                  id="unidadeMedida"
                  name="unidadeMedida"
                  value={formData.unidadeMedida}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valorUnitario">Valor Unitário</Label>
                <Input
                  id="valorUnitario"
                  name="valorUnitario"
                  type="number"
                  step="0.01"
                  value={formData.valorUnitario || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prateleira">Prateleira (Localização)</Label>
              <Input
                id="prateleira"
                name="prateleira"
                value={formData.prateleira}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="detalhes">Detalhes</Label>
              <Input
                id="detalhes"
                name="detalhes"
                value={formData.detalhes}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditDialog;
