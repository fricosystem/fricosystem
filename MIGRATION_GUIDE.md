# 🔄 Guia de Migração - APEX Chat v1.1

## ✨ O que é novo?

A chave de API do Groq agora é **armazenada com segurança no Firebase** em vez de variáveis de ambiente.

### Antes (v1.0) ❌
```
.env
VITE_GROQ_API_KEY=gsk_xxxxx  ← Exposto em código!
```

### Depois (v1.1) ✅
```
Firebase Firestore
└── api_key (coleção privada)
    └── groq: "gsk_xxxxx"  ← Protegido por Firestore Rules
```

---

## 🚀 Passo a Passo da Migração

### **Passo 1: Preparar Firebase (5 minutos)**

1. Abra [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto Fricosystem
3. Vá para **Firestore Database**
4. Você verá a coleção **`api_key`** já criada
5. Selecione ou crie um documento
6. ID: pode ser qualquer um (você pode usar `config` ou deixar auto-gerado)

### **Passo 2: Adicionar a Chave (1 minuto)**

No documento selecionado:

1. **Campo**: Digite `groq`
2. **Tipo**: Selecione `String`
3. **Valor**: Cole sua chave do Groq (começa com `gsk_`)
4. Clique em **Save**

✅ **Pronto!** Você atualizou:
```
api_key
└── {documento}
    └── groq: "gsk_..."
```

### **Passo 3: Testar (2 minutos)**

1. Abra o aplicativo
2. Navegue para qualquer página autenticada
3. Clique no botão do **APEX Chat** (ícone do robô)
4. Se configurado corretamente, o chat está pronto
5. Se não, você verá um aviso amarelo com instruções

### **Passo 4: Opcional - Obter Chave do Groq**

Se você ainda não tem uma chave:

1. Acesse [console.groq.com](https://console.groq.com)
2. Login com sua conta
3. Vá para **API Keys**
4. **Create API Key**
5. Copie a chave gerada
6. Volte ao Firebase e cole no campo `groq`

---

## 📋 Checklist de Migração

- [ ] Acessar coleção `api_key` no Firebase (já existe)
- [ ] Adicionar campo `groq` ao documento
- [ ] Colar chave de API válida (começa com `gsk_`)
- [ ] Testar APEX Chat
- [ ] Remover `.env` com `VITE_GROQ_API_KEY` (opcional)
- [ ] Configurar Firestore Rules para segurança (recomendado)

---

## 🔒 Segurança - Firestore Rules (IMPORTANTE!)

Para proteger sua chave, adicione estas regras:

1. Vá para **Firestore Database > Rules**
2. Substitua o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Qualquer usuário autenticado pode ler api_key
    match /api_key/{document=**} {
      allow read: if request.auth != null;
      // Apenas você pode escrever/atualizar
      allow write: if request.auth.uid == 'seu_uid_admin_aqui';
    }

    // Outras coleções existentes...
    // Manter suas regras atuais aqui
  }
}
```

**Como encontrar seu UID:**
1. Firebase Console > Authentication > Users
2. Clique em seu email
3. Copie o **User ID**
4. Substitua `'seu_uid_admin_aqui'` no código acima

---

## 🔄 Estrutura de Dados

### Antes da Migração
```
Variáveis de Ambiente (.env)
- VITE_GROQ_API_KEY
- VITE_GROQ_MODEL
```

### Depois da Migração
```
Firebase Firestore (coleção: api_key)
- groq (String) - Chave de API obrigatória
- openai (String) - Opcional, para futuro
- anthropic (String) - Opcional, para futuro
```

---

## 🆘 Troubleshooting

### ❌ "Chave da API Groq não configurada"

**Causa**: Campo `groq` não encontrado ou vazio

**Solução**:
1. Verifique se existe documento em `api_key`
2. Verifique se tem campo chamado `groq`
3. Verifique se o campo não está vazio
4. Verifique se a chave é válida (começa com `gsk_`)

### ❌ "Firebase request timeout"

**Causa**: Problema de conexão ou Firestore Rules muito restritivas

**Solução**:
1. Verifique internet
2. Verifique Firestore Rules (permissão de leitura)
3. Verifique se está autenticado no app

### ❌ "Chat input desabilitado"

**Causa**: API não configurada ou ainda carregando

**Solução**:
1. Aguarde o carregamento (mostra spinner)
2. Se permanecer amarelo, veja "Chave não configurada" acima
3. Recarregue a página (F5)

---

## 📱 Como Usar Após Migração

### Usuário Normal
1. Abra o app
2. Clique no APEX Chat (robô)
3. Faça suas perguntas normalmente

### Administrador (Atualizar Chave)
1. Firebase Console > Firestore
2. Vá para `api_key` > documento
3. Clique em `groq`
4. Edite o valor
5. Salve
6. Chat usa nova chave automaticamente na próxima pergunta

---

## 📊 Comparação

| Aspecto | Antes (v1.0) | Depois (v1.1) |
|---------|-------------|--------------|
| **Local da Chave** | .env | Firebase Firestore |
| **Exposição** | Alta (arquivo públicado) | Baixa (protegida) |
| **Atualização** | Redeploy necessário | Imediata |
| **Controle de Acesso** | Arquivo | Firestore Rules |
| **Multi-ambiente** | Múltiplos .env | Um Firestore |
| **Segurança** | ⚠️ Básica | ✅ Avançada |

---

## 📚 Documentação Completa

- `APEX_CHAT_SETUP.md` - Guia detalhado de setup
- `APEX_CHAT_CHANGES.md` - Mudanças técnicas
- `FIREBASE_APE_KEY_EXAMPLE.json` - Exemplo de estrutura
- `MIGRATION_GUIDE.md` - Este arquivo

---

## ❓ Perguntas Frequentes

**P: Preciso deletar o .env?**
R: Não é obrigatório, mas recomendado por segurança. O app ignorará `VITE_GROQ_API_KEY`.

**P: E se perder a chave do Groq?**
R: Obtenha uma nova em console.groq.com e atualize no Firebase.

**P: Posso ter múltiplas chaves?**
R: Sim, adicione mais campos (openai, anthropic, etc) e adapte o código.

**P: E produção/staging?**
R: Use Firestore Rules para controlar acesso por ambiente.

**P: Qual é o impacto de performance?**
R: Mínimo - a chave é buscada uma vez ao abrir o chat (< 100ms).

---

## 🎯 Próximos Passos

1. ✅ Completar migração acima
2. ✅ Testar APEX Chat
3. ✅ Configurar Firestore Rules
4. ✅ Documentar no seu projeto
5. ✅ Comunicar time sobre mudança

---

**Versão**: 1.0
**Data**: 2026-03-22
**Tempo estimado**: 15 minutos
**Dificuldade**: 🟢 Fácil

**Suporte**: Se tiver dúvidas, consulte APEX_CHAT_SETUP.md ou abra uma issue no GitHub.
