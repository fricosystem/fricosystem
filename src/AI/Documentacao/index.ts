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
    keywords: ['dashboard', 'painel', 'inicio', 'home', 'principal', 'visao geral', 'resumo'],
    synonyms: ['pagina inicial', 'tela principal', 'painel de controle', 'cockpit'],
    relatedTerms: ['indicadores', 'kpi', 'graficos', 'estatisticas', 'metricas', 'performance'],
    actions: ['ver resumo', 'acompanhar indicadores', 'visualizar graficos']
  },
  
  // === ESTOQUE ===
  {
    route: '/produtos',
    name: 'Produtos',
    description: 'Gestao completa de produtos e itens de estoque',
    keywords: ['produtos', 'estoque', 'itens', 'materiais', 'pecas', 'insumos'],
    synonyms: ['catalogo', 'inventario', 'almoxarifado', 'deposito', 'armazem'],
    relatedTerms: ['quantidade', 'preco', 'fornecedor', 'codigo', 'sku', 'lote', 'validade', 'localizacao'],
    actions: ['cadastrar produto', 'consultar estoque', 'editar item', 'ver quantidade', 'buscar material']
  },
  {
    route: '/inventario',
    name: 'Inventario',
    description: 'Contagem fisica e ajustes de estoque',
    keywords: ['inventario', 'contagem', 'conferencia', 'auditoria', 'balanço'],
    synonyms: ['levantamento', 'verificacao', 'checagem', 'apuracao'],
    relatedTerms: ['divergencia', 'ajuste', 'acerto', 'diferenca', 'sobra', 'falta'],
    actions: ['fazer contagem', 'registrar divergencia', 'ajustar estoque', 'conferir itens']
  },
  {
    route: '/inventario-ciclico',
    name: 'Inventario Ciclico',
    description: 'Contagem rotativa e programada de itens',
    keywords: ['inventario ciclico', 'contagem ciclica', 'rotativo', 'programado'],
    synonyms: ['contagem parcial', 'inventario rotativo', 'verificacao periodica'],
    relatedTerms: ['agenda', 'frequencia', 'ciclo', 'rotina', 'planejamento'],
    actions: ['agendar contagem', 'executar ciclo', 'programar inventario']
  },
  {
    route: '/entrada-manual',
    name: 'Entrada Manual',
    description: 'Registro manual de entrada de produtos no estoque',
    keywords: ['entrada', 'entrada manual', 'recebimento', 'inclusao'],
    synonyms: ['lancar entrada', 'dar entrada', 'registrar recebimento', 'adicionar estoque'],
    relatedTerms: ['quantidade', 'lote', 'nota fiscal', 'fornecedor', 'data entrada'],
    actions: ['registrar entrada', 'lancar recebimento', 'adicionar produto', 'dar entrada']
  },
  {
    route: '/notas-fiscais',
    name: 'Notas Fiscais - Entrada XML',
    description: 'Importacao e processamento de notas fiscais via XML',
    keywords: ['nota fiscal', 'nf', 'nfe', 'xml', 'danfe', 'importar'],
    synonyms: ['nota', 'documento fiscal', 'fatura', 'nf-e'],
    relatedTerms: ['cnpj', 'chave', 'produtos', 'valores', 'impostos', 'icms'],
    actions: ['importar xml', 'processar nota', 'lancar nf', 'conferir nota']
  },
  {
    route: '/transferencia',
    name: 'Transferencia',
    description: 'Movimentacao de produtos entre depositos ou unidades',
    keywords: ['transferencia', 'movimentacao', 'transferir', 'mover'],
    synonyms: ['relocar', 'deslocar', 'enviar', 'remessa'],
    relatedTerms: ['origem', 'destino', 'deposito', 'unidade', 'quantidade'],
    actions: ['transferir produto', 'mover material', 'enviar para outra unidade']
  },
  {
    route: '/enderecamento',
    name: 'Enderecamento',
    description: 'Localizacao fisica de produtos no deposito',
    keywords: ['enderecamento', 'localizacao', 'endereco', 'posicao'],
    synonyms: ['posicionamento', 'alocacao', 'local', 'lugar'],
    relatedTerms: ['corredor', 'prateleira', 'nivel', 'box', 'rua', 'coluna', 'altura'],
    actions: ['enderecar produto', 'localizar item', 'definir posicao', 'alocar']
  },
  {
    route: '/medida-de-lenha',
    name: 'Cubagem e Medida de Lenha',
    description: 'Calculo de volume e medicao de lenha e madeira',
    keywords: ['cubagem', 'lenha', 'madeira', 'medida', 'volume', 'metro cubico', 'm3', 'medicao'],
    synonyms: ['cubar', 'medir lenha', 'calcular volume', 'metragem', 'cubicagem', 'cubo'],
    relatedTerms: ['metros', 'tora', 'cavaco', 'biomassa', 'combustivel', 'caldeira', 'fornecedor lenha', 'nota fiscal lenha', 'registro lenha'],
    actions: ['medir lenha', 'calcular cubagem', 'registrar medicao', 'cubar madeira', 'lancar medida']
  },
  {
    route: '/baixa-requisicao',
    name: 'Baixa de Requisicao',
    description: 'Confirmacao de entrega e baixa de requisicoes',
    keywords: ['baixa', 'requisicao', 'entrega', 'confirmacao'],
    synonyms: ['confirmar entrega', 'dar baixa', 'finalizar requisicao'],
    relatedTerms: ['retirada', 'solicitacao', 'pedido', 'material'],
    actions: ['dar baixa', 'confirmar entrega', 'finalizar pedido']
  },
  {
    route: '/relatorios',
    name: 'Relatorios',
    description: 'Geracao de relatorios e analises do sistema',
    keywords: ['relatorios', 'relatorio', 'analise', 'exportar', 'imprimir'],
    synonyms: ['report', 'extrato', 'listagem', 'demonstrativo'],
    relatedTerms: ['pdf', 'excel', 'grafico', 'periodo', 'filtro', 'dados'],
    actions: ['gerar relatorio', 'exportar dados', 'imprimir', 'analisar']
  },
  
  // === MANUTENCAO ===
  {
    route: '/dashboard-manutencao',
    name: 'Dashboard de Manutencao',
    description: 'Painel de controle da area de manutencao',
    keywords: ['dashboard manutencao', 'painel manutencao', 'indicadores manutencao'],
    synonyms: ['visao manutencao', 'controle manutencao', 'cockpit manutencao'],
    relatedTerms: ['mtbf', 'mttr', 'disponibilidade', 'falhas', 'paradas'],
    actions: ['acompanhar manutencao', 'ver indicadores', 'monitorar equipamentos']
  },
  {
    route: '/maquinas',
    name: 'Maquinas',
    description: 'Cadastro e gestao de maquinas e equipamentos',
    keywords: ['maquinas', 'equipamentos', 'ativos', 'patrimonio'],
    synonyms: ['maquinario', 'aparelhos', 'dispositivos', 'ferramentas'],
    relatedTerms: ['tag', 'patrimonio', 'setor', 'modelo', 'fabricante', 'status'],
    actions: ['cadastrar maquina', 'consultar equipamento', 'ver status', 'editar ativo']
  },
  {
    route: '/manutencao-preventiva',
    name: 'Manutencao Preventiva',
    description: 'Planejamento e agendamento de manutencoes preventivas',
    keywords: ['preventiva', 'manutencao preventiva', 'planejamento', 'agendamento'],
    synonyms: ['programada', 'planejada', 'periodica', 'rotineira'],
    relatedTerms: ['frequencia', 'checklist', 'tarefa', 'calendario', 'agenda'],
    actions: ['agendar manutencao', 'planejar preventiva', 'criar tarefa', 'programar']
  },
  {
    route: '/execucao-manutencao',
    name: 'Execucao de Manutencao',
    description: 'Registro de execucao de tarefas de manutencao',
    keywords: ['execucao', 'executar', 'realizar', 'registrar manutencao'],
    synonyms: ['fazer manutencao', 'completar tarefa', 'finalizar servico'],
    relatedTerms: ['horas', 'observacao', 'conclusao', 'pecas utilizadas'],
    actions: ['executar tarefa', 'registrar execucao', 'finalizar manutencao']
  },
  {
    route: '/parada-maquina',
    name: 'Parada de Maquina',
    description: 'Registro de paradas e indisponibilidades de equipamentos',
    keywords: ['parada', 'parou', 'quebrou', 'falha', 'indisponivel', 'defeito'],
    synonyms: ['paralisacao', 'interrupcao', 'avaria', 'pane'],
    relatedTerms: ['motivo', 'tempo', 'causa', 'solucao', 'downtime'],
    actions: ['registrar parada', 'informar falha', 'abrir chamado parada']
  },
  {
    route: '/ordens-servico',
    name: 'Ordens de Servico',
    description: 'Gestao de ordens de servico corretivas',
    keywords: ['ordem servico', 'os', 'corretiva', 'chamado', 'solicitacao'],
    synonyms: ['ordem', 'ticket', 'atendimento', 'demanda'],
    relatedTerms: ['prioridade', 'status', 'responsavel', 'prazo', 'urgente'],
    actions: ['abrir os', 'criar ordem', 'acompanhar chamado', 'fechar os']
  },
  
  // === REQUISICOES ===
  {
    route: '/requisicoes',
    name: 'Requisicoes',
    description: 'Solicitacoes de materiais do estoque',
    keywords: ['requisicao', 'requisicoes', 'solicitar', 'pedido', 'solicitacao'],
    synonyms: ['pedido material', 'solicitacao material', 'requerimento'],
    relatedTerms: ['aprovacao', 'status', 'itens', 'quantidade', 'urgencia'],
    actions: ['criar requisicao', 'solicitar material', 'aprovar requisicao', 'acompanhar pedido']
  },
  {
    route: '/carrinho',
    name: 'Carrinho',
    description: 'Carrinho de compras para requisicoes',
    keywords: ['carrinho', 'cesta', 'selecao'],
    synonyms: ['carrinho de compras', 'itens selecionados', 'lista de pedido'],
    relatedTerms: ['adicionar', 'remover', 'quantidade', 'finalizar'],
    actions: ['adicionar ao carrinho', 'remover item', 'finalizar pedido']
  },
  {
    route: '/devolucao',
    name: 'Devolucoes',
    description: 'Registro de devolucao de materiais ao estoque',
    keywords: ['devolucao', 'devolver', 'retornar', 'retorno'],
    synonyms: ['devolver material', 'retornar item', 'restituir'],
    relatedTerms: ['motivo', 'quantidade', 'condicao', 'requisicao original'],
    actions: ['devolver material', 'registrar devolucao', 'retornar ao estoque']
  },
  
  // === COMPRAS ===
  {
    route: '/fornecedor-produtos',
    name: 'Ordens de Compra',
    description: 'Gestao de ordens de compra e cotacoes',
    keywords: ['ordem compra', 'oc', 'compra', 'cotacao', 'pedido compra'],
    synonyms: ['pedido fornecedor', 'aquisicao', 'procurement'],
    relatedTerms: ['fornecedor', 'preco', 'prazo', 'condicoes', 'entrega'],
    actions: ['criar ordem compra', 'fazer cotacao', 'aprovar oc']
  },
  {
    route: '/compras',
    name: 'Compras',
    description: 'Modulo de compras e aquisicoes',
    keywords: ['compras', 'adquirir', 'comprar', 'aquisicao'],
    synonyms: ['setor compras', 'procurement', 'suprimentos'],
    relatedTerms: ['fornecedor', 'preco', 'negociacao', 'contrato'],
    actions: ['solicitar compra', 'aprovar aquisicao', 'gerenciar compras']
  },
  
  // === FINANCEIRO ===
  {
    route: '/notas-fiscais-lancamento',
    name: 'NF - Lancamento',
    description: 'Lancamento financeiro de notas fiscais',
    keywords: ['lancamento', 'financeiro', 'nota fiscal', 'pagar', 'contas'],
    synonyms: ['lancar nota', 'registrar pagamento', 'contabilizar'],
    relatedTerms: ['valor', 'vencimento', 'parcela', 'pagamento'],
    actions: ['lancar nota', 'registrar financeiro', 'agendar pagamento']
  },
  {
    route: '/centro-custo',
    name: 'Centro de Custo',
    description: 'Gestao de centros de custo da empresa',
    keywords: ['centro custo', 'cc', 'custo', 'despesa', 'orcamento'],
    synonyms: ['centro de despesa', 'unidade de custo', 'conta'],
    relatedTerms: ['codigo', 'alocacao', 'budget', 'verba'],
    actions: ['criar centro custo', 'alocar despesa', 'gerenciar custos']
  },
  
  // === PRODUCAO ===
  {
    route: '/pcp',
    name: 'PCP',
    description: 'Planejamento e Controle da Producao',
    keywords: ['pcp', 'producao', 'planejamento', 'programacao', 'controle'],
    synonyms: ['planejamento producao', 'cronograma', 'scheduling'],
    relatedTerms: ['ordem producao', 'capacidade', 'demanda', 'lead time'],
    actions: ['planejar producao', 'programar fabricacao', 'controlar producao']
  },
  
  // === COMUNICACAO ===
  {
    route: '/chat',
    name: 'Chat',
    description: 'Comunicacao interna entre usuarios',
    keywords: ['chat', 'mensagem', 'conversa', 'comunicacao'],
    synonyms: ['bate-papo', 'messenger', 'direct', 'mensageiro'],
    relatedTerms: ['enviar', 'receber', 'grupo', 'notificacao'],
    actions: ['enviar mensagem', 'iniciar conversa', 'criar grupo']
  },
  {
    route: '/email',
    name: 'Email',
    description: 'Envio de emails pelo sistema',
    keywords: ['email', 'e-mail', 'correio', 'mensagem'],
    synonyms: ['correio eletronico', 'mail', 'enviar email'],
    relatedTerms: ['destinatario', 'assunto', 'anexo', 'caixa entrada'],
    actions: ['enviar email', 'compor mensagem', 'ver caixa entrada']
  },
  {
    route: '/reunioes',
    name: 'Reunioes',
    description: 'Agendamento e gestao de reunioes',
    keywords: ['reuniao', 'reunioes', 'meeting', 'encontro', 'agenda'],
    synonyms: ['encontro', 'conferencia', 'assembleia', 'sessao'],
    relatedTerms: ['participantes', 'pauta', 'horario', 'sala', 'convite'],
    actions: ['agendar reuniao', 'criar meeting', 'convidar participantes']
  },
  
  // === MANUAIS ===
  {
    route: '/manuais',
    name: 'Manuais',
    description: 'Biblioteca de manuais e documentos tecnicos',
    keywords: ['manual', 'manuais', 'documentacao', 'guia', 'instrucao'],
    synonyms: ['documento', 'procedimento', 'tutorial', 'help'],
    relatedTerms: ['pdf', 'equipamento', 'procedimento', 'passo a passo'],
    actions: ['consultar manual', 'buscar documentacao', 'ver instrucoes']
  },
  
  // === ADMINISTRATIVO ===
  {
    route: '/gestao-usuarios',
    name: 'Gestao de Usuarios',
    description: 'Cadastro e gerenciamento de usuarios do sistema',
    keywords: ['usuarios', 'usuario', 'cadastro', 'login', 'acesso'],
    synonyms: ['colaboradores', 'funcionarios', 'pessoas', 'contas'],
    relatedTerms: ['permissao', 'perfil', 'senha', 'email', 'ativo', 'inativo'],
    actions: ['criar usuario', 'editar acesso', 'desativar usuario', 'resetar senha']
  },
  {
    route: '/gestao-perfis',
    name: 'Gestao de Perfis',
    description: 'Configuracao de perfis e permissoes',
    keywords: ['perfis', 'perfil', 'permissao', 'permissoes', 'acesso'],
    synonyms: ['roles', 'funcoes', 'niveis acesso', 'privilegios'],
    relatedTerms: ['modulo', 'funcionalidade', 'restrito', 'liberado'],
    actions: ['criar perfil', 'editar permissoes', 'configurar acesso']
  },
  {
    route: '/gestao-produtos',
    name: 'Gestao de Produtos',
    description: 'Configuracoes avancadas de produtos',
    keywords: ['gestao produtos', 'configurar produtos', 'categorias'],
    synonyms: ['administrar produtos', 'parametros produtos'],
    relatedTerms: ['categoria', 'grupo', 'familia', 'atributo'],
    actions: ['configurar produto', 'criar categoria', 'organizar itens']
  },
  {
    route: '/unidades',
    name: 'Gestao de Unidades',
    description: 'Cadastro de unidades e filiais da empresa',
    keywords: ['unidades', 'unidade', 'filial', 'filiais', 'matriz'],
    synonyms: ['estabelecimento', 'local', 'planta', 'fabrica'],
    relatedTerms: ['endereco', 'responsavel', 'cnpj', 'codigo'],
    actions: ['criar unidade', 'cadastrar filial', 'editar local']
  },
  {
    route: '/gestao-manutencao',
    name: 'Gestao de Manutencao',
    description: 'Configuracoes do modulo de manutencao',
    keywords: ['gestao manutencao', 'configurar manutencao', 'parametros'],
    synonyms: ['administrar manutencao', 'setup manutencao'],
    relatedTerms: ['tipo', 'prioridade', 'frequencia', 'checklist'],
    actions: ['configurar manutencao', 'criar tipo', 'definir parametros']
  },
  {
    route: '/gestao-fornecedores',
    name: 'Gestao de Fornecedores',
    description: 'Cadastro e gerenciamento de fornecedores',
    keywords: ['fornecedores', 'fornecedor', 'parceiro', 'supplier'],
    synonyms: ['vendedor', 'distribuidor', 'representante', 'prestador'],
    relatedTerms: ['cnpj', 'contato', 'condicoes', 'prazo', 'pagamento'],
    actions: ['cadastrar fornecedor', 'editar parceiro', 'consultar fornecedor']
  },
  {
    route: '/gestao-tarefas',
    name: 'Gestao de Tarefas',
    description: 'Configuracao de tipos de tarefas de manutencao',
    keywords: ['tarefas', 'tarefa', 'atividade', 'servico'],
    synonyms: ['trabalho', 'job', 'operacao', 'acao'],
    relatedTerms: ['descricao', 'checklist', 'tempo', 'recurso'],
    actions: ['criar tarefa', 'configurar atividade', 'definir checklist']
  },
  {
    route: '/setores',
    name: 'Setores',
    description: 'Cadastro de setores e departamentos',
    keywords: ['setores', 'setor', 'departamento', 'area'],
    synonyms: ['divisao', 'secao', 'nucleo', 'equipe'],
    relatedTerms: ['responsavel', 'funcionarios', 'localizacao'],
    actions: ['criar setor', 'cadastrar departamento', 'editar area']
  },
  
  // === UTILITARIOS ===
  {
    route: '/importar-planilha',
    name: 'Importar Dados',
    description: 'Importacao de dados via planilha Excel',
    keywords: ['importar', 'planilha', 'excel', 'csv', 'upload'],
    synonyms: ['carregar dados', 'importacao', 'migrar dados'],
    relatedTerms: ['arquivo', 'template', 'modelo', 'formato'],
    actions: ['importar planilha', 'carregar excel', 'fazer upload']
  },
  
  // === DESENVOLVEDOR ===
  {
    route: '/planejamento-desenvolvimento',
    name: 'Planejamento de Desenvolvimento',
    description: 'Planejamento de novas funcionalidades e melhorias',
    keywords: ['planejamento', 'desenvolvimento', 'backlog', 'roadmap'],
    synonyms: ['sprint', 'projeto', 'demanda', 'melhoria'],
    relatedTerms: ['tarefa', 'prioridade', 'prazo', 'responsavel'],
    actions: ['criar demanda', 'planejar sprint', 'priorizar backlog']
  },
  {
    route: '/ide',
    name: 'IDE',
    description: 'Ambiente de desenvolvimento integrado',
    keywords: ['ide', 'codigo', 'desenvolvimento', 'programacao'],
    synonyms: ['editor', 'codificacao', 'desenvolvimento'],
    relatedTerms: ['script', 'funcao', 'debug', 'teste'],
    actions: ['escrever codigo', 'testar funcao', 'debugar']
  },
  {
    route: '/sistema',
    name: 'Sistema',
    description: 'Configuracoes gerais do sistema',
    keywords: ['sistema', 'configuracao', 'config', 'parametros'],
    synonyms: ['setup', 'ajustes', 'preferencias', 'opcoes'],
    relatedTerms: ['backup', 'versao', 'atualizacao', 'log'],
    actions: ['configurar sistema', 'fazer backup', 'ver logs']
  },
  {
    route: '/apex-ai',
    name: 'APEX AI',
    description: 'Configuracoes do assistente de IA',
    keywords: ['apex ai', 'ia', 'inteligencia artificial', 'assistente', 'chatbot'],
    synonyms: ['ai', 'bot', 'assistente virtual', 'agente'],
    relatedTerms: ['modelo', 'skill', 'prompt', 'configuracao'],
    actions: ['configurar ia', 'ajustar assistente', 'editar skill']
  },
  
  // === PERFIL ===
  {
    route: '/perfil',
    name: 'Perfil',
    description: 'Perfil e configuracoes pessoais do usuario',
    keywords: ['perfil', 'meu perfil', 'conta', 'minha conta'],
    synonyms: ['dados pessoais', 'meus dados', 'configuracoes pessoais'],
    relatedTerms: ['foto', 'senha', 'email', 'nome', 'preferencias'],
    actions: ['editar perfil', 'alterar senha', 'atualizar dados']
  }
];

