import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { 
  calcularMTTR, 
  calcularTaxaConclusao, 
  calcularCustosTotal,
  identificarMaquinasCriticas,
  calcularEficienciaManutentores,
  calcularTendenciaMensal
} from "@/utils/kpisManutencao";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { AlertCircle, Clock, DollarSign, TrendingUp, Wrench, CheckCircle2 } from "lucide-react";
import { ProximosManutentores } from "./ProximosManutentores";

interface DashboardKPIsProps {
  tarefas: TarefaManutencao[];
}

export function DashboardKPIs({ tarefas }: DashboardKPIsProps) {
  const mttr = calcularMTTR(tarefas);
  const taxaConclusao = calcularTaxaConclusao(tarefas);
  const custosTotal = calcularCustosTotal(tarefas);
  const maquinasCriticas = identificarMaquinasCriticas(tarefas, 5);
  const eficienciaManutentores = calcularEficienciaManutentores(tarefas);
  const tendenciaMensal = calcularTendenciaMensal(tarefas, 6);

  const formatarHoras = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  const formatarDinheiro = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="space-y-6">
      {/* Cards de KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTTR Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarHoras(mttr)}</div>
            <p className="text-xs text-muted-foreground">Tempo médio de reparo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaConclusao}%</div>
            <p className="text-xs text-muted-foreground">Tarefas no prazo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarDinheiro(custosTotal)}</div>
            <p className="text-xs text-muted-foreground">Materiais utilizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tarefas.length}</div>
            <p className="text-xs text-muted-foreground">
              {tarefas.filter(t => t.status === "concluida").length} concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Manutentores */}
      <ProximosManutentores tarefas={tarefas} />

      {/* Eficiência dos Manutentores */}
      <Card>
        <CardHeader>
          <CardTitle>Eficiência dos Manutentores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eficienciaManutentores.map((m) => (
              <div key={m.manutentorId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{m.manutentorNome}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.tarefasConcluidas} tarefas concluídas
                  </p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{formatarHoras(m.tempoMedioExecucao)}</p>
                    <p className="text-muted-foreground">Tempo médio</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{m.desvioTempoEstimado}%</p>
                    <p className="text-muted-foreground">Desvio</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{m.taxaSucesso}%</p>
                    <p className="text-muted-foreground">Taxa sucesso</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência de Manutenções (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendenciaMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="Total" />
                <Line type="monotone" dataKey="concluidas" stroke="hsl(var(--chart-2))" name="Concluídas" />
                <Line type="monotone" dataKey="atrasadas" stroke="hsl(var(--destructive))" name="Atrasadas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Máquinas Críticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Top 5 Máquinas Críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={maquinasCriticas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="maquinaNome" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="numeroFalhas" fill="hsl(var(--destructive))" name="Nº Falhas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes das Máquinas Críticas */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes das Máquinas Críticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {maquinasCriticas.map((m) => (
              <div key={m.maquinaId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{m.maquinaNome}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.numeroFalhas} falhas registradas
                  </p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{formatarHoras(m.tempoParadaTotal)}</p>
                    <p className="text-muted-foreground">Tempo parada</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{formatarDinheiro(m.custoTotal)}</p>
                    <p className="text-muted-foreground">Custo total</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
