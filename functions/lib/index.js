"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecureReportChunk = exports.generateFullReport = exports.clearApexChatHistory = exports.apexChatMessage = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const params_1 = require("firebase-functions/params");
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
const db = admin.firestore();
const GROQ_API_KEY = (0, params_1.defineSecret)("GROQ_API_KEY");
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
];
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
function assertAuthenticated(request) {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError("unauthenticated", "Autenticacao obrigatoria.");
    }
    if (!request.app) {
        throw new https_1.HttpsError("failed-precondition", "App Check obrigatorio.");
    }
    return request.auth.uid;
}
async function getActiveUserProfile(uid) {
    const snapshot = await db.collection("usuarios").doc(uid).get();
    if (!snapshot.exists) {
        throw new https_1.HttpsError("permission-denied", "Perfil de usuario nao encontrado.");
    }
    const data = snapshot.data() ?? {};
    if (data.ativo !== "sim") {
        throw new https_1.HttpsError("permission-denied", "Usuario sem acesso ativo.");
    }
    return {
        id: uid,
        ...Object.fromEntries(Object.entries(data).filter(([key]) => SAFE_USER_FIELDS.includes(key))),
    };
}
function normalizeText(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}
function sanitizeInput(message) {
    const cleaned = message
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    if (!cleaned) {
        throw new https_1.HttpsError("invalid-argument", "Mensagem vazia.");
    }
    if (cleaned.length > 4000) {
        throw new https_1.HttpsError("invalid-argument", "Mensagem muito longa.");
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
        throw new https_1.HttpsError("invalid-argument", "Entrada bloqueada por politica de seguranca.");
    }
    return cleaned;
}
function maskString(value) {
    const trimmed = value.trim();
    if (trimmed.length <= 4) {
        return "*".repeat(trimmed.length);
    }
    return `${trimmed.slice(0, 2)}${"*".repeat(Math.max(trimmed.length - 4, 2))}${trimmed.slice(-2)}`;
}
function sanitizeScalar(key, value) {
    if (typeof value !== "string") {
        return value;
    }
    if (SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(key))) {
        return maskString(value);
    }
    return value;
}
function sanitizeDocument(input, parentKey = "") {
    if (Array.isArray(input)) {
        return input.map((item) => sanitizeDocument(item, parentKey));
    }
    if (input && typeof input === "object") {
        const entries = Object.entries(input).map(([key, value]) => [key, sanitizeDocument(value, key)]);
        return Object.fromEntries(entries);
    }
    return sanitizeScalar(parentKey, input);
}
function sanitizeForStorage(input) {
    return sanitizeDocument(input);
}
function sanitizeForReport(collectionName, input) {
    const sanitized = sanitizeDocument(input);
    if (collectionName === "usuarios") {
        return Object.fromEntries(Object.entries(sanitized).filter(([key]) => SAFE_USER_FIELDS.includes(key)));
    }
    return sanitized;
}
function extractSearchTerms(message) {
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
function detectRelevantCollections(message) {
    const normalized = normalizeText(message);
    const matches = new Set();
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
async function readCollectionSanitized(collectionName) {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...sanitizeForReport(collectionName, doc.data()),
    }));
}
function matchDocuments(docs, searchTerms, maxItems = 20) {
    if (!searchTerms.length) {
        return docs.slice(0, maxItems);
    }
    const ranked = docs.filter((doc) => {
        const haystack = normalizeText(JSON.stringify(doc));
        return searchTerms.some((term) => haystack.includes(term));
    });
    return ranked.slice(0, maxItems);
}
async function buildChatContext(message) {
    const searchTerms = extractSearchTerms(message);
    const collectionNames = detectRelevantCollections(message);
    const sections = await Promise.all(collectionNames.map(async (collectionName) => {
        const docs = await readCollectionSanitized(collectionName);
        const relevantDocs = matchDocuments(docs, searchTerms, 15);
        return {
            collectionName,
            totalDocuments: docs.length,
            relevantDocs,
        };
    }));
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
async function storeChatMessage(uid, role, content) {
    await db
        .collection("usuarios")
        .doc(uid)
        .collection("apex_chat_messages")
        .add({
        role,
        content,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
function buildSystemPrompt(input) {
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
async function callGroqChat(input) {
    const apiKey = GROQ_API_KEY.value();
    if (!apiKey) {
        throw new https_1.HttpsError("failed-precondition", "Secret GROQ_API_KEY nao configurado.");
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
        throw new https_1.HttpsError(response.status === 429 ? "resource-exhausted" : "internal", `Falha no provedor de IA: ${text || response.statusText}`);
    }
    const payload = (await response.json());
    return (payload.choices?.[0]?.message?.content?.trim() ||
        "Nao consegui gerar a resposta agora.");
}
function chunkText(content, chunkSize = 700000) {
    const chunks = [];
    for (let index = 0; index < content.length; index += chunkSize) {
        chunks.push(content.slice(index, index + chunkSize));
    }
    return chunks.length ? chunks : [""];
}
exports.apexChatMessage = (0, https_1.onCall)({
    region: REGION,
    timeoutSeconds: 120,
    memory: "1GiB",
    enforceAppCheck: true,
    secrets: [GROQ_API_KEY],
}, async (request) => {
    const uid = assertAuthenticated(request);
    const userProfile = await getActiveUserProfile(uid);
    const message = sanitizeInput(String(request.data?.message ?? ""));
    const pagePath = String(request.data?.pagePath ?? "");
    const pageDocumentation = String(request.data?.pageDocumentation ?? "");
    const history = Array.isArray(request.data?.conversationHistory)
        ? request.data.conversationHistory
            .filter((item) => item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string")
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
});
exports.clearApexChatHistory = (0, https_1.onCall)({
    region: REGION,
    timeoutSeconds: 120,
    memory: "512MiB",
    enforceAppCheck: true,
}, async (request) => {
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
});
exports.generateFullReport = (0, https_1.onCall)({
    region: REGION,
    timeoutSeconds: 300,
    memory: "1GiB",
    enforceAppCheck: true,
}, async (request) => {
    const uid = assertAuthenticated(request);
    const userProfile = await getActiveUserProfile(uid);
    const requestedCollections = Array.isArray(request.data?.collections)
        ? request.data.collections
            .filter((item) => ALL_REPORT_COLLECTIONS.includes(item))
        : [];
    const collections = requestedCollections.length
        ? requestedCollections
        : [...ALL_REPORT_COLLECTIONS];
    const reportPayload = {
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
        reportPayload.collections[collectionName] = {
            totalDocuments: docs.length,
            documents: docs,
        };
        reportPayload.totals.documents += docs.length;
    }
    const reportJson = JSON.stringify(reportPayload, null, 2);
    const chunks = chunkText(reportJson);
    const reportRef = db
        .collection("usuarios")
        .doc(uid)
        .collection("secure_reports")
        .doc();
    await reportRef.set({
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        ownerUid: uid,
        collectionNames: collections,
        chunkCount: chunks.length,
        totalDocuments: reportPayload.totals.documents,
        format: "json",
    });
    for (const [index, chunk] of chunks.entries()) {
        await reportRef.collection("chunks").doc(String(index)).set({
            content: chunk,
            index,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    return {
        reportId: reportRef.id,
        collectionNames: collections,
        chunkCount: chunks.length,
        totalDocuments: reportPayload.totals.documents,
    };
});
exports.getSecureReportChunk = (0, https_1.onCall)({
    region: REGION,
    timeoutSeconds: 120,
    memory: "512MiB",
    enforceAppCheck: true,
}, async (request) => {
    const uid = assertAuthenticated(request);
    await getActiveUserProfile(uid);
    const reportId = String(request.data?.reportId ?? "");
    const chunkIndex = String(request.data?.chunkIndex ?? "0");
    if (!reportId) {
        throw new https_1.HttpsError("invalid-argument", "reportId obrigatorio.");
    }
    const reportRef = db
        .collection("usuarios")
        .doc(uid)
        .collection("secure_reports")
        .doc(reportId);
    const reportSnapshot = await reportRef.get();
    if (!reportSnapshot.exists) {
        throw new https_1.HttpsError("not-found", "Relatorio nao encontrado.");
    }
    const chunkSnapshot = await reportRef.collection("chunks").doc(chunkIndex).get();
    if (!chunkSnapshot.exists) {
        throw new https_1.HttpsError("not-found", "Trecho do relatorio nao encontrado.");
    }
    return {
        reportId,
        chunkIndex: Number(chunkIndex),
        chunkCount: reportSnapshot.data()?.chunkCount ?? 0,
        content: String(chunkSnapshot.data()?.content ?? ""),
    };
});
//# sourceMappingURL=index.js.map