/**
 * Normaliza texto removendo acentos e convertendo para minusculas
 */
const normalizeTextForSearch = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

/**
 * Calcula a similaridade entre duas strings (0 a 1)
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeTextForSearch(str1);
  const s2 = normalizeTextForSearch(str2);
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Levenshtein distance simplificado
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  let matches = 0;
  const shorterWords = shorter.split(' ');
  for (const word of shorterWords) {
    if (longer.includes(word) && word.length > 2) {
      matches++;
    }
  }
  
  return matches / shorterWords.length;
};

/**
 * Busca paginas relacionadas a um termo de busca
 * Retorna as paginas mais relevantes com score de confianca
 */
export const searchRelatedPages = (query: string, maxResults: number = 5): Array<{
  page: PageSemanticMapping;
  score: number;
  matchType: 'exact' | 'keyword' | 'synonym' | 'related' | 'action' | 'fuzzy';
}> => {
  const normalizedQuery = normalizeTextForSearch(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
  const results: Array<{ page: PageSemanticMapping; score: number; matchType: string }> = [];
  
  for (const page of PAGE_SEMANTIC_MAP) {
    let bestScore = 0;
    let matchType = 'fuzzy';
    
    // 1. Match exato no nome (score: 1.0)
    if (normalizeTextForSearch(page.name) === normalizedQuery) {
      bestScore = 1.0;
      matchType = 'exact';
    }
    
    // 2. Match em keywords (score: 0.9)
    if (bestScore < 0.9) {
      for (const keyword of page.keywords) {
        const normalizedKeyword = normalizeTextForSearch(keyword);
        if (normalizedQuery.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedQuery)) {
          bestScore = Math.max(bestScore, 0.9);
          matchType = 'keyword';
        }
        // Match parcial de palavras
        for (const word of queryWords) {
          if (normalizedKeyword.includes(word) || word.includes(normalizedKeyword)) {
            bestScore = Math.max(bestScore, 0.85);
            matchType = 'keyword';
          }
        }
      }
    }
    
    // 3. Match em sinonimos (score: 0.85)
    if (bestScore < 0.85) {
      for (const synonym of page.synonyms) {
        const normalizedSynonym = normalizeTextForSearch(synonym);
        if (normalizedQuery.includes(normalizedSynonym) || normalizedSynonym.includes(normalizedQuery)) {
          bestScore = Math.max(bestScore, 0.85);
          matchType = 'synonym';
        }
        for (const word of queryWords) {
          if (normalizedSynonym.includes(word) || word.includes(normalizedSynonym)) {
            bestScore = Math.max(bestScore, 0.8);
            matchType = 'synonym';
          }
        }
      }
    }
    
    // 4. Match em termos relacionados (score: 0.75)
    if (bestScore < 0.75) {
      for (const term of page.relatedTerms) {
        const normalizedTerm = normalizeTextForSearch(term);
        if (normalizedQuery.includes(normalizedTerm) || normalizedTerm.includes(normalizedQuery)) {
          bestScore = Math.max(bestScore, 0.75);
          matchType = 'related';
        }
        for (const word of queryWords) {
          if (normalizedTerm.includes(word) || word.includes(normalizedTerm)) {
            bestScore = Math.max(bestScore, 0.7);
            matchType = 'related';
          }
        }
      }
    }
    
    // 5. Match em acoes (score: 0.7)
    if (bestScore < 0.7) {
      for (const action of page.actions) {
        const normalizedAction = normalizeTextForSearch(action);
        const similarity = calculateSimilarity(normalizedQuery, normalizedAction);
        if (similarity > 0.5) {
          bestScore = Math.max(bestScore, 0.65 + similarity * 0.1);
          matchType = 'action';
        }
      }
    }
    
    // 6. Match fuzzy na descricao (score: 0.5)
    if (bestScore < 0.5) {
      const normalizedDesc = normalizeTextForSearch(page.description);
      for (const word of queryWords) {
        if (normalizedDesc.includes(word)) {
          bestScore = Math.max(bestScore, 0.5);
          matchType = 'fuzzy';
        }
      }
    }
    
    if (bestScore > 0.3) {
      results.push({ page, score: bestScore, matchType: matchType as 'exact' | 'keyword' | 'synonym' | 'related' | 'action' | 'fuzzy' });
    }
  }
  
  // Ordenar por score e retornar top N
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
