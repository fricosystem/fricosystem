import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { 
  Bot, 
  User, 
  Loader2, 
  Send, 
  AlertCircle, 
  X, 
  Trash2, 
  Sparkles,
  HelpCircle,
  FileText,
  Package,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Sheet, 
  SheetContent,
  SheetTitle
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit, 
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import skillPrompt from "@/AI/Skill.md?raw";
import { getPageDocumentation, getPageName, hasPageDocumentation } from "@/AI/Documentacao/index";
import { getGroqApiKey } from "@/services/apiKeyService";

// =============================================
// INTERFACES E TIPOS
// =============================================

interface ProdutoSugestao {
  id: string;
  nome: string;
  codigo_estoque: string;
}

interface ProdutoCard {
  id: string;
  nome: string;
  codigo_estoque: string;
  codigo_material: string;
  quantidade: number;
  unidade_de_medida: string;
  valor_unitario: number;
  fornecedor_nome: string | null;
  deposito: string;
  prateleira: string;
  imageUrl: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  produtosSugeridos?: ProdutoSugestao[];
  produtosComImagem?: ProdutoCard[];
}

interface ApexChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContextualSuggestion {
  label: string;
  query: string;
  icon?: React.ReactNode;
}

// Interfaces para todas as coleções
interface ProdutoChatData {
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
  data_vencimento: string;
  fornecedor_nome: string | null;
  fornecedor_cnpj: string | null;
  fornecedor_id: string | null;
  ativo: string;
  imageUrl?: string;
}

interface FornecedorChatData {
  id: string;
  razaoSocial: string;
  cnpj: string;
  endereco: {
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  telefone: string;
  email: string;
  pessoaContato: string;
  condicoesPagamento: string;
  prazoEntrega: string;
}

interface EquipamentoChatData {
  id: string;
  equipamento: string;
  patrimonio: string;
  setor: string;
  tag: string;
  status: string;
  descricao: string;
}

interface ManutentorChatData {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  email: string;
  telefone: string;
  status: string;
}

interface ManualChatData {
  id: string;
  titulo: string;
  subtitulo: string;
  ativo: boolean;
  dataCriacao: string;
}

interface TarefaManutencaoChatData {
  id: string;
  titulo: string;
  descricao: string;
  equipamento: string;
  setor: string;
  frequencia: string;
  status: string;
  prioridade: string;
  manutentor: string;
  dataHoraAgendada: string;
}

interface OrdemServicoChatData {
  id: string;
  titulo: string;
  descricao: string;
  equipamento: string;
  setor: string;
  status: string;
  prioridade: string;
  dataAbertura: string;
  dataConclusao: string;
}

interface UnidadeChatData {
  id: string;
  nome: string;
  codigo: string;
  endereco: string;
  responsavel: string;
  telefone: string;
}

interface SetorChatData {
  id: string;
  nome: string;
  descricao: string;
  responsavel: string;
  unidade: string;
}

interface CentroCustoChatData {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
}

interface DatabaseContextResult {
  hasRelevantData: boolean;
  context: string;
  fallbackAnswer: string;
  produtosSugeridos?: ProdutoSugestao[];
  produtosComImagem?: ProdutoCard[];
}

// =============================================
// CONSTANTES E UTILITÁRIOS
// =============================================

const STOP_WORDS = new Set([
  "quais", "qual", "quero", "mostrar", "mostre", "listar", "liste", "tem", "tenho",
  "produto", "produtos", "item", "itens", "do", "da", "de", "dos", "das", "no", "na",
  "nos", "nas", "com", "sem", "por", "para", "que", "em", "os", "as", "um", "uma",
  "mais", "menos", "me", "traga", "busque", "buscar", "sobre", "onde", "como", "quando",
  "maquina", "maquinas", "equipamento", "equipamentos", "fornecedor", "fornecedores",
  "manutentor", "manutentores", "manual", "manuais", "tarefa", "tarefas", "ordem", "ordens"
]);

const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatCurrencyBRL = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00";

// Mapeamento de sugestões contextuais por página
const PAGE_SUGGESTIONS: Record<string, ContextualSuggestion[]> = {
  '/dashboard': [
    { label: 'Resumo do dia', query: 'Me dê um resumo geral do sistema hoje' },
    { label: 'Alertas de estoque', query: 'Quais produtos estão com estoque baixo?' },
    { label: 'OS pendentes', query: 'Quantas ordens de serviço estão pendentes?' },
  ],
  '/produtos': [
    { label: 'Estoque baixo', query: 'Liste produtos com estoque abaixo do mínimo' },
    { label: 'Mais caros', query: 'Quais são os 10 produtos mais caros?' },
    { label: 'Sem estoque', query: 'Quais produtos estão zerados?' },
    { label: 'Vencendo', query: 'Quais produtos estão próximos do vencimento?' },
  ],
  '/maquinas': [
    { label: 'Máquinas paradas', query: 'Quais máquinas estão paradas?' },
    { label: 'Manutenção pendente', query: 'Quais equipamentos têm manutenção pendente?' },
    { label: 'Status geral', query: 'Qual o status geral dos equipamentos?' },
  ],
  '/ordens-servico': [
    { label: 'OS abertas', query: 'Liste todas as ordens de serviço abertas' },
    { label: 'OS urgentes', query: 'Quais OS têm prioridade alta?' },
    { label: 'OS concluídas hoje', query: 'Quantas OS foram concluídas hoje?' },
  ],
  '/manutencao-preventiva': [
    { label: 'Próximas tarefas', query: 'Quais são as próximas tarefas de manutenção agendadas?' },
    { label: 'Atrasadas', query: 'Existem tarefas de manutenção atrasadas?' },
    { label: 'Por equipamento', query: 'Quais tarefas estão agendadas para cada equipamento?' },
  ],
  '/requisicoes': [
    { label: 'Pendentes', query: 'Quais requisições estão pendentes de aprovação?' },
    { label: 'Mais solicitados', query: 'Quais produtos são mais requisitados?' },
  ],
  '/fornecedor-produtos': [
    { label: 'Fornecedores ativos', query: 'Liste todos os fornecedores ativos' },
    { label: 'Por produto', query: 'Quais fornecedores fornecem quais produtos?' },
  ],
  '/inventario': [
    { label: 'Divergências', query: 'Existem divergências no inventário?' },
    { label: 'Último inventário', query: 'Quando foi realizado o último inventário completo?' },
  ],
  '/relatorios': [
    { label: 'Relatório mensal', query: 'Gere um resumo mensal do estoque' },
    { label: 'Movimentações', query: 'Quais foram as principais movimentações do mês?' },
  ],
};

// Comandos rápidos disponíveis
const QUICK_COMMANDS = [
  { command: '/ajuda', description: 'Mostra comandos disponíveis', action: 'help' },
  { command: '/pagina', description: 'Explica a página atual', action: 'page' },
  { command: '/limpar', description: 'Limpa o histórico', action: 'clear' },
];

// =============================================
// FUNÇÕES DE BUSCA DE DADOS
// =============================================

const detectRelevantCollections = (message: string): string[] => {
  const normalized = normalizeText(message);
  const collections: string[] = [];
  
  if (/(produto|estoque|deposito|prateleira|vencimento|codigo|material|quantidade|barato|caro|item|itens|preco|valor|peca|pecas|veda|rosca|lubrificante|oleo|filtro|correia|rolamento|parafuso|arruela|anel|junta|vedacao|mangueira|bomba|motor|valvula|sensor|rele|fusivel|lampada|cabo|fio|tubo|conexao|abraca|braçadeira|chapa|barra|cantoneira|perfil|solda|eletrodo|disco|lixa|serra|broca|fresa|ferramenta|epi|luva|oculos|mascara|capacete|bota|uniforme)/.test(normalized)) {
    collections.push("produtos");
  }

  if (/(fornecedor|cnpj|razao social|pagamento|prazo entrega|contato|fornece|quem vende|onde compro)/.test(normalized)) {
    collections.push("fornecedores");
  }

  if (/(maquina|equipamento|patrimonio|tag)/.test(normalized) && !/(manutentor)/.test(normalized)) {
    collections.push("equipamentos");
  }

  if (/(manutentor|tecnico|tecnicos|quem faz|responsavel)/.test(normalized) && !/(tarefa|ordem|servico)/.test(normalized)) {
    collections.push("manutentores");
  }

  if (/(manual|manuais|instrucao|instrucoes|documento)/.test(normalized)) {
    collections.push("manuais");
  }

  if (/(tarefa|tarefas|preventiva|agendada|agendamento|frequencia)/.test(normalized)) {
    collections.push("tarefas_manutencao");
  }

  if (/(ordem|ordens|os\b|servico|servicos|aberta|pendente|concluida)/.test(normalized)) {
    collections.push("ordens_servicos");
  }

  if (/(unidade|unidades|filial|filiais|loja|lojas)/.test(normalized) && !/(medida)/.test(normalized)) {
    collections.push("unidades");
  }

  if (/(setor|setores|departamento|area)/.test(normalized) && !/(equipamento|maquina)/.test(normalized)) {
    collections.push("setores");
  }

  if (/(centro de custo|centro custo|custo|centros)/.test(normalized)) {
    collections.push("centros_de_custo");
  }

  if (collections.length === 0 && /(quantos|quantas|lista|listar|mostre|mostrar|tem|temos|existe|buscar|encontrar|relatorio|resumo|total|qual|quais|onde|como|quanto)/.test(normalized)) {
    collections.push("produtos", "fornecedores", "equipamentos");
  }

  if (collections.length === 0) {
    const words = normalized.split(/\s+/).filter(w => w.length >= 3);
    if (words.length >= 1 && words.length <= 10) {
      collections.push("produtos");
    }
  }

  return collections;
};

const extractSearchTerms = (message: string) => {
  const normalized = normalizeText(message).replace(/[^\w\s]/g, " ");
  return normalized
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
    .slice(0, 5);
};

const fetchProdutosRaw = async (): Promise<ProdutoChatData[]> => {
  try {
    const snap = await getDocs(query(collection(db, "produtos"), limit(500)));
    return snap.docs.map((docRef) => {
      const d = docRef.data();
      return {
        id: docRef.id,
        codigo_estoque: d.codigo_estoque || d.codigoEstoque || "",
        codigo_material: d.codigo_material || d.codigoMaterial || "",
        nome: d.nome || d.descricao || d.produto || "",
        quantidade: d.quantidade ?? d.qtd ?? d.qtdEstoque ?? 0,
        quantidade_minima: d.quantidade_minima || d.quantidadeMinima || 0,
        valor_unitario: d.valor_unitario || d.valorUnitario || d.preco || 0,
        unidade_de_medida: d.unidade_de_medida || d.unidadeMedida || d.un || "",
        deposito: d.deposito || d.almoxarifado || "",
        prateleira: d.prateleira || "",
        unidade: d.unidade || d.filial || "",
        detalhes: d.detalhes || d.observacao || "",
        data_vencimento: d.data_vencimento || d.dataVencimento || "",
        fornecedor_nome: d.fornecedor_nome || d.fornecedorNome || null,
        fornecedor_cnpj: d.fornecedor_cnpj || d.fornecedorCnpj || null,
        fornecedor_id: d.fornecedor_id || d.fornecedorId || null,
        ativo: d.ativo ?? d.status ?? "sim",
        imageUrl: d.imageUrl || d.imagem || d.foto || d.image || d.url_imagem || null,
      } as ProdutoChatData;
    });
  } catch {
    return [];
  }
};

const fetchProdutosContext = async (message: string): Promise<string> => {
  try {
    let produtosSnapshot;
    try {
      produtosSnapshot = await getDocs(query(collection(db, "produtos"), limit(500)));
    } catch {
      produtosSnapshot = await getDocs(collection(db, "produtos"));
    }
    
    const produtos = produtosSnapshot.docs.map((docRef) => {
      const data = docRef.data();
      return {
        id: docRef.id,
        codigo_estoque: data.codigo_estoque || data.codigoEstoque || "",
        codigo_material: data.codigo_material || data.codigoMaterial || "",
        nome: data.nome || data.descricao || data.produto || "",
        quantidade: data.quantidade || data.qtd || data.qtdEstoque || 0,
        quantidade_minima: data.quantidade_minima || data.quantidadeMinima || data.estoqueMinimo || 0,
        valor_unitario: data.valor_unitario || data.valorUnitario || data.preco || data.valor || 0,
        unidade_de_medida: data.unidade_de_medida || data.unidadeMedida || data.un || "",
        deposito: data.deposito || data.almoxarifado || "",
        prateleira: data.prateleira || data.localizacao || "",
        unidade: data.unidade || data.filial || "",
        detalhes: data.detalhes || data.observacao || data.obs || "",
        data_vencimento: data.data_vencimento || data.dataVencimento || data.validade || "",
        fornecedor_nome: data.fornecedor_nome || data.fornecedorNome || data.fornecedor || null,
        fornecedor_cnpj: data.fornecedor_cnpj || data.fornecedorCnpj || data.cnpjFornecedor || null,
        fornecedor_id: data.fornecedor_id || data.fornecedorId || null,
        ativo: data.ativo ?? data.status ?? "sim",
      } as ProdutoChatData;
    });

    const normalizedMessage = normalizeText(message);
    let filtered = [...produtos];

    if (normalizedMessage.includes("inativo")) {
      filtered = filtered.filter((p) => normalizeText(String(p.ativo)) === "nao" || normalizeText(String(p.ativo)) === "não" || p.ativo === false);
    } else if (!normalizedMessage.includes("todos") && !normalizedMessage.includes("todas")) {
      filtered = filtered.filter((p) => {
        const ativoStr = normalizeText(String(p.ativo));
        return ativoStr !== "nao" && ativoStr !== "não" && p.ativo !== false && p.ativo !== "false";
      });
    }

    if (/(zerado|sem estoque|esgotado|quantidade zero)/.test(normalizedMessage)) {
      filtered = filtered.filter((p) => p.quantidade <= 0);
    } else if (/(baixo estoque|estoque baixo|abaixo do minimo|repor|faltando)/.test(normalizedMessage)) {
      filtered = filtered.filter((p) => p.quantidade < p.quantidade_minima);
    }

    const searchTerms = extractSearchTerms(message);
    
    if (searchTerms.length > 0) {
      const filteredBySearch = filtered.filter((produto) => {
        const base = normalizeText(
          `${produto.nome} ${produto.codigo_estoque} ${produto.codigo_material} ${produto.detalhes} ${produto.fornecedor_nome || ""} ${produto.fornecedor_cnpj || ""} ${produto.deposito} ${produto.prateleira} ${produto.unidade}`
        );
        return searchTerms.some((term) => base.includes(term));
      });
      
      if (filteredBySearch.length > 0) {
        filtered = filteredBySearch;
      }
    }

    if (/(mais barato|menor preco)/.test(normalizedMessage)) {
      filtered.sort((a, b) => a.valor_unitario - b.valor_unitario);
    } else if (/(mais caro|maior preco)/.test(normalizedMessage)) {
      filtered.sort((a, b) => b.valor_unitario - a.valor_unitario);
    }

    const topProdutos = filtered.slice(0, 30);
    const totalProdutos = produtos.length;
    const totalFiltrado = filtered.length;

    if (topProdutos.length === 0) {
      return `\n\n=== COLECAO PRODUTOS ===\nTotal de produtos no sistema: ${totalProdutos}\nNenhum produto encontrado com os criterios de busca.`;
    }

    const contextoProdutos = topProdutos
      .map((p, i) =>
        `${i + 1}. Nome: ${p.nome} | Codigo Estoque: ${p.codigo_estoque} | Codigo Material: ${p.codigo_material} | Quantidade: ${p.quantidade} | Minimo: ${p.quantidade_minima} | Valor: ${formatCurrencyBRL(p.valor_unitario)} | Unidade Medida: ${p.unidade_de_medida} | Deposito: ${p.deposito} | Prateleira: ${p.prateleira} | Unidade: ${p.unidade} | Fornecedor: ${p.fornecedor_nome || "nao informado"} | CNPJ Fornecedor: ${p.fornecedor_cnpj || "nao informado"} | Vencimento: ${p.data_vencimento || "nao informado"} | Ativo: ${p.ativo} | Detalhes: ${p.detalhes || "nao informado"}`
      )
      .join("\n");

    return `\n\n=== COLECAO PRODUTOS ===\nTotal de produtos no sistema: ${totalProdutos}\nProdutos encontrados na busca: ${totalFiltrado}\nExibindo os primeiros ${topProdutos.length} registros:\n${contextoProdutos}`;
  } catch (error) {
    console.error("[APEX] Erro ao buscar produtos:", error);
    return `\n\n=== COLECAO PRODUTOS ===\nErro ao acessar dados de produtos: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
  }
};

const fetchFornecedoresContext = async (message: string): Promise<string> => {
  try {
    const fornecedoresSnapshot = await getDocs(collection(db, "fornecedores"));
    const fornecedores = fornecedoresSnapshot.docs.map((docRef) => {
      const data = docRef.data();
      return {
        id: docRef.id,
        razaoSocial: data.razaoSocial || "",
        cnpj: data.cnpj || "",
        endereco: data.endereco || { rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", cep: "" },
        telefone: data.telefone || "",
        email: data.email || "",
        pessoaContato: data.pessoaContato || "",
        condicoesPagamento: data.condicoesPagamento || "",
        prazoEntrega: data.prazoEntrega || "",
      } as FornecedorChatData;
    });

    const searchTerms = extractSearchTerms(message);
    let filtered = [...fornecedores];

    if (searchTerms.length > 0) {
      filtered = filtered.filter((f) => {
        const base = normalizeText(
          `${f.razaoSocial} ${f.cnpj} ${f.email} ${f.telefone} ${f.pessoaContato} ${f.endereco.cidade} ${f.endereco.estado}`
        );
        return searchTerms.some((term) => base.includes(term));
      });
    }

    const topFornecedores = filtered.slice(0, 20);
    const totalFornecedores = fornecedores.length;
    const totalFiltrado = filtered.length;

    const contextoFornecedores = topFornecedores
      .map((f, i) =>
        `${i + 1}. Razao Social: ${f.razaoSocial} | CNPJ: ${f.cnpj} | Telefone: ${f.telefone} | Email: ${f.email} | Contato: ${f.pessoaContato} | Endereco: ${f.endereco.rua}, ${f.endereco.numero}, ${f.endereco.bairro}, ${f.endereco.cidade}/${f.endereco.estado} - CEP: ${f.endereco.cep} | Condicoes de Pagamento: ${f.condicoesPagamento} | Prazo de Entrega: ${f.prazoEntrega}`
      )
      .join("\n");

    return `\n\n=== COLECAO FORNECEDORES ===\nTotal de fornecedores no sistema: ${totalFornecedores}\nFornecedores encontrados na busca: ${totalFiltrado}\nExibindo os primeiros ${topFornecedores.length} registros:\n${contextoFornecedores}`;
  } catch (error) {
    console.error("[APEX] Erro ao buscar fornecedores:", error);
    return `\n\n=== COLECAO FORNECEDORES ===\nErro ao acessar dados de fornecedores: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
  }
};

const fetchEquipamentosContext = async (message: string): Promise<string> => {
  try {
    const equipamentosSnapshot = await getDocs(collection(db, "equipamentos"));
    const equipamentos = equipamentosSnapshot.docs.map((docRef) => {
      const data = docRef.data();
      return {
        id: docRef.id,
        equipamento: data.equipamento || "",
        patrimonio: data.patrimonio || "",
        setor: data.setor || "",
        tag: data.tag || "",
        status: data.status || "Ativa",
        descricao: data.descricao || "",
      } as EquipamentoChatData;
    });

    const searchTerms = extractSearchTerms(message);
    let filtered = [...equipamentos];

    if (searchTerms.length > 0) {
      filtered = filtered.filter((e) => {
        const base = normalizeText(`${e.equipamento} ${e.patrimonio} ${e.setor} ${e.tag} ${e.descricao}`);
        return searchTerms.some((term) => base.includes(term));
      });
    }

    const topEquipamentos = filtered.slice(0, 20);
    const totalEquipamentos = equipamentos.length;
    const totalFiltrado = filtered.length;

    const contextoEquipamentos = topEquipamentos
      .map((e, i) =>
        `${i + 1}. Equipamento: ${e.equipamento} | Patrimonio: ${e.patrimonio} | Setor: ${e.setor} | Tag: ${e.tag} | Status: ${e.status} | Descricao: ${e.descricao || "nao informado"}`
      )
      .join("\n");

    return `\n\n=== COLECAO EQUIPAMENTOS/MAQUINAS ===\nTotal de equipamentos no sistema: ${totalEquipamentos}\nEquipamentos encontrados na busca: ${totalFiltrado}\nExibindo os primeiros ${topEquipamentos.length} registros:\n${contextoEquipamentos}`;
  } catch (error) {
    console.error("[APEX] Erro ao buscar equipamentos:", error);
    return `\n\n=== COLECAO EQUIPAMENTOS ===\nErro ao acessar dados de equipamentos: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
  }
};

const fetchManutentoresContext = async (message: string): Promise<string> => {
  try {
    const manutentoresSnapshot = await getDocs(collection(db, "manutentores"));
    const manutentores = manutentoresSnapshot.docs.map((docRef) => {
      const data = docRef.data();
      return {
        id: docRef.id,
        nome: data.nome || "",
        cargo: data.cargo || "",
        setor: data.setor || "",
        email: data.email || "",
        telefone: data.telefone || "",
        status: data.status || data.ativo ? "Ativo" : "Inativo",
      } as ManutentorChatData;
    });

    const searchTerms = extractSearchTerms(message);
    let filtered = [...manutentores];

    if (searchTerms.length > 0) {
      filtered = filtered.filter((m) => {
        const base = normalizeText(`${m.nome} ${m.cargo} ${m.setor} ${m.email}`);
        return searchTerms.some((term) => base.includes(term));
      });
    }

    const topManutentores = filtered.slice(0, 20);
    const totalManutentores = manutentores.length;
    const totalFiltrado = filtered.length;

    const contextoManutentores = topManutentores
      .map((m, i) =>
        `${i + 1}. Nome: ${m.nome} | Cargo: ${m.cargo} | Setor: ${m.setor} | Email: ${m.email} | Telefone: ${m.telefone} | Status: ${m.status}`
      )
      .join("\n");

    return `\n\n=== COLECAO MANUTENTORES ===\nTotal de manutentores no sistema: ${totalManutentores}\nManutentores encontrados na busca: ${totalFiltrado}\nExibindo os primeiros ${topManutentores.length} registros:\n${contextoManutentores}`;
  } catch (error) {
    console.error("[APEX] Erro ao buscar manutentores:", error);
    return "\n\n=== COLECAO MANUTENTORES ===\nErro ao acessar dados de manutentores.";
  }
};

const fetchManuaisContext = async (message: string): Promise<string> => {
  try {
    const manuaisSnapshot = await getDocs(collection(db, "pdf_manuais"));
    const manuais = manuaisSnapshot.docs.map((docRef) => {
      const data = docRef.data();
      return {
        id: docRef.id,
        titulo: data.titulo || "",
        subtitulo: data.subtitulo || "",
        ativo: data.ativo !== false,
        dataCriacao: data.dataCriacao || "",
      } as ManualChatData;
    });

    const searchTerms = extractSearchTerms(message);
    let filtered = [...manuais];

    if (searchTerms.length > 0) {
      filtered = filtered.filter((m) => {
        const base = normalizeText(`${m.titulo} ${m.subtitulo}`);
        return searchTerms.some((term) => base.includes(term));
      });
    }

    const topManuais = filtered.slice(0, 20);
    const totalManuais = manuais.length;
    const totalFiltrado = filtered.length;

    const contextoManuais = topManuais
      .map((m, i) =>
        `${i + 1}. Titulo: ${m.titulo} | Subtitulo: ${m.subtitulo} | Ativo: ${m.ativo ? "Sim" : "Nao"} | Data Criacao: ${m.dataCriacao}`
      )
      .join("\n");

    return `\n\n=== COLECAO MANUAIS ===\nTotal de manuais no sistema: ${totalManuais}\nManuais encontrados na busca: ${totalFiltrado}\nExibindo os primeiros ${topManuais.length} registros:\n${contextoManuais}`;
  } catch (error) {
    console.error("[APEX] Erro ao buscar manuais:", error);
    return "\n\n=== COLECAO MANUAIS ===\nErro ao acessar dados de manuais.";
  }
};

const fetchTarefasManutencaoContext = async (message: string): Promise<string> => {
  try {
    const tarefasSnapshot = await getDocs(collection(db, "tarefas_manutencao"));
    const tarefas = tarefasSnapshot.docs.map((docRef) => {
      const data = docRef.data();
      return {
        id: docRef.id,
        titulo: data.titulo || data.descricao || "",
        descricao: data.descricao || "",
        equipamento: data.equipamento || "",
        setor: data.setor || "",
        frequencia: data.frequencia || "",
        status: data.status || "",
        prioridade: data.prioridade || "",
        manutentor: data.manutentor || data.manutentorNome || "",
        dataHoraAgendada: data.dataHoraAgendada || "",
      } as TarefaManutencaoChatData;
    });

    const searchTerms = extractSearchTerms(message);
    let filtered = [...tarefas];

    if (searchTerms.length > 0) {
      filtered = filtered.filter((t) => {
        const base = normalizeText(`${t.titulo} ${t.descricao} ${t.equipamento} ${t.setor} ${t.manutentor}`);
        return searchTerms.some((term) => base.includes(term));
      });
    }

    const topTarefas = filtered.slice(0, 20);
    const totalTarefas = tarefas.length;
    const totalFiltrado = filtered.length;

    const contextoTarefas = topTarefas
      .map((t, i) =>
        `${i + 1}. Titulo: ${t.titulo} | Equipamento: ${t.equipamento} | Setor: ${t.setor} | Frequencia: ${t.frequencia} | Status: ${t.status} | Prioridade: ${t.prioridade} | Manutentor: ${t.manutentor} | Agendada: ${t.dataHoraAgendada}`
      )
      .join("\n");

    return `\n\n=== COLECAO TAREFAS DE MANUTENCAO ===\nTotal de tarefas no sistema: ${totalTarefas}\nTarefas encontradas na busca: ${totalFiltrado}\nExibindo as primeiras ${topTarefas.length} registros:\n${contextoTarefas}`;
  } catch (error) {
    console.error("[APEX] Erro ao buscar tarefas:", error);
    return "\n\n=== COLECAO TAREFAS DE MANUTENCAO ===\nErro ao acessar dados de tarefas.";
  }
};

const fetchOrdensServicoContext = async (message: string): Promise<string> => {
  try {
    const ordensSnapshot = await getDocs(collection(db, "ordens_servicos"));
    const ordens = ordensSnapshot.docs.map((docRef) => {
      const data = docRef.data();
      return {
        id: docRef.id,
        titulo: data.titulo || data.descricao || "",
        descricao: data.descricao || "",
        equipamento: data.equipamento || "",
        setor: data.setor || "",
        status: data.status || "",
        prioridade: data.prioridade || "",
        dataAbertura: data.dataAbertura || data.criadoEm || "",
        dataConclusao: data.dataConclusao || "",
      } as OrdemServicoChatData;
    });

    const searchTerms = extractSearchTerms(message);
    let filtered = [...ordens];

    const normalizedMessage = normalizeText(message);
    if (normalizedMessage.includes("aberta") || normalizedMessage.includes("pendente")) {
      filtered = filtered.filter((o) => normalizeText(o.status).includes("aberta") || normalizeText(o.status).includes("pendente"));
    } else if (normalizedMessage.includes("concluida") || normalizedMessage.includes("finalizada")) {
      filtered = filtered.filter((o) => normalizeText(o.status).includes("conclu") || normalizeText(o.status).includes("finaliz"));
    }

    if (searchTerms.length > 0) {
      filtered = filtered.filter((o) => {
        const base = normalizeText(`${o.titulo} ${o.descricao} ${o.equipamento} ${o.setor}`);
        return searchTerms.some((term) => base.includes(term));
      });
    }

    const topOrdens = filtered.slice(0, 20);
    const totalOrdens = ordens.length;
    const totalFiltrado = filtered.length;

    const contextoOrdens = topOrdens
      .map((o, i) =>
        `${i + 1}. Titulo: ${o.titulo} | Equipamento: ${o.equipamento} | Setor: ${o.setor} | Status: ${o.status} | Prioridade: ${o.prioridade} | Abertura: ${o.dataAbertura} | Conclusao: ${o.dataConclusao || "nao concluida"}`
      )
      .join("\n");

    return `\n\n=== COLECAO ORDENS DE SERVICO ===\nTotal de ordens no sistema: ${totalOrdens}\nOrdens encontradas na busca: ${totalFiltrado}\nExibindo as primeiras ${topOrdens.length} registros:\n${contextoOrdens}`;
  } catch (error) {
    console.error("[APEX] Erro ao buscar ordens:", error);
    return "\n\n=== COLECAO ORDENS DE SERVICO ===\nErro ao acessar dados de ordens de servico.";
  }
};

const fetchUnidadesContext = async (message: string): Promise<string> => {
  try {
    const unidadesSnapshot = await getDocs(collection(db, "unidades"));
    const unidades = unidadesSnapshot.docs.map((docRef) => {
      const data = docRef.data();
      return {
        id: docRef.id,
        nome: data.nome || "",
        codigo: data.codigo || "",
        endereco: data.endereco || "",
        responsavel: data.responsavel || "",
        telefone: data.telefone || "",
      } as UnidadeChatData;
    });

    const searchTerms = extractSearchTerms(message);
    let filtered = [...unidades];

    if (searchTerms.length > 0) {
      filtered = filtered.filter((u) => {
        const base = normalizeText(`${u.nome} ${u.codigo} ${u.endereco} ${u.responsavel}`);
        return searchTerms.some((term) => base.includes(term));
      });
    }

    const contextoUnidades = filtered
      .map((u, i) =>
        `${i + 1}. Nome: ${u.nome} | Codigo: ${u.codigo} | Endereco: ${u.endereco} | Responsavel: ${u.responsavel} | Telefone: ${u.telefone}`
      )
      .join("\n");

    return `\n\n=== COLECAO UNIDADES ===\nTotal de unidades no sistema: ${unidades.length}\nUnidades encontradas: ${filtered.length}\n${contextoUnidades}`;
  } catch (error) {
    console.error("[APEX] Erro ao buscar unidades:", error);
    return "\n\n=== COLECAO UNIDADES ===\nErro ao acessar dados de unidades.";
  }
};

const fetchSetoresContext = async (message: string): Promise<string> => {
  try {
    const setoresSnapshot = await getDocs(collection(db, "setores"));
    const setores = setoresSnapshot.docs.map((docRef) => {
      const data = docRef.data();
      return {
        id: docRef.id,
        nome: data.nome || "",
        descricao: data.descricao || "",
        responsavel: data.responsavel || "",
        unidade: data.unidade || "",
      } as SetorChatData;
    });

    const searchTerms = extractSearchTerms(message);
    let filtered = [...setores];

    if (searchTerms.length > 0) {
      filtered = filtered.filter((s) => {
        const base = normalizeText(`${s.nome} ${s.descricao} ${s.responsavel} ${s.unidade}`);
        return searchTerms.some((term) => base.includes(term));
      });
    }

    const contextoSetores = filtered
      .map((s, i) =>
        `${i + 1}. Nome: ${s.nome} | Descricao: ${s.descricao} | Responsavel: ${s.responsavel} | Unidade: ${s.unidade}`
      )
      .join("\n");

    return `\n\n=== COLECAO SETORES ===\nTotal de setores no sistema: ${setores.length}\nSetores encontrados: ${filtered.length}\n${contextoSetores}`;
  } catch (error) {
    console.error("[APEX] Erro ao buscar setores:", error);
    return "\n\n=== COLECAO SETORES ===\nErro ao acessar dados de setores.";
  }
};

const fetchCentrosCustoContext = async (message: string): Promise<string> => {
  try {
    const centrosSnapshot = await getDocs(collection(db, "centros_de_custo"));
    const centros = centrosSnapshot.docs.map((docRef) => {
      const data = docRef.data();
      return {
        id: docRef.id,
        nome: data.nome || "",
        codigo: data.codigo || "",
        descricao: data.descricao || "",
      } as CentroCustoChatData;
    });

    const searchTerms = extractSearchTerms(message);
    let filtered = [...centros];

    if (searchTerms.length > 0) {
      filtered = filtered.filter((c) => {
        const base = normalizeText(`${c.nome} ${c.codigo} ${c.descricao}`);
        return searchTerms.some((term) => base.includes(term));
      });
    }

    const contextoCentros = filtered
      .map((c, i) =>
        `${i + 1}. Nome: ${c.nome} | Codigo: ${c.codigo} | Descricao: ${c.descricao}`
      )
      .join("\n");

    return `\n\n=== COLECAO CENTROS DE CUSTO ===\nTotal de centros de custo: ${centros.length}\nCentros encontrados: ${filtered.length}\n${contextoCentros}`;
  } catch (error) {
    console.error("[APEX] Erro ao buscar centros de custo:", error);
    return "\n\n=== COLECAO CENTROS DE CUSTO ===\nErro ao acessar dados de centros de custo.";
  }
};

const fetchDatabaseContext = async (message: string): Promise<DatabaseContextResult> => {
  const collections = detectRelevantCollections(message);
  
  if (collections.length === 0) {
    return {
      hasRelevantData: false,
      context: "",
      fallbackAnswer: "",
    };
  }

  let fullContext = "\n\n=== DADOS DO SISTEMA APEX HUB ===\nAbaixo estao os dados das colecoes relevantes para responder a pergunta do usuario:\n";
  
  const contextPromises: Promise<string>[] = [];

  for (const col of collections) {
    switch (col) {
      case "produtos":
        contextPromises.push(fetchProdutosContext(message));
        break;
      case "fornecedores":
        contextPromises.push(fetchFornecedoresContext(message));
        break;
      case "equipamentos":
        contextPromises.push(fetchEquipamentosContext(message));
        break;
      case "manutentores":
        contextPromises.push(fetchManutentoresContext(message));
        break;
      case "manuais":
        contextPromises.push(fetchManuaisContext(message));
        break;
      case "tarefas_manutencao":
        contextPromises.push(fetchTarefasManutencaoContext(message));
        break;
      case "ordens_servicos":
        contextPromises.push(fetchOrdensServicoContext(message));
        break;
      case "unidades":
        contextPromises.push(fetchUnidadesContext(message));
        break;
      case "setores":
        contextPromises.push(fetchSetoresContext(message));
        break;
      case "centros_de_custo":
        contextPromises.push(fetchCentrosCustoContext(message));
        break;
    }
  }

  let produtosSugeridos: ProdutoSugestao[] | undefined;
  let produtosComImagem: ProdutoCard[] | undefined;

  if (collections.includes("produtos")) {
    const todosOsProdutos = await fetchProdutosRaw();
    const searchTerms = extractSearchTerms(message);

    const matched = todosOsProdutos.filter((p) => {
      const base = normalizeText(`${p.nome} ${p.codigo_estoque} ${p.codigo_material} ${p.detalhes}`);
      return searchTerms.some((t) => base.includes(t));
    });

    if (matched.length > 1) {
      produtosSugeridos = matched.slice(0, 8).map((p) => ({
        id: p.id,
        nome: p.nome,
        codigo_estoque: p.codigo_estoque,
      }));
    }

    const comImagem = matched.filter((p) => p.imageUrl && p.imageUrl.length > 0);
    if (comImagem.length > 0) {
      produtosComImagem = comImagem.slice(0, 6).map((p) => ({
        id: p.id,
        nome: p.nome,
        codigo_estoque: p.codigo_estoque,
        codigo_material: p.codigo_material,
        quantidade: p.quantidade,
        unidade_de_medida: p.unidade_de_medida,
        valor_unitario: p.valor_unitario,
        fornecedor_nome: p.fornecedor_nome,
        deposito: p.deposito,
        prateleira: p.prateleira,
        imageUrl: p.imageUrl!,
      }));
    }
  }

  const results = await Promise.all(contextPromises);
  fullContext += results.join("");
  
  fullContext += "\n\n=== INSTRUCOES PARA RESPOSTA ===\nUse APENAS os dados acima para responder a pergunta do usuario. Se o dado solicitado nao estiver presente, informe que nao foi encontrado. Formate a resposta de forma clara e organizada. Se for solicitado um relatorio, organize os dados em formato tabular ou lista estruturada.";

  return {
    hasRelevantData: true,
    context: fullContext,
    fallbackAnswer: "Encontrei dados relevantes no sistema. Por favor, veja os detalhes acima.",
    produtosSugeridos,
    produtosComImagem,
  };
};

const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit & { timeoutMs?: number }) => {
  const timeoutMs = (init as any)?.timeoutMs ?? 15000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...(init || {}), signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
};

const getGroqConfig = async () => {
  const apiKey = await getGroqApiKey();
  
  if (!apiKey) {
    console.error("[APEX] Chave de API do Groq nao foi encontrada na colecao 'api_key'. Configure a chave antes de usar o APEX Chat.");
    return null;
  }

  return {
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: apiKey,
    model: (import.meta as any).env?.VITE_GROQ_MODEL || "llama-3.3-70b-versatile",
  };
};

// =============================================
// COMPONENTE DE MARKDOWN
// =============================================

const SimpleMarkdown = ({ content }: { content: string }) => {
  const processMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;
    
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
      const codeMatch = remaining.match(/`(.+?)`/);
      
      const matches = [
        boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index! } : null,
        italicMatch ? { type: 'italic', match: italicMatch, index: italicMatch.index! } : null,
        codeMatch ? { type: 'code', match: codeMatch, index: codeMatch.index! } : null,
      ].filter(Boolean).sort((a, b) => a!.index - b!.index);
      
      if (matches.length === 0) {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }
      
      const firstMatch = matches[0]!;
      
      if (firstMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, firstMatch.index)}</span>);
      }
      
      const matchedText = firstMatch.match[1];
      switch (firstMatch.type) {
        case 'bold':
          parts.push(<strong key={key++}>{matchedText}</strong>);
          break;
        case 'italic':
          parts.push(<em key={key++}>{matchedText}</em>);
          break;
        case 'code':
          parts.push(<code key={key++} className="bg-muted px-1 rounded text-xs">{matchedText}</code>);
          break;
      }
      
      remaining = remaining.slice(firstMatch.index + firstMatch.match[0].length);
    }
    
    return parts;
  };
  
  const lines = content.split('\n');
  
  return (
    <>
      {lines.map((line, idx) => (
        <span key={idx}>
          {processMarkdown(line)}
          {idx < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
};

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

const ApexChatModal = ({ isOpen, onClose }: ApexChatModalProps) => {
  const { user, userData } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState<boolean | null>(null);
  const [pageDocumentation, setPageDocumentation] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detectar se e mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mensagem de boas-vindas contextual
  const getWelcomeMessage = useCallback((): Message => {
    const pageName = getPageName(location.pathname);
    const hasDoc = hasPageDocumentation(location.pathname);
    
    return {
      id: "welcome",
      role: "assistant",
      content: `Ola! Sou o **APEX AI**, seu assistente virtual inteligente.

Voce esta na pagina **${pageName}**${hasDoc ? ' e tenho documentacao completa sobre ela.' : '.'}

Posso ajudar com:
- **Dados do sistema**: produtos, fornecedores, equipamentos, OS
- **Funcionalidades**: explicar como usar cada recurso
- **Tratativas**: sugerir acoes para resolver problemas

${hasDoc ? `Digite **/pagina** para saber mais sobre ${pageName}.` : ''}

Como posso ajuda-lo?`,
      timestamp: new Date(),
    };
  }, [location.pathname]);

  // Carregar documentacao da pagina atual
  useEffect(() => {
    const loadPageDoc = async () => {
      if (location.pathname) {
        const doc = await getPageDocumentation(location.pathname);
        setPageDocumentation(doc);
      }
    };
    loadPageDoc();
  }, [location.pathname]);

  // Inicializar mensagem de boas-vindas
  useEffect(() => {
    if (isOpen) {
      setMessages([getWelcomeMessage()]);
    }
  }, [isOpen, getWelcomeMessage]);

  // Verificar se a API esta configurada quando o chat abrir
  useEffect(() => {
    if (!isOpen) return;

    const checkApiConfiguration = async () => {
      try {
        const apiKey = await getGroqApiKey();
        setIsApiConfigured(!!apiKey);
      } catch (error) {
        console.error("[APEX] Erro ao verificar API:", error);
        setIsApiConfigured(false);
      }
    };

    checkApiConfiguration();
  }, [isOpen]);

  // Carregar historico do Firebase quando o chat abrir
  useEffect(() => {
    if (!isOpen || !user) return;

    const chatRef = collection(db, "chat_messages");
    const q = query(
      chatRef,
      where("userId", "==", user.uid),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history: Message[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        history.push({
          id: docSnapshot.id,
          role: data.role,
          content: data.content,
          timestamp: data.createdAt?.toDate() || new Date(),
        });
      });

      history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const recentHistory = history.slice(-50);

      if (recentHistory.length > 0) {
        setMessages([getWelcomeMessage(), ...recentHistory]);
        setShowSuggestions(false);
      }
    });

    return () => unsubscribe();
  }, [isOpen, user, getWelcomeMessage]);

  // Auto-scroll para a ultima mensagem
  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Sugestoes contextuais baseadas na pagina atual
  const contextualSuggestions = PAGE_SUGGESTIONS[location.pathname] || PAGE_SUGGESTIONS['/dashboard'] || [];

  // Limpar historico do chat
  const handleClearHistory = async () => {
    if (!user) return;
    
    try {
      const chatRef = collection(db, "chat_messages");
      const q = query(chatRef, where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map((docSnapshot) => 
        deleteDoc(doc(db, "chat_messages", docSnapshot.id))
      );
      
      await Promise.all(deletePromises);
      setMessages([getWelcomeMessage()]);
      setShowSuggestions(true);
    } catch (error) {
      console.error("[APEX] Erro ao limpar historico:", error);
    }
  };

  // Processar comandos rapidos
  const processCommand = async (command: string): Promise<boolean> => {
    const lowerCommand = command.toLowerCase().trim();
    
    if (lowerCommand === '/ajuda' || lowerCommand === '/help') {
      const helpMessage: Message = {
        id: "help-" + Date.now(),
        role: "assistant",
        content: `**Comandos Disponiveis:**

**/ajuda** - Mostra esta lista de comandos
**/pagina** - Explica as funcionalidades da pagina atual
**/limpar** - Limpa o historico de conversas

**Dicas de Uso:**
- Pergunte sobre **produtos**, **fornecedores**, **equipamentos**
- Consulte **ordens de servico** e **tarefas de manutencao**
- Peca **relatorios** e **resumos** dos dados
- Use as **sugestoes contextuais** para perguntas rapidas`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, helpMessage]);
      return true;
    }
    
    if (lowerCommand === '/pagina' || lowerCommand === '/page') {
      const pageName = getPageName(location.pathname);
      
      if (pageDocumentation) {
        const pageMessage: Message = {
          id: "page-" + Date.now(),
          role: "assistant",
          content: `**Documentacao: ${pageName}**\n\n${pageDocumentation.slice(0, 2000)}${pageDocumentation.length > 2000 ? '\n\n*[Documentacao resumida por ser muito extensa]*' : ''}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, pageMessage]);
      } else {
        const noDocMessage: Message = {
          id: "page-" + Date.now(),
          role: "assistant",
          content: `A pagina **${pageName}** ainda nao possui documentacao detalhada. Posso ajuda-lo com duvidas especificas sobre as funcionalidades visiveis.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, noDocMessage]);
      }
      return true;
    }
    
    if (lowerCommand === '/limpar' || lowerCommand === '/clear') {
      await handleClearHistory();
      return true;
    }
    
    return false;
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userContent = input;
    setInput("");
    setShowSuggestions(false);
    setIsLoading(true);
    
    // Verificar se e um comando
    if (userContent.startsWith('/')) {
      const wasCommand = await processCommand(userContent);
      if (wasCommand) {
        setIsLoading(false);
        return;
      }
    }
    
    const userMessage: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    let databaseContext: DatabaseContextResult = { hasRelevantData: false, context: "", fallbackAnswer: "" };

    try {
      // 1. Salvar mensagem do usuario no Firebase
      await addDoc(collection(db, "chat_messages"), {
        userId: user.uid,
        role: "user",
        content: userContent,
        createdAt: serverTimestamp(),
      });

      // 2. Buscar contexto de todas as colecoes relevantes
      databaseContext = await fetchDatabaseContext(userContent);

      // 3. Preparar o historico de mensagens para o contexto
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // 4. Preparar o system prompt com as habilidades, documentacao da pagina e contexto do usuario
      const pageName = getPageName(location.pathname);
      const pageContextSection = pageDocumentation 
        ? `\n\n=== DOCUMENTACAO DA PAGINA ATUAL: ${pageName} ===\n${pageDocumentation}\n\nUse esta documentacao para explicar funcionalidades, sugerir tratativas e orientar o usuario sobre como usar esta pagina do sistema.`
        : '';

      const systemPrompt = `${skillPrompt}

Informacoes do usuario:
- Nome: ${userData?.nome || user.email || "Usuario"}
- Email: ${user?.email || "Nao informado"}
- Pagina atual: ${pageName} (${location.pathname})

${pageContextSection}

Voce e o APEX AI, um assistente virtual do sistema APEX HUB com ACESSO TOTAL aos dados do sistema.

Voce tem acesso as seguintes colecoes do banco de dados:
- produtos: informacoes de estoque, precos, fornecedores, vencimentos
- fornecedores: razao social, CNPJ, contatos, condicoes de pagamento, enderecos
- equipamentos: maquinas, patrimonio, setores, tags, status
- manutentores: tecnicos de manutencao, contatos, setores
- manuais: documentacao tecnica, instrucoes
- tarefas_manutencao: tarefas preventivas, agendamentos
- ordens_servicos: ordens de servico abertas e concluidas
- unidades: filiais, enderecos
- setores: departamentos
- centros_de_custo: gestao financeira

Diretrizes OPERACIONAIS (voce auxilia FUNCIONARIOS, nao desenvolvedores):
- SEMPRE use os dados fornecidos no contexto para responder
- Se perguntarem sobre a pagina atual, use a DOCUMENTACAO DA PAGINA para explicar
- Sugira TRATATIVAS praticas e operacionais para resolver problemas
- Explique passo a passo como realizar tarefas no sistema
- Use linguagem simples e direta, adequada para operadores e tecnicos
- Para relatorios, use listas ou formato tabular
- Seja preciso e cite os dados exatos encontrados
- Se nao encontrar o dado solicitado, informe claramente
- Responda sempre em portugues do Brasil`;

      // 5. Preparar as mensagens para a API Groq
      const fullSystemPrompt = databaseContext.hasRelevantData 
        ? `${systemPrompt}${databaseContext.context}`
        : systemPrompt;

      const apiMessages = [
        { role: "system", content: fullSystemPrompt },
        ...conversationHistory,
        { role: "user", content: userContent }
      ];

      // 6. Fazer requisicao direta para a API Groq
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw new Error("Sem conexao com a internet");
      }

      const groqConfig = await getGroqConfig();
      if (!groqConfig) {
        throw new Error("Chave da API Groq nao configurada na colecao 'api_key'. Configure o campo 'groq' antes de usar o APEX Chat.");
      }

      const response = await fetchWithTimeout(`${groqConfig.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: groqConfig.model,
          messages: apiMessages,
          max_tokens: 4096,
          temperature: 0.7,
        }),
        timeoutMs: 60000,
      } as any);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Groq API Error:", response.status, errorData);
        
        if (response.status === 429) {
          throw new Error("Limite de requisicoes excedido. Aguarde um momento.");
        } else {
          throw new Error(errorData.error?.message || `Erro na API: ${response.status}`);
        }
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || "Desculpe, nao consegui processar sua mensagem no momento.";
      
      // 7. Adicionar mensagem da assistente na UI
      const assistantMessage: Message = {
        id: "assistant-" + Date.now(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
        produtosSugeridos: databaseContext.produtosSugeridos,
        produtosComImagem: databaseContext.produtosComImagem,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
      // 8. Salvar resposta da assistente no Firebase
      await addDoc(collection(db, "chat_messages"), {
        userId: user.uid,
        role: "assistant",
        content: assistantContent,
        createdAt: serverTimestamp(),
      });
      
    } catch (error) {
      console.error("Chat error:", error);

      let errorMessageText = "Desculpe, houve um erro ao processar sua mensagem. ";
      
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes("sem conexao") || (typeof navigator !== "undefined" && navigator.onLine === false)) {
          errorMessageText += "Voce esta offline. Verifique sua conexao com a internet.";
        } else if (error.message.includes("API") || error.message.includes("401")) {
          errorMessageText += "Problema com o servico de IA. Tente novamente.";
        } else if (error.message.includes("fetch") || error.message.toLowerCase().includes("network") || error.message.toLowerCase().includes("abort")) {
          errorMessageText += "Nao foi possivel conectar ao servico. Verifique sua conexao com a internet.";
        } else if (error.message.includes("429")) {
          errorMessageText += "Muitas requisicoes. Aguarde alguns segundos e tente novamente.";
        } else {
          errorMessageText += error.message;
        }
      } else {
        errorMessageText += "Tente novamente em alguns momentos.";
      }
      
      const errorMessage: Message = {
        id: "error-" + Date.now(),
        role: "assistant",
        content: errorMessageText,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (query: string) => {
    setInput(query);
    setShowSuggestions(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Conteudo do chat
  const ChatContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">APEX AI</h2>
              <p className="text-xs text-muted-foreground">
                {getPageName(location.pathname)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleClearHistory}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Limpar historico</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Toolbar de comandos rapidos */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
          {QUICK_COMMANDS.map((cmd) => (
            <Badge 
              key={cmd.command}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 whitespace-nowrap text-xs py-1"
              onClick={() => {
                setInput(cmd.command);
                setTimeout(() => handleSend(), 50);
              }}
            >
              {cmd.command}
            </Badge>
          ))}
          {hasPageDocumentation(location.pathname) && (
            <Badge 
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 whitespace-nowrap text-xs py-1 border-primary/30 text-primary"
              onClick={() => {
                setInput('/pagina');
                setTimeout(() => handleSend(), 50);
              }}
            >
              <FileText className="w-3 h-3 mr-1" />
              Ver documentacao
            </Badge>
          )}
        </div>
      </div>

      {/* Area de mensagens */}
      <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className={`max-w-[85%] md:max-w-[80%] flex flex-col gap-2 ${message.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    <SimpleMarkdown content={message.content} />
                  </div>
                  <p
                    className={`text-[10px] mt-1.5 ${
                      message.role === "user"
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Cards de produtos com imagem */}
                {message.role === "assistant" && message.produtosComImagem && message.produtosComImagem.length > 0 && (
                  <div className="flex flex-col gap-2 w-full">
                    {message.produtosComImagem.map((prod) => (
                      <div
                        key={prod.id}
                        className="rounded-xl border bg-card overflow-hidden flex gap-3 p-3 shadow-sm"
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.nome}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-muted"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-xs font-semibold text-foreground leading-tight truncate">{prod.nome}</span>
                          {prod.codigo_estoque && (
                            <span className="text-xs text-muted-foreground">Cod: {prod.codigo_estoque}</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Qtd: <span className={`font-medium ${prod.quantidade <= 0 ? "text-destructive" : "text-foreground"}`}>{prod.quantidade}</span>
                            {prod.unidade_de_medida ? ` ${prod.unidade_de_medida}` : ""}
                          </span>
                          {prod.valor_unitario > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Valor: <span className="font-medium text-foreground">{formatCurrencyBRL(prod.valor_unitario)}</span>
                            </span>
                          )}
                          {prod.fornecedor_nome && (
                            <span className="text-xs text-muted-foreground truncate">Fornecedor: {prod.fornecedor_nome}</span>
                          )}
                          {(prod.deposito || prod.prateleira) && (
                            <span className="text-xs text-muted-foreground">
                              {prod.deposito}{prod.prateleira ? ` / ${prod.prateleira}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chips de sugestoes de produtos relacionados */}
                {message.role === "assistant" && message.produtosSugeridos && message.produtosSugeridos.length > 1 && (
                  <div className="flex flex-col gap-1.5 w-full">
                    <span className="text-xs text-muted-foreground">Produtos relacionados:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {message.produtosSugeridos.map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => setInput(sug.nome)}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs text-primary font-medium hover:bg-primary/15 hover:border-primary/60 transition-colors cursor-pointer"
                        >
                          {sug.nome}
                          {sug.codigo_estoque && (
                            <span className="text-primary/60">#{sug.codigo_estoque}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consultando dados do sistema...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Sugestoes contextuais */}
      {showSuggestions && contextualSuggestions.length > 0 && messages.length <= 1 && (
        <div className="flex-shrink-0 px-4 py-3 border-t bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Sugestoes para esta pagina</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 ml-auto"
              onClick={() => setShowSuggestions(false)}
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {contextualSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion.query)}
                className="inline-flex items-center gap-1.5 rounded-full bg-background border px-3 py-1.5 text-xs font-medium hover:bg-primary/5 hover:border-primary/30 transition-colors"
              >
                {suggestion.icon || <Package className="w-3 h-3" />}
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Area de input */}
      <div className="flex-shrink-0 p-4 border-t bg-background">
        {isApiConfigured === false && (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex gap-2 text-sm text-yellow-800 dark:text-yellow-200 mb-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <strong>Chave de API nao configurada</strong>
              <p className="text-xs mt-1">
                Adicione sua chave do Groq no campo <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">groq</code> da colecao <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">api_key</code> no Firebase.
              </p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder="Pergunte algo ou digite /ajuda..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isApiConfigured === false}
              className="pr-10 rounded-full bg-muted/50 border-muted-foreground/20 focus:border-primary"
            />
            <Button 
              size="icon" 
              onClick={handleSend} 
              disabled={isLoading || !input.trim() || isApiConfigured === false}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <HelpCircle className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            Digite <code className="bg-muted px-1 rounded">/ajuda</code> para ver comandos
          </span>
        </div>
      </div>
    </div>
  );

  // Renderizar Sheet para mobile, Dialog para desktop
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent 
          side="bottom" 
          className="h-[100dvh] !p-0 flex flex-col rounded-t-2xl border-t border-border [&>button]:hidden"
        >
          <SheetTitle className="sr-only">APEX AI</SheetTitle>
          <div className="flex flex-col h-full overflow-hidden">
            <ChatContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent hideCloseButton className="sm:max-w-[600px] h-[700px] !p-0 gap-0 rounded-2xl overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">APEX AI</DialogTitle>
        <div className="flex flex-col h-full overflow-hidden">
          <ChatContent />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApexChatModal;
