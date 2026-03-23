/**
 * Loader dinamico de documentacao por pagina
 * Permite carregar apenas a documentacao necessaria para a pagina atual
 */

// Mapeamento de rotas para arquivos de documentacao
const pageDocMap: Record<string, () => Promise<string>> = {
  // Principal
  '/dashboard': () => import('./Dashboard.md?raw').then(m => m.default),
  
  // Estoque
  '/produtos': () => import('./Produtos.md?raw').then(m => m.default),
  '/inventario': () => import('./Inventario.md?raw').then(m => m.default),
  '/inventario-ciclico': () => import('./InventarioCiclico.md?raw').then(m => m.default),
  '/entrada-manual': () => import('./EntradaManual.md?raw').then(m => m.default),
  '/notas-fiscais': () => import('./NotasFiscais.md?raw').then(m => m.default),
  '/transferencia': () => import('./Transferencia.md?raw').then(m => m.default),
  '/enderecamento': () => import('./Enderecamento.md?raw').then(m => m.default),
  '/medida-de-lenha': () => import('./MedidaLenha.md?raw').then(m => m.default),
  '/baixa-requisicao': () => import('./BaixaRequisicao.md?raw').then(m => m.default),
  '/relatorios': () => import('./Relatorios.md?raw').then(m => m.default),
  
  // Manutencao
  '/dashboard-manutencao': () => import('./DashboardManutencao.md?raw').then(m => m.default),
  '/maquinas': () => import('./Maquinas.md?raw').then(m => m.default),
  '/manutencao-preventiva': () => import('./ManutencaoPreventiva.md?raw').then(m => m.default),
  '/execucao-manutencao': () => import('./ExecucaoManutencao.md?raw').then(m => m.default),
  '/parada-maquina': () => import('./ParadaMaquina.md?raw').then(m => m.default),
  '/ordens-servico': () => import('./OrdensServico.md?raw').then(m => m.default),
  
  // Requisicoes
  '/requisicoes': () => import('./Requisicoes.md?raw').then(m => m.default),
  '/carrinho': () => import('./Carrinho.md?raw').then(m => m.default),
  '/devolucao': () => import('./Devolucao.md?raw').then(m => m.default),
  
  // Fornecedores
  '/fornecedor-produtos': () => import('./OrdensCompra.md?raw').then(m => m.default),
  
  // Compras
  '/compras': () => import('./Compras.md?raw').then(m => m.default),
  
  // Financeiro
  '/notas-fiscais-lancamento': () => import('./NotasFiscaisLancamento.md?raw').then(m => m.default),
  '/centro-custo': () => import('./CentroCusto.md?raw').then(m => m.default),
  
  // Utilitarios
  '/importar-planilha': () => import('./ImportarPlanilha.md?raw').then(m => m.default),
  
  // Producao
  '/pcp': () => import('./PCP.md?raw').then(m => m.default),
  
  // Comunicacao
  '/chat': () => import('./Chat.md?raw').then(m => m.default),
  '/email': () => import('./Email.md?raw').then(m => m.default),
  '/reunioes': () => import('./Reunioes.md?raw').then(m => m.default),
  
  // Manuais
  '/manuais': () => import('./Manuais.md?raw').then(m => m.default),
  
  // Administrativo
  '/gestao-usuarios': () => import('./GestaoUsuarios.md?raw').then(m => m.default),
  '/gestao-perfis': () => import('./GestaoPerfis.md?raw').then(m => m.default),
  '/gestao-produtos': () => import('./GestaoProdutos.md?raw').then(m => m.default),
  '/unidades': () => import('./Unidades.md?raw').then(m => m.default),
  '/gestao-manutencao': () => import('./GestaoManutencao.md?raw').then(m => m.default),
  '/gestao-fornecedores': () => import('./GestaoFornecedores.md?raw').then(m => m.default),
  '/gestao-tarefas': () => import('./GestaoTarefas.md?raw').then(m => m.default),
  '/setores': () => import('./Setores.md?raw').then(m => m.default),
  
  // Desenvolvedor
  '/planejamento-desenvolvimento': () => import('./PlanejamentoDesenvolvimento.md?raw').then(m => m.default),
  '/ide': () => import('./IDE.md?raw').then(m => m.default),
  '/sistema': () => import('./Sistema.md?raw').then(m => m.default),
  '/apex-ai': () => import('./ApexAI.md?raw').then(m => m.default),
  
  // Perfil
  '/perfil': () => import('./Perfil.md?raw').then(m => m.default),
};

/**
 * Busca a documentacao especifica de uma pagina
 * @param path - Rota da pagina (ex: '/dashboard', '/produtos')
 * @returns Promise com o conteudo markdown da documentacao
 */
export const getPageDocumentation = async (path: string): Promise<string> => {
  // Normaliza o path removendo query strings e trailing slashes
  const normalizedPath = path.split('?')[0].replace(/\/$/, '') || '/dashboard';
  
  const loader = pageDocMap[normalizedPath];
  if (loader) {
    try {
      return await loader();
    } catch (error) {
      console.error(`[APEX] Erro ao carregar documentacao de ${normalizedPath}:`, error);
      return '';
    }
  }
  
  return ''; // Pagina sem documentacao especifica
};

/**
 * Verifica se uma pagina possui documentacao
 * @param path - Rota da pagina
 * @returns boolean indicando se ha documentacao disponivel
 */
export const hasPageDocumentation = (path: string): boolean => {
  const normalizedPath = path.split('?')[0].replace(/\/$/, '') || '/dashboard';
  return normalizedPath in pageDocMap;
};

/**
 * Lista todas as paginas com documentacao disponivel
 * @returns Array com nomes formatados de todas as paginas documentadas
 */
