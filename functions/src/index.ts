import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();

const db = admin.firestore();
// Segredos ficam no Secret Manager, nunca no Firestore nem no front-end.
// Configure com: firebase functions:secrets:set GROQ_API_KEY
const GROQ_API_KEY = defineSecret("GROQ_API_KEY");
// Token do GitHub usado pelo proxy do IDE (opcional).
const GITHUB_TOKEN = defineSecret("GITHUB_TOKEN");


const REGION = "southamerica-east1";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

const ALL_REPORT_COLLECTIONS = [
  "produtos",
  "fornecedores",
  "equipamentos",
  "manutentores",
  "pdf_manuais",
  "tarefas_manutencao",
  "ordens_servicos",
  "unidades",
  "setores",
  "centros_de_custo",
  "medidas_lenha",
  "paradas_maquina",
] as const;

type ReportCollectionName = (typeof ALL_REPORT_COLLECTIONS)[number];

type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

const SENSITIVE_FIELD_PATTERNS = [
  /senha/i,
  /password/i,
  /token/i,
  /secret/i,
  /api[-_]?key/i,
  /private[-_]?key/i,
  /encrypted/i,
  /cpf/i,
  /cnpj/i,
  /rg/i,
  /documento/i,
  /telefone/i,
  /celular/i,
  /email/i,
  /endereco/i,
  /address/i,
  /salario/i,
  /salary/i,
];

const SAFE_USER_FIELDS = [
  "nome",
  "cargo",
  "perfil",
  "centro_de_custo",
  "unidade",
  "ativo",
  "online",
  "permissoes",
];

function assertAuthenticated(request: {
  auth?: { uid?: string } | null;
  app?: unknown;
}): string {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Autenticacao obrigatoria.");
  }

  if (!request.app) {
    throw new HttpsError("failed-precondition", "App Check obrigatorio.");
  }

  return request.auth.uid;
}

async function getActiveUserProfile(uid: string) {
  const snapshot = await db.collection("usuarios").doc(uid).get();

  if (!snapshot.exists) {
    throw new HttpsError("permission-denied", "Perfil de usuario nao encontrado.");
  }

  const data = snapshot.data() ?? {};

  if (data.ativo !== "sim") {
    throw new HttpsError("permission-denied", "Usuario sem acesso ativo.");
  }

  return {
    id: uid,
    ...Object.fromEntries(
      Object.entries(data).filter(([key]) => SAFE_USER_FIELDS.includes(key))
    ),
  };
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function sanitizeInput(message: string): string {
  const cleaned = message
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    throw new HttpsError("invalid-argument", "Mensagem vazia.");
  }

  if (cleaned.length > 4000) {
    throw new HttpsError("invalid-argument", "Mensagem muito longa.");
  }

  const suspiciousPatterns = [
    /ignore\s+previous/gi,
    /system\s*prompt/gi,
    /jailbreak/gi,
    /developer\s+mode/gi,
    /bypass/gi,
    /override/gi,
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(cleaned))) {
    throw new HttpsError(
      "invalid-argument",
      "Entrada bloqueada por politica de seguranca."
    );
  }

  return cleaned;
}

function maskString(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length <= 4) {
    return "*".repeat(trimmed.length);
  }

  return `${trimmed.slice(0, 2)}${"*".repeat(
    Math.max(trimmed.length - 4, 2)
  )}${trimmed.slice(-2)}`;
}

function sanitizeScalar(key: string, value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  if (SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(key))) {
    return maskString(value);
  }

  return value;
}

function sanitizeDocument(
  input: unknown,
  parentKey = ""
): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeDocument(item, parentKey));
  }

  if (input && typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>).map(
      ([key, value]) => [key, sanitizeDocument(value, key)]
    );

    return Object.fromEntries(entries);
  }

  return sanitizeScalar(parentKey, input);
}

function sanitizeForStorage(
  input: Record<string, unknown>
): Record<string, unknown> {
  return sanitizeDocument(input) as Record<string, unknown>;
}

function sanitizeForReport(
  collectionName: string,
  input: Record<string, unknown>
): Record<string, unknown> {
  const sanitized = sanitizeDocument(input) as Record<string, unknown>;

  if (collectionName === "usuarios") {
    return Object.fromEntries(
      Object.entries(sanitized).filter(([key]) => SAFE_USER_FIELDS.includes(key))
    );
  }

  return sanitized;
}

function extractSearchTerms(message: string): string[] {
  const stopWords = new Set([
    "quais",
    "qual",
    "como",
    "onde",
    "para",
    "com",
    "sem",
    "uma",
    "umas",
    "uns",
    "que",
    "sobre",
    "todos",
    "todas",
    "apex",
    "hub",
    "chat",
    "relatorio",
    "relatorios",
  ]);

  return normalizeText(message)
    .split(/\s+/)
    .filter((term) => term.length >= 3 && !stopWords.has(term))
    .slice(0, 8);
}

function detectRelevantCollections(message: string): ReportCollectionName[] {
  const normalized = normalizeText(message);
  const matches = new Set<ReportCollectionName>();

  if (/(produto|estoque|deposito|prateleira|vencimento|material|peca|item)/.test(normalized)) {
    matches.add("produtos");
  }
  if (/(fornecedor|cnpj|compra|cotacao|prazo entrega)/.test(normalized)) {
    matches.add("fornecedores");
  }
  if (/(maquina|equipamento|patrimonio|tag)/.test(normalized)) {
    matches.add("equipamentos");
  }
  if (/(manutentor|tecnico|responsavel manutencao)/.test(normalized)) {
    matches.add("manutentores");
  }
  if (/(manual|documentacao tecnica|pdf)/.test(normalized)) {
    matches.add("pdf_manuais");
  }
  if (/(preventiva|tarefa|agendamento)/.test(normalized)) {
    matches.add("tarefas_manutencao");
  }
  if (/(ordem|os |ordens servico|servico)/.test(normalized)) {
    matches.add("ordens_servicos");
  }
  if (/(unidade|filial|loja)/.test(normalized)) {
    matches.add("unidades");
  }
  if (/(setor|departamento|area)/.test(normalized)) {
    matches.add("setores");
  }
  if (/(centro de custo|financeiro|custo)/.test(normalized)) {
    matches.add("centros_de_custo");
  }
  if (/(lenha|cubagem|biomassa|m3)/.test(normalized)) {
    matches.add("medidas_lenha");
  }
  if (/(parada|quebra|parou|indisponivel)/.test(normalized)) {
    matches.add("paradas_maquina");
  }

  if (!matches.size) {
    matches.add("produtos");
    matches.add("equipamentos");
    matches.add("ordens_servicos");
  }

  return [...matches];
}

async function readCollectionSanitized(
  collectionName: ReportCollectionName
) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...sanitizeForReport(collectionName, doc.data()),
  }));
}

function matchDocuments(
  docs: Record<string, unknown>[],
  searchTerms: string[],
  maxItems = 20
) {
  if (!searchTerms.length) {
    return docs.slice(0, maxItems);
  }

  const ranked = docs.filter((doc) => {
    const haystack = normalizeText(JSON.stringify(doc));
    return searchTerms.some((term) => haystack.includes(term));
  });

  return ranked.slice(0, maxItems);
}

async function buildChatContext(message: string) {
  const searchTerms = extractSearchTerms(message);
  const collectionNames = detectRelevantCollections(message);

  const sections = await Promise.all(
    collectionNames.map(async (collectionName) => {
      const docs = await readCollectionSanitized(collectionName);
      const relevantDocs = matchDocuments(docs, searchTerms, 15);

      return {
        collectionName,
        totalDocuments: docs.length,
        relevantDocs,
      };
    })
  );

  const contextText = sections
    .map((section) => {
      const serialized = section.relevantDocs
        .map((doc, index) => `${index + 1}. ${JSON.stringify(doc)}`)
        .join("\n");

      return [
        `=== COLECAO ${section.collectionName.toUpperCase()} ===`,
        `Total de documentos: ${section.totalDocuments}`,
        serialized ? `Documentos relevantes:\n${serialized}` : "Nenhum documento relevante encontrado.",
      ].join("\n");
    })
    .join("\n\n");

  return {
    collectionNames,
    contextText,
  };
}

