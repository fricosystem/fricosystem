# Mudanças no APEX Chat - Chave de API do Groq

## 📋 Resumo das Alterações

O APEX Chat foi atualizado para usar a chave de API do Groq diretamente da coleção **"ape_key"** no Firebase Firestore, em vez de variáveis de ambiente (.env). Isso oferece melhor segurança e facilita o gerenciamento de chaves.

## 🔧 Arquivos Modificados

### 1. **src/services/apiKeyService.ts** (NOVO)
- Novo serviço para buscar chaves de API do Firebase
- Funções:
  - `getGroqApiKey()`: Busca especificamente a chave do Groq
  - `getApiKey(fieldName)`: Busca qualquer chave de API

### 2. **src/components/ApexChatModal.tsx** (MODIFICADO)
- Adicionada importação do serviço `apiKeyService`
- Função `getGroqConfig()` agora busca a chave dinamicamente do Firebase
- Estado `isApiConfigured` para controlar o status da API
- Verificação automática de configuração ao abrir o modal
- Interface de aviso (yellow alert) quando a chave não está configurada
- Input e botão de envio desabilitados até a chave ser configurada
- Mensagens de erro melhoradas quando a chave não é encontrada

### 3. **src/components/ApexChatApiStatus.tsx** (NOVO)
- Componente reutilizável para exibir status da configuração da API
- Mostra estado de carregamento, configurado ou não configurado
- Pode ser usado em outras páginas para verificar status

### 4. **APEX_CHAT_SETUP.md** (NOVO)
- Guia completo de configuração para adicionar a chave de API
- Instruções passo a passo para criar a coleção no Firebase
- Como obter uma chave de API do Groq
- Troubleshooting e regras de segurança recomendadas

## 🔐 Benefícios de Segurança

✅ **Chave não exposta em código**
- A chave não fica mais em arquivos .env ou variáveis de ambiente

✅ **Gerenciamento centralizado**
- Todas as chaves em um único lugar no Firebase

✅ **Controle de acesso**
- Protegido pelas regras de segurança do Firestore

✅ **Fácil rotação**
- Atualize a chave sem necessidade de redeploy

## 📝 Estrutura esperada no Firebase

```
Firestore Database
└── ape_key (coleção)
    └── {documento} (pode ser qualquer ID)
        └── groq: "gsk_sua_chave_aqui" (String)
```

## 🚀 Como Usar

### Primeira vez:

1. Abra o arquivo `APEX_CHAT_SETUP.md`
2. Siga as instruções para criar a coleção "ape_key"
3. Adicione seu token do Groq no campo "groq"
4. Abra o APEX Chat - ele verificará automaticamente

### Em produção:

1. A chave é verificada automaticamente ao abrir o chat
2. Se não configurada, mostrará um aviso amigável
3. O chat fica desabilitado até a chave ser configurada

## ⚙️ Implementação Técnica

### Fluxo de busca da chave:

1. Modal é aberto → `useEffect` dispara
2. `getGroqApiKey()` é chamada
3. Se encontrada → `isApiConfigured = true`
4. Se não encontrada → `isApiConfigured = false` + aviso
5. Ao enviar mensagem → `getGroqConfig()` busca novamente (para refresh)

### Tratamento de erros:

- Chave não encontrada → erro amigável com instruções
- Campo "groq" vazio → erro indicando necessidade de preenchimento
- Coleção não existe → guia de setup sugerido

## 📦 Dependências

- `firebase/firestore` (já existente)
- `lucide-react` (já existente para ícones)
- Nenhuma nova dependência necessária!

## 🔄 Variáveis de Ambiente

Agora **não precisa mais** de:
- `VITE_GROQ_API_KEY`

Mantém:
- `VITE_GROQ_MODEL` (opcional, padrão: "llama-3.3-70b-versatile")

## 📚 Documentação

- `APEX_CHAT_SETUP.md` - Guia de configuração
- `APEX_CHAT_CHANGES.md` - Este arquivo
- Comments no código explicam as mudanças

## ✅ Checklist de Migração

- [ ] Criar coleção "ape_key" no Firebase
- [ ] Adicionar chave do Groq no campo "groq"
- [ ] Remover `VITE_GROQ_API_KEY` do `.env` (opcional, será ignorada)
- [ ] Testar APEX Chat para confirmar funcionamento
- [ ] Revisar regras de Firestore para segurança

## 🆘 Troubleshooting

**P: Recebo "Chave da API Groq não configurada"**
R: Verifique se a coleção "ape_key" existe e tem o campo "groq" preenchido

**P: Como alterar a chave do Groq?**
R: Simplesmente atualize o valor no campo "groq" no Firebase - o chat carregará a nova chave

**P: Posso usar múltiplas chaves?**
R: Sim, adicione mais campos à coleção (ex: "groq2", "openai", etc) e crie um selector no código

---

**Versão**: 1.0
**Data**: 2026-03-22
**Status**: Implementado ✅
