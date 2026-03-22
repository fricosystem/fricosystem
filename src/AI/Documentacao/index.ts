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
 * @returns Array com todas as rotas documentadas
 */
export const getAllDocumentedPages = (): string[] => {
  return Object.keys(pageDocMap);
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
    '/perfil': 'Perfil',
  };
  
  const normalizedPath = path.split('?')[0].replace(/\/$/, '') || '/dashboard';
  return pageNames[normalizedPath] || 'Pagina';
};
