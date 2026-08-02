import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface ProdutoSemClassificacao {
  codigo: string;
  nome: string;
  quantidade_produzida: number;
}

interface AdicionarProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: ProdutoSemClassificacao | null;
  onProdutoAdicionado: () => void;
}

interface NewProduto {
  codigo: string;
  descricao_produto: string;
  maquina: string;
  embalagem: string;
  un_cx: string;
  cx_respectiva: string;
  peso_liq_unit_kg: string;
  batch_receita_kg: string;
  classificacao: string;
}

const AdicionarProdutoModal: React.FC<AdicionarProdutoModalProps> = ({
  isOpen,
  onClose,
  produto,
  onProdutoAdicionado,
}) => {
  const [loading, setLoading] = useState(false);
  const [newProduto, setNewProduto] = useState<NewProduto>({
    codigo: "",
    descricao_produto: "",
    maquina: "",
    embalagem: "",
    un_cx: "",
    cx_respectiva: "",
    peso_liq_unit_kg: "",
    batch_receita_kg: "",
    classificacao: "",
  });

  React.useEffect(() => {
    if (produto) {
      setNewProduto(prev => ({
        ...prev,
        codigo: produto.codigo,
        descricao_produto: produto.nome,
      }));
    }
  }, [produto]);

  const handleAddProduto = async () => {
    if (!newProduto.codigo || !newProduto.descricao_produto) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha pelo menos código e descrição.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const produtoToAdd = {
        codigo: newProduto.codigo,
        descricao_produto: newProduto.descricao_produto,
        maquina: newProduto.maquina,
        embalagem: newProduto.embalagem,
        un_cx: newProduto.un_cx,
        cx_respectiva: newProduto.cx_respectiva,
        peso_liq_unit_kg: newProduto.peso_liq_unit_kg,
        batch_receita_kg: newProduto.batch_receita_kg,
        classificacao: newProduto.classificacao,
        // Campos adicionais do PCP
        produto_id: `prod_${Date.now()}`,
        nome: newProduto.descricao_produto,
        categoria: newProduto.classificacao || "Outros",
        unidade_medida: "kg",
        setor_producao: newProduto.maquina || "",
        meta_diaria: 0,
        meta_semanal: 0,
        meta_mensal: 0,
        custo_producao: 0,
        lead_time_dias: 1,
        quantidade_produzida_total: produto?.quantidade_produzida || 0,
        quantidade_estoque: 0,
        meta_anual: 0,
        ativo: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      await addDoc(collection(db, "PCP_produtos"), produtoToAdd);
      
      toast({
        title: "Produto adicionado",
        description: `Produto ${newProduto.descricao_produto} foi adicionado com sucesso!`,
      });

      onProdutoAdicionado();
      onClose();
      
      // Limpar formulário
      setNewProduto({
        codigo: "",
        descricao_produto: "",
        maquina: "",
        embalagem: "",
        un_cx: "",
        cx_respectiva: "",
        peso_liq_unit_kg: "",
        batch_receita_kg: "",
        classificacao: "",
      });
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Adicionar Novo Produto
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="codigo" className="text-right">
              Código
            </Label>
            <Input
              id="codigo"
              value={newProduto.codigo}
              onChange={(e) => setNewProduto({...newProduto, codigo: e.target.value})}
              className="col-span-3"
              readOnly={!!produto}
              style={produto ? { backgroundColor: 'var(--muted)' } : {}}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="descricao" className="text-right">
              Descrição
            </Label>
            <Input
              id="descricao"
              value={newProduto.descricao_produto}
              onChange={(e) => setNewProduto({...newProduto, descricao_produto: e.target.value})}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maquina" className="text-right">
              Máquina
            </Label>
            <Input
              id="maquina"
              value={newProduto.maquina}
              onChange={(e) => setNewProduto({...newProduto, maquina: e.target.value})}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="embalagem" className="text-right">
              Embalagem
            </Label>
            <Input
              id="embalagem"
              value={newProduto.embalagem}
              onChange={(e) => setNewProduto({...newProduto, embalagem: e.target.value})}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="un_cx" className="text-right">
              UN/CX
            </Label>
            <Input
              id="un_cx"
              value={newProduto.un_cx}
              onChange={(e) => setNewProduto({...newProduto, un_cx: e.target.value})}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cx_respectiva" className="text-right">
              CX Respectiva
            </Label>
            <Input
              id="cx_respectiva"
              value={newProduto.cx_respectiva}
              onChange={(e) => setNewProduto({...newProduto, cx_respectiva: e.target.value})}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="peso" className="text-right">
              Peso Liq Unit (KG)
            </Label>
            <Input
              id="peso"
              value={newProduto.peso_liq_unit_kg}
              onChange={(e) => setNewProduto({...newProduto, peso_liq_unit_kg: e.target.value})}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="batch_kg" className="text-right">
              Batch Receita (KG)
            </Label>
            <Input
              id="batch_kg"
              value={newProduto.batch_receita_kg}
              onChange={(e) => setNewProduto({...newProduto, batch_receita_kg: e.target.value})}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="classificacao" className="text-right">
              Classificação
            </Label>
            <Input
              id="classificacao"
              value={newProduto.classificacao}
              onChange={(e) => setNewProduto({...newProduto, classificacao: e.target.value})}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleAddProduto} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancelar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdicionarProdutoModal;