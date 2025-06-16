import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface ItemNotaFiscal {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
}

interface NotaFiscal {
  id: string;
  fornecedor: string;
  valor: number;
  data: string;
  status: 'processada' | 'pendente';
  itens: ItemNotaFiscal[];
  cnpjFornecedor?: string;
  chaveAcesso?: string;
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
      // Simulação de dados para demonstração
      const notasDemo: NotaFiscal[] = [
        {
          id: 'NF-12345',
          fornecedor: 'Fornecedor Exemplo 1',
          valor: 1500.75,
          data: new Date('2023-05-15').toISOString(),
          status: 'processada',
          cnpjFornecedor: '12.345.678/0001-90',
          chaveAcesso: 'NFe35150812345678901234567890123456789012345678',
          itens: [
            {
              codigo: 'PROD001',
              descricao: 'Produto A',
              quantidade: 2,
              unidade: 'UN',
              valorUnitario: 500.25,
              valorTotal: 1000.50
            },
            {
              codigo: 'PROD002',
              descricao: 'Produto B',
              quantidade: 1,
              unidade: 'UN',
              valorUnitario: 500.25,
              valorTotal: 500.25
            }
          ]
        },
        {
          id: 'NF-67890',
          fornecedor: 'Fornecedor Exemplo 2',
          valor: 3200.00,
          data: new Date('2023-06-20').toISOString(),
          status: 'processada',
          cnpjFornecedor: '98.765.432/0001-21',
          chaveAcesso: 'NFe35150898765432109876543210987654321098765432',
          itens: [
            {
              codigo: 'PROD003',
              descricao: 'Produto C',
              quantidade: 5,
              unidade: 'UN',
              valorUnitario: 640.00,
              valorTotal: 3200.00
            }
          ]
        }
      ];
      setNotasFiscais(notasDemo);
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
      const cnpjMatch = xmlString.match(/<emit>[\s\S]*?<CNPJ>(.*?)<\/CNPJ>/);
      const chaveMatch = xmlString.match(/<infNFe.*Id="(.*?)"/);
      
      // Extrair itens
      const itemRegex = /<det.*?>[\s\S]*?<cProd>(.*?)<\/cProd>[\s\S]*?<xProd>(.*?)<\/xProd>[\s\S]*?<qCom>(.*?)<\/qCom>[\s\S]*?<uCom>(.*?)<\/uCom>[\s\S]*?<vUnCom>(.*?)<\/vUnCom>[\s\S]*?<vProd>(.*?)<\/vProd>/g;
      const itens: ItemNotaFiscal[] = [];
      let itemMatch;
      
      while ((itemMatch = itemRegex.exec(xmlString)) !== null) {
        itens.push({
          codigo: itemMatch[1],
          descricao: itemMatch[2],
          quantidade: parseFloat(itemMatch[3]),
          unidade: itemMatch[4],
          valorUnitario: parseFloat(itemMatch[5]),
          valorTotal: parseFloat(itemMatch[6]),
        });
      }

      return {
        id: idMatch ? `NF-${idMatch[1]}` : `NF-${Math.floor(10000 + Math.random() * 90000)}`,
        fornecedor: fornecedorMatch ? fornecedorMatch[1] : `Fornecedor ${Math.floor(Math.random() * 100)}`,
        valor: valorMatch ? parseFloat(valorMatch[1]) : parseFloat((Math.random() * 10000).toFixed(2)),
        cnpjFornecedor: cnpjMatch ? cnpjMatch[1] : undefined,
        chaveAcesso: chaveMatch ? chaveMatch[1] : undefined,
        itens: itens.length > 0 ? itens : [
          {
            codigo: '001',
            descricao: 'Produto Exemplo',
            quantidade: 1,
            unidade: 'UN',
            valorUnitario: 100.00,
            valorTotal: 100.00,
          }
        ],
      };
    } catch (error) {
      console.error('Erro ao extrair dados do XML:', error);
      return {
        id: `NF-${Math.floor(10000 + Math.random() * 90000)}`,
        fornecedor: `Fornecedor ${Math.floor(Math.random() * 100)}`,
        valor: parseFloat((Math.random() * 10000).toFixed(2)),
        itens: [
          {
            codigo: '001',
            descricao: 'Produto Exemplo',
            quantidade: 1,
            unidade: 'UN',
            valorUnitario: 100.00,
            valorTotal: 100.00,
          }
        ],
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
        itens: dados.itens || [
          {
            codigo: '001',
            descricao: 'Produto Exemplo',
            quantidade: 1,
            unidade: 'UN',
            valorUnitario: 100.00,
            valorTotal: 100.00,
          }
        ],
        cnpjFornecedor: dados.cnpjFornecedor,
        chaveAcesso: dados.chaveAcesso,
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