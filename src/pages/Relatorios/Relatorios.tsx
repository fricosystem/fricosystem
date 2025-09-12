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
      <div className="flex flex-col h-full w-full px-4 py-4 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h1 className="text-2xl font-bold">Relatórios de Movimentação</h1>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetFiltros}>
              Limpar Filtros
            </Button>
            <Button variant="outline" onClick={handleExportar}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros organizados em colunas */}
        <div className="bg-card rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
              <Label className="text-sm font-medium">Buscar</Label>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto, código, solicitante, tipo, depósito..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Movimento</Label>
              <Select 
                value={filtros.status} 
                onValueChange={(value: 'todos' | 'entrada' | 'saida') => handleFiltroChange('status', value)}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
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

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Tipo</Label>
              <Select 
                value={filtros.tipo} 
                onValueChange={(value) => handleFiltroChange('tipo', value)}
                disabled={opcoesFiltro.tipos.length === 0}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Período</Label>
              <Select 
                value={filtros.periodo} 
                onValueChange={handlePeriodoChange}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Período" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="mes">Este mês</SelectItem>
                  <SelectItem value="ano">Este ano</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filtros.periodo === 'personalizado' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Data Inicial</Label>
                  <Input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={dataInicioInput}
                    onChange={(e) => handleDataInicioChange(e.target.value)}
                    maxLength={10}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Data Final</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      value={dataFimInput}
                      onChange={(e) => handleDataFimChange(e.target.value)}
                      maxLength={10}
                      disabled={!dataInicioInput || dataInicioInput.length < 10}
                    />
                    <Button 
                      onClick={aplicarFiltroPersonalizado}
                      disabled={!dataInicioInput || dataInicioInput.length < 10 || !dataFimInput || dataFimInput.length < 10}
                      variant="default"
                      size="sm"
                    >
                      Aplicar Filtro Personalizado
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Solicitante</Label>
              <Select 
                value={filtros.solicitante || ''} 
                onValueChange={(value) => handleFiltroChange('solicitante', value)}
                disabled={opcoesFiltro.solicitantes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Solicitante" />
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

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Cargo</Label>
              <Select 
                value={filtros.cargo || ''} 
                onValueChange={(value) => handleFiltroChange('cargo', value)}
                disabled={opcoesFiltro.cargos.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cargo" />
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

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Depósito</Label>
              <Select 
                value={filtros.deposito || ''} 
                onValueChange={(value) => handleFiltroChange('deposito', value)}
                disabled={opcoesFiltro.depositos.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Depósito" />
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

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Usuário</Label>
              <Select 
                value={filtros.usuario || ''} 
                onValueChange={(value) => handleFiltroChange('usuario', value)}
                disabled={opcoesFiltro.usuarios.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Usuário" />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Centro de Custo</Label>
              <Select 
                value={filtros.centroCusto || ''} 
                onValueChange={(value) => handleFiltroChange('centroCusto', value)}
                disabled={opcoesFiltro.centrosCusto.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Centro de Custo" />
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

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Unidade</Label>
              <Select 
                value={filtros.unidade || ''} 
                onValueChange={(value) => handleFiltroChange('unidade', value)}
                disabled={opcoesFiltro.unidades.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unidade" />
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

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Valor Mínimo</Label>
              <Input
                type="number"
                placeholder="Valor mínimo"
                value={filtros.valorMin || ''}
                onChange={(e) => handleFiltroChange('valorMin', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Valor Máximo</Label>
              <Input
                type="number"
                placeholder="Valor máximo"
                value={filtros.valorMax || ''}
                onChange={(e) => handleFiltroChange('valorMax', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>

        {/* Card para a lista de resultados */}
        <div className="bg-card rounded-lg shadow overflow-hidden mb-4 flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full rounded-lg border">
                <p className="text-lg text-muted-foreground">Carregando relatórios...</p>
              </div>
            ) : relatoriosFiltrados.length === 0 ? (
              <div className="flex items-center justify-center h-full rounded-lg border">
                <p className="text-lg text-muted-foreground">Nenhum relatório encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Depósito</TableHead>
                      <TableHead>Centro de Custo</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Requisição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatoriosFiltrados.map((relatorio) => (
                      <TableRow key={relatorio.id}>
                        <TableCell>{formatDate(relatorio.data_registro)}</TableCell>
                        <TableCell className="font-medium">{relatorio.nome_produto}</TableCell>
                        <TableCell>{relatorio.codigo_material}</TableCell>
                        <TableCell className="text-right">{relatorio.quantidade}</TableCell>
                        <TableCell className="text-right">{formatCurrency(relatorio.valor_unitario)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(relatorio.valor_total)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            relatorio.status === 'entrada' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {relatorio.status === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            {relatorio.tipo || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{relatorio.solicitante.nome}</p>
                            <p className="text-xs text-muted-foreground">{relatorio.solicitante.cargo}</p>
                          </div>
                        </TableCell>
                        <TableCell>{relatorio.deposito || 'N/A'}</TableCell>
                        <TableCell>{relatorio.centro_de_custo || 'N/A'}</TableCell>
                        <TableCell>{relatorio.unidade || 'N/A'}</TableCell>
                        <TableCell>{relatorio.usuario.nome}</TableCell>
                        <TableCell className="font-mono">{relatorio.requisicao_id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Barra de totais dentro do card */}
          <div className="border-t p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">
                Total de registros: {relatoriosFiltrados.length}
              </div>
              <div className="flex gap-6">
                <div className="text-right">
                  <div className="text-sm font-medium text-muted-foreground">Quantidade Total</div>
                  <div className="text-lg font-bold text-blue-100">{totais.quantidadeTotal}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-muted-foreground">Valor Total</div>
                  <div className="text-lg font-bold text-primary">{formatCurrency(totais.valorTotal)}</div>
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