export const getAllDocumentedPages = (): string[] => {
  return Object.keys(pageDocMap).map(route => {
    const name = getPageName(route);
    return `${name} (${route})`;
  });
};

/**
 * Obtem o nome amigavel de uma pagina pela rota
 */
export const getPageName = (path: string): string => {
  const pageNames: Record<string, string> = {
    '/dashboard': 'Dashboard Geral',
    '/produtos': 'Produtos',
    '/inventario': 'Inventario',
    '/inventario-ciclico': 'Inventario Ciclico',
    '/entrada-manual': 'Entrada Manual',
    '/notas-fiscais': 'Notas Fiscais - Entrada XML',
    '/transferencia': 'Transferencia',
    '/enderecamento': 'Enderecamento',
    '/medida-de-lenha': 'Cubagem e Medida de Lenha',
    '/baixa-requisicao': 'Baixa de Requisicao',
    '/relatorios': 'Relatorios',
    '/dashboard-manutencao': 'Dashboard de Manutencao',
    '/maquinas': 'Maquinas',
    '/manutencao-preventiva': 'Manutencao Preventiva',
    '/execucao-manutencao': 'Execucao de Manutencao',
    '/parada-maquina': 'Parada de Maquina',
    '/ordens-servico': 'Ordens de Servico',
    '/requisicoes': 'Requisicoes',
    '/carrinho': 'Carrinho',
    '/devolucao': 'Devolucoes',
    '/fornecedor-produtos': 'Ordens de Compra',
    '/compras': 'Compras',
    '/notas-fiscais-lancamento': 'NF - Lancamento',
    '/centro-custo': 'Centro de Custo',
    '/importar-planilha': 'Importar Dados',
    '/pcp': 'PCP',
    '/chat': 'Chat',
    '/email': 'Email',
    '/reunioes': 'Reunioes',
    '/manuais': 'Manuais',
    '/gestao-usuarios': 'Gestao de Usuarios',
    '/gestao-perfis': 'Gestao de Perfis',
    '/gestao-produtos': 'Gestao de Produtos',
    '/unidades': 'Gestao de Unidades',
    '/gestao-manutencao': 'Gestao de Manutencao',
    '/gestao-fornecedores': 'Gestao de Fornecedores',
    '/gestao-tarefas': 'Gestao de Tarefas',
    '/setores': 'Setores',
    '/planejamento-desenvolvimento': 'Planejamento de Desenvolvimento',
    '/ide': 'IDE',
    '/sistema': 'Sistema',
    '/apex-ai': 'APEX AI',
    '/perfil': 'Perfil',
  };
  
  const normalizedPath = path.split('?')[0].replace(/\/$/, '') || '/dashboard';
  return pageNames[normalizedPath] || 'Pagina';
};

// =============================================
// MAPEAMENTO SEMANTICO DE PAGINAS
// =============================================

interface PageSemanticMapping {
  route: string;
  name: string;
  description: string;
  keywords: string[];
  synonyms: string[];
  relatedTerms: string[];
  actions: string[];
}

/**
 * Mapeamento semantico completo de todas as paginas do sistema
 * Inclui palavras-chave, sinonimos e termos relacionados para busca inteligente
 */
