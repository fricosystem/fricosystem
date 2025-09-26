import { Edit, Trash2, Package } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface Produto {
  id: string;
  codigo_estoque: string;
  codigo_material: string;
  nome: string;
  quantidade: number;
  quantidade_minima: number;
  valor_unitario: number;
  unidade_de_medida: string;
  deposito: string;
  prateleira: string;
  unidade: string;
  detalhes: string;
  imagem: string;
  data_criacao: string;
  data_vencimento: string;
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  fornecedor_cnpj: string | null;
}

interface ProductTableProps {
  produtos: Produto[];
  onEdit: (produto: Produto) => void;
  onDelete: (id: string) => void;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  totalProducts: number;
}

export const ProductTable = ({ 
  produtos, 
  onEdit, 
  onDelete, 
  page, 
  rowsPerPage, 
  onPageChange, 
  totalProducts 
}: ProductTableProps) => {
  const isMobile = useIsMobile();
  const paginatedProdutos = produtos.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalPages = Math.ceil(totalProducts / rowsPerPage);

  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {paginatedProdutos.map((produto) => (
            <Card key={produto.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {produto.imagem ? (
                      <img
                        src={produto.imagem}
                        alt={produto.nome}
                        className="w-16 h-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                        <Package size={24} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-sm truncate">{produto.nome}</h3>
                        <p className="text-xs text-muted-foreground">#{produto.codigo_estoque}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-muted-foreground">Qtd:</span>
                        <span className="ml-1 font-medium">{produto.quantidade}</span>
                        <span className="text-muted-foreground ml-1">(min: {produto.quantidade_minima})</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="ml-1 font-medium">R$ {produto.valor_unitario?.toFixed(2).replace(".", ",") || "0,00"}</span>
                      </div>
                      {produto.fornecedor_nome && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Fornecedor:</span>
                          <span className="ml-1 font-medium text-xs">{produto.fornecedor_nome}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(produto)}
                        className="flex-1 h-8 text-xs"
                      >
                        <Edit size={14} className="mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(produto.id)}
                        className="flex-1 h-8 text-xs"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) onPageChange(page - 1);
                    }}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(pageNum => {
                    const start = Math.max(1, page - 2);
                    const end = Math.min(totalPages, page + 2);
                    return pageNum >= start && pageNum <= end;
                  })
                  .map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onPageChange(pageNum);
                        }}
                        isActive={pageNum === page}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) onPageChange(page + 1);
                    }}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">IMAGEM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">CÓDIGO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">NOME</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">QUANTIDADE</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">VALOR UNIT.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">FORNECEDOR</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {paginatedProdutos.map((produto) => (
              <tr key={produto.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {produto.imagem ? (
                    <img
                      src={produto.imagem}
                      alt={produto.nome}
                      className="w-10 h-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                      <Package size={20} className="text-muted-foreground" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-foreground">
                  {produto.codigo_estoque}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-foreground">{produto.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-foreground">
                  <div>
                    {produto.quantidade}
                    <span className="ml-2 text-xs text-muted-foreground">(min: {produto.quantidade_minima})</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-foreground">
                  R$ {produto.valor_unitario?.toFixed(2).replace(".", ",") || "0,00"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{produto.fornecedor_nome || "-"}</span>
                    {produto.fornecedor_cnpj && (
                      <span className="text-xs text-muted-foreground">
                        CNPJ: {produto.fornecedor_cnpj}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(produto)}
                    >
                      <Edit size={16} className="mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(produto.id)}
                    >
                      <Trash2 size={16} className="mr-1" />
                      Excluir
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) onPageChange(page - 1);
                  }}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(pageNum => {
                  const start = Math.max(1, page - 2);
                  const end = Math.min(totalPages, page + 2);
                  return pageNum >= start && pageNum <= end;
                })
                .map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(pageNum);
                      }}
                      isActive={pageNum === page}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}

              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) onPageChange(page + 1);
                  }}
                  className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
};