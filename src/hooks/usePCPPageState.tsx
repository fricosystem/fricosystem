import { useState, useCallback } from 'react';

export type ActiveTab = "dashboard" | "turno1" | "turno2" | "processamento" | "resultados" | "produtos" | "metas" | "sistema";
export type PeriodFilter = "hoje" | "semana" | "mes" | "ano" | "personalizado";

interface ProdutoSemClassificacao {
  codigo: string;
  nome: string;
  quantidade_produzida: number;
}

export const usePCPPageState = () => {
  // Estados principais
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("hoje");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  
  // Estados para os modais
  const [showProdutosSemClassificacao, setShowProdutosSemClassificacao] = useState(false);
  const [showAdicionarProduto, setShowAdicionarProduto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoSemClassificacao | null>(null);

  // Handlers para mudança de estado
  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
  }, []);

  const handlePeriodChange = useCallback((newPeriod: PeriodFilter) => {
    setPeriod(newPeriod);
  }, []);

  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleCustomStartDateChange = useCallback((date: Date | undefined) => {
    setCustomStartDate(date);
  }, []);

  const handleCustomEndDateChange = useCallback((date: Date | undefined) => {
    setCustomEndDate(date);
  }, []);

  // Handlers para modais
  const openProdutosSemClassificacao = useCallback(() => {
    setShowProdutosSemClassificacao(true);
  }, []);

  const closeProdutosSemClassificacao = useCallback(() => {
    setShowProdutosSemClassificacao(false);
  }, []);

  const openAdicionarProduto = useCallback((produto: ProdutoSemClassificacao) => {
    setProdutoSelecionado(produto);
    setShowAdicionarProduto(true);
  }, []);

  const closeAdicionarProduto = useCallback(() => {
    setShowAdicionarProduto(false);
    setProdutoSelecionado(null);
  }, []);

  const handleProdutoAdicionado = useCallback(() => {
    setShowProdutosSemClassificacao(false);
    setShowAdicionarProduto(false);
    setProdutoSelecionado(null);
  }, []);

  return {
    // Estados
    activeTab,
    searchTerm,
    period,
    customStartDate,
    customEndDate,
    showProdutosSemClassificacao,
    showAdicionarProduto,
    produtoSelecionado,
    
    // Handlers
    handleTabChange,
    handlePeriodChange,
    handleSearchTermChange,
    handleCustomStartDateChange,
    handleCustomEndDateChange,
    openProdutosSemClassificacao,
    closeProdutosSemClassificacao,
    openAdicionarProduto,
    closeAdicionarProduto,
    handleProdutoAdicionado,
  };
};

export default usePCPPageState;