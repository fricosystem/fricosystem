import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  atualizado_em: any;
  codigo: string;
  codigo_estoque: string;
  codigo_material: string;
  data_criacao: string;
  data_vencimento: string;
  deposito: string;
  deposito_id: string;
  descricao: string;
  detalhes: string;
  fornecedor_cnpj: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  imagem: string;
  nome: string;
  prateleira: string;
  quantidade: number;
  quantidade_minima: number;
  status: string;
  unidade: string;
  unidade_de_medida: string;
  valor_unitario: number;
}

interface ProductDetailsProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, isOpen, onClose, onEdit }) => {
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  if (!product) return null;

  const handleClose = () => {
    if (isSubmitting) {
      setPendingClose(true);
    } else {
      onClose();
    }
  };

  const handleAddToCart = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para adicionar itens ao carrinho",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const cartItem = {
        codigo_material: product.codigo_material,
        deposito: product.deposito,
        email: user.email,
        imagem: product.imagem,
        nome: product.nome,
        prateleira: product.prateleira,
        quantidade: quantity,
        quantidade_minima: product.quantidade_minima,
        timestamp: Date.now(),
        unidade: product.unidade,
        unidade_de_medida: product.unidade_de_medida,
        valor_unitario: product.valor_unitario,
      };
      
      await addDoc(collection(db, "carrinho"), cartItem);
      
      toast({
        title: "Sucesso",
        description: `${quantity} ${product.unidade_de_medida} de ${product.nome} adicionado(s) ao carrinho`,
      });
      
      onClose();
      setPendingClose(false);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item ao carrinho",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      if (pendingClose) {
        onClose();
        setPendingClose(false);
      }
    }
  };

  const handleEditClick = () => {
    onEdit();
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent 
        className="sm:max-w-2xl"
        onInteractOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Detalhes do Produto</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 my-4 px-4">
          <div className="flex flex-col items-center mb-6">
            {product.imagem ? (
              <img 
                src={product.imagem} 
                alt={product.nome} 
                className="w-full max-h-80 object-contain rounded-md border" 
              />
            ) : (
              <div className="w-full max-h-80 bg-muted rounded-md flex items-center justify-center">
                <span className="text-muted-foreground">Sem imagem</span>
              </div>
            )}
            <h3 className="text-2xl font-semibold mt-6">{product.nome}</h3>
          </div>
            
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-medium">Código Material:</p>
              <p className="text-muted-foreground">{product.codigo_material}</p>
            </div>
            
            <div className="space-y-1">
              <p className="font-medium">Código Estoque:</p>
              <p className="text-muted-foreground">{product.codigo_estoque}</p>
            </div>
            
            <div className="space-y-1">
              <p className="font-medium">Valor Unitário:</p>
              <p className="text-muted-foreground">{formatCurrency(product.valor_unitario)}</p>
            </div>
            
            <div className="space-y-1">
              <p className="font-medium">Quantidade Disponível:</p>
              <p className="text-muted-foreground">{product.quantidade} {product.unidade_de_medida}</p>
            </div>
            
            <div className="space-y-1">
              <p className="font-medium">Local:</p>
              <p className="text-muted-foreground">{product.deposito} - Prateleira {product.prateleira}</p>
            </div>
            
            <div className="space-y-1">
              <p className="font-medium">Validade:</p>
              <p className="text-muted-foreground">{formatDate(product.data_vencimento)}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="font-medium">Fornecedor:</p>
            <p className="text-muted-foreground">{product.fornecedor_nome}</p>
            <p className="text-muted-foreground text-xs">CNPJ: {product.fornecedor_cnpj}</p>
          </div>
          
          {product.descricao && (
            <div className="space-y-1">
              <p className="font-medium">Descrição:</p>
              <p className="text-muted-foreground">{product.descricao}</p>
            </div>
          )}
          
          <div className="pt-6">
            <label htmlFor="quantity" className="block text-sm font-medium mb-2">
              Quantidade para adicionar:
            </label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={product.quantidade}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(product.quantidade, parseInt(e.target.value) || 0)))}
              className="w-full"
            />
          </div>
        </div>
          
        <DialogFooter className="flex justify-between w-full px-4 pb-4">
          <Button 
            variant="outline" 
            onClick={handleEditClick}
            disabled={isSubmitting}
          >
            Editar Produto
          </Button>
          
          <Button 
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Fechar
          </Button>

          <Button 
            onClick={handleAddToCart} 
            disabled={product.quantidade <= 0 || isSubmitting}
          >
            {isSubmitting ? (
              <span className="animate-pulse">Adicionando...</span>
            ) : (
              "Adicionar ao Carrinho"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetails;