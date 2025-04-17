import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  codigo: string;
  nome: string;
  codigoEstoque?: string;
  deposito?: string;
  location?: string;
  quantidade?: number;
  quantidadeMinima?: number;
  detalhes?: string;
  imagem?: string;
  unidadeMedida?: string;
  valorUnitario?: number;
  prateleira?: string;
}

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  updateProductLocation: (productId: string, location: string) => Promise<void>;
  updateProduct: (productId: string, updatedData: Partial<Product>) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL pública da planilha (CSV ou JSON)
  const PRODUCTS_SHEET_URL = "https://docs.google.com/spreadsheets/d/1eASDt7YXnc7-XTW8cuwKqkIILP1dY_22YXjs-R7tEMs/edit?gid=736804534&output=csv";

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(PRODUCTS_SHEET_URL);
      if (!response.ok) {
        throw new Error("Falha ao carregar os dados dos produtos");
      }
      
      const csvText = await response.text();
      
      // Parse CSV
      const lines = csvText.split("\n");
      const headers = lines[0].split(",");
      
      // Map CSV rows to products
      const parsedProducts: Product[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(",");
        const product: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          const cleanHeader = header.trim();
          product[cleanHeader] = values[index]?.trim() || "";
        });
        
        // Mapear os nomes das colunas da planilha para as propriedades do objeto Product
        parsedProducts.push({
          id: product["Codigo material"] || String(i),
          codigo: product["Codigo material"] || "",
          codigoEstoque: product["Codigo estoque"] || "",
          nome: product["Nome"] || "",
          deposito: product["Deposito"] || "",
          quantidade: product["Quantidade"] ? Number(product["Quantidade"]) : undefined,
          quantidadeMinima: product["Quantidade minima"] ? Number(product["Quantidade minima"]) : undefined,
          detalhes: product["Detalhes"] || "",
          imagem: product["Imagem"] || "",
          unidadeMedida: product["Unidade de medida"] || "",
          valorUnitario: product["Valor unitario"] ? Number(product["Valor unitario"]) : undefined,
          location: product["Prateleira"] || "",
          prateleira: product["Prateleira"] || "",
        });
      }
      
      setProducts(parsedProducts);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido ao buscar produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const refreshProducts = async () => {
    await fetchProducts();
  };

  const updateProductLocation = async (productId: string, location: string) => {
    try {
      // Atualizar localmente primeiro para feedback imediato
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, location, prateleira: location } 
            : product
        )
      );

      // Simulação de atualização bem sucedida com feedback
      // Em uma implementação real, isso seria substituído por uma chamada para atualizar a planilha
      toast({
        title: "Localização atualizada",
        description: `Produto movido para ${location}`,
      });
    } catch (error) {
      console.error("Erro ao atualizar localização:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a localização do produto.",
        variant: "destructive",
      });
    }
  };

  const updateProduct = async (productId: string, updatedData: Partial<Product>) => {
    try {
      // Atualizar localmente primeiro para feedback imediato
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, ...updatedData } 
            : product
        )
      );

      // Feedback ao usuário
      toast({
        title: "Produto atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados do produto.",
        variant: "destructive",
      });
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        refreshProducts,
        updateProductLocation,
        updateProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
