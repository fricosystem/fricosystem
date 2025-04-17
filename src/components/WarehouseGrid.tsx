import React, { useState } from "react";
import { useProducts, Product } from "@/contexts/ProductContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/ProductCard";

interface WarehouseGridProps {
  draggedProduct: Product | null;
  setDraggedProduct: (product: Product | null) => void;
  products: Product[];
}

// Layout estático do armazém - isso poderia ser configurável futuramente
const WAREHOUSE_LAYOUT = {
  rows: 5,
  cols: 5,
  areas: [
    { id: "A1", label: "A1" },
    { id: "A2", label: "A2" },
    { id: "A3", label: "A3" },
    { id: "A4", label: "A4" },
    { id: "A5", label: "A5" },
    { id: "B1", label: "B1" },
    { id: "B2", label: "B2" },
    { id: "B3", label: "B3" },
    { id: "B4", label: "B4" },
    { id: "B5", label: "B5" },
    { id: "C1", label: "C1" },
    { id: "C2", label: "C2" },
    { id: "C3", label: "C3" },
    { id: "C4", label: "C4" },
    { id: "C5", label: "C5" },
    { id: "D1", label: "D1" },
    { id: "D2", label: "D2" },
    { id: "D3", label: "D3" },
    { id: "D4", label: "D4" },
    { id: "D5", label: "D5" },
    { id: "E1", label: "E1" },
    { id: "E2", label: "E2" },
    { id: "E3", label: "E3" },
    { id: "E4", label: "E4" },
    { id: "E5", label: "E5" },
  ],
};

const WarehouseGrid: React.FC<WarehouseGridProps> = ({
  draggedProduct,
  setDraggedProduct,
  products,
}) => {
  const { updateProductLocation } = useProducts();
  const [customLocation, setCustomLocation] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const getProductsInLocation = (locationId: string) => {
    return products.filter(p => p.location === locationId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, locationId: string) => {
    e.preventDefault();
    
    if (!draggedProduct) {
      const jsonData = e.dataTransfer.getData("application/json");
      if (jsonData) {
        try {
          const parsedProduct = JSON.parse(jsonData) as Product;
          await updateProductLocation(parsedProduct.id, locationId);
        } catch (err) {
          console.error("Error parsing dragged product:", err);
        }
      }
      return;
    }
    
    await updateProductLocation(draggedProduct.id, locationId);
    setDraggedProduct(null);
  };

  const handleCustomLocationSubmit = async () => {
    if (draggedProduct && customLocation.trim()) {
      await updateProductLocation(draggedProduct.id, customLocation.trim());
      setDraggedProduct(null);
      setCustomLocation("");
      setShowCustomInput(false);
    }
  };

  const handleCustomLocationCancel = () => {
    setDraggedProduct(null);
    setCustomLocation("");
    setShowCustomInput(false);
  };

  return (
    <div className="space-y-4">
      {showCustomInput && (
        <div className="bg-muted/30 p-4 rounded-md mb-4">
          <h3 className="font-medium mb-2">Localização Personalizada</h3>
          <div className="flex gap-2">
            <Input
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="Digite a localização (ex: F7)"
              className="flex-1"
            />
            <Button onClick={handleCustomLocationSubmit}>Salvar</Button>
            <Button variant="outline" onClick={handleCustomLocationCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {!showCustomInput && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustomInput(true)}
          className="mb-4"
        >
          + Adicionar Localização Personalizada
        </Button>
      )}

      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {WAREHOUSE_LAYOUT.areas.map((area) => {
          const productsHere = getProductsInLocation(area.id);
          
          return (
            <div 
              key={area.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, area.id)}
              className={`
                border-2 rounded-md p-2 min-h-[100px] flex flex-col
                ${draggedProduct ? "border-dashed border-primary/50" : "border-muted"}
                ${productsHere.length > 0 ? "bg-primary/5" : ""}
              `}
            >
              <div className="font-semibold text-center bg-muted/30 rounded py-1 mb-2">
                {area.label}
              </div>
              
              <div className="flex-1 flex flex-col gap-2">
                {productsHere.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Vazio
                  </p>
                ) : (
                  productsHere.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isDraggable
                      setDraggedProduct={setDraggedProduct}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WarehouseGrid;
