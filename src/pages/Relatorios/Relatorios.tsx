import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
 TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Calendar } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { 
  collection, 
  query, 
  orderBy,
  getDocs,
  Timestamp
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Relatorio {
  id: string;
  requisicao_id: string;
  produto_id: string;
  codigo_material: string;
  nome_produto: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  status: 'entrada' | 'saida';
  tipo?: string;
  solicitante: {
    id: string;
    nome: string;
    cargo: string;
  };
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
  deposito?: string;
  prateleira?: string;
  centro_de_custo: string;
  unidade: string;
  data_saida: Timestamp;
  data_registro: Timestamp;
}

interface Filtros {
  status: 'todos' | 'entrada' | 'saida';
  tipo: string;
  periodo: 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado';
  dataInicio?: Date;
  dataFim?: Date;
  solicitante?: string;
  cargo?: string;
  deposito?: string;
  usuario?: string;
  centroCusto?: string;
  unidade?: string;
  valorMin?: number;
  valorMax?: number;
}

const Relatorios = () => {
  const { userData } = useAuth();
  
  // Estados principais
  const [todosRelatorios, setTodosRelatorios] = useState<Relatorio[]>([]);
  const [relatoriosFiltrados, setRelatoriosFiltrados] = useState<Relatorio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para filtros
  const [filtros, setFiltros] = useState<Filtros>({
    status: 'todos',
    tipo: 'todos',
    periodo: 'hoje'
  });
  
  // Estados para os valores dos inputs de data
  const [dataInicioInput, setDataInicioInput] = useState('');
  const [dataFimInput, setDataFimInput] = useState('');
  const [filtroPersonalizadoAplicado, setFiltroPersonalizadoAplicado] = useState(false);
  
  // Opções para filtros
  const [opcoesFiltro, setOpcoesFiltro] = useState({
    solicitantes: [] as string[],
    cargos: [] as string[],
    depositos: [] as string[],
    usuarios: [] as string[],
    centrosCusto: [] as string[],
    unidades: [] as string[],
    tipos: [] as string[]
  });

  useEffect(() => {
    const carregarRelatorios = async () => {
      try {
        setIsLoading(true);
        // Apenas busca todos os dados sem filtros no Firestore
        const q = query(collection(db, "relatorios"), orderBy("data_registro", "desc"));
        const querySnapshot = await getDocs(q);
        
        const relatoriosData: Relatorio[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Relatorio));

        setTodosRelatorios(relatoriosData);
        setRelatoriosFiltrados(relatoriosData);

        // Carregar opções para filtros
        const uniqueValues = {
          solicitantes: new Set<string>(),
          cargos: new Set<string>(),
          depositos: new Set<string>(),
          usuarios: new Set<string>(),
          centrosCusto: new Set<string>(),
          unidades: new Set<string>(),
          tipos: new Set<string>()
        };

        relatoriosData.forEach(data => {
          uniqueValues.solicitantes.add(data.solicitante.nome);
          uniqueValues.cargos.add(data.solicitante.cargo);
          if (data.deposito) uniqueValues.depositos.add(data.deposito);
          uniqueValues.usuarios.add(data.usuario.nome);
          if (data.centro_de_custo) uniqueValues.centrosCusto.add(data.centro_de_custo);
          if (data.unidade) uniqueValues.unidades.add(data.unidade);
          if (data.tipo) uniqueValues.tipos.add(data.tipo);
        });

        setOpcoesFiltro({
          solicitantes: Array.from(uniqueValues.solicitantes),
          cargos: Array.from(uniqueValues.cargos),
          depositos: Array.from(uniqueValues.depositos),
          usuarios: Array.from(uniqueValues.usuarios),
          centrosCusto: Array.from(uniqueValues.centrosCusto),
          unidades: Array.from(uniqueValues.unidades),
          tipos: Array.from(uniqueValues.tipos)
        });
      } catch (error) {
        console.error("Erro ao carregar relatórios:", error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarRelatorios();
  }, []);

  useEffect(() => {
    // Aplicar todos os filtros sempre que filtros ou searchTerm mudar
    // Exceto quando for período personalizado (só aplica quando botão for clicado)
    if (filtros.periodo !== 'personalizado' || filtroPersonalizadoAplicado) {
      aplicarFiltros();
    }
  }, [todosRelatorios, filtros, searchTerm, filtroPersonalizadoAplicado]);

  const aplicarFiltros = () => {
    let resultados = [...todosRelatorios];
  
    // Filtro de status
    if (filtros.status !== 'todos') {
      resultados = resultados.filter(relatorio => relatorio.status === filtros.status);
    }

    // Filtro de tipo
    if (filtros.tipo !== 'todos') {
      resultados = resultados.filter(relatorio => relatorio.tipo === filtros.tipo);
    }
  
    // Filtro de período
    if (filtros.periodo !== 'personalizado' || (filtros.periodo === 'personalizado' && filtros.dataInicio && filtros.dataFim)) {
      let inicioDate: Date | null = null;
      let fimDate: Date | null = null;
  
      if (filtros.periodo === 'hoje') {
        inicioDate = startOfDay(new Date());
        fimDate = endOfDay(new Date());
      } else if (filtros.periodo === 'semana') {
        inicioDate = startOfWeek(new Date(), { locale: ptBR });
        fimDate = endOfWeek(new Date(), { locale: ptBR });
      } else if (filtros.periodo === 'mes') {
        inicioDate = startOfMonth(new Date());
        fimDate = endOfMonth(new Date());
      } else if (filtros.periodo === 'ano') {
        inicioDate = startOfYear(new Date());
        fimDate = endOfYear(new Date());
      } else if (filtros.periodo === 'personalizado' && filtros.dataInicio && filtros.dataFim) {
        inicioDate = startOfDay(filtros.dataInicio);
        fimDate = endOfDay(filtros.dataFim);
      }
  
      if (inicioDate && fimDate) {
        resultados = resultados.filter(relatorio => {
          const dataRegistro = relatorio.data_registro.toDate();
          return dataRegistro >= inicioDate! && dataRegistro <= fimDate!;
        });
      }
    }
  
    // Filtros individuais
    if (filtros.solicitante) {
      resultados = resultados.filter(relatorio => relatorio.solicitante.nome === filtros.solicitante);
    }
  
    if (filtros.cargo) {
      resultados = resultados.filter(relatorio => relatorio.solicitante.cargo === filtros.cargo);
    }
  
    if (filtros.deposito) {
      resultados = resultados.filter(relatorio => relatorio.deposito === filtros.deposito);
    }
  
    if (filtros.usuario) {
      resultados = resultados.filter(relatorio => relatorio.usuario.nome === filtros.usuario);
    }
  
    if (filtros.centroCusto) {
      resultados = resultados.filter(relatorio => relatorio.centro_de_custo === filtros.centroCusto);
    }
  
    if (filtros.unidade) {
      resultados = resultados.filter(relatorio => relatorio.unidade === filtros.unidade);
    }
  
    if (filtros.valorMin !== undefined) {
      resultados = resultados.filter(relatorio => relatorio.valor_total >= filtros.valorMin!);
    }
  
    if (filtros.valorMax !== undefined) {
      resultados = resultados.filter(relatorio => relatorio.valor_total <= filtros.valorMax!);
    }
  
    // Filtro de busca
    if (searchTerm) {
      resultados = resultados.filter(relatorio => 
        relatorio.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        relatorio.codigo_material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        relatorio.solicitante.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        relatorio.usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (relatorio.tipo && relatorio.tipo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (relatorio.deposito && relatorio.deposito.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (relatorio.centro_de_custo && relatorio.centro_de_custo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (relatorio.unidade && relatorio.unidade.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  
    setRelatoriosFiltrados(resultados);
  };

  // Calcular totais
  const calcularTotais = () => {
    const totais = {
      quantidadeTotal: 0,
      valorTotal: 0
    };

    relatoriosFiltrados.forEach(relatorio => {
      totais.quantidadeTotal += relatorio.quantidade;
      totais.valorTotal += relatorio.valor_total;
    });

    return totais;
  };

  const totais = calcularTotais();
  
  const handlePeriodoChange = (periodo: 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado') => {
    setFiltros(prev => ({
      ...prev,
      periodo,
      dataInicio: undefined,
      dataFim: undefined
    }));
    
    // Limpa os inputs quando muda o período
    if (periodo !== 'personalizado') {
      setDataInicioInput('');
      setDataFimInput('');
      setFiltroPersonalizadoAplicado(false);
    }
  };
  
  const handleFiltroChange = (key: keyof Filtros, value: any) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatDateInput = (value: string) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara DD/MM/YYYY
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const parseDateFromInput = (dateString: string): Date | undefined => {
    if (!dateString || dateString.length !== 10) return undefined;
    
    const [day, month, year] = dateString.split('/').map(Number);
    
    // Validação básica
    if (!day || !month || !year || day > 31 || month > 12 || year < 1900) {
      return undefined;
    }
    
    return new Date(year, month - 1, day);
  };

  const handleDataInicioChange = (value: string) => {
    const formattedValue = formatDateInput(value);
    setDataInicioInput(formattedValue);
    // Não aplica filtro automaticamente durante digitação
  };

  const handleDataFimChange = (value: string) => {
    const formattedValue = formatDateInput(value);
    setDataFimInput(formattedValue);
    // Não aplica filtro automaticamente durante digitação
  };

  const aplicarFiltroPersonalizado = () => {
    const dataInicio = parseDateFromInput(dataInicioInput);
    const dataFim = parseDateFromInput(dataFimInput);
    
    if (dataInicio && dataFim) {
      setFiltros(prev => ({
        ...prev,
        dataInicio,
        dataFim
      }));
      setFiltroPersonalizadoAplicado(true);
    }
  };
  
  const resetFiltros = () => {
    setFiltros({
      status: 'todos',
      tipo: 'todos',
      periodo: 'hoje'
    });
    setSearchTerm('');
    setDataInicioInput('');
    setDataFimInput('');
    setFiltroPersonalizadoAplicado(false);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (timestamp: Timestamp): string => {
    return format(timestamp.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const handleExportar = () => {
  };

  return (
    <AppLayout title="Relatórios Gerais">
      <div className="flex flex-col h-full w-full max-w-full px-1 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 overflow-x-hidden">
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:justify-between md:items-center mb-3 md:mb-6 min-w-0">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Relatórios de Movimentação</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block mt-0.5 md:mt-1">Visualize e filtre todos os movimentos de entrada e saída</p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={resetFiltros}
              size="sm"
              className="flex-1 sm:flex-none text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9 px-2 sm:px-3"
            >
              Limpar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportar}
              size="sm"
              className="flex-1 sm:flex-none text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9 px-2 sm:px-3"
            >
              <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros organizados em colunas */}
        <div className="bg-card rounded-lg shadow p-2 sm:p-3 md:p-4 mb-2 sm:mb-3 md:mb-4 min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4 min-w-0">
            <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 col-span-2">
              <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Buscar</Label>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Search className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder="Produto, código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
              <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Movimento</Label>
              <Select 
                value={filtros.status} 
                onValueChange={(value: 'todos' | 'entrada' | 'saida') => handleFiltroChange('status', value)}
              >
                <SelectTrigger className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9">
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                    <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0 hidden sm:block" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
              <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Tipo</Label>
              <Select 
                value={filtros.tipo} 
                onValueChange={(value) => handleFiltroChange('tipo', value)}
                disabled={opcoesFiltro.tipos.length === 0}
              >
                <SelectTrigger className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9">
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                    <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0 hidden sm:block" />
                    <SelectValue placeholder="Tipo" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {opcoesFiltro.tipos.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4">
            <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
              <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Período</Label>
              <Select 
                value={filtros.periodo} 
                onValueChange={handlePeriodoChange}
              >
                <SelectTrigger className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9">
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0 hidden sm:block" />
                    <SelectValue placeholder="Período" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mês</SelectItem>
                  <SelectItem value="ano">Ano</SelectItem>
                  <SelectItem value="personalizado">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filtros.periodo === 'personalizado' && (
              <>
                <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                  <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Início</Label>
                  <Input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={dataInicioInput}
                    onChange={(e) => handleDataInicioChange(e.target.value)}
                    maxLength={10}
                    className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 col-span-2 lg:col-span-2">
                  <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Fim</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={dataFimInput}
                      onChange={(e) => handleDataFimChange(e.target.value)}
                      maxLength={10}
                      disabled={!dataInicioInput || dataInicioInput.length < 10}
                      className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9 flex-1"
                    />
                    <Button 
                      onClick={aplicarFiltroPersonalizado}
                      disabled={!dataInicioInput || dataInicioInput.length < 10 || !dataFimInput || dataFimInput.length < 10}
                      variant="default"
                      size="sm"
                      className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9 whitespace-nowrap px-2 sm:px-3"
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </>
            )}

            {filtros.periodo !== 'personalizado' && (
              <>
                <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                  <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Solicitante</Label>
                  <Select 
                    value={filtros.solicitante || ''} 
                    onValueChange={(value) => handleFiltroChange('solicitante', value)}
                    disabled={opcoesFiltro.solicitantes.length === 0}
                  >
                    <SelectTrigger className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {opcoesFiltro.solicitantes.map(solicitante => (
                        <SelectItem key={solicitante} value={solicitante}>
                          {solicitante}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                  <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Depósito</Label>
                  <Select 
                    value={filtros.deposito || ''} 
                    onValueChange={(value) => handleFiltroChange('deposito', value)}
                    disabled={opcoesFiltro.depositos.length === 0}
                  >
                    <SelectTrigger className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {opcoesFiltro.depositos.map(deposito => (
                        <SelectItem key={deposito} value={deposito}>
                          {deposito}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Filtros adicionais - colapsáveis em mobile */}
          <details className="group">
            <summary className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors mb-2 sm:mb-3">
              Mais filtros...
            </summary>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 pt-2">
              {filtros.periodo === 'personalizado' && (
                <>
                  <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                    <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Solicitante</Label>
                    <Select 
                      value={filtros.solicitante || ''} 
                      onValueChange={(value) => handleFiltroChange('solicitante', value)}
                      disabled={opcoesFiltro.solicitantes.length === 0}
                    >
                      <SelectTrigger className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {opcoesFiltro.solicitantes.map(solicitante => (
                          <SelectItem key={solicitante} value={solicitante}>
                            {solicitante}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                    <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Depósito</Label>
                    <Select 
                      value={filtros.deposito || ''} 
                      onValueChange={(value) => handleFiltroChange('deposito', value)}
                      disabled={opcoesFiltro.depositos.length === 0}
                    >
                      <SelectTrigger className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {opcoesFiltro.depositos.map(deposito => (
                          <SelectItem key={deposito} value={deposito}>
                            {deposito}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Cargo</Label>
                <Select 
                  value={filtros.cargo || ''} 
                  onValueChange={(value) => handleFiltroChange('cargo', value)}
                  disabled={opcoesFiltro.cargos.length === 0}
                >
                  <SelectTrigger className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {opcoesFiltro.cargos.map(cargo => (
                      <SelectItem key={cargo} value={cargo}>
                        {cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Usuário</Label>
                <Select 
                  value={filtros.usuario || ''} 
                  onValueChange={(value) => handleFiltroChange('usuario', value)}
                  disabled={opcoesFiltro.usuarios.length === 0}
                >
                  <SelectTrigger className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {opcoesFiltro.usuarios.map(usuario => (
                      <SelectItem key={usuario} value={usuario}>
                        {usuario}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Centro de Custo</Label>
                <Select 
                  value={filtros.centroCusto || ''} 
                  onValueChange={(value) => handleFiltroChange('centroCusto', value)}
                  disabled={opcoesFiltro.centrosCusto.length === 0}
                >
                  <SelectTrigger className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {opcoesFiltro.centrosCusto.map((centroCusto) => (
                      <SelectItem key={centroCusto} value={centroCusto}>
                        {centroCusto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Unidade</Label>
                <Select 
                  value={filtros.unidade || ''} 
                  onValueChange={(value) => handleFiltroChange('unidade', value)}
                  disabled={opcoesFiltro.unidades.length === 0}
                >
                  <SelectTrigger className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {opcoesFiltro.unidades.map((unidade) => (
                      <SelectItem key={unidade} value={unidade}>
                        {unidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Valor Mín</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={filtros.valorMin || ''}
                  onChange={(e) => handleFiltroChange('valorMin', e.target.value ? Number(e.target.value) : undefined)}
                  className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9"
                />
              </div>

              <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                <Label className="text-[10px] sm:text-xs md:text-sm font-medium">Valor Máx</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={filtros.valorMax || ''}
                  onChange={(e) => handleFiltroChange('valorMax', e.target.value ? Number(e.target.value) : undefined)}
                  className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9"
                />
              </div>
            </div>
          </details>
        </div>

        {/* Card para a lista de resultados */}
        <div className="bg-card rounded-lg shadow overflow-hidden mb-2 sm:mb-3 md:mb-4 flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 sm:h-full rounded-lg border">
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Carregando...</p>
              </div>
            ) : relatoriosFiltrados.length === 0 ? (
              <div className="flex items-center justify-center h-32 sm:h-full rounded-lg border">
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Nenhum relatório encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] sm:text-xs md:text-sm w-[70px] sm:w-[90px] md:w-[100px] whitespace-nowrap">Data</TableHead>
                      <TableHead className="text-[10px] sm:text-xs md:text-sm w-[100px] sm:w-[140px] md:w-[150px]">Produto</TableHead>
                      <TableHead className="hidden md:table-cell text-xs md:text-sm w-[100px]">Código</TableHead>
                      <TableHead className="text-right text-[10px] sm:text-xs md:text-sm w-[40px] sm:w-[60px] md:w-[80px]">Qtd</TableHead>
                      <TableHead className="hidden lg:table-cell text-right text-xs md:text-sm w-[90px] md:w-[100px]">Valor Unit.</TableHead>
                      <TableHead className="text-right text-[10px] sm:text-xs md:text-sm w-[65px] sm:w-[90px] md:w-[100px]">Total</TableHead>
                      <TableHead className="text-[10px] sm:text-xs md:text-sm w-[50px] sm:w-[70px] md:w-[80px]">Status</TableHead>
                      <TableHead className="hidden xl:table-cell text-xs md:text-sm w-[100px]">Tipo</TableHead>
                      <TableHead className="hidden sm:table-cell text-xs md:text-sm w-[100px] md:w-[120px]">Solicitante</TableHead>
                      <TableHead className="hidden lg:table-cell text-xs md:text-sm w-[110px] md:w-[120px]">Depósito</TableHead>
                      <TableHead className="hidden xl:table-cell text-xs md:text-sm w-[110px] md:w-[120px]">C. Custo</TableHead>
                      <TableHead className="hidden xl:table-cell text-xs md:text-sm w-[80px]">Unidade</TableHead>
                      <TableHead className="hidden xl:table-cell text-xs md:text-sm w-[100px]">Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatoriosFiltrados.map((relatorio) => (
                      <TableRow key={relatorio.id}>
                        <TableCell className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap py-2 sm:py-3">
                          {format(relatorio.data_registro.toDate(), 'dd/MM/yy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium text-[10px] sm:text-xs md:text-sm py-2 sm:py-3">
                          <div className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-[140px]">{relatorio.nome_produto}</div>
                          <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground md:hidden truncate max-w-[80px] sm:max-w-[120px]">
                            {relatorio.codigo_material}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs md:text-sm py-2 sm:py-3">{relatorio.codigo_material}</TableCell>
                        <TableCell className="text-right text-[10px] sm:text-xs md:text-sm py-2 sm:py-3">{relatorio.quantidade}</TableCell>
                        <TableCell className="hidden lg:table-cell text-right text-xs md:text-sm py-2 sm:py-3">{formatCurrency(relatorio.valor_unitario)}</TableCell>
                        <TableCell className="text-right font-medium text-[10px] sm:text-xs md:text-sm py-2 sm:py-3">{formatCurrency(relatorio.valor_total)}</TableCell>
                        <TableCell className="py-2 sm:py-3">
                          <span className={`px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] md:text-xs whitespace-nowrap ${
                            relatorio.status === 'entrada' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }`}>
                            {relatorio.status === 'entrada' ? 'E' : 'S'}
                            <span className="hidden sm:inline">{relatorio.status === 'entrada' ? 'ntrada' : 'aída'}</span>
                          </span>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell py-2 sm:py-3">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            {relatorio.tipo || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-2 sm:py-3">
                          <div className="min-w-0">
                            <p className="font-medium text-xs md:text-sm truncate max-w-[90px] md:max-w-[100px]">{relatorio.solicitante.nome}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground truncate max-w-[90px] md:max-w-[100px]">{relatorio.solicitante.cargo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs md:text-sm py-2 sm:py-3">{relatorio.deposito || 'N/A'}</TableCell>
                        <TableCell className="hidden xl:table-cell text-xs md:text-sm py-2 sm:py-3">{relatorio.centro_de_custo || 'N/A'}</TableCell>
                        <TableCell className="hidden xl:table-cell text-xs md:text-sm py-2 sm:py-3">{relatorio.unidade || 'N/A'}</TableCell>
                        <TableCell className="hidden xl:table-cell text-xs md:text-sm py-2 sm:py-3">{relatorio.usuario.nome}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Barra de totais dentro do card */}
          <div className="border-t p-2 sm:p-3 md:p-4">
            <div className="flex flex-row justify-between items-center gap-2 sm:gap-4">
              <div className="text-[10px] sm:text-xs md:text-sm font-medium">
                <span className="hidden sm:inline">Registros: </span>
                <span className="font-bold">{relatoriosFiltrados.length}</span>
              </div>
              <div className="flex gap-3 sm:gap-4 md:gap-6">
                <div className="text-right">
                  <div className="text-[9px] sm:text-xs md:text-sm font-medium text-muted-foreground">Qtd</div>
                  <div className="text-sm sm:text-base md:text-lg font-bold text-blue-600 dark:text-blue-400">{totais.quantidadeTotal}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] sm:text-xs md:text-sm font-medium text-muted-foreground">Total</div>
                  <div className="text-sm sm:text-base md:text-lg font-bold text-primary">{formatCurrency(totais.valorTotal)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Relatorios;