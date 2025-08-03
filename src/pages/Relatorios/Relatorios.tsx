import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
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
  where, 
  getDocs,
  orderBy,
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
  periodo: 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado';
  dataInicio?: string;
  dataFim?: string;
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
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<Filtros>({
    status: 'todos',
    periodo: 'hoje'
  });
  const [opcoesFiltro, setOpcoesFiltro] = useState({
    solicitantes: [] as string[],
    cargos: [] as string[],
    depositos: [] as string[],
    usuarios: [] as string[],
    centrosCusto: [] as string[],
    unidades: [] as string[]
  });

  useEffect(() => {
    const carregarRelatorios = async () => {
      try {
        setIsLoading(true);
        let q = query(collection(db, "relatorios"), orderBy("data_registro", "desc"));

        // Aplicar filtro de status
        if (filtros.status !== 'todos') {
          q = query(q, where("status", "==", filtros.status));
        }

        // Aplicar filtro de período
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
          inicioDate = new Date(filtros.dataInicio);
          fimDate = new Date(filtros.dataFim);
          fimDate.setHours(23, 59, 59, 999);
        }

        if (inicioDate && fimDate) {
          q = query(
            q, 
            where("data_registro", ">=", Timestamp.fromDate(inicioDate)),
            where("data_registro", "<=", Timestamp.fromDate(fimDate))
          );
        }

        // Aplicar outros filtros
        if (filtros.solicitante) {
          q = query(q, where("solicitante.nome", "==", filtros.solicitante));
        }

        if (filtros.cargo) {
          q = query(q, where("solicitante.cargo", "==", filtros.cargo));
        }

        if (filtros.deposito) {
          q = query(q, where("deposito", "==", filtros.deposito));
        }

        if (filtros.usuario) {
          q = query(q, where("usuario.nome", "==", filtros.usuario));
        }

        if (filtros.centroCusto) {
          q = query(q, where("centro_de_custo", "==", filtros.centroCusto));
        }

        if (filtros.unidade) {
          q = query(q, where("unidade", "==", filtros.unidade));
        }

        if (filtros.valorMin !== undefined) {
          q = query(q, where("valor_total", ">=", filtros.valorMin));
        }

        if (filtros.valorMax !== undefined) {
          q = query(q, where("valor_total", "<=", filtros.valorMax));
        }

        const querySnapshot = await getDocs(q);
        const relatoriosData: Relatorio[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Relatorio));

        setRelatorios(relatoriosData);

        // Carregar opções para filtros
        const uniqueValues = {
          solicitantes: new Set<string>(),
          cargos: new Set<string>(),
          depositos: new Set<string>(),
          usuarios: new Set<string>(),
          centrosCusto: new Set<string>(),
          unidades: new Set<string>()
        };

        querySnapshot.forEach(doc => {
          const data = doc.data() as Relatorio;
          uniqueValues.solicitantes.add(data.solicitante.nome);
          uniqueValues.cargos.add(data.solicitante.cargo);
          if (data.deposito) uniqueValues.depositos.add(data.deposito);
          uniqueValues.usuarios.add(data.usuario.nome);
          if (data.centro_de_custo) uniqueValues.centrosCusto.add(data.centro_de_custo);
          if (data.unidade) uniqueValues.unidades.add(data.unidade);
        });

        setOpcoesFiltro({
          solicitantes: Array.from(uniqueValues.solicitantes),
          cargos: Array.from(uniqueValues.cargos),
          depositos: Array.from(uniqueValues.depositos),
          usuarios: Array.from(uniqueValues.usuarios),
          centrosCusto: Array.from(uniqueValues.centrosCusto),
          unidades: Array.from(uniqueValues.unidades)
        });
      } catch (error) {
        console.error("Erro ao carregar relatórios:", error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarRelatorios();
  }, [filtros]);

  const handlePeriodoChange = (periodo: 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado') => {
    setFiltros(prev => ({
      ...prev,
      periodo,
      dataInicio: undefined,
      dataFim: undefined
    }));
  };

  const handleFiltroChange = (key: keyof Filtros, value: any) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFiltros = () => {
    setFiltros({
      status: 'todos',
      periodo: 'hoje'
    });
    setSearchTerm('');
  };

  const filtrarRelatorios = () => {
    return relatorios.filter(relatorio => 
      relatorio.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relatorio.codigo_material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relatorio.solicitante.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relatorio.usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (relatorio.deposito && relatorio.deposito.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (relatorio.centro_de_custo && relatorio.centro_de_custo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (relatorio.unidade && relatorio.unidade.toLowerCase().includes(searchTerm.toLowerCase()))
    );
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
    // Implementar lógica de exportação para CSV ou Excel
    console.log("Exportar relatórios");
  };

  const relatoriosFiltrados = filtrarRelatorios();

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

        <div className="bg-card rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 col-span-1 md:col-span-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto, código, solicitante, depósito, centro de custo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                type="date"
                placeholder="Data inicial"
                value={filtros.dataInicio || ''}
                onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
              />
              <Input
                type="date"
                placeholder="Data final"
                value={filtros.dataFim || ''}
                onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
                disabled={!filtros.dataInicio}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select 
              value={filtros.solicitante || ''} 
              onValueChange={(value) => handleFiltroChange('solicitante', value)}
              disabled={opcoesFiltro.solicitantes.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Solicitante" />
              </SelectTrigger>
              <SelectContent>
                {opcoesFiltro.solicitantes.map(solicitante => (
                  <SelectItem key={solicitante} value={solicitante}>
                    {solicitante}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filtros.cargo || ''} 
              onValueChange={(value) => handleFiltroChange('cargo', value)}
              disabled={opcoesFiltro.cargos.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cargo" />
              </SelectTrigger>
              <SelectContent>
                {opcoesFiltro.cargos.map(cargo => (
                  <SelectItem key={cargo} value={cargo}>
                    {cargo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filtros.deposito || ''} 
              onValueChange={(value) => handleFiltroChange('deposito', value)}
              disabled={opcoesFiltro.depositos.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Depósito" />
              </SelectTrigger>
              <SelectContent>
                {opcoesFiltro.depositos.map(deposito => (
                  <SelectItem key={deposito} value={deposito}>
                    {deposito}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filtros.usuario || ''} 
              onValueChange={(value) => handleFiltroChange('usuario', value)}
              disabled={opcoesFiltro.usuarios.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Usuário" />
              </SelectTrigger>
              <SelectContent>
                {opcoesFiltro.usuarios.map(usuario => (
                  <SelectItem key={usuario} value={usuario}>
                    {usuario}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <Select 
              value={filtros.centroCusto || ''} 
              onValueChange={(value) => handleFiltroChange('centroCusto', value)}
              disabled={opcoesFiltro.centrosCusto.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Centro de Custo" />
              </SelectTrigger>
              <SelectContent>
                {opcoesFiltro.centrosCusto.map((centroCusto) => (
                  <SelectItem key={centroCusto} value={centroCusto}>
                    {centroCusto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filtros.unidade || ''} 
              onValueChange={(value) => handleFiltroChange('unidade', value)}
              disabled={opcoesFiltro.unidades.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                {opcoesFiltro.unidades.map((unidade) => (
                  <SelectItem key={unidade} value={unidade}>
                    {unidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Valor mínimo"
              value={filtros.valorMin || ''}
              onChange={(e) => handleFiltroChange('valorMin', Number(e.target.value))}
            />
            <Input
              type="number"
              placeholder="Valor máximo"
              value={filtros.valorMax || ''}
              onChange={(e) => handleFiltroChange('valorMax', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg border">
              <p className="text-lg text-muted-foreground">Carregando relatórios...</p>
            </div>
          ) : relatoriosFiltrados.length === 0 ? (
            <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg border">
              <p className="text-lg text-muted-foreground">Nenhum relatório encontrado</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow overflow-hidden h-full">
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
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Relatorios;