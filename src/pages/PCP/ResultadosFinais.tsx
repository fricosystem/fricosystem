import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface OrdemProducao {
  id: string;
  ordem_id: string;
  produto: string;
  quantidade: number;
  status: string;
  data_inicio: string;
  data_fim: string;
  turno: string;
  eficiencia: number;
}

interface Produto {
  id: string;
  nome: string;
  codigo: string;
  quantidade_estoque: number;
  lead_time: number;
}

interface ResultadosFinaisProps {
  ordens: OrdemProducao[];
  produtos: Produto[];
}

const ResultadosFinais: React.FC<ResultadosFinaisProps> = ({ ordens, produtos }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Resultados Finais</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Produção Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.570 unidades</div>
            <p className="text-sm text-muted-foreground mt-2">
              Meta: 2.000 unidades (78.5%)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Eficiência Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">78.5%</div>
            <p className="text-sm text-muted-foreground mt-2">
              Meta: 85%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Produtividade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">98.1 unid/h</div>
            <p className="text-sm text-muted-foreground mt-2">
              Meta: 120 unid/h
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Detalhes por Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Eficiência</TableHead>
                <TableHead>Produtividade</TableHead>
                <TableHead className="text-right">Tempo Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { produto: "Produto A", quantidade: 850, eficiencia: 85, produtividade: 105, tempo: "8.1 min" },
                { produto: "Produto B", quantidade: 720, eficiencia: 72, produtividade: 90, tempo: "9.8 min" },
              ].map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.produto}</TableCell>
                  <TableCell>{item.quantidade} unid</TableCell>
                  <TableCell>{item.eficiencia}%</TableCell>
                  <TableCell>{item.produtividade} unid/h</TableCell>
                  <TableCell className="text-right">{item.tempo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultadosFinais;