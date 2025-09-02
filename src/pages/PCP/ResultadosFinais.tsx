import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/components/ui/use-toast";

interface Produto {
  id: string;
  batch_receita_kg: string;
  batch_receita_un: string;
  classificacao: string;
  codigo: string;
  cx_respectiva: string;
  descricao_produto: string;
  embalagem: string;
  maquina: string;
  peso_liq_unit_kg: string;
  un_cx: string;
}

interface ProcessamentoData {
  id: string;
  dataProcessamento: string;
  turnosProcessados: string[];
  kgTotal: number;
  kgTurno1: number;
  kgTurno2: number;
  planejadoTurno1: number;
  planejadoTurno2: number;
  planoDiario: number;
  timestamp: Date;
}

interface ProdutoProcessado {
  classificacao: string;
  produtos: {
    descricao: string;
    codigo: string;
    kgTotal: number;
    kgTurno1: number;
    kgTurno2: number;
    planejadoTurno1: number;
    planejadoTurno2: number;
    planoDiario: number;
  }[];
}

const ResultadosFinais: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [processamentos, setProcessamentos] = useState<ProcessamentoData[]>([]);
  const [produtosProcessados, setProdutosProcessados] = useState<ProdutoProcessado[]>([]);
  const [expandedClassificacao, setExpandedClassificacao] = useState<string | null>(null);
  const { toast } = useToast();

  // Cache para documentos já carregados
  const [documentCache, setDocumentCache] = useState<Record<string, any>>({});

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Função para normalizar códigos
  const normalizeCode = (code: string | undefined): string => {
    return (code || "").trim().toLowerCase();
  };

  // Função para match melhorado de produtos
  const isProductMatch = (produtoItem: any, produto: Produto): boolean => {
    const itemCodigo = normalizeCode(produtoItem.codigo);
    const produtoCodigo = normalizeCode(produto.codigo);
    
    // Prioridade 1: Match exato por código
    if (itemCodigo && produtoCodigo && itemCodigo === produtoCodigo) {
      return true;
    }
    
    // Prioridade 2: Match por descrição (mais restritivo)
    if (produtoItem.texto_breve && produto.descricao_produto) {
      const textoBreve = produtoItem.texto_breve.toLowerCase().trim();
      const descricao = produto.descricao_produto.toLowerCase().trim();
      return textoBreve.includes(descricao) || descricao.includes(textoBreve);
    }
    
    return false;
  };

  // Função para carregar documento com cache
  const getDocumentWithCache = async (docId: string) => {
    if (documentCache[docId]) {
      return documentCache[docId];
    }
    
    try {
      const docRef = doc(db, "PCP", docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDocumentCache(prev => ({ ...prev, [docId]: data }));
        return data;
      }
    } catch (error) {
      console.error(`Erro ao carregar documento ${docId}:`, error);
    }
    return null;
  };

  const loadProdutos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "PCP_produtos"));
      const produtosData: Produto[] = [];
      querySnapshot.forEach((doc) => {
        produtosData.push({
          id: doc.id,
          ...doc.data()
        } as Produto);
      });
      setProdutos(produtosData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos",
        variant: "destructive",
      });
    }
  };

  const loadProcessamentos = async () => {
    try {
      const processamentosCollection = collection(db, "PCP");
      const q = query(processamentosCollection, orderBy("Processamento.timestamp", "desc"));
      const querySnapshot = await getDocs(q);

      const processamentosData: ProcessamentoData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data().Processamento;
        if (data) {
          processamentosData.push({
            id: doc.id,
            dataProcessamento: data.dataProcessamento,
            turnosProcessados: data.turnosProcessados,
            kgTotal: data.kgTotal || 0,
            kgTurno1: data.kgTurno1 || 0,
            kgTurno2: data.kgTurno2 || 0,
            planejadoTurno1: data.planejadoTurno1 || 0,
            planejadoTurno2: data.planejadoTurno2 || 0,
            planoDiario: data.planoDiario || 0,
            timestamp: data.timestamp.toDate()
          });
        }
      });
      setProcessamentos(processamentosData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar processamentos",
        variant: "destructive",
      });
    }
  };

  const mergeProdutosProcessados = async () => {
    try {
      console.log("🔄 Iniciando merge de produtos processados...");
      
      // Validar dados básicos
      const produtosSemClassificacao = produtos.filter(p => !p.classificacao || p.classificacao.trim() === "");
      if (produtosSemClassificacao.length > 0) {
        console.warn("⚠️ Produtos sem classificação encontrados:", produtosSemClassificacao.length);
      }

      const classificacoes = [...new Set(produtos.map(p => p.classificacao).filter(Boolean))];
      console.log(`📊 Total de classificações encontradas: ${classificacoes.length}`, classificacoes);
      
      const mergedData: ProdutoProcessado[] = [];
      let totalProdutosProcessados = 0;
      let produtosSemMatch = 0;

      for (const classificacao of classificacoes) {
        const produtosDaClassificacao = produtos.filter(p => p.classificacao === classificacao);
        console.log(`🏷️ Processando classificação "${classificacao}" com ${produtosDaClassificacao.length} produtos`);
        
        const produtosProcessadosData: {
          descricao: string;
          codigo: string;
          kgTotal: number;
          kgTurno1: number;
          kgTurno2: number;
          planejadoTurno1: number;
          planejadoTurno2: number;
          planoDiario: number;
        }[] = [];

        for (const produto of produtosDaClassificacao) {
          // Usar cache para reduzir consultas ao Firestore
          const processamentosComProduto = await Promise.all(
            processamentos.map(async (processamento) => {
              const docData = await getDocumentWithCache(processamento.id);
              if (!docData) return null;

              const turno1 = docData["1 Turno"] || [];
              const turno2 = docData["2 Turno"] || [];
              
              // Usar função melhorada de match
              const produtoNoTurno1 = turno1.find((item: any) => isProductMatch(item, produto));
              const produtoNoTurno2 = turno2.find((item: any) => isProductMatch(item, produto));

              if (produtoNoTurno1 || produtoNoTurno2) {
                // Debug: log successful matches
                if (produtoNoTurno1) {
                  console.log(`✅ Match T1 - ${produto.codigo}: ${produtoNoTurno1.codigo} (${produtoNoTurno1.kg}kg)`);
                }
                if (produtoNoTurno2) {
                  console.log(`✅ Match T2 - ${produto.codigo}: ${produtoNoTurno2.codigo} (${produtoNoTurno2.kg}kg)`);
                }

                return {
                  kgTotal: (parseFloat(produtoNoTurno1?.kg || "0") + parseFloat(produtoNoTurno2?.kg || "0")),
                  kgTurno1: parseFloat(produtoNoTurno1?.kg || "0"),
                  kgTurno2: parseFloat(produtoNoTurno2?.kg || "0"),
                  planejadoTurno1: parseFloat(produtoNoTurno1?.planejamento || "0"),
                  planejadoTurno2: parseFloat(produtoNoTurno2?.planejamento || "0"),
                  planoDiario: (parseFloat(produtoNoTurno1?.planejamento || "0") + 
                              parseFloat(produtoNoTurno2?.planejamento || "0"))
                };
              }
              return null;
            })
          );

          // Somar todos os processamentos encontrados para este produto
          const validProcessamentos = processamentosComProduto.filter(Boolean);
          const total = validProcessamentos.reduce((acc, curr) => ({
            kgTotal: acc.kgTotal + (curr?.kgTotal || 0),
            kgTurno1: acc.kgTurno1 + (curr?.kgTurno1 || 0),
            kgTurno2: acc.kgTurno2 + (curr?.kgTurno2 || 0),
            planejadoTurno1: acc.planejadoTurno1 + (curr?.planejadoTurno1 || 0),
            planejadoTurno2: acc.planejadoTurno2 + (curr?.planejadoTurno2 || 0),
            planoDiario: acc.planoDiario + (curr?.planoDiario || 0)
          }), {
            kgTotal: 0,
            kgTurno1: 0,
            kgTurno2: 0,
            planejadoTurno1: 0,
            planejadoTurno2: 0,
            planoDiario: 0
          });

          if (total.kgTotal > 0) {
            produtosProcessadosData.push({
              descricao: produto.descricao_produto,
              codigo: produto.codigo,
              ...total
            });
            totalProdutosProcessados++;
          } else {
            // Debug: produtos sem match
            console.warn(`❌ Produto sem match: ${produto.codigo} - ${produto.descricao_produto}`);
            produtosSemMatch++;
          }
        }

        if (produtosProcessadosData.length > 0) {
          mergedData.push({
            classificacao,
            produtos: produtosProcessadosData
          });
        }
      }

      // Logs de resumo
      console.log(`📈 Resumo do processamento:
        - Produtos processados: ${totalProdutosProcessados}
        - Produtos sem match: ${produtosSemMatch}
        - Classificações com dados: ${mergedData.length}
        - Cache hits: ${Object.keys(documentCache).length} documentos`);

      setProdutosProcessados(mergedData);
    } catch (error) {
      console.error("❌ Erro ao mesclar dados de produção:", error);
      toast({
        title: "Erro",
        description: "Falha ao mesclar dados de produção",
        variant: "destructive",
      });
    }
  };

  const toggleClassificacao = (classificacao: string) => {
    setExpandedClassificacao(expandedClassificacao === classificacao ? null : classificacao);
  };

  useEffect(() => {
    loadProdutos();
    loadProcessamentos();
  }, []);

  useEffect(() => {
    if (produtos.length > 0 && processamentos.length > 0) {
      mergeProdutosProcessados();
    }
  }, [produtos, processamentos]);

  const filteredClassificacoes = produtosProcessados.filter(pp => 
    pp.classificacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pp.produtos.some(p => 
      p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Resultados Finais</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Produção Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(produtosProcessados.reduce((sum, pp) => 
                sum + pp.produtos.reduce((prodSum, p) => prodSum + p.kgTotal, 0), 0))} kg
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Eficiência Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {produtosProcessados.length > 0 
                ? formatNumber(produtosProcessados.reduce((sum, pp) => {
                    const classificacaoTotal = pp.produtos.reduce((prodSum, p) => ({
                      produzido: prodSum.produzido + p.kgTotal,
                      planejado: prodSum.planejado + p.planoDiario
                    }), { produzido: 0, planejado: 0 });
                    
                    return sum + (classificacaoTotal.planejado > 0 
                      ? (classificacaoTotal.produzido / classificacaoTotal.planejado) * 100 
                      : 0);
                  }, 0) / produtosProcessados.length) + '%'
                : '0%'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Produtos Processados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {produtosProcessados.reduce((sum, pp) => sum + pp.produtos.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Produção por Família de Produto</span>
            <div className="relative w-full max-w-md">
              <Input
                placeholder="Buscar por classificação ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classificação</TableHead>
                <TableHead>Total Produzido</TableHead>
                <TableHead>Planejado</TableHead>
                <TableHead>Diferença</TableHead>
                <TableHead>Eficiência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClassificacoes.map((pp) => (
                <React.Fragment key={pp.classificacao}>
                  <TableRow 
                    className="cursor-pointer"
                    onClick={() => toggleClassificacao(pp.classificacao)}
                  >
                    <TableCell className="font-medium">{pp.classificacao}</TableCell>
                    <TableCell>
                      {formatNumber(pp.produtos.reduce((sum, p) => sum + p.kgTotal, 0))} kg
                    </TableCell>
                    <TableCell>
                      {formatNumber(pp.produtos.reduce((sum, p) => sum + p.planoDiario, 0))} kg
                    </TableCell>
                    <TableCell>
                      <span className={
                        pp.produtos.reduce((sum, p) => sum + (p.kgTotal - p.planoDiario), 0) >= 0 
                          ? "text-green-600" 
                          : "text-red-600"
                      }>
                        {formatNumber(pp.produtos.reduce((sum, p) => sum + (p.kgTotal - p.planoDiario), 0))} kg
                      </span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const totalProduzido = pp.produtos.reduce((sum, p) => sum + p.kgTotal, 0);
                        const totalPlanejado = pp.produtos.reduce((sum, p) => sum + p.planoDiario, 0);
                        return formatNumber(totalPlanejado > 0 ? (totalProduzido / totalPlanejado) * 100 : 0) + '%';
                      })()}
                    </TableCell>
                  </TableRow>
                  
                  {expandedClassificacao === pp.classificacao && (
                    <>
                      {pp.produtos.map((produto, idx) => (
                        <TableRow key={`${pp.classificacao}-${produto.codigo}`} className="">
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{produto.codigo}</span>
                              <Separator orientation="vertical" className="h-4" />
                              <span>{produto.descricao}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatNumber(produto.kgTotal)} kg</TableCell>
                          <TableCell>{formatNumber(produto.planoDiario)} kg</TableCell>
                          <TableCell>
                            <span className={produto.kgTotal - produto.planoDiario >= 0 ? "text-green-600" : "text-red-600"}>
                              {formatNumber(produto.kgTotal - produto.planoDiario)} kg
                            </span>
                          </TableCell>
                          <TableCell>
                            {formatNumber(produto.planoDiario > 0 ? (produto.kgTotal / produto.planoDiario) * 100 : 0)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      <TableRow className="font-medium">
                        <TableCell className="pl-8">Detalhes por Turno</TableCell>
                        <TableCell colSpan={4}>
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">1° Turno</p>
                              <p>{formatNumber(pp.produtos.reduce((sum, p) => sum + p.kgTurno1, 0))} kg</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">2° Turno</p>
                              <p>{formatNumber(pp.produtos.reduce((sum, p) => sum + p.kgTurno2, 0))} kg</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Planejado 1°</p>
                              <p>{formatNumber(pp.produtos.reduce((sum, p) => sum + p.planejadoTurno1, 0))} kg</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Planejado 2°</p>
                              <p>{formatNumber(pp.produtos.reduce((sum, p) => sum + p.planejadoTurno2, 0))} kg</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultadosFinais;