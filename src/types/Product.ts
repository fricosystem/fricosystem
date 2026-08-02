export interface Product {
  id: string;
  codigo_estoque: string;
  codigo_material: string;
  data_criacao: string;
  data_vencimento: string;
  deposito: string;
  detalhes: string;
  fornecedor_atual: string;
  imagem: string;
  nome: string;
  prateleira: string;
  quantidade: number;
  quantidade_minima: number;
  unidade: string;
  unidade_de_medida: string;
  valor_unitario: number;
}