async function storeChatMessage(
  uid: string,
  role: "user" | "assistant",
  content: string
) {
  await db
    .collection("usuarios")
    .doc(uid)
    .collection("apex_chat_messages")
    .add({
      role,
      content,
      createdAt: FieldValue.serverTimestamp(),
    });
}

function buildSystemPrompt(input: {
  userProfile: Record<string, unknown>;
  pagePath?: string;
  pageDocumentation?: string;
  contextText: string;
}) {
  const pageSection = input.pageDocumentation
    ? `\n\n=== DOCUMENTACAO DA PAGINA ===\n${input.pageDocumentation.slice(0, 5000)}`
    : "";

  return [
    "Voce e o APEX AI, assistente do sistema APEX HUB.",
    "Regras obrigatorias:",
    "- Responda sempre em portugues do Brasil.",
    "- Nunca exponha chaves, tokens, emails completos, CPF, CNPJ, senha ou dados privados.",
    "- Se o usuario pedir dado sensivel, recuse com educacao.",
    "- Use apenas o contexto do sistema recebido abaixo.",
    "- Nao invente acesso a dados que nao estejam no contexto.",
    "- Foque em orientacao operacional, uso do sistema, resumo de estoque e manutencao.",
    "",
    "Perfil autenticado do usuario:",
    JSON.stringify(input.userProfile),
    input.pagePath ? `Pagina atual: ${input.pagePath}` : "",
    pageSection,
    "",
    "Contexto seguro do banco:",
    input.contextText,
  ]
    .filter(Boolean)
    .join("\n");
}

