/**
 * APEX Chat Security Service
 * Responsável por garantir segurança e boas práticas no APEX Chat AI
 */

// =============================================
// RATE LIMITING
// =============================================

interface UserRateLimit {
  messageCount: number;
  lastResetTime: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, UserRateLimit>();

const RATE_LIMIT_CONFIG = {
  messagesPerMinute: 30,
  minuteWindow: 60 * 1000, // 60 segundos
  blockDurationMs: 5 * 60 * 1000, // 5 minutos de bloqueio
};

export const checkRateLimit = (userId: string): { allowed: boolean; reason?: string } => {
  const now = Date.now();
  let userLimit = rateLimitStore.get(userId);

  // Se usuário não existe ou janela expirou, resetar
  if (!userLimit || now - userLimit.lastResetTime > RATE_LIMIT_CONFIG.minuteWindow) {
    rateLimitStore.set(userId, {
      messageCount: 1,
      lastResetTime: now,
    });
    return { allowed: true };
  }

  // Verificar se usuário está bloqueado
  if (userLimit.blockedUntil && now < userLimit.blockedUntil) {
    const remainingMs = userLimit.blockedUntil - now;
    return {
      allowed: false,
      reason: `Você enviou muitas mensagens. Tente novamente em ${Math.ceil(remainingMs / 1000)} segundos.`,
    };
  }

  // Incrementar contador
  userLimit.messageCount++;

  // Se ultrapassou limite, bloquear
  if (userLimit.messageCount > RATE_LIMIT_CONFIG.messagesPerMinute) {
    userLimit.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
    console.warn(`[APEX SECURITY] Usuário ${userId} foi limitado por rate limiting`);
    return {
      allowed: false,
      reason: `Limite de mensagens excedido. Tente novamente em alguns minutos.`,
    };
  }

  rateLimitStore.set(userId, userLimit);
  return { allowed: true };
};

// =============================================
// INPUT VALIDATION E SANITIZAÇÃO
// =============================================

const DANGEROUS_PATTERNS = [
  /system\s*:/gi, // Tentar modificar system prompt
  /ignore.*instruction/gi, // Tentar ignorar instruções
  /forget.*instruction/gi,
  /aja\s*como/gi, // "Aja como" para prompt injection
  /pretend/gi,
  /you\s*are/gi,
  /voce\s*e/gi,
  /override/gi,
  /bypass/gi,
  /jailbreak/gi,
  /eval\s*\(/gi, // Tentativas de execução
  /exec\s*\(/gi,
  /script/gi,
];

const DANGEROUS_KEYWORDS = [
  'senhas',
  'passwords',
  'credential',
  'credencial',
  'privado',
  'private',
  'confidencial',
  'salary',
  'salário',
  'demissão',
  'despedir',
];

export const validateInput = (input: string): { valid: boolean; reason?: string; cleaned: string } => {
  // Verificar comprimento
  if (!input || input.trim().length === 0) {
    return { valid: false, reason: 'Mensagem vazia', cleaned: input };
  }

  if (input.length > 5000) {
    return { valid: false, reason: 'Mensagem muito longa (máximo 5000 caracteres)', cleaned: input };
  }

  // Verificar padrões perigosos (prompt injection)
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      console.warn(`[APEX SECURITY] Tentativa de prompt injection detectada: ${pattern}`);
      return {
        valid: false,
        reason: 'Mensagem contém padrões inválidos. Por favor, reformule sua pergunta.',
        cleaned: input,
      };
    }
  }

  // Verificar se pede informações restritas
  const lowerInput = input.toLowerCase();
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (lowerInput.includes(keyword)) {
      console.warn(`[APEX SECURITY] Tentativa de acesso a informação restrita: ${keyword}`);
      // Não bloquear totalmente, mas alertar
      break;
    }
  }

  // Limpar a mensagem (remover caracteres de controle, espaços extras)
  const cleaned = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();

  return { valid: true, cleaned };
};

// =============================================
// SEGURANÇA DE RESPOSTA
// =============================================

const RESTRICTED_INFO_PATTERNS = [
  /salário|salary|remuneração/i,
  /senha|password|credencial/i,
  /cpf|rg|documento/i,
  /telefone|celular|phone/i,
  /endereço|address/i,
  /demiss|fired|despedir/i,
  /promoveção|promotion/i,
];

export const validateResponse = (response: string, userId: string): { safe: boolean; cleaned: string } => {
  let cleaned = response;

  // Verificar se a resposta contém informações restritas
  for (const pattern of RESTRICTED_INFO_PATTERNS) {
    if (pattern.test(response)) {
      console.warn(`[APEX SECURITY] Resposta pode conter informação restrita para usuário ${userId}: ${pattern}`);
      // A resposta já foi gerada pela IA, apenas registramos o aviso
    }
  }

  // Remover potenciais informações sensíveis como números
  // (emails, CPF, etc) - fazer isso de forma conservadora
  // Apenas remover se parecer um padrão suspeito

  return { safe: true, cleaned };
};

// =============================================
// AUDIT LOGGING
// =============================================

interface AuditLog {
  timestamp: Date;
  userId: string;
  action: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error';
}

const auditLogs: AuditLog[] = [];

export const logAuditEvent = (
  userId: string,
  action: string,
  details: Record<string, any> = {},
  severity: 'info' | 'warning' | 'error' = 'info'
) => {
  const log: AuditLog = {
    timestamp: new Date(),
    userId,
    action,
    details,
    severity,
  };

  auditLogs.push(log);

  // Manter apenas últimos 1000 logs em memória
  if (auditLogs.length > 1000) {
    auditLogs.shift();
  }

  // Log no console para severity >= warning
  if (severity !== 'info') {
    console.log(`[APEX AUDIT] [${severity.toUpperCase()}] ${action}`, {
      userId,
      timestamp: log.timestamp,
      ...details,
    });
  }
};