export const PAGE_SEMANTIC_MAP: PageSemanticMapping[] = [
  // === PRINCIPAL ===
  {
    route: '/dashboard',
    name: 'Dashboard Geral',
    description: 'Visao geral do sistema com indicadores, graficos e resumos',
    keywords: ['dashboard', 'painel', 'inicio', 'home', 'principal', 'visao geral', 'resumo', 'tela inicial', 'primeiro acesso'],
    synonyms: ['pagina inicial', 'tela principal', 'painel de controle', 'cockpit', 'bem vindo', 'onboarding'],
    relatedTerms: ['indicadores', 'kpi', 'graficos', 'estatisticas', 'metricas', 'performance', 'tour sistema'],
    actions: ['ver resumo', 'acompanhar indicadores', 'visualizar graficos', 'ver tela inicial']
  },

  // === ESTOQUE ===
  {
    route: '/produtos',
    name: 'Produtos',
    description: 'Gestao completa de produtos e itens de estoque',
    keywords: ['produtos', 'estoque', 'itens', 'materiais', 'pecas', 'insumos', 'item', 'material', 'peca', 'produto', 'saldo', 'quantidade em estoque'],
    synonyms: ['catalogo', 'almoxarifado', 'deposito', 'armazem', 'estocagem', 'prateleira produto'],
    relatedTerms: ['quantidade', 'preco', 'fornecedor', 'codigo', 'sku', 'lote', 'validade', 'localizacao', 'custo', 'valor unitario', 'estoque baixo', 'falta produto', 'consultar produto', 'saldo produto'],
    actions: ['cadastrar produto', 'consultar estoque', 'editar item', 'ver quantidade', 'buscar material', 'verificar saldo', 'localizar peca']
  },
  {
    route: '/inventario',
    name: 'Inventario',
    description: 'Contagem fisica e ajustes de estoque',
    keywords: ['inventario', 'contagem', 'conferencia', 'auditoria', 'balanco', 'contar estoque', 'levantar estoque'],
    synonyms: ['levantamento', 'verificacao', 'checagem', 'apuracao', 'conferencia fisica'],
    relatedTerms: ['divergencia', 'ajuste', 'acerto', 'diferenca', 'sobra', 'falta', 'ajustar quantidade', 'correcao estoque'],
    actions: ['fazer contagem', 'registrar divergencia', 'ajustar estoque', 'conferir itens', 'iniciar inventario']
  },
  {
    route: '/inventario-ciclico',
    name: 'Inventario Ciclico',
    description: 'Contagem rotativa e programada de itens por ciclo',
    keywords: ['inventario ciclico', 'contagem ciclica', 'rotativo', 'programado', 'ciclo', 'contagem periodica'],
    synonyms: ['contagem parcial', 'inventario rotativo', 'verificacao periodica', 'contagem agendada'],
    relatedTerms: ['agenda', 'frequencia', 'ciclo', 'rotina', 'planejamento', 'programacao contagem'],
    actions: ['agendar contagem', 'executar ciclo', 'programar inventario', 'ver ciclos pendentes']
  },
  {
    route: '/entrada-manual',
    name: 'Entrada Manual',
    description: 'Registro manual de entrada de produtos no estoque sem nota fiscal',
    keywords: ['entrada manual', 'dar entrada', 'chegou produto', 'receber mercadoria', 'lancar estoque', 'adicionar ao estoque', 'entrada sem nota', 'entrada', 'recebimento'],
    synonyms: ['lancar entrada', 'registrar recebimento', 'adicionar estoque', 'entrada avulsa'],
    relatedTerms: ['quantidade', 'lote', 'fornecedor', 'data entrada', 'produto recebido'],
    actions: ['registrar entrada', 'lancar recebimento', 'adicionar produto', 'dar entrada no estoque']
  },
  {
    route: '/notas-fiscais',
    name: 'Notas Fiscais - Entrada XML',
    description: 'Importacao e processamento de notas fiscais de entrada via arquivo XML',
    keywords: ['nota fiscal', 'nf', 'nfe', 'xml', 'danfe', 'importar nota', 'chave nfe', 'nota chegou', 'entrada por nota', 'documento fiscal', 'fiscal'],
    synonyms: ['nota', 'fatura', 'nf-e', 'documento eletronico'],
    relatedTerms: ['cnpj', 'chave acesso', 'impostos', 'icms', 'produtos nota', 'valores nota', 'emitente'],
    actions: ['importar xml', 'processar nota', 'lancar nf', 'conferir nota', 'carregar nota fiscal']
  },
  {
    route: '/transferencia',
    name: 'Transferencia',
    description: 'Movimentacao de produtos entre depositos ou unidades da empresa',
    keywords: ['transferencia', 'transferir', 'mover produto', 'enviar para outra unidade', 'relocar', 'remessa interna', 'entre depositos', 'movimentacao'],
    synonyms: ['relocar', 'deslocar', 'remessa', 'envio interno'],
    relatedTerms: ['origem', 'destino', 'deposito', 'unidade', 'quantidade transferida'],
    actions: ['transferir produto', 'mover material', 'enviar para outra unidade', 'registrar transferencia']
  },
  {
    route: '/enderecamento',
    name: 'Enderecamento',
    description: 'Localizacao fisica de produtos dentro do deposito por enderecos',
    keywords: ['enderecamento', 'enderecar', 'localizacao do produto', 'onde fica', 'prateleira', 'corredor', 'posicao no deposito', 'rua', 'coluna', 'nivel', 'box', 'localizacao'],
    synonyms: ['posicionamento', 'alocacao produto', 'lugar produto', 'posicao fisica'],
    relatedTerms: ['rua', 'corredor', 'coluna', 'nivel', 'altura', 'slot', 'posicao', 'mapa deposito'],
    actions: ['enderecar produto', 'localizar item', 'definir posicao', 'alocar no deposito', 'ver endereco produto']
  },
  {
    route: '/medida-de-lenha',
    name: 'Cubagem e Medida de Lenha',
    description: 'Calculo de volume e medicao de lenha e madeira em metros cubicos',
    keywords: ['cubagem', 'cubar', 'lenha', 'madeira', 'metro cubico', 'm3', 'medicao', 'medir lenha', 'calcular volume', 'tora', 'cavaco', 'biomassa', 'combustivel', 'caldeira', 'volume madeira', 'cubicagem', 'metragem', 'medida lenha'],
    synonyms: ['cubo de lenha', 'medir madeira', 'calcular cubagem', 'metragem lenha', 'volumetria', 'metros cubicos lenha'],
    relatedTerms: ['fornecedor lenha', 'nota fiscal lenha', 'registro medicao', 'nova medida', 'novo fornecedor lenha', 'imprimir relatorio lenha', 'metros', 'data medicao'],
    actions: ['medir lenha', 'calcular cubagem', 'registrar medicao', 'cubar madeira', 'lancar medida', 'nova medida', 'ver registros cubagem']
  },
  {
    route: '/baixa-requisicao',
    name: 'Baixa de Requisicao',
    description: 'Confirmacao de entrega e baixa de requisicoes de material',
    keywords: ['baixa', 'baixa requisicao', 'confirmar entrega', 'dar baixa', 'finalizar requisicao', 'retirada confirmada', 'entrega material'],
    synonyms: ['confirmar retirada', 'concluir requisicao', 'encerrar pedido'],
    relatedTerms: ['retirada', 'solicitacao', 'pedido material', 'confirmacao'],
    actions: ['dar baixa', 'confirmar entrega', 'finalizar pedido', 'registrar retirada']
  },
  {
    route: '/relatorios',
    name: 'Relatorios',
    description: 'Geracao de relatorios, graficos e analises de dados do sistema',
    keywords: ['relatorio', 'relatorios', 'exportar', 'imprimir', 'grafico', 'kpi', 'analise', 'extrato', 'listagem', 'dados', 'pdf', 'excel', 'dashboard'],
    synonyms: ['report', 'demonstrativo', 'historico dados', 'consulta dados'],
    relatedTerms: ['periodo', 'filtro', 'data inicial', 'data final', 'totais', 'resumo gerencial'],
    actions: ['gerar relatorio', 'exportar dados', 'imprimir relatorio', 'analisar dados', 'ver historico']
  },

  // === MANUTENCAO ===
  {
    route: '/dashboard-manutencao',
    name: 'Dashboard de Manutencao',
    description: 'Painel de controle com indicadores e resumo da area de manutencao',
    keywords: ['dashboard manutencao', 'painel manutencao', 'indicadores manutencao', 'mtbf', 'mttr', 'disponibilidade equipamento'],
    synonyms: ['visao manutencao', 'controle manutencao', 'cockpit manutencao', 'resumo manutencao'],
    relatedTerms: ['disponibilidade', 'falhas', 'paradas', 'tempo medio', 'eficiencia'],
    actions: ['acompanhar manutencao', 'ver indicadores', 'monitorar equipamentos', 'ver dashboard']
  },
  {
    route: '/maquinas',
    name: 'Maquinas',
    description: 'Cadastro e gestao de maquinas, equipamentos e ativos industriais',
    keywords: ['maquina', 'maquinas', 'equipamento', 'equipamentos', 'ativo', 'ativos', 'patrimonio', 'bem', 'tag', 'instrumento', 'aparelho', 'dispositivo'],
    synonyms: ['maquinario', 'parque de equipamentos', 'ativo imobilizado'],
    relatedTerms: ['tag', 'numero patrimonio', 'setor', 'modelo', 'fabricante', 'status equipamento', 'data aquisicao'],
    actions: ['cadastrar maquina', 'consultar equipamento', 'ver status', 'editar ativo', 'localizar equipamento']
  },
  {
    route: '/manutencao-preventiva',
    name: 'Manutencao Preventiva',
    description: 'Planejamento, agendamento e controle de manutencoes preventivas',
    keywords: ['preventiva', 'manutencao preventiva', 'agendada', 'programada', 'periodica', 'plano manutencao', 'planejar manutencao', 'calendario manutencao', 'agendamento'],
    synonyms: ['manutencao planejada', 'manutencao rotineira', 'revisao programada'],
    relatedTerms: ['frequencia', 'checklist', 'tarefa preventiva', 'calendario', 'periodicidade', 'proximo vencimento'],
    actions: ['agendar manutencao', 'planejar preventiva', 'criar tarefa', 'programar revisao', 'ver agenda']
  },
  {
    route: '/execucao-manutencao',
    name: 'Execucao de Manutencao',
    description: 'Registro da execucao de tarefas e servicos de manutencao realizados',
    keywords: ['executar manutencao', 'execucao', 'realizar tarefa', 'completar manutencao', 'registrar execucao', 'finalizar servico manutencao', 'servico realizado'],
    synonyms: ['fazer manutencao', 'concluir tarefa', 'registrar servico'],
    relatedTerms: ['horas trabalhadas', 'observacao', 'conclusao', 'pecas utilizadas', 'tecnico responsavel'],
    actions: ['executar tarefa', 'registrar execucao', 'finalizar manutencao', 'registrar horas']
  },
  {
    route: '/parada-maquina',
    name: 'Parada de Maquina',
    description: 'Registro de paradas, falhas e indisponibilidades de equipamentos',
    keywords: ['parada', 'parou', 'quebrou', 'falha', 'indisponivel', 'defeito', 'avaria', 'pane', 'interrupcao', 'paralisacao', 'maquina parada', 'equipamento parado', 'parou de funcionar', 'nao ta passando', 'travou'],
    synonyms: ['downtime', 'indisponibilidade', 'falha equipamento', 'colapso'],
    relatedTerms: ['motivo parada', 'tempo parado', 'causa', 'solucao', 'equipamento afetado', 'producao afetada'],
    actions: ['registrar parada', 'informar falha', 'abrir chamado parada', 'reportar problema']
  },
  {
    route: '/ordens-servico',
    name: 'Ordens de Servico',
    description: 'Gestao de ordens de servico corretivas e chamados de manutencao',
    keywords: ['ordem servico', 'os', 'corretiva', 'chamado', 'solicitacao servico', 'abrir chamado', 'ticket', 'consertar', 'reparo', 'conserto'],
    synonyms: ['ordem manutencao', 'ticket suporte', 'atendimento tecnico', 'demanda corretiva'],
    relatedTerms: ['prioridade', 'status os', 'responsavel', 'prazo', 'urgente', 'equipamento', 'descricao problema'],
    actions: ['abrir os', 'criar ordem servico', 'acompanhar chamado', 'fechar os', 'consultar status']
  },

  // === REQUISICOES ===
  {
    route: '/requisicoes',
    name: 'Requisicoes',
    description: 'Solicitacoes formais de materiais e pecas do estoque',
    keywords: ['requisicao', 'requisicoes', 'solicitar material', 'pedido material', 'requerimento', 'pedir peca', 'solicitar item', 'preciso de material', 'solicitacao material'],
    synonyms: ['pedido interno', 'solicitacao peca', 'requerimento material'],
    relatedTerms: ['aprovacao', 'status requisicao', 'itens solicitados', 'quantidade', 'urgencia', 'centro custo'],
    actions: ['criar requisicao', 'solicitar material', 'aprovar requisicao', 'acompanhar pedido', 'ver status']
  },
  {
    route: '/carrinho',
    name: 'Carrinho',
    description: 'Carrinho de itens selecionados para criar requisicao de material',
    keywords: ['carrinho', 'cesta', 'selecionar itens', 'lista pedido', 'montar pedido', 'adicionar ao carrinho', 'itens selecionados'],
    synonyms: ['carrinho compras', 'lista de requisicao', 'selecao materiais'],
    relatedTerms: ['adicionar item', 'remover item', 'quantidade', 'finalizar pedido'],
    actions: ['adicionar ao carrinho', 'remover item', 'finalizar pedido', 'ver carrinho']
  },
  {
    route: '/devolucao',
    name: 'Devolucoes',
    description: 'Registro de devolucao de materiais ao estoque apos uso',
    keywords: ['devolucao', 'devolver', 'retornar material', 'sobrou material', 'material nao usado', 'retorno ao estoque', 'restituir', 'devolver peca'],
    synonyms: ['retorno material', 'restituicao', 'devolucao estoque'],
    relatedTerms: ['motivo devolucao', 'quantidade devolvida', 'condicao item', 'requisicao original'],
    actions: ['devolver material', 'registrar devolucao', 'retornar ao estoque', 'informar sobra']
  },

  // === COMPRAS ===
  {
    route: '/fornecedor-produtos',
    name: 'Ordens de Compra',
    description: 'Gestao de ordens de compra e cotacoes com fornecedores',
    keywords: ['ordem compra', 'oc', 'cotacao', 'pedido fornecedor', 'aquisicao', 'procurement', 'comprar de fornecedor', 'pedido compra'],
    synonyms: ['pedido aquisicao', 'compra externa', 'requisicao compra'],
    relatedTerms: ['fornecedor', 'preco cotado', 'prazo entrega', 'condicoes pagamento', 'aprovacao compra'],
    actions: ['criar ordem compra', 'fazer cotacao', 'aprovar oc', 'acompanhar compra']
  },
  {
    route: '/compras',
    name: 'Compras',
    description: 'Modulo de gestao de compras e aquisicoes da empresa',
    keywords: ['compras', 'comprar', 'adquirir', 'aquisicao', 'suprimentos', 'setor compras', 'negociacao', 'cotacao'],
    synonyms: ['setor de suprimentos', 'procurement', 'aquisicoes'],
    relatedTerms: ['fornecedor', 'preco', 'negociacao', 'contrato', 'aprovacao'],
    actions: ['solicitar compra', 'aprovar aquisicao', 'gerenciar compras', 'acompanhar pedido']
  },

  // === FINANCEIRO ===
  {
    route: '/notas-fiscais-lancamento',
    name: 'NF - Lancamento',
    description: 'Lancamento financeiro de notas fiscais para controle de contas a pagar',
    keywords: ['lancamento nf', 'financeiro nota', 'pagar nota', 'contas pagar', 'vencimento nota', 'lancamento financeiro', 'pagar', 'contas'],
    synonyms: ['lancar nota financeiro', 'registrar pagamento nf', 'contabilizar nota'],
    relatedTerms: ['valor nota', 'vencimento', 'parcela', 'pagamento', 'conta bancaria'],
    actions: ['lancar nota', 'registrar financeiro', 'agendar pagamento', 'ver contas a pagar']
  },
  {
    route: '/centro-custo',
    name: 'Centro de Custo',
    description: 'Gestao de centros de custo para alocacao de despesas da empresa',
    keywords: ['centro custo', 'cc', 'custo', 'despesa', 'orcamento', 'alocacao', 'verba', 'budget', 'centro de custo'],
    synonyms: ['centro despesa', 'unidade custo', 'conta gerencial'],
    relatedTerms: ['codigo cc', 'alocacao despesa', 'planejamento orcamentario', 'verba disponivel'],
    actions: ['criar centro custo', 'alocar despesa', 'gerenciar custos', 'consultar budget']
  },

  // === PRODUCAO ===
  {
    route: '/pcp',
    name: 'PCP',
    description: 'Planejamento e Controle da Producao',
    keywords: ['pcp', 'producao', 'fabricacao', 'planejamento producao', 'programacao', 'cronograma', 'ordem producao', 'capacidade', 'controle producao'],
    synonyms: ['planejamento fabrica', 'scheduling', 'programacao producao'],
    relatedTerms: ['ordem fabricacao', 'capacidade produtiva', 'demanda', 'lead time', 'sequenciamento'],
    actions: ['planejar producao', 'programar fabricacao', 'controlar producao', 'criar ordem producao']
  },

  // === COMUNICACAO ===
  {
    route: '/chat',
    name: 'Chat',
    description: 'Comunicacao interna entre usuarios do sistema via mensagens',
    keywords: ['chat', 'mensagem', 'conversar', 'comunicar', 'bate papo', 'mensageiro', 'notificacao interna', 'conversa'],
    synonyms: ['mensageiro interno', 'bate-papo', 'messenger', 'direct'],
    relatedTerms: ['enviar mensagem', 'receber', 'grupo chat', 'notificacao'],
    actions: ['enviar mensagem', 'iniciar conversa', 'criar grupo', 'ver mensagens']
  },
  {
    route: '/email',
    name: 'Email',
    description: 'Envio e recebimento de emails pelo sistema',
    keywords: ['email', 'e-mail', 'correio', 'enviar email', 'caixa entrada', 'mensagem email', 'mail'],
    synonyms: ['correio eletronico', 'envio email', 'caixa de email'],
    relatedTerms: ['destinatario', 'assunto', 'anexo', 'caixa entrada', 'rascunho'],
    actions: ['enviar email', 'compor mensagem', 'ver caixa entrada', 'ler email']
  },
  {
    route: '/reunioes',
    name: 'Reunioes',
    description: 'Agendamento e gestao de reunioes e encontros',
    keywords: ['reuniao', 'reunioes', 'meeting', 'encontro', 'agendar reuniao', 'conferencia', 'assembleia', 'pauta reuniao'],
    synonyms: ['encontro agendado', 'sessao trabalho', 'conferencia equipe'],
    relatedTerms: ['participantes', 'pauta', 'horario', 'sala', 'convite', 'link reuniao'],
    actions: ['agendar reuniao', 'criar meeting', 'convidar participantes', 'ver agenda reunioes']
  },

  // === MANUAIS ===
  {
    route: '/manuais',
    name: 'Manuais',
    description: 'Biblioteca de manuais tecnicos e documentos de instrucao de equipamentos',
    keywords: ['manual', 'manuais', 'documentacao', 'guia', 'instrucao', 'procedimento', 'tutorial', 'como fazer', 'passo a passo equipamento'],
    synonyms: ['documento tecnico', 'instrucoes uso', 'help equipamento', 'procedimento operacional'],
    relatedTerms: ['pdf manual', 'equipamento manual', 'instrucoes fabricante', 'versao manual'],
    actions: ['consultar manual', 'buscar documentacao', 'ver instrucoes', 'baixar manual']
  },

  // === ADMINISTRATIVO ===
  {
    route: '/gestao-usuarios',
    name: 'Gestao de Usuarios',
    description: 'Cadastro e gerenciamento de usuarios e acessos ao sistema',
    keywords: ['usuario', 'usuarios', 'acesso', 'cadastrar usuario', 'login', 'permissao', 'colaborador', 'funcionario sistema', 'resetar senha', 'conta usuario'],
    synonyms: ['gerenciar usuarios', 'administrar contas', 'controle acesso usuarios'],
    relatedTerms: ['email usuario', 'senha', 'ativo inativo', 'perfil usuario', 'data cadastro'],
    actions: ['criar usuario', 'editar acesso', 'desativar usuario', 'resetar senha', 'ver usuarios']
  },
  {
    route: '/gestao-perfis',
    name: 'Gestao de Perfis',
    description: 'Configuracao de perfis de acesso e permissoes por modulo',
    keywords: ['perfis acesso', 'nivel acesso', 'permissoes', 'roles', 'funcoes', 'restringir acesso', 'liberar modulo', 'perfil usuario', 'permissao modulo'],
    synonyms: ['roles sistema', 'niveis permissao', 'grupos acesso', 'privilegios'],
    relatedTerms: ['modulo', 'funcionalidade', 'restrito', 'liberado', 'administrador'],
    actions: ['criar perfil', 'editar permissoes', 'configurar acesso', 'definir nivel']
  },
  {
    route: '/gestao-produtos',
    name: 'Gestao de Produtos',
    description: 'Configuracoes avancadas e parametros de produtos no sistema',
    keywords: ['gestao produtos', 'configurar produtos', 'categoria produto', 'grupo produto', 'familia produto', 'parametro produto'],
    synonyms: ['administrar produtos', 'setup produtos', 'configuracao catalogo'],
    relatedTerms: ['categoria', 'grupo', 'familia', 'atributo', 'classificacao produto'],
    actions: ['configurar produto', 'criar categoria', 'organizar itens', 'definir grupo']
  },
  {
    route: '/unidades',
    name: 'Gestao de Unidades',
    description: 'Cadastro de unidades, filiais e estabelecimentos da empresa',
    keywords: ['unidade', 'unidades', 'filial', 'filiais', 'matriz', 'estabelecimento', 'planta', 'fabrica', 'local empresa'],
    synonyms: ['gerenciar filiais', 'cadastro unidades', 'controle estabelecimentos'],
    relatedTerms: ['endereco unidade', 'responsavel', 'cnpj', 'codigo unidade'],
    actions: ['criar unidade', 'cadastrar filial', 'editar local', 'ver unidades']
  },
  {
    route: '/gestao-manutencao',
    name: 'Gestao de Manutencao',
    description: 'Configuracoes e parametros gerais do modulo de manutencao',
    keywords: ['gestao manutencao', 'configurar manutencao', 'parametros manutencao', 'tipo manutencao', 'setup manutencao'],
    synonyms: ['administrar manutencao', 'configuracao modulo manutencao'],
    relatedTerms: ['tipo servico', 'prioridade', 'frequencia manutencao', 'checklist padrao'],
    actions: ['configurar manutencao', 'criar tipo servico', 'definir parametros', 'setup modulo']
  },
  {
    route: '/gestao-fornecedores',
    name: 'Gestao de Fornecedores',
    description: 'Cadastro e gerenciamento completo de fornecedores e parceiros',
    keywords: ['fornecedor', 'fornecedores', 'parceiro', 'vendor', 'distribuidor', 'representante', 'prestador', 'cadastrar fornecedor'],
    synonyms: ['gerenciar fornecedores', 'cadastro parceiros', 'gestao suppliers'],
    relatedTerms: ['cnpj fornecedor', 'contato fornecedor', 'condicoes pagamento', 'prazo entrega', 'produtos fornecedor'],
    actions: ['cadastrar fornecedor', 'editar parceiro', 'consultar fornecedor', 'ver lista fornecedores']
  },
  {
    route: '/gestao-tarefas',
    name: 'Gestao de Tarefas',
    description: 'Configuracao de tipos de tarefas e checklists de manutencao',
    keywords: ['tarefa manutencao', 'tipo tarefa', 'checklist tarefa', 'atividade manutencao', 'configurar tarefa', 'servico manutencao'],
    synonyms: ['tipos servico', 'templates tarefa', 'modelos checklist'],
    relatedTerms: ['descricao tarefa', 'tempo estimado', 'recursos necessarios', 'instrucoes'],
    actions: ['criar tarefa', 'configurar atividade', 'definir checklist', 'editar tipo servico']
  },
  {
    route: '/setores',
    name: 'Setores',
    description: 'Cadastro de setores e departamentos da empresa',
    keywords: ['setor', 'setores', 'departamento', 'area', 'divisao', 'nucleo', 'equipe', 'setor empresa'],
    synonyms: ['gerenciar setores', 'cadastro departamentos', 'areas empresa'],
    relatedTerms: ['responsavel setor', 'funcionarios setor', 'localizacao setor'],
    actions: ['criar setor', 'cadastrar departamento', 'editar area', 'ver setores']
  },

  // === UTILITARIOS ===
  {
    route: '/importar-planilha',
    name: 'Importar Dados',
    description: 'Importacao de dados em massa via planilha Excel ou CSV',
    keywords: ['importar planilha', 'upload excel', 'importar dados', 'migrar dados', 'carregar arquivo', 'planilha csv', 'excel', 'importar', 'planilha'],
    synonyms: ['carga dados', 'importacao massa', 'migrar planilha'],
    relatedTerms: ['arquivo excel', 'template importacao', 'modelo planilha', 'formato csv'],
    actions: ['importar planilha', 'carregar excel', 'fazer upload', 'migrar dados']
  },

  // === DESENVOLVEDOR ===
  {
    route: '/planejamento-desenvolvimento',
    name: 'Planejamento de Desenvolvimento',
    description: 'Planejamento e gestao de novas funcionalidades e melhorias do sistema',
    keywords: ['planejamento desenvolvimento', 'backlog', 'roadmap', 'sprint', 'demanda sistema', 'melhoria sistema', 'funcionalidade nova'],
    synonyms: ['gestao backlog', 'planejamento sprint', 'roadmap sistema'],
    relatedTerms: ['tarefa dev', 'prioridade', 'prazo entrega', 'responsavel dev', 'status demanda'],
    actions: ['criar demanda', 'planejar sprint', 'priorizar backlog', 'acompanhar desenvolvimento']
  },
  {
    route: '/ide',
    name: 'IDE',
    description: 'Ambiente de desenvolvimento integrado para customizacoes do sistema',
    keywords: ['ide', 'codigo', 'desenvolvimento', 'programacao', 'editor codigo', 'script'],
    synonyms: ['editor codigo', 'ambiente desenvolvimento', 'codificacao'],
    relatedTerms: ['funcao', 'debug', 'teste codigo', 'deploy'],
    actions: ['escrever codigo', 'testar funcao', 'debugar', 'publicar alteracao']
  },
  {
    route: '/sistema',
    name: 'Sistema',
    description: 'Configuracoes gerais, backup e parametros do sistema APEX HUB',
    keywords: ['sistema', 'configuracao sistema', 'backup', 'versao', 'log sistema', 'parametros gerais', 'diagnostico', 'config'],
    synonyms: ['setup sistema', 'ajustes gerais', 'preferencias sistema', 'opcoes gerais'],
    relatedTerms: ['backup dados', 'versao atual', 'atualizacao', 'log eventos', 'manutencao sistema'],
    actions: ['configurar sistema', 'fazer backup', 'ver logs', 'verificar versao']
  },
  {
    route: '/apex-ai',
    name: 'APEX AI',
    description: 'Configuracoes do assistente de inteligencia artificial APEX AI',
    keywords: ['apex ai', 'ia', 'inteligencia artificial', 'assistente ia', 'chatbot', 'configurar chat', 'skill ia', 'modelo ia', 'bot'],
    synonyms: ['assistente virtual', 'chat ia', 'agente ia', 'configuracao assistente'],
    relatedTerms: ['modelo llm', 'skill prompt', 'configuracao bot', 'regras ia', 'temperatura modelo'],
    actions: ['configurar ia', 'ajustar assistente', 'editar skill', 'definir modelo']
  },

  // === PERFIL ===
  {
    route: '/perfil',
    name: 'Perfil',
    description: 'Perfil pessoal e configuracoes da conta do usuario logado',
    keywords: ['perfil', 'meu perfil', 'minha conta', 'dados pessoais', 'alterar senha', 'foto perfil', 'preferencias', 'conta'],
    synonyms: ['meus dados', 'configuracoes pessoais', 'conta pessoal'],
    relatedTerms: ['foto', 'senha atual', 'email conta', 'nome usuario', 'preferencias sistema'],
    actions: ['editar perfil', 'alterar senha', 'atualizar dados', 'trocar foto']
  }
];

