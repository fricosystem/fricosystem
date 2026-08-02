import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProdutoSemClassificacao {
  codigo: string;
  nome: string;
  quantidade_produzida: number;
}

interface ProdutosSemClassificacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produtos: ProdutoSemClassificacao[];
  onAdicionarProduto: (produto: ProdutoSemClassificacao) => void;
}

const ProdutosSemClassificacaoModal: React.FC<ProdutosSemClassificacaoModalProps> = ({
  isOpen,
  onClose,
  produtos,
  onAdicionarProduto,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-red-500" />
            Produtos Não Cadastrados
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="destructive" className="text-sm">
              {produtos.length} produtos não cadastrados
            </Badge>
          </div>

          <ScrollArea className="h-[400px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome do Produto</TableHead>
                  <TableHead className="text-right">Quantidade Produzida</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((produto, index) => (
                  <TableRow key={`${produto.codigo}-${index}`} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-medium">
                      {produto.codigo}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {produto.nome}
                    </TableCell>
                    <TableCell className="text-right">
                      {produto.quantidade_produzida.toLocaleString()} kg
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAdicionarProduto(produto)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Plus className="h-3 w-3" />
                        Adicionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProdutosSemClassificacaoModal;