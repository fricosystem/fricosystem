import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { doc, setDoc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, Search, Edit, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
interface ProdutoPCP {
  id: string;
  codigo: string;
  descricao_produto: string;
  batch_receita_kg?: number;
  classificacao?: string;
}
interface Produto {
  codigo: string;
  textoBreve: string;
  kg: number;
  cx: number;
  planejamento: number;
  descricao_produto?: string;
  id?: string;
}
interface TurnoFormProps {
  turno: '1' | '2';
  titulo: string;
}
const TurnoForm: React.FC<TurnoFormProps> = ({
  turno,
  titulo
}) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosPCP, setProdutosPCP] = useState<ProdutoPCP[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importData, setImportData] = useState<Produto[]>([]);
  const [status, setStatus] = useState<"empty" | "loaded" | "saved">("empty");
  const [editingValues, setEditingValues] = useState<{
    [key: number]: string;
  }>({});
  const [editingKgValues, setEditingKgValues] = useState<{
    [key: number]: string;
  }>({});
  const [editingKgIndex, setEditingKgIndex] = useState<number | null>(null);
  const [editingCxValues, setEditingCxValues] = useState<{
    [key: number]: string;
  }>({});
  const [editingCxIndex, setEditingCxIndex] = useState<number | null>(null);
  const [planilhaImportada, setPlanilhaImportada] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const {
    toast
  } = useToast();

  // Função para buscar produtos da coleção PCP_produtos
  const fetchProdutosPCP = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "PCP_produtos"));
      const produtosData: ProdutoPCP[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data && data.codigo) {
          // Validação adicional
          produtosData.push({
            id: doc.id,
            ...data
          } as ProdutoPCP);
        }
      });
      setProdutosPCP(produtosData);
      return produtosData;
    } catch (error) {
      console.error("Error fetching produtos PCP:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos do sistema",
        variant: "destructive"
      });
      return [];
    }
  };

  // Função para mesclar dados da planilha com produtos PCP
  const mergeImportWithPCPProducts = (importedData: Produto[], pcpProducts: ProdutoPCP[]) => {
    if (!importedData || !pcpProducts) {
      console.warn('Dados inválidos para mesclagem:', {
        importedData: !!importedData,
        pcpProducts: !!pcpProducts
      });
      return [];
    }
    const mergedProducts: Produto[] = pcpProducts.map(pcpProduto => {
      const importedItem = importedData.find(item => item.codigo === pcpProduto.codigo);
      return {
        codigo: pcpProduto.codigo,
        textoBreve: pcpProduto.descricao_produto || "",
        kg: importedItem?.kg || 0,
        cx: importedItem?.cx || 0,
        planejamento: 0,
        descricao_produto: pcpProduto.descricao_produto,
        id: pcpProduto.id
      };
    });
    return mergedProducts;
  };

  // Filtrar produtos baseado no termo de busca
  const filterProducts = (products: Produto[], search: string) => {
    if (!search.trim()) return products;
    const searchLower = search.toLowerCase();
    return products.filter(produto => produto.codigo.toLowerCase().includes(searchLower) || produto.textoBreve.toLowerCase().includes(searchLower) || produto.descricao_produto && produto.descricao_produto.toLowerCase().includes(searchLower));
  };

  // Atualizar produtos filtrados quando search term ou produtos mudarem
  useEffect(() => {
    const filtered = filterProducts(produtos, searchTerm);
    setProdutosFiltrados(filtered);
  }, [produtos, searchTerm]);
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  const getSelectedDateString = () => {
    return selectedDate.toISOString().split('T')[0];
  };
  useEffect(() => {
    const loadData = async () => {
      const today = getTodayDate();
      const localStorageKey = `turno${turno}_${today}`;
      const savedData = localStorage.getItem(localStorageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setProdutos(parsed);
        setPlanilhaImportada(true);
        setStatus("loaded");
        return;
      }

      // Não carrega automaticamente do Firestore - só após importação da planilha
    };
    loadData();
  }, [turno]);

  // Função para analisar o valor formatado e converter para número
  const parseNumber = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    // Remove todos os pontos (separadores de milhar) e substitui vírgula por ponto
    const cleanValue = String(value).replace(/\./g, "") // Remove pontos (separadores de milhar)
    .replace(",", "."); // Substitui vírgula por ponto decimal

    return parseFloat(cleanValue) || 0;
  };
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Formatar input durante a digitação com formatação automática de decimais
  const formatInputValue = (value: string): string => {
    if (!value) return "";

    // Remove todos os caracteres não numéricos
    const cleanValue = value.replace(/[^\d]/g, "");

    // Se o valor está vazio após limpeza, retorna vazio
    if (!cleanValue) return "";

    // Se o valor é apenas zeros, retorna "0,00"
    if (cleanValue.replace(/0/g, "") === "") {
      return "0,00";
    }

    // Remove zeros à esquerda
    const trimmedValue = cleanValue.replace(/^0+/, "");

    // Se após remover zeros à esquerda ficou vazio, retorna "0,00"
    if (!trimmedValue) {
      return "0,00";
    }

    // Se o valor tem apenas 1 ou 2 dígitos, formata como decimal (0,XX)
    if (trimmedValue.length <= 2) {
      // Adiciona zeros à esquerda se necessário para ter 2 dígitos
      const paddedValue = trimmedValue.padStart(2, "0");
      return `0,${paddedValue}`;
    }

    // Para valores com 3+ dígitos, separa parte inteira e decimal
    const integerPart = trimmedValue.slice(0, -2);
    const decimalPart = trimmedValue.slice(-2);

    // Formata a parte inteira com pontos de milhar
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formattedInteger},${decimalPart}`;
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      readExcelFile(e.target.files[0]);
    }
  };
  const readExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, {
        type: "array"
      });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, {
        header: 1
      });
      const processedData: Produto[] = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row.length >= 6 && row[0] && (row[3] || row[5])) {
          processedData.push({
            codigo: String(row[0]).trim(),
            textoBreve: row[2] ? String(row[2]).trim().substring(0, 30) : "",
            kg: parseFloat(String(row[3]) || "0"),
            cx: parseFloat(String(row[5]) || "0"),
            planejamento: 0
          });
        }
      }
      setImportData(processedData);
      setIsModalOpen(true);
    };
    reader.readAsArrayBuffer(file);
  };
  const confirmImport = async () => {
    const today = getTodayDate();
    const localStorageKey = `turno${turno}_${today}`;

    // Buscar produtos PCP
    const pcpProducts = await fetchProdutosPCP();

    // Mesclar dados importados com produtos PCP
    const mergedProducts = mergeImportWithPCPProducts(importData, pcpProducts);
    setProdutos(mergedProducts);
    setStatus("loaded");
    setPlanilhaImportada(true);
    setIsModalOpen(false);
    setShowDatePicker(true); // Mostrar seleção de data após importação

    localStorage.setItem(localStorageKey, JSON.stringify(mergedProducts));
    toast({
      title: "Sucesso",
      description: `Planilha importada e mesclada com ${pcpProducts.length} produtos do sistema!`
    });
  };

  // Função para iniciar a edição do CX
  const startCxEditing = (index: number) => {
    setEditingCxIndex(index);
    handleCxFocus(index);
  };

  // Função para lidar com a mudança no campo de CX
  const handleCxChange = (index: number, value: string) => {
    // Remove qualquer formatação existente para processar apenas números
    const numericValue = value.replace(/[^\d]/g, "");

    // Aplica formatação automática durante a digitação
    const formattedValue = formatInputValue(numericValue);

    // Store the formatted editing value to allow free typing
    setEditingCxValues(prev => ({
      ...prev,
      [index]: formattedValue
    }));
    const newProdutos = [...produtos];
    newProdutos[index].cx = parseNumber(formattedValue);
    setProdutos(newProdutos);

    // Update localStorage on every change
    const today = getTodayDate();
    const localStorageKey = `turno${turno}_${today}`;
    localStorage.setItem(localStorageKey, JSON.stringify(newProdutos));
  };
  const handleCxFocus = (index: number) => {
    const currentValue = produtos[index].cx;

    // Se o valor atual é zero, inicia com campo vazio para nova digitação
    if (currentValue === 0) {
      setEditingCxValues(prev => ({
        ...prev,
        [index]: ""
      }));
    } else {
      // Para valores não zero, mostra o valor numérico sem formatação para edição
      const numericValue = String(Math.round(currentValue * 100));
      setEditingCxValues(prev => ({
        ...prev,
        [index]: numericValue
      }));
    }
  };

  // Função para quando o campo CX perde o foco (formata o número)
  const handleCxBlur = (index: number) => {
    const currentValue = produtos[index].cx;

    // Se o valor atual é zero, mantém vazio para facilitar nova digitação
    if (currentValue === 0) {
      setEditingCxValues(prev => ({
        ...prev,
        [index]: ""
      }));
    } else {
      // Caso contrário, limpa o valor de edição para mostrar o valor formatado
      setEditingCxValues(prev => {
        const newValues = {
          ...prev
        };
        delete newValues[index];
        return newValues;
      });
    }

    // Sair do modo de edição
    setEditingCxIndex(null);
  };

  // Função para iniciar a edição do KG
  const startKgEditing = (index: number) => {
    setEditingKgIndex(index);
    handleKgFocus(index);
  };

  // Função para lidar com a mudança no campo de KG
  const handleKgChange = (index: number, value: string) => {
    // Remove qualquer formatação existente para processar apenas números
    const numericValue = value.replace(/[^\d]/g, "");

    // Aplica formatação automática durante a digitação
    const formattedValue = formatInputValue(numericValue);

    // Store the formatted editing value to allow free typing
    setEditingKgValues(prev => ({
      ...prev,
      [index]: formattedValue
    }));
    const newProdutos = [...produtos];
    newProdutos[index].kg = parseNumber(formattedValue);
    setProdutos(newProdutos);

    // Update localStorage on every change
    const today = getTodayDate();
    const localStorageKey = `turno${turno}_${today}`;
    localStorage.setItem(localStorageKey, JSON.stringify(newProdutos));
  };
  const handleKgFocus = (index: number) => {
    const currentValue = produtos[index].kg;

    // Se o valor atual é zero, inicia com campo vazio para nova digitação
    if (currentValue === 0) {
      setEditingKgValues(prev => ({
        ...prev,
        [index]: ""
      }));
    } else {
      // Para valores não zero, mostra o valor numérico sem formatação para edição
      const numericValue = String(Math.round(currentValue * 100));
      setEditingKgValues(prev => ({
        ...prev,
        [index]: numericValue
      }));
    }
  };

  // Função para quando o campo KG perde o foco (formata o número)
  const handleKgBlur = (index: number) => {
    const currentValue = produtos[index].kg;

    // Se o valor atual é zero, mantém vazio para facilitar nova digitação
    if (currentValue === 0) {
      setEditingKgValues(prev => ({
        ...prev,
        [index]: ""
      }));
    } else {
      // Caso contrário, limpa o valor de edição para mostrar o valor formatado
      setEditingKgValues(prev => {
        const newValues = {
          ...prev
        };
        delete newValues[index];
        return newValues;
      });
    }

    // Sair do modo de edição
    setEditingKgIndex(null);
  };

  // Função para lidar com a mudança no campo de planejamento
  const handlePlanejamentoChange = (index: number, value: string) => {
    // Remove qualquer formatação existente para processar apenas números
    const numericValue = value.replace(/[^\d]/g, "");

    // Aplica formatação automática durante a digitação
    const formattedValue = formatInputValue(numericValue);

    // Store the formatted editing value to allow free typing
    setEditingValues(prev => ({
      ...prev,
      [index]: formattedValue
    }));
    const newProdutos = [...produtos];
    newProdutos[index].planejamento = parseNumber(formattedValue);
    setProdutos(newProdutos);

    // Update localStorage on every change
    const today = getTodayDate();
    const localStorageKey = `turno${turno}_${today}`;
    localStorage.setItem(localStorageKey, JSON.stringify(newProdutos));
  };
  const handlePlanejamentoFocus = (index: number) => {
    const currentValue = produtos[index].planejamento;

    // Se o valor atual é zero, inicia com campo vazio para nova digitação
    if (currentValue === 0) {
      setEditingValues(prev => ({
        ...prev,
        [index]: ""
      }));
    } else {
      // Para valores não zero, mostra o valor numérico sem formatação para edição
      const numericValue = String(Math.round(currentValue * 100));
      setEditingValues(prev => ({
        ...prev,
        [index]: numericValue
      }));
    }
  };

  // Função para quando o campo perde o foco (formata o número)
  const handlePlanejamentoBlur = (index: number) => {
    const currentValue = produtos[index].planejamento;

    // Se o valor atual é zero, mantém vazio para facilitar nova digitação
    if (currentValue === 0) {
      setEditingValues(prev => ({
        ...prev,
        [index]: ""
      }));
    } else {
      // Caso contrário, limpa o valor de edição para mostrar o valor formatado
      setEditingValues(prev => {
        const newValues = {
          ...prev
        };
        delete newValues[index];
        return newValues;
      });
    }
  };
  const clearImportation = () => {
    const today = getTodayDate();
    const localStorageKey = `turno${turno}_${today}`;
    localStorage.removeItem(localStorageKey);
    setProdutos([]);
    setProdutosFiltrados([]);
    setEditingValues({});
    setEditingKgValues({});
    setEditingKgIndex(null);
    setEditingCxValues({});
    setEditingCxIndex(null);
    setPlanilhaImportada(false);
    setSearchTerm("");
    setShowDatePicker(false);
    setShowCalendar(false);
    setSelectedDate(new Date());
    setStatus("empty");
    toast({
      title: "Sucesso",
      description: `Importação do ${titulo} limpa com sucesso!`
    });
  };
  const saveToFirestore = async () => {
    if (produtos.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum dado para salvar!",
        variant: "destructive"
      });
      return;
    }

    // Filtrar apenas produtos que tenham dados em KG, CX ou Planejamento (excluir apenas os que estão zerados em todas as colunas)
    const produtosComDados = produtos.filter(p => p.kg > 0 || p.cx > 0 || p.planejamento > 0);
    if (produtosComDados.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum produto com dados para salvar! Preencha pelo menos uma das colunas: KG, CX ou Planejamento.",
        variant: "destructive"
      });
      return;
    }
    try {
      const selectedDateString = getSelectedDateString();
      const docRef = doc(db, "PCP", selectedDateString);
      await setDoc(docRef, {
        [`${turno}_turno`]: produtosComDados.map(p => ({
          codigo: p.codigo,
          texto_breve: p.textoBreve,
          kg: p.kg,
          cx: p.cx,
          planejamento: p.planejamento
        })),
        processado: "não",
        date: selectedDateString,
        timestamp: new Date()
      }, {
        merge: true
      });
      setStatus("saved");
      const today = getTodayDate();
      const localStorageKey = `turno${turno}_${today}`;
      localStorage.removeItem(localStorageKey);
      setProdutos([]);
      setProdutosFiltrados([]);
      setEditingValues({});
      setEditingKgValues({});
      setEditingKgIndex(null);
      setEditingCxValues({});
      setEditingCxIndex(null);
      setPlanilhaImportada(false);
      setSearchTerm("");
      setShowDatePicker(false);
      setShowCalendar(false);
      setSelectedDate(new Date());
      setStatus("empty");
      const dateFormatted = format(selectedDate, "dd/MM/yyyy", {
        locale: ptBR
      });
      toast({
        title: "Sucesso",
        description: `${produtosComDados.length} produtos do ${titulo} salvos para ${dateFormatted}!`
      });
    } catch (error) {
      console.error("Erro ao salvar no Firestore:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados!",
        variant: "destructive"
      });
    }
  };
  const getBadgeVariant = () => {
    switch (status) {
      case "empty":
        return "secondary";
      case "loaded":
        return "default";
      case "saved":
        return "default";
      default:
        return "default";
    }
  };
  const getBadgeText = () => {
    switch (status) {
      case "empty":
        return "Apontamento não importado";
      case "loaded":
        return "Apontamento carregado";
      case "saved":
        return "Apontamento salvo";
      default:
        return "";
    }
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{titulo}</h2>
        <Button variant="outline" onClick={() => setShowCalendar(!showCalendar)} className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Lançamento Personalizado
        </Button>
      </div>
      
      {/* Calendário para seleção de data - exibido apenas quando solicitado */}
      {showCalendar && <Card className="bg-card/95 backdrop-blur-sm border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário de Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <div className="w-fit">
                <Calendar 
                  mode="single" 
                  selected={selectedDate} 
                  onSelect={date => date && setSelectedDate(date)} 
                  className="rounded-md border bg-card pointer-events-auto p-3" 
                  locale={ptBR}
                  classNames={{
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground font-semibold border border-primary/20",
                    day: "h-9 w-9 text-center font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                    head_cell: "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
                    cell: "text-center p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    nav_button: "hover:bg-accent hover:text-accent-foreground",
                    caption: "flex justify-center pt-1 relative items-center"
                  }}
                />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-2">Data Selecionada</h4>
                  <div className="p-4 bg-primary/10 rounded-lg border">
                    <p className="text-lg font-medium">
                      {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR
                  })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Esta será a data utilizada para salvar os lançamentos de produção
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>• Selecione uma data anterior ou posterior para lançamentos retroativos ou futuros</p>
                  <p>• Por padrão, a data atual está selecionada</p>
                  <p>• Esta data será aplicada ao salvar os dados no sistema</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>}
      
      <Card className="bg-card/95 backdrop-blur-sm border">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Controle de Produção</span>
            <Badge variant="secondary" className={status === "loaded" ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-500 text-white"}>
              {getBadgeText()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className={`${produtos.length === 0 ? 'min-h-[300px] flex flex-col justify-center' : 'py-6'} bg-card p-8`}>
          <div className="space-y-8">
            {produtos.length === 0 && <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-full max-w-lg">
                  <h3 className="text-lg font-semibold mb-6 text-foreground">Importar Planilha de Apontamento</h3>
                  <div className="relative">
                    <input type="file" accept=".xls,.xlsx" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" id={`file-upload-${turno}`} />
                    <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl" asChild>
                      <label htmlFor={`file-upload-${turno}`} className="cursor-pointer flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Escolher Arquivo</span>
                          <span className="text-xs opacity-90">Formato .xls ou .xlsx</span>
                        </div>
                      </label>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Selecione a planilha de apontamento para importar os dados
                  </p>
                </div>
              </div>}

            {produtos.length > 0 && planilhaImportada && <div className="mt-6">
                {/* Seleção de data personalizada após importação */}
                {showDatePicker}
                {/* Barra de pesquisa */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input type="text" placeholder="Pesquisar por código ou descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Exibindo {produtosFiltrados.length} de {produtos.length} produtos
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead className="w-1/4">Descrição</TableHead>
                        <TableHead className="text-right">KG</TableHead>
                        <TableHead className="text-right">CX</TableHead>
                        <TableHead className="text-right">Planejamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosFiltrados.map((produto, index) => {
                    // Encontrar o índice original do produto na lista completa
                    const originalIndex = produtos.findIndex(p => p.codigo === produto.codigo);
                    return <TableRow key={produto.codigo}>
                            <TableCell className="font-mono">{produto.codigo}</TableCell>
                            <TableCell className="truncate" title={produto.descricao_produto || produto.textoBreve}>
                              {produto.descricao_produto || produto.textoBreve}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 justify-end">
                                {editingKgIndex === originalIndex ? <Input type="text" value={editingKgValues[originalIndex] !== undefined ? editingKgValues[originalIndex] : produto.kg === 0 ? "" : formatNumber(produto.kg)} onChange={e => handleKgChange(originalIndex, e.target.value)} onBlur={() => handleKgBlur(originalIndex)} className="text-right w-24" placeholder="0,00" autoFocus /> : <span className="text-right w-24 inline-block">{formatNumber(produto.kg)}</span>}
                                <Edit className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => startKgEditing(originalIndex)} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 justify-end">
                                {editingCxIndex === originalIndex ? <Input type="text" value={editingCxValues[originalIndex] !== undefined ? editingCxValues[originalIndex] : produto.cx === 0 ? "" : formatNumber(produto.cx)} onChange={e => handleCxChange(originalIndex, e.target.value)} onBlur={() => handleCxBlur(originalIndex)} className="text-right w-24" placeholder="0,00" autoFocus /> : <span className="text-right w-24 inline-block">{formatNumber(produto.cx)}</span>}
                                <Edit className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => startCxEditing(originalIndex)} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input type="text" value={editingValues[originalIndex] !== undefined ? editingValues[originalIndex] : produto.planejamento === 0 ? "" : formatNumber(produto.planejamento)} onChange={e => handlePlanejamentoChange(originalIndex, e.target.value)} onFocus={() => handlePlanejamentoFocus(originalIndex)} onBlur={() => handlePlanejamentoBlur(originalIndex)} className="text-right" placeholder="0,00" />
                            </TableCell>
                          </TableRow>;
                  })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <Button variant="destructive" onClick={clearImportation} className="flex items-center gap-2 hover:bg-destructive/80 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md">
                    <Trash2 className="h-4 w-4" />
                    Limpar Importação
                  </Button>
                  <Button onClick={saveToFirestore} disabled={status === "saved"} className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    Salvar {titulo}
                  </Button>
                </div>
              </div>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Itens a serem importados</DialogTitle>
          </DialogHeader>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead className="w-1/4">Texto breve</TableHead>
                  <TableHead className="text-right">KG</TableHead>
                  <TableHead className="text-right">CX</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.map((item, index) => <TableRow key={index}>
                    <TableCell>{item.codigo}</TableCell>
                    <TableCell className="truncate" title={item.textoBreve}>{item.textoBreve}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.kg)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.cx)}</TableCell>
                  </TableRow>)}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-semibold text-right">Total:</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatNumber(importData.reduce((sum, item) => sum + item.kg, 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatNumber(importData.reduce((sum, item) => sum + item.cx, 0))}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="hover:bg-secondary/80 hover:scale-105 transition-all duration-200">
              Cancelar
            </Button>
            <Button onClick={confirmImport} className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-lg">
              Confirmar Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default TurnoForm;