/**
 * Normaliza texto removendo acentos, caracteres especiais e convertendo para minusculas
 */
const normalizeTextForSearch = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Verifica se uma palavra da query bate com qualquer palavra de um campo
 * Considera tanto inclusao direta quanto match por prefixo (palavra com 4+ chars)
 */
const wordMatchesField = (word: string, fieldValue: string): boolean => {
  const normField = normalizeTextForSearch(fieldValue);
  const normWord = normalizeTextForSearch(word);

  if (normWord.length < 3) return false;

  // Match direto: o campo contem a palavra ou a palavra contem o campo
  if (normField.includes(normWord) || normWord.includes(normField)) return true;

  // Match por palavra individual dentro do campo
  const fieldWords = normField.split(' ');
  for (const fw of fieldWords) {
    if (fw.length < 3) continue;
    if (fw === normWord) return true;
    // Match por prefixo se a palavra tem 4+ caracteres
    if (normWord.length >= 4 && (fw.startsWith(normWord) || normWord.startsWith(fw))) return true;
  }

  return false;
};

/**
 * Calcula o score de match entre a query e um array de campos de texto
 * Retorna o maior score encontrado entre todas as combinacoes
 */
const scoreQueryAgainstFields = (
  normalizedQuery: string,
  queryWords: string[],
  fields: string[]
): number => {
  let best = 0;

  for (const field of fields) {
    const normField = normalizeTextForSearch(field);

    // Match exato do campo completo com a query
    if (normField === normalizedQuery) { best = Math.max(best, 1.0); continue; }

    // Query contem o campo ou campo contem a query (substring)
    if (normalizedQuery.includes(normField) || normField.includes(normalizedQuery)) {
      best = Math.max(best, 0.92);
      continue;
    }

    // Match por cada palavra da query contra o campo
    let wordMatchCount = 0;
    for (const word of queryWords) {
      if (wordMatchesField(word, field)) wordMatchCount++;
    }
    if (queryWords.length > 0 && wordMatchCount > 0) {
      const ratio = wordMatchCount / queryWords.length;
      best = Math.max(best, 0.6 + ratio * 0.3);
    }
  }

  return best;
};

