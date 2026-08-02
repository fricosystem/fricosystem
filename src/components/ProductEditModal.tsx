// ProductEditModal.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "./ProductDetails";

interface ProductEditModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const ProductEditModal: React.FC<ProductEditModalProps> = ({ product, isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input defaultValue={product.nome} placeholder="Nome do produto" />
          <Input defaultValue={product.codigo_material} placeholder="Código Material" />
          <Input defaultValue={product.quantidade} placeholder="Quantidade" type="number" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditModal;