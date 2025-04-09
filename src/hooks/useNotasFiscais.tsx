
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotaFiscal {
  id: string;
  fornecedor: string;
  valor: number;
  data: string;
  status: 'processada' | 'pendente';
}

export const useNotasFiscais = () => {
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchNotasFiscais();
  }, []);

  const fetchNotasFiscais = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notas_fiscais')
        .select('*')
        .order('data', { ascending: false });
        
      if (error) throw error;
      
      setNotasFiscais(data as NotaFiscal[]);
      
    } catch (error: any) {
      console.error("Error fetching notas fiscais:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as notas fiscais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = e.target.files;
    if (arquivos && arquivos[0]) {
      const arquivo = arquivos[0];
      // Verificar se é um arquivo XML
      if (arquivo.type !== "text/xml" && !arquivo.name.endsWith('.xml')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo XML.",
          variant: "destructive",
        });
        return;
      }
      setArquivoSelecionado(arquivo);
    }
  };

  const processarNota = async () => {
    try {
      if (!arquivoSelecionado) {
        toast({
          title: "Arquivo necessário",
          description: "Por favor, selecione um arquivo XML da NFe.",
          variant: "destructive",
        });
        return;
      }

      setCarregando(true);
      
      // Em uma implementação real, você faria upload do XML para o supabase storage
      // e depois processaria o arquivo, por exemplo com uma edge function
      
      // Simulando processamento e criação de nota fiscal
      setTimeout(async () => {
        // Criar uma nota fiscal simulada
        const novaNota = {
          id: `NF-${Math.floor(Math.random() * 10000).toString().padStart(6, '0')}`,
          fornecedor: "Fornecedor " + Math.floor(Math.random() * 100),
          valor: parseFloat((Math.random() * 10000).toFixed(2)),
          data: new Date().toISOString(),
          status: 'processada' as const
        };
        
        const { error } = await supabase
          .from('notas_fiscais')
          .insert(novaNota);
          
        if (error) throw error;
        
        // Atualizar lista de notas fiscais
        await fetchNotasFiscais();
        
        setCarregando(false);
        setArquivoSelecionado(null);
        
        toast({
          title: "XML processado com sucesso",
          description: "Os itens da nota fiscal foram extraídos.",
        });
      }, 2000);
      
    } catch (error: any) {
      console.error("Error processing nota fiscal:", error);
      setCarregando(false);
      
      toast({
        title: "Erro",
        description: "Não foi possível processar a nota fiscal.",
        variant: "destructive",
      });
    }
  };

  return {
    notasFiscais,
    loading,
    arquivoSelecionado,
    carregando,
    setArquivoSelecionado,
    handleArquivoChange,
    processarNota
  };
};

export default useNotasFiscais;