async function callGroqChat(input: {
  message: string;
  model?: string;
  history: ChatHistoryItem[];
  systemPrompt: string;
}) {
  // A chave vem exclusivamente do Secret Manager (nunca do Firestore).
  const apiKey = GROQ_API_KEY.value() || process.env.GROQ_API_KEY || "";

  if (!apiKey) {
    throw new HttpsError(
      "failed-precondition",
      "GROQ_API_KEY nao configurada. Rode: firebase functions:secrets:set GROQ_API_KEY"
    );
  }


  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model || DEFAULT_MODEL,
      temperature: 0.3,
      max_tokens: 1200,
      messages: [
        { role: "system", content: input.systemPrompt },
        ...input.history.slice(-12),
        { role: "user", content: input.message },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new HttpsError(
      response.status === 429 ? "resource-exhausted" : "internal",
      `Falha no provedor de IA: ${text || response.statusText}`
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return (
    payload.choices?.[0]?.message?.content?.trim() ||
    "Nao consegui gerar a resposta agora."
  );
}

function chunkText(content: string, chunkSize = 700000): string[] {
  const chunks: string[] = [];

  for (let index = 0; index < content.length; index += chunkSize) {
    chunks.push(content.slice(index, index + chunkSize));
  }

  return chunks.length ? chunks : [""];
}

export const apexChatMessage = onCall(
  {
    region: REGION,
    timeoutSeconds: 120,
    memory: "1GiB",
    enforceAppCheck: true,
    secrets: [GROQ_API_KEY],
  },

  async (request) => {
    const uid = assertAuthenticated(request);
    const userProfile = await getActiveUserProfile(uid);

    const message = sanitizeInput(String(request.data?.message ?? ""));
    const pagePath = String(request.data?.pagePath ?? "");
    const pageDocumentation = String(request.data?.pageDocumentation ?? "");
    const history = Array.isArray(request.data?.conversationHistory)
      ? (request.data.conversationHistory as ChatHistoryItem[])
          .filter(
            (item) =>
              item &&
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string"
          )
          .slice(-12)
      : [];

    const { collectionNames, contextText } = await buildChatContext(message);
    const systemPrompt = buildSystemPrompt({
      userProfile,
      pagePath,
      pageDocumentation,
      contextText,
    });

    const answer = await callGroqChat({
      message,
      model: typeof request.data?.model === "string" ? request.data.model : undefined,
      history,
      systemPrompt,
    });

    await Promise.all([
      storeChatMessage(uid, "user", message),
      storeChatMessage(uid, "assistant", answer),
    ]);

    return {
      answer,
      matchedCollections: collectionNames,
    };
  }
);

export const clearApexChatHistory = onCall(
  {
    region: REGION,
    timeoutSeconds: 120,
    memory: "512MiB",
    enforceAppCheck: true,
  },
  async (request) => {
    const uid = assertAuthenticated(request);
    await getActiveUserProfile(uid);

    const historyRef = db
      .collection("usuarios")
      .doc(uid)
      .collection("apex_chat_messages");

    const snapshot = await historyRef.get();

    let batch = db.batch();
    let operationCount = 0;

    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      operationCount += 1;

      if (operationCount === 400) {
        await batch.commit();
        batch = db.batch();
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    return {
      cleared: snapshot.size,
    };
  }
);

export const generateFullReport = onCall(
  {
    region: REGION,
    timeoutSeconds: 300,
    memory: "1GiB",
    enforceAppCheck: true,
    secrets: [GROQ_API_KEY],
  },
  async (request) => {
    const uid = assertAuthenticated(request);
    const userProfile = await getActiveUserProfile(uid);

    const requestedCollections = Array.isArray(request.data?.collections)
      ? request.data.collections
          .filter((item: unknown): item is ReportCollectionName =>
            ALL_REPORT_COLLECTIONS.includes(item as ReportCollectionName)
          )
      : [];

    const collections = requestedCollections.length
      ? requestedCollections
      : [...ALL_REPORT_COLLECTIONS];

    const reportPayload: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      generatedBy: sanitizeForStorage(userProfile),
      collections: {},
      totals: {
        collections: collections.length,
        documents: 0,
      },
    };

    for (const collectionName of collections) {
      const docs = await readCollectionSanitized(collectionName);
      (reportPayload.collections as Record<string, unknown>)[collectionName] = {
        totalDocuments: docs.length,
        documents: docs,
      };
      (reportPayload.totals as Record<string, number>).documents += docs.length;
    }

    const reportJson = JSON.stringify(reportPayload, null, 2);
    const chunks = chunkText(reportJson);

    const reportRef = db
      .collection("usuarios")
      .doc(uid)
      .collection("secure_reports")
      .doc();

    await reportRef.set({
      createdAt: FieldValue.serverTimestamp(),
      ownerUid: uid,
      collectionNames: collections,
      chunkCount: chunks.length,
      totalDocuments: (reportPayload.totals as Record<string, number>).documents,
      format: "json",
    });

    for (const [index, chunk] of chunks.entries()) {
      await reportRef.collection("chunks").doc(String(index)).set({
        content: chunk,
        index,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return {
      reportId: reportRef.id,
      collectionNames: collections,
      chunkCount: chunks.length,
      totalDocuments: (reportPayload.totals as Record<string, number>).documents,
    };
  }
);

export const getSecureReportChunk = onCall(
  {
    region: REGION,
    timeoutSeconds: 120,
    memory: "512MiB",
    enforceAppCheck: true,
  },
  async (request) => {
    const uid = assertAuthenticated(request);
    await getActiveUserProfile(uid);

    const reportId = String(request.data?.reportId ?? "");
    const chunkIndex = String(request.data?.chunkIndex ?? "0");

    if (!reportId) {
      throw new HttpsError("invalid-argument", "reportId obrigatorio.");
    }

    const reportRef = db
      .collection("usuarios")
      .doc(uid)
      .collection("secure_reports")
      .doc(reportId);

    const reportSnapshot = await reportRef.get();

    if (!reportSnapshot.exists) {
      throw new HttpsError("not-found", "Relatorio nao encontrado.");
    }

    const chunkSnapshot = await reportRef.collection("chunks").doc(chunkIndex).get();

    if (!chunkSnapshot.exists) {
      throw new HttpsError("not-found", "Trecho do relatorio nao encontrado.");
    }

    return {
      reportId,
      chunkIndex: Number(chunkIndex),
      chunkCount: reportSnapshot.data()?.chunkCount ?? 0,
      content: String(chunkSnapshot.data()?.content ?? ""),
    };
  }
);

export const getProductPriceQuotes = onCall(
  {
    region: REGION,
    timeoutSeconds: 120,
    memory: "1GiB",
    enforceAppCheck: true,
    secrets: [GROQ_API_KEY],
  },

  async (request) => {
    const uid = assertAuthenticated(request);
    await getActiveUserProfile(uid);

    const productName = String(request.data?.productName ?? "");
    const location = request.data?.location as { lat: number; lng: number } | undefined;

    if (!productName) {
      throw new HttpsError("invalid-argument", "Nome do produto obrigatorio.");
    }

    const systemPrompt = [
      "Voce e um assistente de compras especializado em analise de mercado.",
      "Sua tarefa e gerar uma lista simulada de 5 fornecedores proximos para o produto solicitado.",
      "Como voce nao tem acesso em tempo real ao Google Maps agora, gere nomes de fornecedores realistas (existentes ou verossimeis) no Brasil.",
      "Para cada fornecedor, forneça:",
      "1. Nome do Fornecedor",
      "2. Endereco aproximado (rua, bairro)",
      "3. Distancia aproximada (em km)",
      "4. Preço unitario estimado (baseado em precos de mercado atuais no Brasil)",
      "5. Condicao de pagamento tipica",
      "6. Prazo de entrega",
      "Retorne APENAS um JSON valido no seguinte formato:",
      "{\"quotes\": [{\"supplier\": \"Nome\", \"address\": \"Rua...\", \"distance\": 5.2, \"price\": 150.00, \"payment\": \"30 dias\", \"delivery\": \"2 dias\"}]}",
    ].join("\n");

    const answer = await callGroqChat({
      message: `Produto: ${productName}. Localizacao do usuario: ${location ? `Lat: ${location.lat}, Lng: ${location.lng}` : "Desconhecida"}.`,
      model: DEFAULT_MODEL,
      history: [],
      systemPrompt,
    });

    try {
      // Tenta limpar a resposta caso o LLM coloque markdown
      const jsonMatch = answer.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : answer;
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Erro ao parsear resposta da IA:", answer);
      throw new HttpsError("internal", "Falha ao processar cotacao da IA.");
    }
  }
);


/* ======================================================================
 * Integracao GitHub (IDE)
 * O token NUNCA vai para o front-end. Fica no Secret Manager (GITHUB_TOKEN)
 * ou em uma colecao acessivel apenas pelo Admin SDK (github_tokens),
 * bloqueada pelas Firestore Rules. O cliente so conversa com este proxy.
 * ==================================================================== */

const PRIVILEGED_ROLES = ["DESENVOLVEDOR", "ADMIN"];

async function assertGitHubOperator(uid: string) {
  const snapshot = await db.collection("usuarios").doc(uid).get();
  const data = snapshot.data() ?? {};

  if (!snapshot.exists || data.ativo !== "sim") {
    throw new HttpsError("permission-denied", "Usuario sem acesso ativo.");
  }

  const perfil = String(data.perfil ?? "").toUpperCase();
  const cargo = String(data.cargo ?? "").toUpperCase();

  if (!PRIVILEGED_ROLES.includes(perfil) && !PRIVILEGED_ROLES.includes(cargo)) {
    throw new HttpsError("permission-denied", "Acesso restrito ao IDE.");
  }

  return uid;
}

type GitHubStoredConfig = {
  owner: string;
  repo: string;
  token: string;
};

async function loadGitHubConfig(uid: string): Promise<GitHubStoredConfig | null> {
  const doc = await db.collection("github_tokens").doc(uid).get();
  if (!doc.exists) return null;

  const data = doc.data() ?? {};
  const token = String(data.token ?? "") || GITHUB_TOKEN.value() || "";

  if (!token) return null;

  return {
    owner: String(data.owner ?? ""),
    repo: String(data.repo ?? ""),
    token,
  };
}

/** Salva/atualiza a configuracao. O token entra e nunca mais sai. */
export const saveGitHubIntegration = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB", enforceAppCheck: true },
  async (request) => {
    const uid = assertAuthenticated(request);
    await assertGitHubOperator(uid);

    const token = String(request.data?.token ?? "").trim();
    const owner = String(request.data?.owner ?? "").trim();
    const repo = String(request.data?.repo ?? "").trim();

    if (!token || !owner || !repo) {
      throw new HttpsError("invalid-argument", "token, owner e repo sao obrigatorios.");
    }
    if (owner.length > 120 || repo.length > 200 || token.length > 500) {
      throw new HttpsError("invalid-argument", "Valores acima do tamanho permitido.");
    }

    await db.collection("github_tokens").doc(uid).set(
      {
        owner,
        repo,
        token,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { connected: true, owner, repo };
  }
);

/** Retorna apenas metadados publicos: nunca o token. */
export const getGitHubIntegration = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB", enforceAppCheck: true },
  async (request) => {
    const uid = assertAuthenticated(request);
    await assertGitHubOperator(uid);

    const config = await loadGitHubConfig(uid);
    if (!config) return { connected: false };

    return { connected: true, owner: config.owner, repo: config.repo };
  }
);

export const deleteGitHubIntegration = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB", enforceAppCheck: true },
  async (request) => {
    const uid = assertAuthenticated(request);
    await assertGitHubOperator(uid);

    await db.collection("github_tokens").doc(uid).delete();
    return { connected: false };
  }
);

/**
 * Proxy autenticado para a API do GitHub.
 * O cliente envia metodo/url/corpo; o servidor injeta o token.
 */
export const githubProxy = onCall(
  {
    region: REGION,
    timeoutSeconds: 300,
    memory: "1GiB",
    enforceAppCheck: true,
    secrets: [GITHUB_TOKEN],
  },
  async (request) => {
    const uid = assertAuthenticated(request);
    await assertGitHubOperator(uid);

    const config = await loadGitHubConfig(uid);
    if (!config) {
      throw new HttpsError("failed-precondition", "Integracao GitHub nao configurada.");
    }

    const method = String(request.data?.method ?? "GET").toUpperCase();
    const url = String(request.data?.url ?? "");
    const body = request.data?.body;
    const headers = (request.data?.headers ?? {}) as Record<string, string>;

    if (!["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD"].includes(method)) {
      throw new HttpsError("invalid-argument", "Metodo HTTP nao permitido.");
    }

    // Somente a API oficial do GitHub e alcancavel (evita SSRF).
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new HttpsError("invalid-argument", "URL invalida.");
    }
    if (parsed.protocol !== "https:" || parsed.hostname !== "api.github.com") {
      throw new HttpsError("invalid-argument", "Somente https://api.github.com e permitido.");
    }

    const safeHeaders: Record<string, string> = {
      Accept: headers.accept || headers.Accept || "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "apex-erp-ide",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${config.token}`,
    };

    const response = await fetch(parsed.toString(), {
      method,
      headers: safeHeaders,
      body: method === "GET" || method === "HEAD" ? undefined :
        typeof body === "string" ? body : JSON.stringify(body ?? {}),
    });

    const text = await response.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      /* resposta nao-JSON: devolve texto */
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  }
);