export const getAuditLogs = (userId?: string, limit: number = 100): AuditLog[] => {
  let logs = auditLogs;

  if (userId) {
    logs = logs.filter(log => log.userId === userId);
  }

  return logs.slice(-limit);
};

// =============================================
// SESSION SECURITY
// =============================================

interface SessionInfo {
  userId: string;
  startTime: Date;
  lastActivityTime: Date;
  ipHash?: string;
  messageCount: number;
}

const activeSessions = new Map<string, SessionInfo>();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

export const createSession = (userId: string): SessionInfo => {
  const now = new Date();
  const session: SessionInfo = {
    userId,
    startTime: now,
    lastActivityTime: now,
    messageCount: 0,
  };

  activeSessions.set(userId, session);
  logAuditEvent(userId, 'SESSION_CREATED', { sessionStart: now });

  return session;
};

export const updateSessionActivity = (userId: string): boolean => {
  const session = activeSessions.get(userId);

  if (!session) {
    return false;
  }

  const now = new Date();
  const inactiveTime = now.getTime() - session.lastActivityTime.getTime();

  // Se sessão expirou por inatividade
  if (inactiveTime > SESSION_TIMEOUT_MS) {
    endSession(userId, 'SESSION_TIMEOUT');
    return false;
  }

  session.lastActivityTime = now;
  session.messageCount++;

  return true;
};

export const endSession = (userId: string, reason: string = 'USER_LOGOUT'): void => {
  const session = activeSessions.get(userId);

  if (session) {
    const duration = new Date().getTime() - session.startTime.getTime();
    logAuditEvent(userId, 'SESSION_ENDED', {
      reason,
      duration: `${duration / 1000}s`,
      messageCount: session.messageCount,
    });
    activeSessions.delete(userId);
  }
};

export const getActiveSessionCount = (): number => {
  return activeSessions.size;
};

// =============================================
// API KEY PROTECTION
// =============================================

export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 4) return '***';
  return apiKey.slice(0, 2) + '*'.repeat(Math.max(0, apiKey.length - 6)) + apiKey.slice(-2);
};

// =============================================
// DETECÇÃO DE ANOMALIAS
// =============================================

interface UserBehavior {
  averageMessageLength: number;
  messageFrequency: number; // mensagens por minuto
  lastMessagesPatterns: string[];
  totalMessages: number;
}

const userBehaviors = new Map<string, UserBehavior>();

export const detectAnomalousActivity = (
  userId: string,
  message: string
): { anomalous: boolean; confidence: number; reason?: string } => {
  const messageLength = message.length;
  const behavior = userBehaviors.get(userId);

  if (!behavior || behavior.totalMessages < 10) {
    // Não temos dados suficientes para análise
    return { anomalous: false, confidence: 0 };
  }

  let anomalyScore = 0;
  let reasons: string[] = [];

  // Se mensagem é muito diferente do tamanho médio
  const avgLength = behavior.averageMessageLength;
  if (messageLength > avgLength * 3 || messageLength < avgLength / 3) {
    anomalyScore += 20;
    reasons.push('Mensagem com tamanho atípico');
  }

  // Se muitas mensagens similares (possível spam/bot)
  if (behavior.lastMessagesPatterns.length > 5) {
    const repeatedPatterns = behavior.lastMessagesPatterns.filter(
      p => p.toLowerCase().includes(message.slice(0, 20).toLowerCase())
    ).length;

    if (repeatedPatterns > 3) {
      anomalyScore += 30;
      reasons.push('Padrão de mensagens repetidas detectado');
    }
  }

  // Detectado se score >= 40
  const isAnomalous = anomalyScore >= 40;

  if (isAnomalous) {
    logAuditEvent(userId, 'ANOMALOUS_ACTIVITY_DETECTED', {
      messageLength,
      avgLength,
      anomalyScore,
      reasons,
    }, 'warning');
  }

  return {
    anomalous: isAnomalous,
    confidence: Math.min(100, anomalyScore),
    reason: reasons.length > 0 ? reasons[0] : undefined,
  };
};

export const updateUserBehavior = (userId: string, message: string): void => {
  let behavior = userBehaviors.get(userId);

  if (!behavior) {
    behavior = {
      averageMessageLength: message.length,
      messageFrequency: 1,
      lastMessagesPatterns: [message.slice(0, 30)],
      totalMessages: 1,
    };
  } else {
    // Atualizar média de tamanho
    behavior.averageMessageLength =
      (behavior.averageMessageLength * behavior.totalMessages + message.length) /
      (behavior.totalMessages + 1);

    // Manter últimas 10 mensagens para análise
    behavior.lastMessagesPatterns.push(message.slice(0, 30));
    if (behavior.lastMessagesPatterns.length > 10) {
      behavior.lastMessagesPatterns.shift();
    }

    behavior.totalMessages++;
  }

  userBehaviors.set(userId, behavior);
};

// =============================================
// EXPORT DE STATUS SECURITY
// =============================================

export const getSecurityStatus = (userId: string) => {
  const session = activeSessions.get(userId);
  const rateLimit = rateLimitStore.get(userId);
  const logs = getAuditLogs(userId, 20);

  return {
    session: session
      ? {
        active: true,
        startTime: session.startTime,
        lastActivityTime: session.lastActivityTime,
        messageCount: session.messageCount,
      }
      : null,
    rateLimit: rateLimit
      ? {
        messageCount: rateLimit.messageCount,
        isBlocked: rateLimit.blockedUntil ? Date.now() < rateLimit.blockedUntil : false,
      }
      : null,
    recentLogs: logs.filter(l => l.severity !== 'info').slice(-5),
  };
};
