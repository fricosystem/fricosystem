import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  SearchIcon, 
  RefreshCw, 
  ArrowUpDown, 
  Table, 
  Grid,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  RotateCcw,
  Save
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useProdutos } from "@/hooks/useProdutos";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";
import { collection, doc, updateDoc, addDoc, Timestamp } from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsCard from "@/components/StatsCard";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface InventarioItem {
  id: string;
  codigo_estoque: string;
  nome: string;
  deposito: string;
  prateleira: string;
  quantidade_sistema: number;
  quantidade_contada?: number;
  quantidade_minima: number;
  unidade_de_medida: string;
  valor_unitario: number;
  status_inventario: "pendente" | "contado" | "conferido" | "divergente";
  data_ultima_contagem?: string;
  fornecedor_atual: string;
  imagem: string;
}

const Inventario = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<string>("codigo_estoque-asc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [depositoFilter, setDepositoFilter] = useState<string>("todos");
  const { produtos, loading, error } = useProdutos();
  const { toast } = useToast();
  const { userData } = useAuth();

  // Modal states
  const [isContarModalOpen, setIsContarModalOpen] = useState(false);
  const [itemSendoCotado, setItemSendoCotado] = useState<InventarioItem | null>(null);
  const [quantidadeContada, setQuantidadeContada] = useState("");
  const [isSalvarContagemModalOpen, setIsSalvarContagemModalOpen] = useState(false);

  const [inventarioItems, setInventarioItems] = useState<InventarioItem[]>([]);
  const [stats, setStats] = useState({
    totalItens: 0,
    itensPendentes: 0,
    itensContados: 0,
    itensDivergentes: 0,
    precisaoInventario: 0
  });

  // Convert produtos to inventario items
  useEffect(() => {
    if (produtos && produtos.length > 0) {
      const items = produtos.map(produto => ({
        id: produto.id,
        codigo_estoque: produto.codigo_estoque,
        nome: produto.nome,
        deposito: produto.deposito,
        prateleira: produto.prateleira,
        quantidade_sistema: produto.quantidade,
        quantidade_minima: produto.quantidade_minima,
        unidade_de_medida: produto.unidade_de_medida || produto.unidade,
        valor_unitario: produto.valor_unitario,
        status_inventario: "pendente" as const,
        fornecedor_atual: produto.fornecedor_atual,
        imagem: produto.imagem,
      }));
      
      setInventarioItems(items);
      
      // Calculate stats
      const totalItens = items.length;
      const statusCounts = items.reduce((acc, item) => {
        acc[item.status_inventario] = (acc[item.status_inventario] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const itensPendentes = statusCounts["pendente"] || 0;
      const itensContados = (statusCounts["contado"] || 0) + (statusCounts["conferido"] || 0);
      const itensDivergentes = statusCounts["divergente"] || 0;
      const precisaoInventario = totalItens > 0 ? ((itensContados / totalItens) * 100) : 0;

      setStats({
        totalItens,
        itensPendentes,
        itensContados,
        itensDivergentes,
        precisaoInventario
      });
    }
  }, [produtos]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { label: "Pendente", variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
      contado: { label: "Contado", variant: "secondary" as const, className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
      conferido: { label: "Conferido", variant: "secondary" as const, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
      divergente: { label: "Divergente", variant: "secondary" as const, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const sortItems = (items: InventarioItem[]): InventarioItem[] => {
    const [field, order] = sortOption.split('-');
    
    return [...items].sort((a, b) => {
      const valueA = a[field as keyof InventarioItem] || '';
      const valueB = b[field as keyof InventarioItem] || '';
      
      if (field === 'valor_unitario' || field === 'quantidade_sistema') {
        return order === 'asc' 
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number);
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return order === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      return 0;
    });
  };

  const filteredItems = inventarioItems
    ? sortItems(inventarioItems.filter((item) => {
        const termoBusca = searchTerm.toLowerCase();
        const matchesSearch = (
          item.nome.toLowerCase().includes(termoBusca) ||
          item.codigo_estoque.toLowerCase().includes(termoBusca) ||
          item.deposito.toLowerCase().includes(termoBusca) ||
          item.prateleira.toLowerCase().includes(termoBusca)
        );
        
        const matchesStatus = statusFilter === "todos" || item.status_inventario === statusFilter;
        const matchesDeposito = depositoFilter === "todos" || item.deposito === depositoFilter;
        
        return matchesSearch && matchesStatus && matchesDeposito;
      }))
    : [];

  const depositos = Array.from(new Set(inventarioItems.map(item => item.deposito))).filter(Boolean);

  const abrirModalContar = (item: InventarioItem) => {
    setItemSendoCotado(item);
    setQuantidadeContada(item.quantidade_sistema.toString());
    setIsContarModalOpen(true);
  };

  const handleContarItem = (itemId: string, quantidadeContada: number) => {
    setInventarioItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const isDivergente = Math.abs(quantidadeContada - item.quantidade_sistema) > 0;
        return {
          ...item,
          quantidade_contada: quantidadeContada,
          status_inventario: isDivergente ? "divergente" as const : "conferido" as const,
          data_ultima_contagem: new Date().toISOString()
        };
      }
      return item;
    }));

    setIsContarModalOpen(false);
    setItemSendoCotado(null);
    setQuantidadeContada("");

    toast({
      title: "Item contado",
      description: "A contagem foi registrada com sucesso.",
    });
  };

  const exportarInventario = () => {
    // Função para exportar dados do inventário
    toast({
      title: "Exportando inventário",
      description: "Os dados do inventário serão exportados em breve.",
    });
  };

  const zerarContagem = () => {
    setInventarioItems(prev => prev.map(item => ({
      ...item,
      quantidade_contada: undefined,
      status_inventario: "pendente" as const,
      data_ultima_contagem: undefined
    })));

    toast({
      title: "Contagem zerada",
      description: "Todas as contagens foram removidas.",
    });
  };

  const handleSalvarContagem = () => {
    const itensContados = inventarioItems.filter(item => item.quantidade_contada !== undefined);
    
    if (itensContados.length === 0) {
      toast({
        title: "Nenhuma contagem encontrada",
        description: "Não há itens contados para salvar.",
        variant: "destructive",
      });
      return;
    }

    setIsSalvarContagemModalOpen(true);
  };

  const confirmarSalvarContagem = async () => {
    const itensContados = inventarioItems.filter(item => item.quantidade_contada !== undefined);
    
    if (itensContados.length === 0) {
      toast({
        title: "Nenhuma contagem encontrada",
        description: "Não há itens contados para salvar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Atualizar cada produto no banco de dados e salvar relatório
      for (const item of itensContados) {
        if (item.quantidade_contada !== undefined && item.id) {
          // Atualizar quantidade do produto
          await updateDoc(doc(db, "produtos", item.id), {
            quantidade: item.quantidade_contada
          });

          // Determinar se foi entrada ou saída
          const diferenca = item.quantidade_contada - item.quantidade_sistema;
          const status = diferenca >= 0 ? "entrada" : "saida";
          const quantidadeMovimento = Math.abs(diferenca);

          // Salvar relatório apenas se houve diferença
          if (diferenca !== 0) {
            const relatorioData = {
              requisicao_id: item.id,
              produto_id: item.id,
              codigo_material: item.codigo_estoque,
              nome_produto: item.nome,
              quantidade: quantidadeMovimento,
              valor_unitario: item.valor_unitario || 0,
              valor_total: (item.valor_unitario || 0) * quantidadeMovimento,
              status: status,
              tipo: "Inventário",
              solicitante: {
                id: userData?.id || 'system',
                nome: userData?.nome || 'Sistema',
                cargo: userData?.cargo || 'Administrador'
              },
              usuario: {
                id: userData?.id || 'system',
                nome: userData?.nome || 'Sistema',
                email: userData?.email || 'sistema@empresa.com'
              },
              deposito: item.deposito,
              prateleira: item.prateleira || "Não endereçado",
              centro_de_custo: item.deposito,
              unidade: item.unidade_de_medida || 'UN',
              data_saida: Timestamp.fromDate(new Date()),
              data_registro: Timestamp.fromDate(new Date())
            };

            // Adicionar o relatório do inventário
            await addDoc(collection(db, "relatorios"), relatorioData);
          }
        }
      }
      
      toast({
        title: "Contagem salva",
        description: `${itensContados.length} itens tiveram seus estoques atualizados com sucesso.`,
      });

      // Atualizar estado local para refletir as mudanças
      setInventarioItems(prev => prev.map(item => {
        if (item.quantidade_contada !== undefined) {
          return {
            ...item,
            quantidade_sistema: item.quantidade_contada,
            status_inventario: "conferido" as const
          };
        }
        return item;
      }));

    } catch (error) {
      console.error("Erro ao salvar contagem:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a contagem do inventário.",
        variant: "destructive",
      });
    }

    setIsSalvarContagemModalOpen(false);
  };

  return (
    <AppLayout title="Inventário">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total de Itens"
            value={stats.totalItens}
            icon={<Package className="h-5 w-5" />}
            className="bg-blue-50 dark:bg-blue-950"
          />
          <StatsCard
            title="Pendentes"
            value={stats.itensPendentes}
            icon={<Clock className="h-5 w-5" />}
            className="bg-yellow-50 dark:bg-yellow-950"
          />
          <StatsCard
            title="Contados"
            value={stats.itensContados}
            icon={<CheckCircle className="h-5 w-5" />}
            className="bg-green-50 dark:bg-green-950"
          />
          <StatsCard
            title="Divergentes"
            value={stats.itensDivergentes}
            icon={<AlertTriangle className="h-5 w-5" />}
            className="bg-red-50 dark:bg-red-950"
          />
          <StatsCard
            title="Precisão"
            value={`${stats.precisaoInventario.toFixed(1)}%`}
            icon={<CheckCircle className="h-5 w-5" />}
            className="bg-green-50 dark:bg-green-950"
          />
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Buscar por código, nome, depósito ou prateleira..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <SearchIcon className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              
              <div className="flex flex-col md:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="contado">Contado</SelectItem>
                    <SelectItem value="conferido">Conferido</SelectItem>
                    <SelectItem value="divergente">Divergente</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={depositoFilter} onValueChange={setDepositoFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Depósito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Depósitos</SelectItem>
                    {depositos.map((deposito) => (
                      <SelectItem key={deposito} value={deposito}>
                        {deposito}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="w-full md:w-48">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      <SelectValue placeholder="Ordenar por" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="codigo_estoque-asc">Código (A-Z)</SelectItem>
                    <SelectItem value="codigo_estoque-desc">Código (Z-A)</SelectItem>
                    <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
                    <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
                    <SelectItem value="deposito-asc">Depósito (A-Z)</SelectItem>
                    <SelectItem value="valor_unitario-desc">Maior Valor</SelectItem>
                    <SelectItem value="quantidade_sistema-desc">Maior Estoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.location.reload()}
              title="Atualizar dados"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Alternar visualização">
                  {viewMode === "cards" ? <Grid className="h-4 w-4" /> : <Table className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setViewMode("cards")}>
                  <Grid className="h-4 w-4 mr-2" />
                  Visualização em Cards
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode("table")}>
                  <Table className="h-4 w-4 mr-2" />
                  Visualização em Tabela
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={zerarContagem} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Zerar contagem
            </Button>
            
            <Button onClick={handleSalvarContagem} variant="outline" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar contagem
            </Button>

            <Button onClick={exportarInventario} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Inventário
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Erro ao carregar dados: {error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {viewMode === "table" ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-md border overflow-x-auto">
                    <ShadcnTable>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Depósito</TableHead>
                          <TableHead>Prateleira</TableHead>
                          <TableHead>Qtd. Sistema</TableHead>
                          <TableHead>Qtd. Contada</TableHead>
                          <TableHead>Divergência</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => {
                          const divergencia = item.quantidade_contada !== undefined 
                            ? item.quantidade_contada - item.quantidade_sistema 
                            : null;
                          
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.codigo_estoque}</TableCell>
                              <TableCell>{item.nome}</TableCell>
                              <TableCell>{item.deposito}</TableCell>
                              <TableCell>{item.prateleira}</TableCell>
                              <TableCell>{item.quantidade_sistema} {item.unidade_de_medida}</TableCell>
                              <TableCell>
                                {item.quantidade_contada !== undefined 
                                  ? `${item.quantidade_contada} ${item.unidade_de_medida}` 
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {divergencia !== null ? (
                                  <span className={divergencia === 0 ? "text-green-600" : "text-red-600"}>
                                    {divergencia > 0 ? "+" : ""}{divergencia}
                                  </span>
                                ) : "-"}
                              </TableCell>
                              <TableCell>{getStatusBadge(item.status_inventario)}</TableCell>
                              <TableCell>
                                {item.status_inventario === "pendente" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => abrirModalContar(item)}
                                  >
                                    Contar
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </ShadcnTable>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{item.codigo_estoque}</CardTitle>
                          <p className="text-sm text-muted-foreground">{item.nome}</p>
                        </div>
                        {getStatusBadge(item.status_inventario)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Depósito:</span>
                          <span className="font-medium">{item.deposito}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Prateleira:</span>
                          <span className="font-medium">{item.prateleira}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Qtd. Sistema:</span>
                          <span className="font-medium">{item.quantidade_sistema} {item.unidade_de_medida}</span>
                        </div>
                        {item.quantidade_contada !== undefined && (
                          <>
                            <div className="flex justify-between">
                              <span>Qtd. Contada:</span>
                              <span className="font-medium">{item.quantidade_contada} {item.unidade_de_medida}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Divergência:</span>
                              <span className={`font-medium ${
                                item.quantidade_contada - item.quantidade_sistema === 0 
                                  ? "text-green-600" 
                                  : "text-red-600"
                              }`}>
                                {item.quantidade_contada - item.quantidade_sistema}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span>Valor Unit.:</span>
                          <span className="font-medium">{formatCurrency(item.valor_unitario)}</span>
                        </div>
                      </div>
                      
                      {item.status_inventario === "pendente" && (
                        <div className="mt-4">
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => abrirModalContar(item)}
                          >
                            Contar Item
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {filteredItems.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2" />
                    <p>Nenhum item encontrado com os filtros aplicados.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Modal de Contagem */}
        <Dialog open={isContarModalOpen} onOpenChange={setIsContarModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Contar Item</DialogTitle>
            </DialogHeader>
            
            {itemSendoCotado && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-sm">{itemSendoCotado.codigo_estoque}</h4>
                  <p className="text-sm text-muted-foreground">{itemSendoCotado.nome}</p>
                  <div className="flex justify-between text-xs mt-2">
                    <span>Depósito: {itemSendoCotado.deposito}</span>
                    <span>Prateleira: {itemSendoCotado.prateleira}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">
                      Qtd. Sistema: {itemSendoCotado.quantidade_sistema} {itemSendoCotado.unidade_de_medida}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade Contada</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="quantidade"
                      type="number"
                      value={quantidadeContada}
                      onChange={(e) => setQuantidadeContada(e.target.value)}
                      placeholder="Digite a quantidade contada"
                      className="flex-1"
                      min="0"
                      step="1"
                    />
                    <span className="text-sm text-muted-foreground min-w-fit">
                      {itemSendoCotado.unidade_de_medida}
                    </span>
                  </div>
                </div>

                {quantidadeContada && !isNaN(Number(quantidadeContada)) && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Divergência:</span>
                      <span className={`font-medium ${
                        Number(quantidadeContada) - itemSendoCotado.quantidade_sistema === 0 
                          ? "text-green-600" 
                          : "text-red-600"
                      }`}>
                        {Number(quantidadeContada) - itemSendoCotado.quantidade_sistema > 0 ? "+" : ""}
                        {Number(quantidadeContada) - itemSendoCotado.quantidade_sistema}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsContarModalOpen(false);
                  setItemSendoCotado(null);
                  setQuantidadeContada("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const qtd = Number(quantidadeContada);
                  if (!isNaN(qtd) && qtd >= 0 && itemSendoCotado) {
                    handleContarItem(itemSendoCotado.id, qtd);
                  } else {
                    toast({
                      title: "Erro",
                      description: "Digite uma quantidade válida.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!quantidadeContada || isNaN(Number(quantidadeContada)) || Number(quantidadeContada) < 0}
              >
                Confirmar Contagem
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação para Salvar Contagem */}
        <Dialog open={isSalvarContagemModalOpen} onOpenChange={setIsSalvarContagemModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Salvamento</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-yellow-800 dark:text-yellow-200">
                      Atenção!
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Esta ação irá atualizar as quantidades no estoque de acordo com as contagens realizadas.
                      As divergências serão aplicadas incrementando ou diminuindo as quantidades dos produtos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Resumo da operação:</h4>
                <div className="text-sm text-muted-foreground">
                  <p>• Itens com contagem serão atualizados no estoque</p>
                  <p>• Quantidades divergentes serão ajustadas</p>
                  <p>• Esta operação não pode ser desfeita</p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsSalvarContagemModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarSalvarContagem}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Confirmar Salvamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Inventario;