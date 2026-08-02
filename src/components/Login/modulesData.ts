/**
 * Conteúdo institucional dos módulos exibidos na página inicial.
 * Cada módulo vira uma seção própria com todas as suas funcionalidades.
 */
export type ModuleAccent = "emerald" | "blue" | "orange" | "cyan" | "indigo" | "purple" | "sky";

export interface ModuleFeature {
  name: string;
  desc: string;
}

export interface ModuleSection {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  accent: ModuleAccent;
  iconKey: string;
  highlights: string[];
  features: ModuleFeature[];
}

export const moduleSections: ModuleSection[] = [
  {
    id: "modulo-estoque",
    label: "Estoque",
    eyebrow: "Materiais e Almoxarifado",
    title: "Gestão de",
    highlight: "Estoque",
    description:
      "Controle total do almoxarifado: do cadastro do item à posição exata na prateleira, com entradas fiscais, transferências entre unidades e inventário cíclico auditável.",
    accent: "emerald",
    iconKey: "package",
    highlights: [
      "Saldo por unidade, depósito e endereço em tempo real",
      "Alertas de estoque mínimo, máximo e itens sem giro",
      "Rastreio completo de cada movimentação por usuário",
    ],
    features: [
      { name: "Produtos", desc: "Cadastro com código, descrição, unidade de medida, preço, imagem, classificação fiscal e vínculo com fornecedores." },
      { name: "Gestão de Produtos", desc: "Manutenção em massa do catálogo: revisão de dados, ativação/inativação e correção de divergências cadastrais." },
      { name: "Notas Fiscais", desc: "Lançamento de entrada por importação de XML ou digitação manual, com conferência item a item antes de creditar o estoque." },
      { name: "Entrada Manual", desc: "Registro de recebimentos sem nota (amostras, doações, retornos) com justificativa obrigatória e responsável identificado." },
      { name: "Transferências", desc: "Movimentação entre depósitos e unidades com baixa na origem e crédito no destino em uma única operação." },
      { name: "Endereçamento", desc: "Mapa de armazenagem por rua, prédio, nível e apartamento para localizar qualquer item em segundos." },
      { name: "Inventário", desc: "Contagem cíclica ou geral com registro de divergências, ajuste controlado e relatório de acuracidade." },
      { name: "Medida de Lenha", desc: "Módulo específico de recebimento e cubagem de biomassa com cálculo automático de volume." },
    ],
  },
  {
    id: "modulo-requisicoes",
    label: "Requisições",
    eyebrow: "Suprimentos e Compras",
    title: "Requisições e",
    highlight: "Suprimentos",
    description:
      "Da necessidade do chão de fábrica até a compra concluída: fluxo de solicitação com aprovação, separação, baixa, devolução e negociação com fornecedores.",
    accent: "blue",
    iconKey: "clipboard",
    highlights: [
      "Aprovação multinível por perfil, setor e centro de custo",
      "Histórico completo de quem pediu, aprovou e retirou",
      "Comparativo de propostas antes de fechar a compra",
    ],
    features: [
      { name: "Requisições", desc: "Solicitação de materiais com centro de custo, urgência, justificativa e acompanhamento de status em cada etapa." },
      { name: "Carrinho", desc: "Montagem da requisição item a item com consulta de saldo disponível antes do envio para aprovação." },
      { name: "Baixa de Requisição", desc: "Separação e entrega do material com confirmação do solicitante e baixa automática no saldo." },
      { name: "Devolução de Materiais", desc: "Retorno de itens não utilizados ao estoque, com reavaliação de estado e recomposição do saldo." },
      { name: "Compras", desc: "Geração de pedidos de compra a partir das necessidades, com acompanhamento de prazos de entrega." },
      { name: "Cotações e Orçamentos", desc: "Solicitação de propostas a vários fornecedores e comparação de preço, prazo e condição de pagamento." },
      { name: "Fornecedores", desc: "Cadastro de parceiros com CNPJ, contatos, condições comerciais e histórico de fornecimento." },
      { name: "Produtos por Fornecedor", desc: "Vínculo entre itens e fornecedores homologados, com referência e último preço praticado." },
    ],
  },
  {
    id: "modulo-manutencao",
    label: "Manutenção",
    eyebrow: "Confiabilidade de Ativos",
    title: "Manutenção",
    highlight: "Industrial",
    description:
      "Planeje, execute e comprove a manutenção da planta inteira. Preventivas programadas, ordens de serviço rastreadas e registro de paradas com impacto na produção.",
    accent: "orange",
    iconKey: "wrench",
    highlights: [
      "Planos preventivos por frequência, horímetro ou calendário",
      "Consumo de peças integrado ao estoque em cada OS",
      "Indicadores de disponibilidade, MTTR e MTBF",
    ],
    features: [
      { name: "Gestão de Manutenção", desc: "Painel central com a carteira de serviços, backlog, prioridades e distribuição por equipe." },
      { name: "Dashboard de Manutenção", desc: "Indicadores visuais de disponibilidade, paradas, custos e cumprimento do plano preventivo." },
      { name: "Manutenção Preventiva", desc: "Planos com periodicidade, checklists de tarefas, responsáveis e geração automática das ordens." },
      { name: "Ordens de Serviço", desc: "Abertura, priorização, apontamento e encerramento de OS corretivas e preventivas com histórico imutável." },
      { name: "Execução de Manutenção", desc: "Apontamento de mão de obra, horas trabalhadas, peças aplicadas e evidências direto na execução." },
      { name: "Parada de Máquina", desc: "Registro de paradas com motivo, início, término, duração e impacto sobre a produção." },
      { name: "Máquinas e Equipamentos", desc: "Ficha do ativo com patrimônio, setor, criticidade, documentos e todo o histórico de intervenções." },
      { name: "Gestão de Tarefas", desc: "Distribuição e acompanhamento das atividades da equipe técnica com prazos e status." },
    ],
  },
  {
    id: "modulo-qualidade",
    label: "Qualidade",
    eyebrow: "Conformidade e Rastreabilidade",
    title: "Controle de",
    highlight: "Qualidade",
    description:
      "Elimine o papel do chão de fábrica. Checklists versionados, coleta mobile com evidências, trilha de auditoria imutável e tratamento estruturado de não conformidades.",
    accent: "cyan",
    iconKey: "filecheck",
    highlights: [
      "Histórico auditável para conformidade ISO e MAPA",
      "Bloqueio de liberação quando há desvio em aberto",
      "Análise de causa raiz com Ishikawa e plano 5W2H",
    ],
    features: [
      { name: "Dashboard de Qualidade", desc: "Visão consolidada de inspeções realizadas, desvios abertos, reincidências e índices de conformidade." },
      { name: "Engenharia de Planilhas", desc: "Criação de modelos de inspeção dinâmicos, com campos condicionais, limites de especificação e versionamento." },
      { name: "Execução de Inspeção", desc: "Coleta mobile em tempo real no chão de fábrica com fotos, assinaturas e validação automática de limites." },
      { name: "Agendamento", desc: "Programação das coletas por turno, linha e periodicidade, com alerta de inspeções em atraso." },
      { name: "Rastreabilidade", desc: "Trilha de auditoria imutável de cada alteração, com autor, data e valor anterior de cada campo." },
      { name: "Melhoria Contínua", desc: "Registro de não conformidades, análise de causa raiz (Ishikawa) e planos de ação 5W2H com acompanhamento." },
      { name: "Relatórios de CQ", desc: "Emissão de laudos, relatórios por período, produto ou linha e exportação para auditorias." },
      { name: "Cadastros e Configurações", desc: "Parametrização de linhas, produtos, turnos, responsáveis e regras de bloqueio do módulo." },
    ],
  },
  {
    id: "modulo-pcp",
    label: "PCP",
    eyebrow: "Planejamento da Produção",
    title: "PCP e",
    highlight: "Indicadores",
    description:
      "Planejamento e controle da produção conectado ao estoque e à manutenção, com relatórios gerenciais que transformam o dado operacional em decisão.",
    accent: "indigo",
    iconKey: "gauge",
    highlights: [
      "Programação alinhada à disponibilidade de material",
      "Relatórios por período, setor e centro de custo",
      "Exportação dos dados para análise externa",
    ],
    features: [
      { name: "PCP", desc: "Programação de produção com sequenciamento, apontamento de ordens e visão da capacidade disponível." },
      { name: "Planejamento e Desenvolvimento", desc: "Acompanhamento de projetos e melhorias com etapas, responsáveis e marcos de entrega." },
      { name: "Relatórios Gerenciais", desc: "Consultas parametrizáveis de estoque, consumo, manutenção e custos com exportação em planilha." },
      { name: "Dashboard Operacional", desc: "Painel inicial com os indicadores-chave da operação atualizados em tempo real." },
    ],
  },
  {
    id: "modulo-administracao",
    label: "Administração",
    eyebrow: "Governança e Acessos",
    title: "Administração e",
    highlight: "Controle de Acesso",
    description:
      "Estrutura organizacional e segurança do sistema em um só lugar: perfis com permissão granular, unidades, setores e rateio por centro de custo.",
    accent: "purple",
    iconKey: "settings",
    highlights: [
      "Permissões por perfil, tela e ação",
      "Isolamento de dados por unidade industrial",
      "Rastreio de acessos e alterações sensíveis",
    ],
    features: [
      { name: "Gestão de Usuários", desc: "Criação e manutenção de contas, vínculo com unidade, setor e perfil de acesso." },
      { name: "Gestão de Perfis", desc: "Definição granular de permissões por tela e por ação (visualizar, criar, editar, excluir)." },
      { name: "Unidades", desc: "Cadastro de filiais e plantas com segregação dos dados operacionais de cada uma." },
      { name: "Setores", desc: "Organização da planta por áreas produtivas e administrativas, base para requisições e ativos." },
      { name: "Centro de Custo", desc: "Alocação de despesas por área, projeto ou equipamento para análise de custo real." },
      { name: "Painel Administrativo", desc: "Configurações gerais do sistema, parâmetros de operação e manutenção dos cadastros base." },
    ],
  },
  {
    id: "modulo-colaboracao",
    label: "Colaboração",
    eyebrow: "Comunicação e Documentos",
    title: "Colaboração e",
    highlight: "Documentação",
    description:
      "A operação conversa dentro do próprio sistema. Mensagens, e-mails, reuniões e a biblioteca técnica sempre ao lado do dado que originou a conversa.",
    accent: "sky",
    iconKey: "message",
    highlights: [
      "Comunicação interna sem sair do sistema",
      "Documentos técnicos versionados e pesquisáveis",
      "Importação de dados em massa por planilha",
    ],
    features: [
      { name: "Chat Interno", desc: "Conversas diretas e em grupo entre equipes, com histórico preservado." },
      { name: "E-mail", desc: "Envio e acompanhamento de mensagens vinculadas às rotinas do sistema." },
      { name: "Reuniões", desc: "Agendamento de encontros com participantes, pauta e registro de decisões." },
      { name: "Manuais", desc: "Biblioteca digital de manuais técnicos, procedimentos e instruções de trabalho." },
      { name: "Importar Planilha", desc: "Carga de dados em massa a partir de arquivos Excel com validação prévia dos registros." },
    ],
  },
];
