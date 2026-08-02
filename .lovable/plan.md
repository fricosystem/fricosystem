# Plano de Segurança — APEX ERP (config via .env + Vercel)

## Diagnóstico atual

| Item | Onde está | Risco | Ação |
|---|---|---|---|
| `apiSecret` do Cloudinary (`6K9Rz...`) | `src/Cloudinary/cloudinaryUploadProdutos.ts` | **Crítico** — segredo real no bundle público | Remover do código e **rotacionar** no painel Cloudinary |
| `apiKey` do Cloudinary | 3 arquivos em `src/Cloudinary/` | Baixo (é público em unsigned upload), mas hardcoded | Mover para `VITE_CLOUDINARY_*` |
| Config Firebase (fallback `AIzaSy...`) | `src/firebase/firebase.ts` | Baixo (chave é pública por design), mas fixa o projeto no código | Mover 100% para `VITE_FIREBASE_*`, sem fallback |
| Supabase URL + anon key | `src/integrations/supabase/client.ts` | Baixo (anon key é pública), mas hardcoded | Mover para `VITE_SUPABASE_*` |
| Token do GitHub em `btoa()` | `src/firebase/firestore.ts` | **Alto** — base64 não é criptografia; token com escopo `repo` legível no Firestore | Bloquear leitura no cliente / mover fluxo para Cloud Function |
| Chave Groq lida da coleção `api_key` | `functions/src/index.ts` | Médio — segredo em banco em vez de Secret Manager | Migrar para `defineSecret("GROQ_API_KEY")` |

Nota importante: chaves de API do Firebase e a anon key do Supabase **não são segredos** — a segurança real vem das Firestore Rules e do App Check. Mesmo assim, saem do código-fonte conforme pedido.

## O que será feito

### 1. Camada de configuração central (`src/config/env.ts`)
Um único módulo lê `import.meta.env`, valida os valores obrigatórios e exporta objetos tipados (`firebaseConfig`, `cloudinaryConfig`, `supabaseConfig`, `appCheckSiteKey`).

Comportamento:
- Em **dev**, se faltar variável: aviso claro no console listando o que falta.
- Em **build/produção**, se faltar variável obrigatória: erro explícito na inicialização (evita deploy silenciosamente quebrado).
- Nada de fallback com valor real hardcoded.

### 2. Arquivos de ambiente
- `.env.example` versionado, com todas as chaves e comentários (é o mapa para preencher a Vercel).
- `.env` local (já coberto pelo `.gitignore`) criado com os valores atuais para o sistema seguir 100% funcional em desenvolvimento.
- Na Vercel: as mesmas chaves em Project Settings → Environment Variables (Production/Preview/Development). Como Vite injeta em build, nenhum código muda — as variáveis simplesmente vêm do ambiente quando o `.env` não existe.

### 3. Remoção de segredos do front-end
- `apiSecret` do Cloudinary **excluído** do código (upload unsigned não precisa dele). Você rotaciona a chave no Cloudinary depois.
- Os 3 arquivos de upload passam a usar `cloudinaryConfig` do módulo central; nomes de cloud/preset via env.
- `src/firebase/firebase.ts` e `src/integrations/supabase/client.ts` passam a consumir o módulo central.

### 4. Token do GitHub
- Firestore Rules: negar leitura da config de GitHub pelo cliente (hoje o token é recuperável).
- O `GitHubConfigComponent` continua funcionando via Cloud Function que guarda/usa o token no servidor; o front nunca recebe o token de volta (só `owner/repo` e status conectado).
- Remover o `btoa/atob` chamado de "criptografia".

### 5. Backend (Cloud Functions)
- Groq: `defineSecret("GROQ_API_KEY")` em vez de ler a coleção `api_key`; a coleção deixa de existir no fluxo.
- Regras já negam `api_key`/`github` no cliente — manter e reforçar.

### 6. Endurecimento complementar
- App Check obrigatório (`VITE_FIREBASE_APP_CHECK_SITE_KEY` no env; enforcement no console Firebase).
- Headers de segurança no `vercel.json`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- Revisar regras `isActiveUser()` amplas em coleções operacionais (hoje qualquer usuário ativo escreve em tudo) — proposta de escopo por perfil numa etapa seguinte, para não quebrar o sistema agora.

## Variáveis a cadastrar na Vercel

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_FIREBASE_APP_CHECK_SITE_KEY
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_API_KEY
VITE_CLOUDINARY_UPLOAD_PRESET
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```
(Segredos de servidor — Groq, token GitHub — ficam no Firebase Secret Manager, nunca com prefixo `VITE_`.)

## Ações manuais suas (fora do código)
1. Rotacionar o API secret do Cloudinary (ele está exposto no histórico do repo).
2. Revogar/recriar o Personal Access Token do GitHub.
3. Cadastrar as variáveis na Vercel.
4. Restringir a API key do Firebase por domínio no Google Cloud Console.

## Ordem de execução
1. `src/config/env.ts` + `.env.example` + `.env` local
2. Migrar Firebase, Supabase e Cloudinary para o módulo (remover o secret)
3. `vercel.json` com headers
4. Token GitHub via Cloud Function + regras
5. Groq via Secret Manager
