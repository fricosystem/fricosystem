
import { useState } from "react";
import { Package, DollarSign, TrendingUp, AlertTriangle, ShoppingCart, FileText } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import StatsCard from "@/components/StatsCard";
import AlertaBaixoEstoque from "@/components/AlertaBaixoEstoque";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dados simulados para o dashboard
const mockProdutosBaixoEstoque = [
  {
    id: "1",
    nome: "Arroz Branco 5kg",
    quantidadeAtual: 10,
    quantidadeMinima: 15
  },
  {
    id: "2",
    nome: "Feijão Preto 1kg",
    quantidadeAtual: 8,
    quantidadeMinima: 12
  },
  {
    id: "3",
    nome: "Açúcar Refinado 1kg",
    quantidadeAtual: 5,
    quantidadeMinima: 10
  }
];

const Dashboard = () => {
  const [period, setPeriod] = useState<"hoje" | "semana" | "mes">("semana");
  
  // No futuro, esses dados viriam de uma API baseado no período selecionado
  const dadosPeriodo = {
    hoje: {
      totalProdutos: "184",
      valorEstoque: "R$ 23.450",
      movimentacoes: "12",
      alertas: "5"
    },
    semana: {
      totalProdutos: "196", 
      valorEstoque: "R$ 27.850",
      movimentacoes: "68",
      alertas: "3"
    },
    mes: {
      totalProdutos: "203",
      valorEstoque: "R$ 32.980",
      movimentacoes: "215",
      alertas: "7"
    }
  };

  // Últimas movimentações de estoque (simulado)
  const ultimasMovimentacoes = [
    { id: "1", produto: "Arroz Branco 5kg", tipo: "entrada", quantidade: 50, data: "hoje, 14:32" },
    { id: "2", produto: "Feijão Preto 1kg", tipo: "saída", quantidade: 20, data: "hoje, 11:15" },
    { id: "3", produto: "Macarrão 500g", tipo: "entrada", quantidade: 100, data: "ontem, 16:45" },
    { id: "4", produto: "Óleo de Soja 900ml", tipo: "saída", quantidade: 30, data: "ontem, 09:20" },
    { id: "5", produto: "Açúcar Refinado 1kg", tipo: "entrada", quantidade: 25, data: "há 2 dias" }
  ];

  // Últimas notas fiscais processadas (simulado)
  const ultimasNotasFiscais = [
    { id: "NF-001234", fornecedor: "Distribuidora ABC", valor: "R$ 4.850,00", data: "hoje, 15:20", status: "processada" },
    { id: "NF-001233", fornecedor: "Alimentos XYZ", valor: "R$ 2.320,00", data: "ontem, 09:45", status: "pendente" },
    { id: "NF-001232", fornecedor: "Distribuidora ABC", valor: "R$ 1.750,00", data: "há 3 dias", status: "processada" }
  ];

  const dados = dadosPeriodo[period];

  return (
    <AppLayout title="Dashboard">
      {/* Seletor de período */}
      <div className="mb-6">
        <Tabs defaultValue="semana" value={period} onValueChange={(v) => setPeriod(v as "hoje" | "semana" | "mes")}>
          <TabsList>
            <TabsTrigger value="hoje">Hoje</TabsTrigger>
            <TabsTrigger value="semana">Esta Semana</TabsTrigger>
            <TabsTrigger value="mes">Este Mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Total de Produtos"
          value={dados.totalProdutos}
          icon={<Package size={18} />}
          trend={{ value: 2.5, positive: true, label: "vs. período anterior" }}
        />
        <StatsCard
          title="Valor Total em Estoque"
          value={dados.valorEstoque}
          icon={<DollarSign size={18} />}
          trend={{ value: 4.2, positive: true, label: "vs. período anterior" }}
        />
        <StatsCard
          title="Movimentações"
          value={dados.movimentacoes}
          icon={<TrendingUp size={18} />}
          trend={{ value: 1.8, positive: true, label: "vs. período anterior" }}
        />
        <StatsCard
          title="Alertas de Estoque"
          value={dados.alertas}
          icon={<AlertTriangle size={18} />}
          trend={{ value: 0.5, positive: false, label: "vs. período anterior" }}
          className={Number(dados.alertas) > 0 ? "border-warning" : ""}
        />
      </div>

      {/* Alertas de baixo estoque */}
      <div className="mb-6">
        <AlertaBaixoEstoque produtos={mockProdutosBaixoEstoque} />
      </div>

      {/* Grid com últimas atividades */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Últimas movimentações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart size={18} /> Últimas Movimentações
            </CardTitle>
            <CardDescription>Últimas entradas e saídas de estoque</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ultimasMovimentacoes.map(movimentacao => (
                <div key={movimentacao.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{movimentacao.produto}</p>
                    <p className="text-xs text-muted-foreground">{movimentacao.data}</p>
                  </div>
                  <div className={`flex items-center ${movimentacao.tipo === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                    <span>{movimentacao.tipo === 'entrada' ? '+' : '-'}{movimentacao.quantidade}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Últimas notas fiscais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText size={18} /> Últimas Notas Fiscais
            </CardTitle>
            <CardDescription>Notas fiscais recebidas recentemente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ultimasNotasFiscais.map(nota => (
                <div key={nota.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{nota.id}</p>
                    <p className="text-xs">{nota.fornecedor}</p>
                    <p className="text-xs text-muted-foreground">{nota.data}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{nota.valor}</p>
                    <span 
                      className={`text-xs px-2 py-1 rounded-full ${
                        nota.status === 'processada' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}
                    >
                      {nota.status === 'processada' ? 'Processada' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
