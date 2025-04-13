
import { useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, Filter, Download, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Requisicao {
  id: string;
  numero: string;
  data: string;
  solicitante: string;
  departamento: string;
  status: "aprovada" | "pendente" | "rejeitada" | "finalizada";
  itens: RequisicaoItem[];
  valorTotal: number;
}

interface RequisicaoItem {
  id: string;
  produtoNome: string;
  quantidade: number;
  valorUnitario: number;
}

// Mock data for requisitions
const mockRequisicoes: Requisicao[] = [
  {
    id: "1",
    numero: "REQ-001",
    data: "2025-04-10",
    solicitante: "João Silva",
    departamento: "Manutenção",
    status: "aprovada",
    valorTotal: 2897.37,
    itens: [
      {
        id: "1",
        produtoNome: "Parafuso 10mm",
        quantidade: 100,
        valorUnitario: 1.599069,
      },
      {
        id: "2",
        produtoNome: "Porca 8mm",
        quantidade: 100,
        valorUnitario: 0.599069,
      },
      {
        id: "3",
        produtoNome: "Arruela 12mm",
        quantidade: 50,
        valorUnitario: 0.299069,
      },
    ],
  },
  {
    id: "2",
    numero: "REQ-002",
    data: "2025-04-11",
    solicitante: "Maria Oliveira",
    departamento: "Produção",
    status: "pendente",
    valorTotal: 1598.37,
    itens: [
      {
        id: "4",
        produtoNome: "Parafuso 8mm",
        quantidade: 50,
        valorUnitario: 1.399069,
      },
      {
        id: "5",
        produtoNome: "Porca 6mm",
        quantidade: 50,
        valorUnitario: 0.499069,
      },
    ],
  },
  {
    id: "3",
    numero: "REQ-003",
    data: "2025-04-12",
    solicitante: "Carlos Santos",
    departamento: "Logística",
    status: "finalizada",
    valorTotal: 5987.45,
    itens: [
      {
        id: "6",
        produtoNome: "Parafuso 12mm",
        quantidade: 200,
        valorUnitario: 1.799069,
      },
      {
        id: "7",
        produtoNome: "Porca 10mm",
        quantidade: 200,
        valorUnitario: 0.699069,
      },
      {
        id: "8",
        produtoNome: "Arruela 15mm",
        quantidade: 100,
        valorUnitario: 0.399069,
      },
    ],
  },
  {
    id: "4",
    numero: "REQ-004",
    data: "2025-04-13",
    solicitante: "Ana Pereira",
    departamento: "Administrativo",
    status: "rejeitada",
    valorTotal: 987.25,
    itens: [
      {
        id: "9",
        produtoNome: "Parafuso 6mm",
        quantidade: 100,
        valorUnitario: 0.989069,
      },
      {
        id: "10",
        produtoNome: "Porca 4mm",
        quantidade: 100,
        valorUnitario: 0.389069,
      },
    ],
  },
];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR").format(date);
};

const getStatusBadge = (status: Requisicao["status"]) => {
  switch (status) {
    case "aprovada":
      return <Badge className="bg-green-500">Aprovada</Badge>;
    case "pendente":
      return <Badge className="bg-yellow-500">Pendente</Badge>;
    case "rejeitada":
      return <Badge className="bg-red-500">Rejeitada</Badge>;
    case "finalizada":
      return <Badge className="bg-blue-500">Finalizada</Badge>;
    default:
      return <Badge>Desconhecido</Badge>;
  }
};

const Requisicoes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequisicao, setSelectedRequisicao] = useState<Requisicao | null>(null);
  const [activeTab, setActiveTab] = useState("todas");

  const filteredRequisicoes = mockRequisicoes.filter((req) => {
    const matchesSearch =
      req.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.departamento.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "todas") return matchesSearch;
    return matchesSearch && req.status === activeTab;
  });

  return (
    <AppLayout title="Requisições">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Requisições</h1>
          <p className="text-muted-foreground">
            Gerencie as requisições de material da empresa
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nova Requisição
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, solicitante ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="aprovada">Aprovadas</TabsTrigger>
          <TabsTrigger value="rejeitada">Rejeitadas</TabsTrigger>
          <TabsTrigger value="finalizada">Finalizadas</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequisicoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Nenhuma requisição encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequisicoes.map((requisicao) => (
                  <TableRow
                    key={requisicao.id}
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => setSelectedRequisicao(requisicao)}
                  >
                    <TableCell className="font-medium">{requisicao.numero}</TableCell>
                    <TableCell>{formatDate(requisicao.data)}</TableCell>
                    <TableCell>{requisicao.solicitante}</TableCell>
                    <TableCell>{requisicao.departamento}</TableCell>
                    <TableCell>{getStatusBadge(requisicao.status)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(requisicao.valorTotal)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedRequisicao && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Detalhes da Requisição {selectedRequisicao.numero}</span>
              {getStatusBadge(selectedRequisicao.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Solicitante</p>
                <p className="font-medium">{selectedRequisicao.solicitante}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departamento</p>
                <p className="font-medium">{selectedRequisicao.departamento}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">{formatDate(selectedRequisicao.data)}</p>
              </div>
            </div>

            <h3 className="font-semibold mb-2">Itens da Requisição</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Valor Unitário</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedRequisicao.itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.produtoNome}</TableCell>
                    <TableCell className="text-right">{item.quantidade}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.valorUnitario)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.quantidade * item.valorUnitario)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(selectedRequisicao.valorTotal)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
};

export default Requisicoes;