/**
 * Busca paginas relacionadas a um termo de busca usando busca semantica profunda.
 * Verifica keywords, sinonimos, termos relacionados, acoes e descricao.
 * Retorna as paginas mais relevantes com score de confianca.
 */
export const searchRelatedPages = (query: string, maxResults: number = 5): Array<{
  page: PageSemanticMapping;
  score: number;
  matchType: 'exact' | 'keyword' | 'synonym' | 'related' | 'action' | 'fuzzy';
}> => {
  if (!query || query.trim().length === 0) return [];

  const normalizedQuery = normalizeTextForSearch(query);
  // Filtrar stop words comuns para focar nos termos significativos
  const stopWords = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'em', 'por', 'para', 'com', 'que', 'se', 'na', 'no', 'nas', 'nos', 'um', 'uma', 'ate', 'ate', 'ou', 'me', 'te', 'ja', 'so', 'eu', 'ele', 'ela', 'nos', 'voce', 'tem', 'sao', 'foi', 'ser', 'esta', 'esta', 'isso', 'isso', 'mais', 'muito', 'bem', 'nao']);
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));

  const results: Array<{ page: PageSemanticMapping; score: number; matchType: string }> = [];

  for (const page of PAGE_SEMANTIC_MAP) {
    let bestScore = 0;
    let matchType = 'fuzzy';

    // 1. Match exato no nome da pagina (score: 1.0)
    const normName = normalizeTextForSearch(page.name);
    if (normName === normalizedQuery || normalizedQuery.includes(normName) || normName.includes(normalizedQuery)) {
      bestScore = 1.0;
      matchType = 'exact';
    }

    // 2. Match em keywords — mais alta prioridade apos nome exato (score: 0.9 - 1.0)
    if (bestScore < 1.0) {
      const kwScore = scoreQueryAgainstFields(normalizedQuery, queryWords, page.keywords);
      if (kwScore > bestScore) {
        bestScore = kwScore * 0.95; // leve penalidade para nao superar nome exato
        matchType = 'keyword';
      }
    }

    // 3. Match em sinonimos (score: ate 0.9)
    if (bestScore < 0.9) {
      const synScore = scoreQueryAgainstFields(normalizedQuery, queryWords, page.synonyms);
      if (synScore > 0) {
        const adjusted = synScore * 0.9;
        if (adjusted > bestScore) {
          bestScore = adjusted;
          matchType = 'synonym';
        }
      }
    }

    // 4. Match em termos relacionados (score: ate 0.8)
    if (bestScore < 0.8) {
      const relScore = scoreQueryAgainstFields(normalizedQuery, queryWords, page.relatedTerms);
      if (relScore > 0) {
        const adjusted = relScore * 0.82;
        if (adjusted > bestScore) {
          bestScore = adjusted;
          matchType = 'related';
        }
      }
    }

    // 5. Match em acoes (score: ate 0.75)
    if (bestScore < 0.75) {
      const actScore = scoreQueryAgainstFields(normalizedQuery, queryWords, page.actions);
      if (actScore > 0) {
        const adjusted = actScore * 0.76;
        if (adjusted > bestScore) {
          bestScore = adjusted;
          matchType = 'action';
        }
      }
    }

    // 6. Match fuzzy na descricao (score: ate 0.65)
    if (bestScore < 0.65) {
      const descScore = scoreQueryAgainstFields(normalizedQuery, queryWords, [page.description]);
      if (descScore > 0) {
        const adjusted = descScore * 0.65;
        if (adjusted > bestScore) {
          bestScore = adjusted;
          matchType = 'fuzzy';
        }
      }
    }

    // Threshold minimo de 0.35 para incluir nos resultados
    if (bestScore >= 0.35) {
      results.push({
        page,
        score: bestScore,
        matchType: matchType as 'exact' | 'keyword' | 'synonym' | 'related' | 'action' | 'fuzzy'
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
};

/**
 * Gera contexto semantico para o modelo de IA
 * Retorna texto formatado com paginas relacionadas a pergunta do usuario
 */
export const generateSemanticContext = (userQuery: string): string => {
  const relatedPages = searchRelatedPages(userQuery, 5);
  
  if (relatedPages.length === 0) {
    return '';
  }
  
  let context = '\n\n---\n📚 PAGINAS RELACIONADAS A PERGUNTA DO USUARIO:\n';
  
  for (const { page, score, matchType } of relatedPages) {
    const confidence = score >= 0.8 ? 'ALTA' : score >= 0.6 ? 'MEDIA' : 'BAIXA';
    context += `\n• **${page.name}** (${page.route}) - Confianca: ${confidence}\n`;
    context += `  Descricao: ${page.description}\n`;
    context += `  Palavras-chave: ${page.keywords.slice(0, 5).join(', ')}\n`;
    context += `  Acoes possiveis: ${page.actions.join(', ')}\n`;
  }
  
  context += '\n---\n';
  context += 'IMPORTANTE: Se o usuario mencionar qualquer termo acima, SEMPRE relacione com a pagina correspondente do APEX HUB.\n';
  context += 'Se nao tiver certeza, pergunte: "Voce esta se referindo a [nome da pagina]?"\n';
  
  return context;
};

/**
 * Verifica se uma pergunta pode estar relacionada ao sistema
 * e sugere possíveis interpretacoes
 */
export const suggestInterpretations = (query: string): string[] => {
  const relatedPages = searchRelatedPages(query, 3);
  const suggestions: string[] = [];
  
  for (const { page, score } of relatedPages) {
    if (score >= 0.5) {
      suggestions.push(`Voce quis dizer sobre a pagina "${page.name}" (${page.route})?`);
    }
  }
  
  return suggestions;
};
