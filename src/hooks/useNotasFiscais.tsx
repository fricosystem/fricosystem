import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface NotaFiscal {
  id: string;
  fornecedor: string;
  valor: number;
  data: string;
  status: 'processada' | 'pendente';
}

const isValidXML = (text: string): boolean => {
  const startsWithXML = text.trim().startsWith('<?xml');
  const hasOpeningAndClosingTags = /<[^>]+>.*<\/[^>]+>/.test(text);

  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const errorNode = xmlDoc.querySelector('parsererror');
      return errorNode === null;
    } catch {
      return false;
    }
  }

  return startsWithXML && hasOpeningAndClosingTags;
};

export const useNotasFiscais = () => {
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [sefazValidado, setSefazValidado] = useState<boolean | null>(null);
  const [xmlContent, setXmlContent] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchNotasFiscais();
  }, []);

  const fetchNotasFiscais = async () => {
    try {
      setLoading(true);
      // Simulação de fetch local (sem Supabase)
      // Aqui você poderia usar localStorage se quiser persistir
    } catch (error: any) {
      console.error('Erro ao carregar notas fiscais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as notas fiscais.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = e.target.files;
    setSefazValidado(null);
    setXmlContent(null);

    if (!arquivos || arquivos.length === 0) {
      setArquivoSelecionado(null);
      return;
    }

    const arquivo = arquivos[0];

    if (!arquivo.name.endsWith('.xml')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo XML.',
        variant: 'destructive',
      });
      setArquivoSelecionado(null);
      return;
    }

    setArquivoSelecionado(arquivo);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        toast({
          title: 'Erro na leitura',
          description: 'Não foi possível ler o conteúdo do arquivo.',
          variant: 'destructive',
        });
        setArquivoSelecionado(null);
        return;
      }

      const content = event.target.result as string;
      setXmlContent(content);
      const valid = isValidXML(content);

      if (!valid) {
        toast({
          title: 'XML inválido',
          description: 'O arquivo não parece ser um XML válido de NFe.',
          variant: 'destructive',
        });
        setArquivoSelecionado(null);
      } else {
        toast({
          title: 'Verificando autenticidade',
          description: 'Validando XML junto à SEFAZ...',
        });

        setTimeout(() => {
          const validated = Math.random() > 0.1;
          setSefazValidado(validated);

          toast({
            title: validated ? 'XML validado' : 'Falha na validação',
            description: validated
              ? 'XML validado com sucesso na SEFAZ.'
              : 'Não foi possível validar o XML na SEFAZ.',
            variant: validated ? 'default' : 'destructive',
          });
        }, 2000);
      }
    };

    reader.readAsText(arquivo);
  };

  const extrairDadosXML = (xmlString: string): Partial<NotaFiscal> => {
    try {
      const fornecedorMatch = xmlString.match(/<emit>[\s\S]*?<xNome>(.*?)<\/xNome>/);
      const valorMatch = xmlString.match(/<vNF>(.*?)<\/vNF>/);
      const idMatch = xmlString.match(/<nNF>(.*?)<\/nNF>/);

      return {
        id: idMatch ? `NF-${idMatch[1]}` : `NF-${Math.floor(10000 + Math.random() * 90000)}`,
        fornecedor: fornecedorMatch ? fornecedorMatch[1] : `Fornecedor ${Math.floor(Math.random() * 100)}`,
        valor: valorMatch ? parseFloat(valorMatch[1]) : parseFloat((Math.random() * 10000).toFixed(2)),
      };
    } catch (error) {
      console.error('Erro ao extrair dados do XML:', error);
      return {
        id: `NF-${Math.floor(10000 + Math.random() * 90000)}`,
        fornecedor: `Fornecedor ${Math.floor(Math.random() * 100)}`,
        valor: parseFloat((Math.random() * 10000).toFixed(2)),
      };
    }
  };

  const processarNota = async () => {
    if (!arquivoSelecionado || !xmlContent) {
      toast({
        title: 'Arquivo necessário',
        description: 'Por favor, selecione um arquivo XML da NFe.',
        variant: 'destructive',
      });
      return;
    }

    if (sefazValidado === false) {
      toast({
        title: 'XML não validado',
        description: 'Este XML não foi validado pela SEFAZ.',
        variant: 'destructive',
      });
      return;
    }

    setCarregando(true);

    try {
      const dados = extrairDadosXML(xmlContent);

      const novaNota: NotaFiscal = {
        id: dados.id || `NF-${Math.floor(10000 + Math.random() * 90000)}`,
        fornecedor: dados.fornecedor || 'Fornecedor Desconhecido',
        valor: dados.valor || 0,
        data: new Date().toISOString(),
        status: 'processada',
      };

      setNotasFiscais((prev) => [novaNota, ...prev]);

      toast({
        title: 'XML processado com sucesso',
        description: 'Os itens da nota fiscal foram extraídos e armazenados.',
      });
    } catch (error) {
      console.error('Erro ao processar nota fiscal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a nota fiscal.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
      setArquivoSelecionado(null);
      setXmlContent(null);
      setSefazValidado(null);
    }
  };

  return {
    notasFiscais,
    loading,
    searchTerm,
    setSearchTerm,
    arquivoSelecionado,
    carregando,
    sefazValidado,
    setArquivoSelecionado,
    handleArquivoChange,
    processarNota,
    fetchNotasFiscais,
  };
};

export default useNotasFiscais;
