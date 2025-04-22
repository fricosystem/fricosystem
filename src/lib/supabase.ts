import { createClient } from '@supabase/supabase-js';
import type { Product } from '@/types/Product';

// Valores padrão que serão substituídos pelas configurações do usuário
const defaultUrl = 'https://uljimwdnsvamunvxfntr.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsamltd2Ruc3ZhbXVudnhmbnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyNDE5MzksImV4cCI6MjA1OTgxNzkzOX0.9XGC8uy4CsAT-0p-hfw0alFiQGbutDnwekS7QFhMsyA';

// Criar cliente inicial (será substituído quando o usuário configurar)
export const supabase = createClient(defaultUrl, defaultKey);

// Função para obter o cliente Supabase atual (configurado pelo usuário)
const getClient = () => {
  // Se estiver no navegador e houver um cliente configurado, use-o
  if (typeof window !== 'undefined' && (window as any).supabaseClient) {
    return (window as any).supabaseClient;
  }
  
  // Caso contrário, tente usar o cliente padrão
  return supabase;
};

// Funções para interagir com os produtos
export const productService = {
  // Buscar todos os produtos
  async getAllProducts(): Promise<Product[]> {
    const client = getClient();
    const { data, error } = await client
      .from('produtos')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
    
    return data || [];
  },
  
  // Atualizar a posição da prateleira de um produto
  async updateProductShelf(productId: string, newShelf: string): Promise<boolean> {
    const client = getClient();
    const { error } = await client
      .from('produtos')
      .update({ prateleira: newShelf })
      .eq('id', productId);
    
    if (error) {
      console.error('Erro ao atualizar prateleira:', error);
      return false;
    }
    
    return true;
  }
};
