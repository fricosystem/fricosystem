
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AppLayout from "@/layouts/AppLayout";
import StatsCard from "@/components/StatsCard";
import { FileBarChart2, BarChart3, PieChart } from "lucide-react";

const data = [
  { name: "Jan", vendas: 4000, estoque: 2400, custos: 2400 },
  { name: "Fev", vendas: 3000, estoque: 1398, custos: 2210 },
  { name: "Mar", vendas: 2000, estoque: 9800, custos: 2290 },
  { name: "Abr", vendas: 2780, estoque: 3908, custos: 2000 },
  { name: "Mai", vendas: 1890, estoque: 4800, custos: 2181 },
  { name: "Jun", vendas: 2390, estoque: 3800, custos: 2500 },
  { name: "Jul", vendas: 3490, estoque: 4300, custos: 2100 },
];

const produtosPorCategoria = [
  { name: "Laticínios", quantidade: 65 },
  { name: "Embutidos", quantidade: 40 },
  { name: "Bebidas", quantidade: 25 },
  { name: "Carnes", quantidade: 30 },
  { name: "Outros", quantidade: 15 },
];

const Relatorios = () => {
  return (
    <AppLayout title="Relatórios">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total de Vendas"
          value="R$ 248.590,00"
          description="Valor total das vendas do mês"
          icon={<FileBarChart2 size={20} />}
          trend={{ value: 12.5, positive: true, label: "desde o mês passado" }}
        />
        <StatsCard
          title="Itens em Estoque"
          value="1.245"
          description="Total de produtos no estoque"
          icon={<BarChart3 size={20} />}
          trend={{ value: 3.2, positive: false, label: "desde o mês passado" }}
        />
        <StatsCard
          title="Notas Fiscais Emitidas"
          value="352"
          description="Notas fiscais do mês atual"
          icon={<PieChart size={20} />}
          trend={{ value: 8.1, positive: true, label: "desde o mês passado" }}
        />
      </div>

      <div className="mt-6">
        <Tabs defaultValue="vendas" className="w-full">
          <TabsList>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="vendas">
            <Card>
              <CardHeader>
                <CardTitle>Relatório de Vendas</CardTitle>
                <CardDescription>
                  Visualize o desempenho de vendas ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="vendas"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="custos"
                        stroke="#82ca9d"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estoque">
            <Card>
              <CardHeader>
                <CardTitle>Movimentação de Estoque</CardTitle>
                <CardDescription>
                  Acompanhe a evolução do estoque ao longo dos meses
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="estoque" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categorias">
            <Card>
              <CardHeader>
                <CardTitle>Produtos por Categoria</CardTitle>
                <CardDescription>
                  Distribuição dos produtos por categoria
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={produtosPorCategoria}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantidade" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Relatorios;
