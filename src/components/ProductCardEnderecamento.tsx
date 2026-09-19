import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/contexts/ProductContext";
import { Badge } from "@/components/ui/badge";
import { Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductEditDialog from "./ProductEditDialog";

interface ProductCardProps {
  product: Product;
  isDraggable?: boolean;
  setDraggedProduct?: (product: Product | null) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isDraggable = false,
  setDraggedProduct,
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (isDraggable && setDraggedProduct) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("application/json", JSON.stringify(product));
      setDraggedProduct(product);
    }
  };

  const handleDragEnd = () => {
    if (setDraggedProduct) {
      setDraggedProduct(null);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditDialog(true);
  };

  return (
    <>
      <Card
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`${
          isDraggable ? "cursor-grab active:cursor-grabbing" : ""
        } border-l-4 ${
          product.location ? "border-l-green-500" : "border-l-gray-300"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <p className="font-medium">{product.codigo}</p>
              </div>
              
              <div className="flex items-center gap-1">
                {product.codigoEstoque && (
                  <Badge variant="outline" className="ml-auto">
                    {product.codigoEstoque}
                  </Badge>
                )}
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={handleEditClick}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <h3 className="font-semibold text-sm line-clamp-2">{product.nome}</h3>
            
            <div className="flex flex-wrap gap-1 mt-1">
              {product.deposito && (
                <Badge variant="secondary" className="text-xs">
                  {product.deposito}
                </Badge>
              )}
              
              {product.location && (
                <Badge variant="default" className="text-xs bg-green-500">
                  {product.location}
                </Badge>
              )}
              
              {product.quantidade !== undefined && (
                <Badge variant="outline" className="text-xs ml-auto">
                  Qtd: {product.quantidade}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showEditDialog && (
        <ProductEditDialog
          product={product}
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
