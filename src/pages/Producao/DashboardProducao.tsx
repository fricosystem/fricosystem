import { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, getYear, subDays, startOfYear, endOfMonth, endOfYear } from "date-fns";
import { pt } from "date-fns/locale";
import AppLayout from "@/layouts/AppLayout"; // Atualizado para import default
import { KpiCard } from "@/pages/Producao/Componentes/KPICardProducao";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Package, ShoppingCart, ChartBar, ChartPie, FilterX } from "lucide-react";
import { getPlanejamentoByPeriodo, getComparativoPeriodoAnterior, getMesMaiorProducao } from "@/pages/Producao/Services/PlanejamentoService";
import { getPlanejamentosConcluidosPorPeriodo } from "@/pages/Producao/Services/PlanejamentoConcluidoService";
import { Planejamento, PlanejamentoConcluido } from "@/types/typesProducao";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  TooltipProps
} from "recharts";

// Cores para gráficos
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042', '#9b87f5', '#7E69AB'];

const DashboardProducao = () => {
  const [periodoAtual, setPeriodoAtual] = useState<Date>(new Date());
  const [planejamentoAtual, setPlanejamentoAtual] = useState<Planejamento | null>(null);
  const [planejamentosConcluidos, setPlanejamentosConcluidos] = useState<PlanejamentoConcluido[]>([]);
  const [comparativos, setComparativos] = useState<{
    semana: number | null;
    mes: number | null;
    ano: number | null;
  }>({
    semana: null,
    mes: null,
    ano: null,
  });
  const [mesMaiorProducao, setMesMaiorProducao] = useState<{ mes: number; valor: number } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dados para visualização
  const [produtosData, setProdutosData] = useState<any[]>([]);
  const [ingredientesData, setIngredientesData] = useState<any[]>([]);
  const [vendasPorPeriodo, setVendasPorPeriodo] = useState<any[]>([]);
  const [produtosValoresData, setProdutosValoresData] = useState<any[]>([]);
  
  // Filtro de período
  const [filtroTempo, setFiltroTempo] = useState<'diario' | 'semanal' | 'mensal' | 'anual'>('semanal');

  useEffect(() => {
    carregarDados();
  }, [periodoAtual, filtroTempo]);

  const carregarDados = async () => {
    setLoading(true);
    
    try {
      // Definir datas de acordo com o filtro
      let dataInicio: Date, dataFim: Date;
      
      switch (filtroTempo) {
        case 'diario':
          dataInicio = periodoAtual;
          dataFim = periodoAtual;
          break;
        case 'semanal':
          dataInicio = startOfWeek(periodoAtual, { weekStartsOn: 1 });
          dataFim = endOfWeek(periodoAtual, { weekStartsOn: 1 });
          break;
        case 'mensal':
          dataInicio = startOfMonth(periodoAtual);
          dataFim = endOfMonth(periodoAtual);
          break;
        case 'anual':
          dataInicio = startOfYear(periodoAtual);
          dataFim = endOfYear(periodoAtual);
          break;
        default:
          dataInicio = startOfWeek(periodoAtual, { weekStartsOn: 1 });
          dataFim = endOfWeek(periodoAtual, { weekStartsOn: 1 });
      }
      
      // Carregar planejamento atual
      const resultPlanejamento = await getPlanejamentoByPeriodo(dataInicio, dataFim);
      
      if (resultPlanejamento.success && resultPlanejamento.planejamento) {
        setPlanejamentoAtual(resultPlanejamento.planejamento);
        prepararDadosVisualizacao(resultPlanejamento.planejamento);
      }
      
      // Carregar planejamentos concluídos
      const resultPlanejamentosConcluidos = await getPlanejamentosConcluidosPorPeriodo(dataInicio, dataFim);
      
      if (resultPlanejamentosConcluidos.success) {
        setPlanejamentosConcluidos(resultPlanejamentosConcluidos.planejamentosConcluidos);
        prepararDadosVendas(resultPlanejamentosConcluidos.planejamentosConcluidos);
      }
      
      // Carregar comparativos
      carregarComparativos(dataInicio, dataFim);
      
      // Carregar mês de maior produção
      const anoAtual = getYear(periodoAtual);
      const resultadoMesMaior = await getMesMaiorProducao(anoAtual);
      
      if (resultadoMesMaior.success) {
        setMesMaiorProducao({
          mes: resultadoMesMaior.mes,
          valor: resultadoMesMaior.valor,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const carregarComparativos = async (inicioSemana: Date, fimSemana: Date) => {
    try {
      // Comparativo semanal
      const resultadoSemanaAnterior = await getComparativoPeriodoAnterior(
        inicioSemana,
        fimSemana,
        'semana'
      );
      
      // Comparativo mensal
      const resultadoMesAnterior = await getComparativoPeriodoAnterior(
        startOfMonth(periodoAtual),
        endOfWeek(startOfMonth(periodoAtual), { weekStartsOn: 1 }),
        'mes'
      );
      
      // Comparativo anual
      const anoAtual = getYear(periodoAtual);
      const resultadoAnoAnterior = await getComparativoPeriodoAnterior(
        new Date(anoAtual, 0, 1),
        new Date(anoAtual, 0, 7),
        'ano'
      );
      
      const valorTotalAtual = planejamentoAtual?.metricas?.valorTotal || 0;
      
      setComparativos({
        semana: resultadoSemanaAnterior.success
          ? calcularVariacaoPercentual(
              valorTotalAtual,
              resultadoSemanaAnterior.planejamento.metricas?.valorTotal || 0
            )
          : null,
        mes: resultadoMesAnterior.success
          ? calcularVariacaoPercentual(
              valorTotalAtual,
              resultadoMesAnterior.planejamento.metricas?.valorTotal || 0
            )
          : null,
        ano: resultadoAnoAnterior.success
          ? calcularVariacaoPercentual(
              valorTotalAtual,
              resultadoAnoAnterior.planejamento.metricas?.valorTotal || 0
            )
          : null,
      });
    } catch (error) {
      console.error("Erro ao carregar comparativos:", error);
    }
  };

  const calcularVariacaoPercentual = (valorAtual: number, valorAnterior: number) => {
    if (!valorAnterior) return 0;
    return Math.round(((valorAtual - valorAnterior) / valorAnterior) * 100);
  };

  const prepararDadosVisualizacao = (planejamento: Planejamento) => {
    // Preparar dados de produtos - Corrigido para garantir valores consistentes
    if (!planejamento.itens || !Array.isArray(planejamento.itens)) {
      setProdutosData([]);
      return;
    }
    
    const dadosProdutos = planejamento.itens
      .filter(item => item && item.produtoNome && typeof item.quantidadePlanejada === 'number')
      .map((item) => ({
        nome: item.produtoNome,
        Quantidade: item.quantidadePlanejada, // Alterado para capitalizar o nome da chave
      }));
    
    setProdutosData(dadosProdutos);
    
    // Preparar dados de produtos com valores
    const dadosProdutosValores = planejamento.itens
      .filter(item => item && item.produtoNome && typeof item.quantidadePlanejada === 'number')
      .map((item) => {
        // Calculando valor estimado baseado em algum valor unitário
        const valorUnitario = item.valorUnitario || 10;
        const valorEstimado = item.quantidadePlanejada * valorUnitario;
        
        return {
          nome: item.produtoNome,
          valor: valorEstimado,
          quantidade: item.quantidadePlanejada
        };
      });
    
    setProdutosValoresData(dadosProdutosValores);
    
    // Preparar dados de ingredientes
    const ingredientesMap = new Map();
    
    planejamento.itens.forEach((item) => {
      if (item.ingredientes && Array.isArray(item.ingredientes)) {
        item.ingredientes.forEach((ing) => {
          if (ing && ing.produtoNome && typeof ing.quantidadeNecessaria === 'number') {
            const ingredienteKey = ing.produtoNome;
            
            if (ingredientesMap.has(ingredienteKey)) {
              ingredientesMap.set(
                ingredienteKey,
                ingredientesMap.get(ingredienteKey) + ing.quantidadeNecessaria
              );
            } else {
              ingredientesMap.set(ingredienteKey, ing.quantidadeNecessaria);
            }
          }
        });
      }
    });
    
    const dadosIngredientes = Array.from(ingredientesMap).map(([nome, quantidade]) => ({
      nome,
      Quantidade: quantidade, // Alterado para capitalizar o nome da chave
    }));
    
    setIngredientesData(dadosIngredientes);
  };

  const prepararDadosVendas = (planejamentosConcluidos: PlanejamentoConcluido[]) => {
    // Agregar vendas por período
    let vendasAgregadas: any[] = [];
    
    if (filtroTempo === 'diario' || filtroTempo === 'semanal') {
      // Agregar por dia
      const vendasPorDia = new Map();
      
      planejamentosConcluidos.forEach(planejamento => {
        if (!planejamento || !planejamento.data || !planejamento.produtosFinais) return;
        
        const data = planejamento.data;
        const valorTotal = planejamento.produtosFinais.reduce(
          (total, produto) => total + (produto.valorTotal || 0), 
          0
        );
        
        vendasPorDia.set(data, (vendasPorDia.get(data) || 0) + valorTotal);
      });
      
      vendasAgregadas = Array.from(vendasPorDia).map(([data, valor]) => ({
        periodo: format(new Date(data), 'dd/MM'),
        Valor: valor // Alterado para capitalizar o nome da chave
      }));
    } else if (filtroTempo === 'mensal') {
      // Agregar por semana do mês
      const vendasPorSemana = new Map();
      
      planejamentosConcluidos.forEach(planejamento => {
        if (!planejamento || !planejamento.data || !planejamento.produtosFinais) return;
        
        const data = new Date(planejamento.data);
        const semana = Math.ceil(data.getDate() / 7);
        const valorTotal = planejamento.produtosFinais.reduce(
          (total, produto) => total + (produto.valorTotal || 0), 
          0
        );
        
        vendasPorSemana.set(semana, (vendasPorSemana.get(semana) || 0) + valorTotal);
      });
      
      vendasAgregadas = Array.from(vendasPorSemana).map(([semana, valor]) => ({
        periodo: `Semana ${semana}`,
        Valor: valor // Alterado para capitalizar o nome da chave
      }));
    } else if (filtroTempo === 'anual') {
      // Agregar por mês
      const vendasPorMes = new Map();
      
      planejamentosConcluidos.forEach(planejamento => {
        if (!planejamento || !planejamento.data || !planejamento.produtosFinais) return;
        
        const data = new Date(planejamento.data);
        const mes = data.getMonth();
        const valorTotal = planejamento.produtosFinais.reduce(
          (total, produto) => total + (produto.valorTotal || 0), 
          0
        );
        
        vendasPorMes.set(mes, (vendasPorMes.get(mes) || 0) + valorTotal);
      });
      
      vendasAgregadas = Array.from(vendasPorMes).map(([mes, valor]) => ({
        periodo: obterNomeMes(mes),
        Valor: valor // Alterado para capitalizar o nome da chave
      }));
    }
    
    // Ordenar os dados
    vendasAgregadas.sort((a, b) => {
      if (filtroTempo === 'anual') {
        return mesesOrdem[a.periodo] - mesesOrdem[b.periodo];
      }
      return 0;
    });
    
    setVendasPorPeriodo(vendasAgregadas);
  };

  const obterNomeMes = (mes: number) => {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril",
      "Maio", "Junho", "Julho", "Agosto",
      "Setembro", "Outubro", "Novembro", "Dezembro",
    ];
    
    return meses[mes];
  };

  // Ordem dos meses para ordenação
  const mesesOrdem: Record<string, number> = {
    "Janeiro": 0, "Fevereiro": 1, "Março": 2, "Abril": 3,
    "Maio": 4, "Junho": 5, "Julho": 6, "Agosto": 7,
    "Setembro": 8, "Outubro": 9, "Novembro": 10, "Dezembro": 11,
  };

  const calcularValorTotalProducao = () => {
    if (!planejamentoAtual || !planejamentoAtual.itens) return 0;
    
    return planejamentoAtual.itens.reduce((total, item) => {
      if (!item || typeof item.quantidadePlanejada !== 'number') return total;
      const valorUnitario = item.valorUnitario || 10;
      const valorProduto = item.quantidadePlanejada * valorUnitario;
      return total + valorProduto;
    }, 0);
  };

  const formatarValorMonetario = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Título do filtro atual
  const titulosFiltro = {
    diario: "Diário",
    semanal: "Semanal",
    mensal: "Mensal",
    anual: "Anual"
  };

  // Interface para o CustomTooltip
  interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
  }

  // Formatador para tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.dataKey === 'Valor' 
                ? formatarValorMonetario(entry.value) 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout title="Dashboard de Produção">

      {/* Filtro de período */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Label htmlFor="filtro-periodo" className="font-medium">
            Período:
          </Label>
          <Select 
            value={filtroTempo} 
            onValueChange={(valor: any) => setFiltroTempo(valor)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">Diário</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Valor Total da Produção"
          value={formatarValorMonetario(calcularValorTotalProducao())}
          change={comparativos.semana || 0}
          changeLabel={`vs. ${filtroTempo} anterior`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        
        <KpiCard
          title="Produtos Planejados"
          value={planejamentoAtual?.itens?.length || 0}
          icon={<Package className="h-5 w-5" />}
        />
        
        <KpiCard
          title="Ingredientes Utilizados"
          value={ingredientesData.length || 0}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        
        <KpiCard
          title="Mês de Maior Produção"
          value={mesMaiorProducao ? obterNomeMes(mesMaiorProducao.mes) : "N/A"}
          description={mesMaiorProducao ? formatarValorMonetario(mesMaiorProducao.valor) : ""}
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      {/* Gráficos */}
      <div className="mt-6">
        <Tabs defaultValue="produtos">
          <TabsList>
            <TabsTrigger value="produtos">Produtos Finais</TabsTrigger>
            <TabsTrigger value="ingredientes">Ingredientes</TabsTrigger>
            <TabsTrigger value="vendas">Vendas por Período</TabsTrigger>
            <TabsTrigger value="distribuicao">Distribuição de Valor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="produtos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBar className="h-5 w-5" /> 
                  Quantidade de Produtos Planejados
                </CardTitle>
                <CardDescription>
                  Distribuição da produção planejada por produto final - {titulosFiltro[filtroTempo]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {/* Alterado para usar ResponsiveContainer e fornecer um tooltip personalizado */}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={produtosData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Quantidade" name="Quantidade" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ingredientes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FilterX className="h-5 w-5" />
                  Uso de Ingredientes
                </CardTitle>
                <CardDescription>
                  Quantidades necessárias de cada ingrediente para a produção planejada - {titulosFiltro[filtroTempo]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {/* Alterado para usar ResponsiveContainer e fornecer um tooltip personalizado */}
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ingredientesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="Quantidade"
                        name="Quantidade"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="vendas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Vendas por Período
                </CardTitle>
                <CardDescription>
                  Valor das vendas por período - {titulosFiltro[filtroTempo]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {/* Alterado para usar ResponsiveContainer e fornecer um tooltip personalizado */}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vendasPorPeriodo}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Valor" name="Valor" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="distribuicao">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartPie className="h-5 w-5" />
                  Distribuição de Valor por Produto
                </CardTitle>
                <CardDescription>
                  Valor relativo de cada produto na produção total - {titulosFiltro[filtroTempo]}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-[400px] w-full max-w-[600px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={produtosValoresData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="valor"
                        nameKey="nome"
                      >
                        {produtosValoresData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatarValorMonetario(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sugestões Estratégicas */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sugestões Estratégicas</CardTitle>
          <CardDescription>
            Recomendações para otimizar a produção da próxima {filtroTempo === 'diario' ? 'semana' : 
              filtroTempo === 'semanal' ? 'semana' : 
              filtroTempo === 'mensal' ? 'mês' : 'ano'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="text-sm font-medium text-blue-800">Otimização de Estoque</h4>
              <p className="text-sm text-blue-600">
                Considere aumentar o estoque de ingredientes críticos que estão próximos do limite mínimo.
              </p>
            </div>
            
            <div className="rounded-lg bg-green-50 p-4">
              <h4 className="text-sm font-medium text-green-800">Aumento de Produção</h4>
              <p className="text-sm text-green-600">
                Os produtos com maior margem de lucro podem ter sua produção aumentada em 15%.
              </p>
            </div>
            
            <div className="rounded-lg bg-purple-50 p-4">
              <h4 className="text-sm font-medium text-purple-800">Redução de Desperdício</h4>
              <p className="text-sm text-purple-600">
                Ajuste a produção dos itens com baixa rotatividade para reduzir o desperdício.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default DashboardProducao;