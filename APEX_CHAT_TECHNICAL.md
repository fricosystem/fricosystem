# 🔧 APEX Chat - Documentação Técnica

## Arquitetura da Solução

```
┌─────────────────────┐
│   ApexChatFab       │ (Botão flutuante)
└──────────┬──────────┘
           │
           ↓
┌──────────────────────┐
│ ApexChatModal        │ (Modal principal)
└──────────┬───────────┘
           │
      ┌────┴─────────────┬──────────────────┐
      │                  │                  │
      ↓                  ↓                  ↓
┌──────────────┐ ┌─────────────────┐ ┌──────────────┐
│ getGroqConfig│ │ fetchDatabase   │ │   Groq API   │
│              │ │ Context()       │ │              │
└──────┬───────┘ └────────┬────────┘ └──────────────┘
       │                  │
       ↓                  ↓
┌──────────────────────────────────────┐
│      apiKeyService                   │
│  (getGroqApiKey)                     │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────┐
│  Firebase Firestore  │
│  api_key collection  │
└──────────────────────┘
```

## Componentes

### 1. **ApexChatFab** 
- Localização: `/src/components/ApexChatFab.tsx`
- Responsabilidade: Botão flutuante com efeitos visuais
- Não cuida de API - apenas abre o modal

### 2. **ApexChatModal**
- Localização: `/src/components/ApexChatModal.tsx`
- Responsabilidade principal: Chat interativo
- Fluxo:
  1. Verifica se API está configurada (useEffect)
  2. Carrega histórico do Firebase
  3. Processa mensagens do usuário
  4. Busca contexto de banco de dados
  5. Faz requisição ao Groq
  6. Salva resposta no Firebase

### 3. **apiKeyService**
- Localização: `/src/services/apiKeyService.ts`
- Funções:
  - `getGroqApiKey()` → Promise<string | null>
  - `getApiKey(fieldName)` → Promise<string | null>
- Tratamento de erros incluído

### 4. **ApexChatApiStatus** (Componente reusável)
- Localização: `/src/components/ApexChatApiStatus.tsx`
- Uso: Mostrar status da API em qualquer página
- Estados: loading | configured | missing

## Fluxo de Dados

### Inicialização
```
isOpen = true
    ↓
useEffect dispara checkApiConfiguration()
    ↓
getGroqApiKey() busca em Firebase
    ↓
setIsApiConfigured(true/false)
    ↓
UI atualiza: input enabled/disabled
```

### Envio de Mensagem
```
handleSend() é chamado
    ↓
detecta coleções relevantes
    ↓
busca dados do Firebase
    ↓
chama getGroqConfig() para obter chave
    ↓
faz POST para https://api.groq.com/openai/v1/chat/completions
    ↓
salva mensagem em chat_messages
    ↓
atualiza UI
```

## Configuração do Firestore

### Estrutura Esperada
```
firestore
└── api_key (Collection)
    └── {auto_id} (Document)
        ├── groq: "gsk_..." (String)
        ├── criado_em: Timestamp
        └── atualizado_em: Timestamp
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Leitura por usuários autenticados
    match /api_key/{document=**} {
      allow read: if request.auth != null;
      // Escrita restrita a admin
      allow write: if request.auth.uid == 'UID_ADMIN_HERE';
    }
  }
}
```

## API Groq Integration

### Endpoint
```
POST https://api.groq.com/openai/v1/chat/completions
```

### Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {apiKey}"
}
```

### Payload
```json
{
  "model": "llama-3.3-70b-versatile",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "max_tokens": 4096,
  "temperature": 0.7
}
```

### Response
```json
{
  "choices": [
    {
      "message": {
        "content": "Resposta do assistente"
      }
    }
  ]
}
```

## Tratamento de Erros

### Cenários Cobertos

1. **Chave não configurada**
   - Detectado em: `checkApiConfiguration()`
   - Exibição: Yellow alert no chat
   - Ação: Input/Button desabilitados

2. **Firebase indisponível**
   - Detectado em: `getGroqApiKey()`
   - Tratamento: Console.error + return null
   - Fallback: Aviso ao usuário

3. **API Groq indisponível**
   - Detectado em: Response status != ok
   - Status 429: Mensagem de rate limit
   - Outros: Erro genérico com detalhes

4. **Timeout**
   - Timeout: 60 segundos
   - Mensagem: "Não foi possível conectar ao serviço"

5. **Offline**
   - Detectado em: navigator.onLine
   - Mensagem: "Você está offline"

## Performance

### Otimizações

1. **Cache de Chave**
   - Buscada uma vez ao abrir modal
   - Reusada durante toda a sessão
   - Apenas re-busca se necessário

2. **Lazy Loading**
   - Histórico carregado via onSnapshot
   - Apenas últimas 50 mensagens em UI
   - Scroll automático ao fim

3. **Database Context**
   - Limite de 500 produtos por busca
   - Top 30 produtos retornados
   - Filtros inteligentes de busca

## Segurança

### Proteções Implementadas

✅ **Chave não exposta em código**
- Armazenada em Firestore, não em .env

✅ **Firestore Rules**
- Leitura apenas para autenticados
- Escrita apenas para admin

✅ **CORS**
- Groq API gerencia CORS

✅ **Timeout**
- 60 segundos para requests
- Evita travamento de UI

✅ **Input Validation**
- Usuário não pode enviar mensagens vazias
- Chat desabilitado se API não configurada

## Integrações

### Firebase
- `collection(db, "api_key")` - Leitura
- `collection(db, "chat_messages")` - Leitura/Escrita
- `onSnapshot()` - Real-time updates

### Groq API
- OpenAI-compatible endpoint
- Chat completions

### Lucide Icons
- Bot, User, Loader2, Send, AlertCircle

## Extensibilidade

### Adicionar nova API

1. Novo campo em `api_key`: `openai: "sk_..."`
2. Nova função em `apiKeyService`:
   ```typescript
   export const getOpenAIKey = async () => {
     return await getApiKey("openai");
   };
   ```
3. Novo componente ou adaptar `ApexChatModal`

### Adicionar novo idioma

1. Modificar `systemPrompt` em `handleSend()`
2. Adicionar fallback para `SimpleMarkdown`
3. Testar com novo modelo multilingue

### Customizar modelo

- Altere em `getGroqConfig()`:
  ```typescript
  model: process.env.VITE_GROQ_MODEL || "seu-modelo-aqui"
  ```

## Debugging

### Console Logs Úteis
```typescript
console.log("[v0] Chave de API:", apiKey);
console.log("[v0] Config Groq:", groqConfig);
console.log("[v0] Contexto DB:", databaseContext);
```

### Firebase Emulator
```bash
firebase emulators:start
```

### Testar Groq API
```bash
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer gsk_..." \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"teste"}]}'
```

## Testes

### Testes Recomendados

1. **Unit Tests**
   - `getGroqApiKey()` com mock Firebase
   - `getGroqConfig()` com timeout
   - Tratamento de erros

2. **Integration Tests**
   - Chat flow completo
   - Firebase snapshot updates
   - API Groq mocked

3. **E2E Tests**
   - Abrir modal
   - Enviar mensagem
   - Verificar resposta

## Versioning

**Versão Atual**: 1.1
- ✅ Chave em Firebase
- ✅ Interface de configuração
- ✅ Tratamento de erros
- ✅ Documentação

**Versão Planejada**: 1.2
- ⏳ Suporte a múltiplas APIs
- ⏳ Histórico persistido
- ⏳ Temas de chat

## Roadmap

- [ ] Adicionar suporte para OpenAI API
- [ ] Adicionar suporte para Anthropic API
- [ ] Implementar seletor de modelo
- [ ] Adicionar busca no histórico
- [ ] Implementar export de conversa
- [ ] Adicionar voice input/output

## Contato & Suporte

- **Documentação**: APEX_CHAT_SETUP.md
- **Migração**: MIGRATION_GUIDE.md
- **Arquivos**: src/services/apiKeyService.ts
- **Issue Tracker**: GitHub Issues

---

**Versão**: 1.0
**Atualizado**: 2026-03-22
**Mantido por**: Fricosystem Dev Team
