import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RefreshCw, Calculator, ShoppingBag } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { toast } from "sonner";
import CotacaoModal from "@/components/CotacaoModal";
import { Skeleton } from "@/components/ui/skeleton";

interface Produto {
  id: string;
  nome: string;
  codigo: string;
  valorUnitario: number;
}

const CotacoesOrcamentos = () => {
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProdutos = async () => {
    setLoading(true);
    console.log("Iniciando busca de produtos no Firestore...");
    try {
      const querySnapshot = await getDocs(collection(db, "produtos"));
      console.log("Snapshot recebido. Tamanho:", querySnapshot.size);
      
      const produtosData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Processando produto:", doc.id, data.nome);
        return {
          id: doc.id,
          nome: data.nome || "Sem Nome",
          codigo: data.codigo_estoque || data.codigo_material || "S/C",
          valorUnitario: data.valor_unitario || 0,
        };
      });
      
      setProdutos(produtosData);
      if (produtosData.length === 0) {
        toast.info("A coleção 'produtos' parece estar vazia no banco.");
      }
    } catch (error: any) {
      console.error("Erro detalhado ao buscar produtos:", error);
      toast.error(`Erro ao carregar produtos: ${error.message || "Erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const filteredProdutos = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdatePrice = (productName: string) => {
    setSelectedProduct(productName);
    setIsModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <AppLayout title="Cotações e Orçamentos">
      <div className="space-y-6">
        <Card className="border-slate-800 bg-slate-950/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2 text-cyan-400">
                  <Calculator className="h-6 w-6" />
                  Cotações de Produtos
                </CardTitle>
                <p className="text-slate-400 text-sm mt-1">
                  Busque e atualize valores de produtos usando inteligência artificial baseada em localização.
                </p>
              </div>
              <Button 
                onClick={fetchProdutos} 
                variant="outline" 
                className="border-slate-800 text-slate-300 hover:bg-slate-900"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar Lista
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar por nome ou código do produto..."
                className="pl-10 bg-slate-900 border-slate-800 text-white focus:ring-cyan-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/20">
              <Table>
                <TableHeader className="bg-slate-900/50">
                  <TableRow className="hover:bg-transparent border-slate-800">
                    <TableHead className="text-slate-300">Produto</TableHead>
                    <TableHead className="text-slate-300">Código</TableHead>
                    <TableHead className="text-slate-300">Valor Atual</TableHead>
                    <TableHead className="text-right text-slate-300">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i} className="border-slate-800/50">
                        <TableCell><Skeleton className="h-5 w-40 bg-slate-800" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 bg-slate-800" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 bg-slate-800" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-9 w-32 ml-auto bg-slate-800" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredProdutos.length > 0 ? (
                    filteredProdutos.map((produto) => (
                      <TableRow key={produto.id} className="border-slate-800/50 hover:bg-slate-900/40 transition-colors">
                        <TableCell className="font-medium text-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-cyan-500/10 flex items-center justify-center">
                              <ShoppingBag className="h-4 w-4 text-cyan-400" />
                            </div>
                            {produto.nome}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-400">{produto.codigo}</TableCell>
                        <TableCell className="text-slate-200">{formatCurrency(produto.valorUnitario)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            onClick={() => handleUpdatePrice(produto.nome)}
                            size="sm"
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
                          >
                            <Calculator className="h-4 w-4 mr-2" />
                            Atualizar valor
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                        Nenhum produto encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <CotacaoModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        productName={selectedProduct || ""} 
      />
    </AppLayout>
  );
};

export default CotacoesOrcamentos;
