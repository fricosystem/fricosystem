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

// Constantes para acesso à planilha Google Sheets
const SHEETS_ID = "1eASDt7YXnc7-XTW8cuwKqkIILP1dY_22YXjs-R7tEMs";
const SHEET_GID = "736804534";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEETS_ID}/export?format=csv&gid=${SHEET_GID}`;

// URL do Google Apps Script Web App (único)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKG2k1M9bznqqpAZFlheRA58T4Jojfu9VGwa-6mjxcCnv1-lULbM6I21MsnurzdxTq/exec";

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (csvText: string): string[][] => {
    const rows = csvText.split('\n');
    return rows.map(row => row.split(',').map(cell => cell.trim()));
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(CSV_URL);
      if (!response.ok) {
        throw new Error("Falha ao carregar os dados dos produtos");
      }
      
      const csvText = await response.text();
      const rows = parseCSV(csvText);
      
      // Pular a primeira linha (cabeçalho)
      const dataRows = rows.slice(1);
      
      const parsedProducts: Product[] = dataRows
        .filter(values => values.length >= 11) // Garantir que a linha tem dados suficientes
        .map((values, index) => {
          const valorUnitarioText = values[10] || "0";
          const valorUnitarioValue = parseFloat(valorUnitarioText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          
          return {
            id: `produto-${index}`,
            codigo: values[1] || "", // Código material (coluna 1)
            codigoEstoque: values[2] || "", // Código estoque (coluna 2)
            nome: values[3] || "", // Nome (coluna 3)
            unidadeMedida: values[10] || "", // Unidade de medida (coluna 10)
            deposito: values[5] || "", // Depósito (coluna 5)
            quantidade: parseFloat(values[6]) || 0, // Quantidade (coluna 6)
            quantidadeMinima: parseFloat(values[7]) || 0, // Quantidade mínima (coluna 7)
            detalhes: values[8] || "", // Detalhes (coluna 8)
            imagem: values[9] || "", // Imagem (coluna 9)
            valorUnitario: valorUnitarioValue,
            location: values[12] || "", // Prateleira (coluna 12)
            prateleira: values[12] || "", // Prateleira (coluna 12)
          };
        });
      
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
      // Encontrar o produto que estamos atualizando
      const productToUpdate = products.find(p => p.id === productId);
      if (!productToUpdate) {
        throw new Error("Produto não encontrado");
      }
  
      // Atualizar o produto localmente primeiro (para UI responsiva)
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, location, prateleira: location } 
            : product
        )
      );
  
      // Preparar URL com parâmetros para o Google Apps Script
      const url = new URL(APPS_SCRIPT_URL);
      url.searchParams.append('action', 'updateLocation');
      url.searchParams.append('codigo', productToUpdate.codigo);
      url.searchParams.append('location', location);
  
      // Usar fetch com CORS habilitado
      const response = await fetch(url.toString(), {
        method: 'GET', // Mudar para GET que funciona melhor com Apps Script
        // Remover o mode: 'no-cors' para poder receber respostas
      });
  
      // Tentar processar a resposta
      try {
        const responseData = await response.json();
        
        if (!responseData.success) {
          throw new Error(responseData.message || "Erro desconhecido");
        }
      } catch (e) {
      }
  
      toast({
        title: "Localização atualizada",
        description: `Produto ${productToUpdate.nome} movido para ${location}`,
      });
  
      // Atualizar a lista após um breve delay para dar tempo do Apps Script processar
      setTimeout(() => {
        refreshProducts();
      }, 3000);
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
      // Encontrar o produto que estamos atualizando
      const productToUpdate = products.find(p => p.id === productId);
      if (!productToUpdate) {
        throw new Error("Produto não encontrado");
      }

      // Atualizar o produto localmente primeiro
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, ...updatedData } 
            : product
        )
      );

      // Enviar dados para o Google Apps Script
      const formData = new FormData();
      formData.append('action', 'updateProduct');
      formData.append('codigo', productToUpdate.codigo);
      
      // Adicionar todos os campos atualizados
      Object.entries(updatedData).forEach(([key, value]) => {
        // Converter prateleira/location para o campo correto na planilha
        if (key === 'location' || key === 'prateleira') {
          formData.append('prateleira', String(value));
        } else {
          formData.append(key, String(value));
        }
      });

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });

      toast({
        title: "Produto atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      // Atualizar a lista após um breve delay
      setTimeout(() => {
        refreshProducts();
      }, 3000);
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
