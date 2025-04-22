import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CORES = ['#22c55e', '#3b82f6', '#f97316', '#ef4444'];

const Dashboard = () => {
  const [producaoData, setProducaoData] = useState([
    { name: 'Seg', producao: 65 },
    { name: 'Ter', producao: 59 },
    { name: 'Qua', producao: 80 },
    { name: 'Qui', producao: 81 },
    { name: 'Sex', producao: 56 },
    { name: 'Sáb', producao: 40 },
    { name: 'Dom', producao: 20 }
  ]);

  const [statusProducao, setStatusProducao] = useState([
    { name: 'Concluído', value: 68 },
    { name: 'Em Produção', value: 15 },
    { name: 'Pendente', value: 12 },
    { name: 'Com Problemas', value: 5 }
  ]);

  const [indicadoresCards, setIndicadoresCards] = useState([
    { titulo: 'Produção Total', valor: '245 kg', descricao: 'Últimos 7 dias' },
    { titulo: 'Eficiência', valor: '92%', descricao: 'Meta: 90%' },
    { titulo: 'Pedidos Pendentes', valor: '12', descricao: 'Precisa de atenção' },
    { titulo: 'Produtos em Estoque', valor: '28', descricao: 'De 35 produtos totais' }
  ]);

  // Simulação de busca de dados do Firebase
  useEffect(() => {
    // Em um sistema real, aqui teríamos uma chamada para o Firestore
    // const fetchData = async () => {
    //   const producaoRef = collection(db, 'producao');
    //   const producaoSnapshot = await getDocs(producaoRef);
    //   const producaoList = producaoSnapshot.docs.map(doc => doc.data());
    //   // processar dados e atualizar estados
    // };
    // fetchData();
  }, []);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da produção da Fricó Alimentos</p>
      </div>
      
      {/* Cards de indicadores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {indicadoresCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{card.titulo}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.valor}</div>
              <p className="text-xs text-muted-foreground">{card.descricao}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Produção Semanal</CardTitle>
            <CardDescription>Produtos produzidos nos últimos 7 dias (kg)</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={producaoData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="producao" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Status da Produção</CardTitle>
            <CardDescription>Distribuição atual dos pedidos</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusProducao}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusProducao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Semana</CardTitle>
          <CardDescription>Informações relevantes sobre a produção atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Produto mais produzido:</span>
              <span>Iogurte Natural - 42kg</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Eficiência média:</span>
              <span>92% (↑ 3%)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Material mais utilizado:</span>
              <span>Leite Integral - 180L</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Tempo médio de produção:</span>
              <span>3h15min</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
