export interface Usuario {
    id?: string;
    ativo: string;
    nome: string;
    email: string;
    senha?: string;
  }
  
  export interface Produto {
    id: string;
    codigo_material: string;
    codigo_estoque: string;
    nome: string;
    unidade: string;
    unidade_de_medida: string;
    deposito: string;
    quantidade: number;
    quantidade_minima: number;
    detalhes: string;
    imagem: string;
    valor_unitario: number;
    prateleira: string;
    data_vencimento: string;
    dataHora: string;
    fornecedor: string;
    fornecedor_nome: string;
    fornecedor_cnpj: string;
  }
  
  export interface ItemReceita {
    produtoId: string;
    produtoNome: string;
    quantidade: number;
    unidadeMedida: string;
  }
  
  export interface Receita {
    id: string;
    produtoFinalId: string;
    produtoFinalNome: string;
    ingredientes: ItemReceita[];
  }
  
  export interface ItemPlanejamento {
    produtoId: string;
    produtoNome: string;
    quantidadePlanejada: number;
    unidadeMedida: string;
    valorUnitario?: number; // Adicionado valorUnitario para cálculos
    ingredientes: {
      produtoId: string;
      produtoNome: string;
      quantidadeNecessaria: number;
      quantidadeDisponivel: number;
      unidadeMedida: string;
      suficiente: boolean;
    }[];
  }
  
  export interface Planejamento {
    id?: string;
    dataInicio: string;
    dataFim: string;
    responsavel: string;
    itens: ItemPlanejamento[];
    status: 'rascunho' | 'confirmado' | 'em_execucao' | 'concluido' | 'cancelado';
    criadoEm: any;
    atualizadoEm: any;
    metricas?: {
      valorTotal: number;
      comparacaoSemanaAnterior?: number;
      comparacaoMesAnterior?: number;
      comparacaoAnoAnterior?: number;
    };
  }
  
  export interface ProdutoFinal {
    id?: string;
    nome: string;
    codigo: string;
    unidadeMedida: string;
    valorUnitario: number;
    ingredientes: {
      produtoId: string;
      produtoNome: string;
      quantidade: number;
      unidadeMedida: string;
    }[];
    criadoEm: any;
    atualizadoEm: any;
  }
  
  export interface PlanejamentoConcluido {
    id?: string;
    planejamentoId: string;
    data: string;
    produtosFinais: {
      produtoId: string;
      produtoNome: string;
      quantidadeProduzida: number;
      unidadeMedida: string;
      valorTotal: number;
    }[];
    responsavel: string;
    criadoEm: any;
    atualizadoEm: any;
  }
  