import { useState, useEffect, useRef } from "react";
import { Bot, User, Loader2, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import skillPrompt from "@/AI/Skill.md?raw";
import { getGroqApiKey } from "@/services/apiKeyService";

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

// Detectar qual coleção a pergunta está relacionada
const detectRelevantCollections = (message: string): string[] => {
  const normalized = normalizeText(message);
  const collections: string[] = [];
  if (/(produto|estoque|deposito|prateleira|vencimento|codigo|material|quantidade|barato|caro|item|itens|preco|valor|peca|pecas|veda|rosca|lubrificante|oleo|filtro|correia|rolamento|parafuso|arruela|anel|junta|vedacao|mangueira|bomba|motor|valvula|sensor|rele|fusivel|lampada|cabo|fio|tubo|conexao|abraca|braçadeira|chapa|barra|cantoneira|perfil|solda|eletrodo|disco|lixa|serra|broca|fresa|ferramenta|epi|luva|oculos|mascara|capacete|bota|uniforme)/.test(normalized)) {
    collections.push("produtos");
  }

  // Fornecedores
  if (/(fornecedor|cnpj|razao social|pagamento|prazo entrega|contato|fornece|quem vende|onde compro)/.test(normalized)) {
    collections.push("fornecedores");
  }

  // Equipamentos/Máquinas
  if (/(maquina|equipamento|patrimonio|tag)/.test(normalized) && !/(manutentor)/.test(normalized)) {
    collections.push("equipamentos");
  }

  // Manutentores
  if (/(manutentor|tecnico|tecnicos|quem faz|responsavel)/.test(normalized) && !/(tarefa|ordem|servico)/.test(normalized)) {
    collections.push("manutentores");
  }

  // Manuais
  if (/(manual|manuais|instrucao|instrucoes|documento)/.test(normalized)) {
    collections.push("manuais");
  }

  // Tarefas de Manutenção
  if (/(tarefa|tarefas|preventiva|agendada|agendamento|frequencia)/.test(normalized)) {
    collections.push("tarefas_manutencao");
  }

  // Ordens de Serviço
  if (/(ordem|ordens|os\b|servico|servicos|aberta|pendente|concluida)/.test(normalized)) {
    collections.push("ordens_servicos");
  }

  // Unidades
  if (/(unidade|unidades|filial|filiais|loja|lojas)/.test(normalized) && !/(medida)/.test(normalized)) {
    collections.push("unidades");
  }

  // Setores
  if (/(setor|setores|departamento|area)/.test(normalized) && !/(equipamento|maquina)/.test(normalized)) {
    collections.push("setores");
  }

  // Centro de Custo
  if (/(centro de custo|centro custo|custo|centros)/.test(normalized)) {
    collections.push("centros_de_custo");
  }

  // Se não detectou nenhuma coleção específica mas parece uma pergunta sobre dados
  // SEMPRE buscar em produtos por padrão quando for pergunta sobre dados
  if (collections.length === 0 && /(quantos|quantas|lista|listar|mostre|mostrar|tem|temos|existe|buscar|encontrar|relatorio|resumo|total|qual|quais|onde|como|quanto)/.test(normalized)) {
    // Buscar em todas as coleções principais
    collections.push("produtos", "fornecedores", "equipamentos");
  }

  // Se ainda não detectou nada, mas a mensagem parece uma busca específica, buscar em produtos
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

// Busca bruta de produtos retornando objetos completos (para sugestões e cards)
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

// Buscar dados de produtos
const fetchProdutosContext = async (message: string): Promise<string> => {
  try {
    let produtosSnapshot;
    try {
      produtosSnapshot = await getDocs(query(collection(db, "produtos"), limit(500)));
    } catch (queryError) {
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

    // Filtros inteligentes
    if (normalizedMessage.includes("inativo")) {
      filtered = filtered.filter((p) => normalizeText(String(p.ativo)) === "nao" || normalizeText(String(p.ativo)) === "não" || p.ativo === false);
    } else if (!normalizedMessage.includes("todos") && !normalizedMessage.includes("todas")) {
      // Por padrão, mostrar apenas ativos
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

    // Ordenação
    if (/(mais barato|menor preco)/.test(normalizedMessage)) {
      filtered.sort((a, b) => a.valor_unitario - b.valor_unitario);
    } else if (/(mais caro|maior preco)/.test(normalizedMessage)) {
      filtered.sort((a, b) => b.valor_unitario - a.valor_unitario);
    }

    const topProdutos = filtered.slice(0, 30);
    const totalProdutos = produtos.length;
    const totalFiltrado = filtered.length;

    if (topProdutos.length === 0) {
      return `\n\n=== COLEÇÃO PRODUTOS ===\nTotal de produtos no sistema: ${totalProdutos}\nNenhum produto encontrado com os critérios de busca.`;
    }

    const contextoProdutos = topProdutos
      .map((p, i) =>
        `${i + 1}. Nome: ${p.nome} | Código Estoque: ${p.codigo_estoque} | Código Material: ${p.codigo_material} | Quantidade: ${p.quantidade} | Mínimo: ${p.quantidade_minima} | Valor: ${formatCurrencyBRL(p.valor_unitario)} | Unidade Medida: ${p.unidade_de_medida} | Depósito: ${p.deposito} | Prateleira: ${p.prateleira} | Unidade: ${p.unidade} | Fornecedor: ${p.fornecedor_nome || "não informado"} | CNPJ Fornecedor: ${p.fornecedor_cnpj || "não informado"} | Vencimento: ${p.data_vencimento || "não informado"} | Ativo: ${p.ativo} | Detalhes: ${p.detalhes || "não informado"}`
      )
      .join("\n");

    return `\n\n=== COLEÇÃO PRODUTOS ===\nTotal de produtos no sistema: ${totalProdutos}\nProdutos encontrados na busca: ${totalFiltrado}\nExibindo os primeiros ${topProdutos.length} registros:\n${contextoProdutos}`;
  } catch (error) {
    console.error("[v0] Erro ao buscar produtos:", error);
    return `\n\n=== COLEÇÃO PRODUTOS ===\nErro ao acessar dados de produtos: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
  }
};

// Buscar dados de fornecedores
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
        `${i + 1}. Razão Social: ${f.razaoSocial} | CNPJ: ${f.cnpj} | Telefone: ${f.telefone} | Email: ${f.email} | Contato: ${f.pessoaContato} | Endereço: ${f.endereco.rua}, ${f.endereco.numero}, ${f.endereco.bairro}, ${f.endereco.cidade}/${f.endereco.estado} - CEP: ${f.endereco.cep} | Condições de Pagamento: ${f.condicoesPagamento} | Prazo de Entrega: ${f.prazoEntrega}`
      )
      .join("\n");

    return `\n\n=== COLEÇÃO FORNECEDORES ===\nTotal de fornecedores no sistema: ${totalFornecedores}\nFornecedores encontrados na busca: ${totalFiltrado}\nExibindo os primeiros ${topFornecedores.length} registros:\n${contextoFornecedores}`;
  } catch (error) {
    console.error("[v0] Erro ao buscar fornecedores:", error);
    return `\n\n=== COLEÇÃO FORNECEDORES ===\nErro ao acessar dados de fornecedores: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
  }
};

// Buscar dados de equipamentos/máquinas
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
        `${i + 1}. Equipamento: ${e.equipamento} | Patrimônio: ${e.patrimonio} | Setor: ${e.setor} | Tag: ${e.tag} | Status: ${e.status} | Descrição: ${e.descricao || "não informado"}`
      )
      .join("\n");

    return `\n\n=== COLEÇÃO EQUIPAMENTOS/MÁQUINAS ===\nTotal de equipamentos no sistema: ${totalEquipamentos}\nEquipamentos encontrados na busca: ${totalFiltrado}\nExibindo os primeiros ${topEquipamentos.length} registros:\n${contextoEquipamentos}`;
  } catch (error) {
    console.error("[v0] Erro ao buscar equipamentos:", error);
    return `\n\n=== COLEÇÃO EQUIPAMENTOS ===\nErro ao acessar dados de equipamentos: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
  }
};

// Buscar dados de manutentores
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

    return `\n\n=== COLEÇÃO MANUTENTORES ===\nTotal de manutentores no sistema: ${totalManutentores}\nManutentores encontrados na busca: ${totalFiltrado}\nExibindo os primeiros ${topManutentores.length} registros:\n${contextoManutentores}`;
  } catch (error) {
    console.error("[v0] Erro ao buscar manutentores:", error);
    return "\n\n=== COLEÇÃO MANUTENTORES ===\nErro ao acessar dados de manutentores.";
  }
};

// Buscar dados de manuais
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
        `${i + 1}. Título: ${m.titulo} | Subtítulo: ${m.subtitulo} | Ativo: ${m.ativo ? "Sim" : "Não"} | Data Criação: ${m.dataCriacao}`
      )
      .join("\n");

    return `\n\n=== COLEÇÃO MANUAIS ===\nTotal de manuais no sistema: ${totalManuais}\nManuais encontrados na busca: ${totalFiltrado}\nExibindo os primeiros ${topManuais.length} registros:\n${contextoManuais}`;
  } catch (error) {
    console.error("[v0] Erro ao buscar manuais:", error);
    return "\n\n=== COLEÇÃO MANUAIS ===\nErro ao acessar dados de manuais.";
  }
};

// Buscar dados de tarefas de manutenção
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
        `${i + 1}. Título: ${t.titulo} | Equipamento: ${t.equipamento} | Setor: ${t.setor} | Frequência: ${t.frequencia} | Status: ${t.status} | Prioridade: ${t.prioridade} | Manutentor: ${t.manutentor} | Agendada: ${t.dataHoraAgendada}`
      )
      .join("\n");

    return `\n\n=== COLEÇÃO TAREFAS DE MANUTENÇÃO ===\nTotal de tarefas no sistema: ${totalTarefas}\nTarefas encontradas na busca: ${totalFiltrado}\nExibindo as primeiras ${topTarefas.length} registros:\n${contextoTarefas}`;
  } catch (error) {
    console.error("[v0] Erro ao buscar tarefas:", error);
    return "\n\n=== COLEÇÃO TAREFAS DE MANUTENÇÃO ===\nErro ao acessar dados de tarefas.";
  }
};

// Buscar dados de ordens de serviço
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
        `${i + 1}. Título: ${o.titulo} | Equipamento: ${o.equipamento} | Setor: ${o.setor} | Status: ${o.status} | Prioridade: ${o.prioridade} | Abertura: ${o.dataAbertura} | Conclusão: ${o.dataConclusao || "não concluída"}`
      )
      .join("\n");

    return `\n\n=== COLEÇÃO ORDENS DE SERVIÇO ===\nTotal de ordens no sistema: ${totalOrdens}\nOrdens encontradas na busca: ${totalFiltrado}\nExibindo as primeiras ${topOrdens.length} registros:\n${contextoOrdens}`;
  } catch (error) {
    console.error("[v0] Erro ao buscar ordens:", error);
    return "\n\n=== COLEÇÃO ORDENS DE SERVIÇO ===\nErro ao acessar dados de ordens de serviço.";
  }
};

// Buscar dados de unidades
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
        `${i + 1}. Nome: ${u.nome} | Código: ${u.codigo} | Endereço: ${u.endereco} | Responsável: ${u.responsavel} | Telefone: ${u.telefone}`
      )
      .join("\n");

    return `\n\n=== COLEÇÃO UNIDADES ===\nTotal de unidades no sistema: ${unidades.length}\nUnidades encontradas: ${filtered.length}\n${contextoUnidades}`;
  } catch (error) {
    console.error("[v0] Erro ao buscar unidades:", error);
    return "\n\n=== COLEÇÃO UNIDADES ===\nErro ao acessar dados de unidades.";
  }
};

// Buscar dados de setores
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
        `${i + 1}. Nome: ${s.nome} | Descrição: ${s.descricao} | Responsável: ${s.responsavel} | Unidade: ${s.unidade}`
      )
      .join("\n");

    return `\n\n=== COLEÇÃO SETORES ===\nTotal de setores no sistema: ${setores.length}\nSetores encontrados: ${filtered.length}\n${contextoSetores}`;
  } catch (error) {
    console.error("[v0] Erro ao buscar setores:", error);
    return "\n\n=== COLEÇÃO SETORES ===\nErro ao acessar dados de setores.";
  }
};

// Buscar dados de centros de custo
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
        `${i + 1}. Nome: ${c.nome} | Código: ${c.codigo} | Descrição: ${c.descricao}`
      )
      .join("\n");

    return `\n\n=== COLEÇÃO CENTROS DE CUSTO ===\nTotal de centros de custo: ${centros.length}\nCentros encontrados: ${filtered.length}\n${contextoCentros}`;
  } catch (error) {
    console.error("[v0] Erro ao buscar centros de custo:", error);
    return "\n\n=== COLEÇÃO CENTROS DE CUSTO ===\nErro ao acessar dados de centros de custo.";
  }
};

// Função principal que busca contexto de todas as coleções relevantes
const fetchDatabaseContext = async (message: string): Promise<DatabaseContextResult> => {
  const collections = detectRelevantCollections(message);
  
  if (collections.length === 0) {
    return {
      hasRelevantData: false,
      context: "",
      fallbackAnswer: "",
    };
  }

  let fullContext = "\n\n=== DADOS DO SISTEMA APEX HUB ===\nAbaixo estão os dados das coleções relevantes para responder à pergunta do usuário:\n";
  
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

  // Se consultar produtos, também calcular sugestões e cards com imagem em paralelo
  let produtosSugeridos: ProdutoSugestao[] | undefined;
  let produtosComImagem: ProdutoCard[] | undefined;

  if (collections.includes("produtos")) {
    const todosOsProdutos = await fetchProdutosRaw();
    const searchTerms = extractSearchTerms(message);

    // Produtos que correspondem à busca (parcial ou completa)
    const matched = todosOsProdutos.filter((p) => {
      const base = normalizeText(`${p.nome} ${p.codigo_estoque} ${p.codigo_material} ${p.detalhes}`);
      return searchTerms.some((t) => base.includes(t));
    });

    // Se há mais de 1 produto relacionado, sugerir os demais como chips
    if (matched.length > 1) {
      produtosSugeridos = matched.slice(0, 8).map((p) => ({
        id: p.id,
        nome: p.nome,
        codigo_estoque: p.codigo_estoque,
      }));
    }

    // Produtos com imagem vinculada
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
  
  fullContext += "\n\n=== INSTRUÇÕES PARA RESPOSTA ===\nUse APENAS os dados acima para responder à pergunta do usuário. Se o dado solicitado não estiver presente, informe que não foi encontrado. Formate a resposta de forma clara e organizada. Se for solicitado um relatório, organize os dados em formato tabular ou lista estruturada.";

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

// Configuração da API do Groq será carregada dinamicamente
const getGroqConfig = async () => {
  const apiKey = await getGroqApiKey();
  
  if (!apiKey) {
    console.error("[v0] Chave de API do Groq não foi encontrada na coleção 'ape_key'. Configure a chave antes de usar o APEX Chat.");
    return null;
  }

  return {
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: apiKey,
    model: (import.meta as any).env?.VITE_GROQ_MODEL || "llama-3.3-70b-versatile",
  };
};

// Componente para renderizar Markdown básico
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

const ApexChatModal = ({ isOpen, onClose }: ApexChatModalProps) => {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Olá! Eu sou o **APEX Chat**, seu assistente virtual com acesso completo aos dados do sistema.

Posso ajudá-lo com informações sobre:
- **Produtos**: estoque, preços, fornecedores, vencimentos
- **Fornecedores**: CNPJ, contatos, condições de pagamento
- **Equipamentos/Máquinas**: patrimônio, setores, status
- **Manutentores**: equipe técnica, contatos
- **Tarefas de Manutenção**: agendamentos, frequências
- **Ordens de Serviço**: abertas, pendentes, concluídas
- **Manuais**: documentação técnica
- **E muito mais!**

Como posso ajudá-lo hoje?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Verificar se a API está configurada quando o chat abrir
  useEffect(() => {
    if (!isOpen) return;

    const checkApiConfiguration = async () => {
      try {
        const apiKey = await getGroqApiKey();
        setIsApiConfigured(!!apiKey);
      } catch (error) {
        console.error("[v0] Erro ao verificar API:", error);
        setIsApiConfigured(false);
      }
    };

    checkApiConfiguration();
  }, [isOpen]);

  // Carregar histórico do Firebase quando o chat abrir
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
      snapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.createdAt?.toDate() || new Date(),
        });
      });

      history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const recentHistory = history.slice(-50);

      if (recentHistory.length > 0) {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `Olá! Eu sou o **APEX Chat**, seu assistente virtual com acesso completo aos dados do sistema. Como posso ajudá-lo hoje?`,
            timestamp: new Date(),
          },
          ...recentHistory
        ]);
      }
    });

    return () => unsubscribe();
  }, [isOpen, user]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userContent = input;
    setInput("");
    setIsLoading(true);
    
    const userMessage: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    let databaseContext: DatabaseContextResult = { hasRelevantData: false, context: "", fallbackAnswer: "" };

    try {
      // 1. Salvar mensagem do usuário no Firebase
      await addDoc(collection(db, "chat_messages"), {
        userId: user.uid,
        role: "user",
        content: userContent,
        createdAt: serverTimestamp(),
      });

      // 2. Buscar contexto de todas as coleções relevantes
      databaseContext = await fetchDatabaseContext(userContent);

      // 3. Preparar o histórico de mensagens para o contexto
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // 4. Preparar o system prompt com as habilidades e contexto do usuário
      const systemPrompt = `${skillPrompt}

Informações do usuário:
- Nome: ${userData?.nome || user.email || "Usuário"}
- Email: ${user?.email || "Não informado"}

Você é o APEX Chat, um assistente virtual do sistema APEX HUB com ACESSO TOTAL aos dados do sistema.
Você tem acesso às seguintes coleções do banco de dados:
- produtos: informações de estoque, preços, fornecedores, vencimentos
- fornecedores: razão social, CNPJ, contatos, condições de pagamento, endereços
- equipamentos: máquinas, patrimônio, setores, tags, status
- manutentores: técnicos de manutenção, contatos, setores
- manuais: documentação técnica, instruções
- tarefas_manutencao: tarefas preventivas, agendamentos
- ordens_servicos: ordens de serviço abertas e concluídas
- unidades: filiais, endereços
- setores: departamentos
- centros_de_custo: gestão financeira

Diretrizes:
- SEMPRE use os dados fornecidos no contexto para responder
- Se perguntarem sobre quantidades, valores ou dados específicos, consulte os dados fornecidos
- Formate respostas de forma clara e organizada
- Para relatórios, use listas ou formato tabular
- Seja preciso e cite os dados exatos encontrados
- Se não encontrar o dado solicitado, informe claramente
- Responda sempre em português do Brasil`;

      // 5. Preparar as mensagens para a API Groq
      const fullSystemPrompt = databaseContext.hasRelevantData 
        ? `${systemPrompt}${databaseContext.context}`
        : systemPrompt;

      const apiMessages = [
        { role: "system", content: fullSystemPrompt },
        ...conversationHistory,
        { role: "user", content: userContent }
      ];

      // 6. Fazer requisição direta para a API Groq
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw new Error("Sem conexao com a internet");
      }

      const groqConfig = await getGroqConfig();
      if (!groqConfig) {
        throw new Error("Chave da API Groq nao configurada na colecao 'ape_key'. Configure o campo 'groq' antes de usar o APEX Chat.");
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

      // Mensagem de erro amigável
      let errorMessageText = "Desculpe, houve um erro ao processar sua mensagem. ";
      
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes("sem conexao") || (typeof navigator !== "undefined" && navigator.onLine === false)) {
          errorMessageText += "Você está offline. Verifique sua conexão com a internet.";
        } else if (error.message.includes("API") || error.message.includes("401")) {
          errorMessageText += "Problema com o serviço de IA. Tente novamente.";
        } else if (error.message.includes("fetch") || error.message.toLowerCase().includes("network") || error.message.toLowerCase().includes("abort")) {
          errorMessageText += "Não foi possível conectar ao serviço. Verifique sua conexão com a internet.";
        } else if (error.message.includes("429")) {
          errorMessageText += "Muitas requisições. Aguarde alguns segundos e tente novamente.";
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <span>APEX Chat</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                <div className={`max-w-[80%] flex flex-col gap-2 ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      <SimpleMarkdown content={message.content} />
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === "user"
                          ? "text-primary-foreground/70"
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
                          className="rounded-lg border bg-card overflow-hidden flex gap-3 p-3 shadow-sm"
                        >
                          <img
                            src={prod.imageUrl}
                            alt={prod.nome}
                            className="w-16 h-16 object-cover rounded-md flex-shrink-0 bg-muted"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-semibold text-foreground leading-tight truncate">{prod.nome}</span>
                            {prod.codigo_estoque && (
                              <span className="text-xs text-muted-foreground">Cód: {prod.codigo_estoque}</span>
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

                  {/* Chips de sugestões de produtos relacionados */}
                  {message.role === "assistant" && message.produtosSugeridos && message.produtosSugeridos.length > 1 && (
                    <div className="flex flex-col gap-1.5 w-full">
                      <span className="text-xs text-muted-foreground">Produtos relacionados encontrados — clique para consultar:</span>
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
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Consultando dados do sistema...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t space-y-3">
          {isApiConfigured === false && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2 text-sm text-yellow-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-yellow-600 mt-0.5" />
              <div>
                <strong>Chave de API não configurada</strong>
                <p className="text-xs mt-1">
                  Adicione sua chave do Groq no campo <code className="bg-yellow-100 px-1 rounded">groq</code> da coleção <code className="bg-yellow-100 px-1 rounded">ape_key</code> no Firebase.
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Pergunte sobre produtos, fornecedores, equipamentos..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isApiConfigured === false}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim() || isApiConfigured === false}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApexChatModal;
