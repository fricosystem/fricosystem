import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, History, Ban, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface RelatorioHistorico {
  id: string;
  requisicao_id: string;
  nome_produto: string;
  codigo_material: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  centro_de_custo: string;
  unidade: string;
  solicitante: {
    nome: string;
  };
  usuario: {
    nome: string;
    email: string;
  };
  data_lancamento: string;
  horario_lancamento: string;
  data_registro: any;
  ativo: boolean;
  motivo_desativacao?: string;
  desativado_por?: string;
  data_desativacao?: any;
}

const HistoricoBaixas = () => {
  const { user, userData } = useAuth();
  
  const [historico, setHistorico] = useState<RelatorioHistorico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [mostrarInativos, setMostrarInativos] = useState(false);
  
  // Estado para desativação
  const [itemParaDesativar, setItemParaDesativar] = useState<RelatorioHistorico | null>(null);
  const [motivoDesativacao, setMotivoDesativacao] = useState("");
  const [isDesativando, setIsDesativando] = useState(false);

  // Carregar histórico
  useEffect(() => {
    const carregarHistorico = async () => {
      try {
        setIsLoading(true);
        
        const relatoriosRef = collection(db, "relatorios");
        const q = query(
          relatoriosRef,
          where("unidade", "==", userData?.unidade || ""),
          orderBy("data_registro", "desc")
        );
        
        const snapshot = await getDocs(q);
        const lista: RelatorioHistorico[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          ativo: doc.data().ativo !== false // Default true se não existir
        })) as RelatorioHistorico[];
        
        setHistorico(lista);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userData?.unidade) {
      carregarHistorico();
    }
  }, [userData?.unidade]);

  // Filtrar histórico
  const historicoFiltrado = useMemo(() => {
    let resultado = historico;
    
    // Filtrar por status ativo/inativo
    if (!mostrarInativos) {
      resultado = resultado.filter(item => item.ativo !== false);
    }
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      resultado = resultado.filter(item => 
        item.nome_produto?.toLowerCase().includes(termo) ||
        item.codigo_material?.toLowerCase().includes(termo) ||
        item.requisicao_id?.toLowerCase().includes(termo) ||
        item.solicitante?.nome?.toLowerCase().includes(termo) ||
        item.centro_de_custo?.toLowerCase().includes(termo)
      );
    }
    
    // Filtrar por data
    if (dataInicio) {
      const inicio = format(dataInicio, "yyyy-MM-dd");
      resultado = resultado.filter(item => item.data_lancamento >= inicio);
    }
    
    if (dataFim) {
      const fim = format(dataFim, "yyyy-MM-dd");
      resultado = resultado.filter(item => item.data_lancamento <= fim);
    }
    
    return resultado;
  }, [historico, searchTerm, dataInicio, dataFim, mostrarInativos]);

  // Desativar item
  const desativarItem = async () => {
    if (!itemParaDesativar || !motivoDesativacao.trim()) {
      toast({
        title: "Erro",
        description: "Informe o motivo da desativação",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsDesativando(true);
      
      const docRef = doc(db, "relatorios", itemParaDesativar.id);
      await updateDoc(docRef, {
        ativo: false,
        motivo_desativacao: motivoDesativacao,
        desativado_por: userData?.nome || user?.email || "Usuário não identificado",
        data_desativacao: new Date()
      });
      
      // Atualizar lista local
      setHistorico(prev => prev.map(item => 
        item.id === itemParaDesativar.id 
          ? { 
              ...item, 
              ativo: false, 
              motivo_desativacao: motivoDesativacao,
              desativado_por: userData?.nome || user?.email || "Usuário não identificado"
            }
          : item
      ));
      
      toast({
        title: "Item desativado",
        description: "O registro foi desativado para auditoria"
      });
      
      setItemParaDesativar(null);
      setMotivoDesativacao("");
    } catch (error) {
      console.error("Erro ao desativar item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar o item",
        variant: "destructive"
      });
    } finally {
      setIsDesativando(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const limparFiltros = () => {
    setSearchTerm("");
    setDataInicio(undefined);
    setDataFim(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-card rounded-lg p-4 border space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por produto, código, requisição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Data Início */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dataInicio && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataInicio}
                onSelect={setDataInicio}
                initialFocus
                locale={ptBR}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          {/* Data Fim */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dataFim && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataFim}
                onSelect={setDataFim}
                initialFocus
                locale={ptBR}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          {/* Botões */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={limparFiltros}
              className="flex-1"
            >
              Limpar
            </Button>
            <Button
              variant={mostrarInativos ? "default" : "outline"}
              onClick={() => setMostrarInativos(!mostrarInativos)}
              className="flex-1"
            >
              {mostrarInativos ? "Todos" : "Ativos"}
            </Button>
          </div>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border">
          <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin mb-4" />
          <p className="text-lg text-muted-foreground">Carregando histórico...</p>
        </div>
      ) : historicoFiltrado.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border">
          <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow overflow-hidden">
          {/* Cabeçalho - Desktop */}
          <div className="hidden lg:grid grid-cols-[1fr,2fr,1fr,1fr,1fr,1fr,auto] gap-4 p-4 font-medium border-b bg-muted/20">
            <div>Requisição</div>
            <div>Produto</div>
            <div>Solicitante</div>
            <div>Centro Custo</div>
            <div className="text-right">Valor</div>
            <div>Data</div>
            <div className="w-20 text-center">Ações</div>
          </div>

          {historicoFiltrado.map(item => (
            <div key={item.id} className={cn(
              "border-b last:border-b-0",
              !item.ativo && "bg-destructive/5"
            )}>
              {/* Desktop */}
              <div className="hidden lg:grid grid-cols-[1fr,2fr,1fr,1fr,1fr,1fr,auto] gap-4 p-4 items-center">
                <div>
                  <div className="font-medium">{item.requisicao_id}</div>
                  {!item.ativo && (
                    <Badge variant="destructive" className="mt-1">Desativado</Badge>
                  )}
                </div>
                <div>
                  <div className="font-medium truncate">{item.nome_produto}</div>
                  <div className="text-xs text-muted-foreground">
                    Código: {item.codigo_material || "N/A"} | Qtd: {item.quantidade}
                  </div>
                </div>
                <div className="truncate">{item.solicitante?.nome || "N/A"}</div>
                <div className="truncate">{item.centro_de_custo || "N/A"}</div>
                <div className="text-right">{formatCurrency(item.valor_total || 0)}</div>
                <div>
                  <div>{item.data_lancamento ? format(new Date(item.data_lancamento), "dd/MM/yyyy") : "N/A"}</div>
                  <div className="text-xs text-muted-foreground">{item.horario_lancamento || ""}</div>
                </div>
                <div className="w-20 flex justify-center">
                  {item.ativo && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/20"
                      onClick={() => setItemParaDesativar(item)}
                      title="Desativar registro"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Mobile */}
              <div className="lg:hidden p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{item.requisicao_id}</div>
                    <div className="text-sm text-muted-foreground">{item.nome_produto}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!item.ativo && (
                      <Badge variant="destructive">Desativado</Badge>
                    )}
                    {item.ativo && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setItemParaDesativar(item)}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Solicitante: </span>
                    {item.solicitante?.nome || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Centro: </span>
                    {item.centro_de_custo || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantidade: </span>
                    {item.quantidade}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor: </span>
                    {formatCurrency(item.valor_total || 0)}
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Data: </span>
                    {item.data_lancamento ? format(new Date(item.data_lancamento), "dd/MM/yyyy") : "N/A"} {item.horario_lancamento || ""}
                  </div>
                </div>
                {!item.ativo && item.motivo_desativacao && (
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    <strong>Motivo:</strong> {item.motivo_desativacao}
                    {item.desativado_por && <span className="block">Por: {item.desativado_por}</span>}
                  </div>
                )}
              </div>
              
              {/* Motivo desativação - Desktop */}
              {!item.ativo && item.motivo_desativacao && (
                <div className="hidden lg:block px-4 pb-4">
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    <strong>Motivo da desativação:</strong> {item.motivo_desativacao}
                    {item.desativado_por && <span className="ml-2">| Por: {item.desativado_por}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog de Desativação */}
      <AlertDialog open={!!itemParaDesativar} onOpenChange={() => setItemParaDesativar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a desativar o registro <strong>{itemParaDesativar?.requisicao_id}</strong> do produto <strong>{itemParaDesativar?.nome_produto}</strong>.
              <br /><br />
              Esta ação é para fins de auditoria e o registro não será excluído, apenas marcado como inativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Motivo da desativação <span className="text-destructive">*</span>
            </label>
            <Input 
              placeholder="Informe o motivo..."
              value={motivoDesativacao}
              onChange={(e) => setMotivoDesativacao(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setItemParaDesativar(null);
              setMotivoDesativacao("");
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={desativarItem}
              disabled={isDesativando || !motivoDesativacao.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDesativando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                "Desativar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HistoricoBaixas;
