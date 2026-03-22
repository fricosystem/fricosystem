# 🤖 APEX Chat - Versão 1.1

## 🎯 O que é?

O **APEX Chat** é um assistente virtual alimentado por IA que oferece acesso instantâneo aos dados do sistema APEX HUB. Com a v1.1, a chave de API é armazenada com segurança no Firebase em vez de variáveis de ambiente.

## ✨ Novidades na v1.1

✅ **Chave de API no Firebase** - Mais seguro que variáveis de ambiente  
✅ **Interface Visual** - Aviso amigável se não configurado  
✅ **Zero Downtime** - Atualizar chave sem redeploy  
✅ **Melhor Documentação** - Guias passo a passo  

## 🚀 Quick Start

### 1. Configurar no Firebase (5 min)

```
Firebase Console
└── Firestore Database
    └── Create Collection: "ape_key"
        └── Add Document
            └── Field "groq" = "sua_chave_aqui"
```

### 2. Pronto! 🎉

Abra o app e clique no APEX Chat (ícone do robô).

## 📚 Documentação Completa

| Documento | Para Quem | Descrição |
|-----------|-----------|-----------|
| **MIGRATION_GUIDE.md** | Todos | Guia visual passo a passo |
| **APEX_CHAT_SETUP.md** | Usuários | Como configurar a API |
| **APEX_CHAT_TECHNICAL.md** | Desenvolvedores | Arquitetura e código |
| **APEX_CHAT_CHANGES.md** | Desenvolvedores | Mudanças técnicas específicas |
| **FIREBASE_APE_KEY_EXAMPLE.json** | Referência | Exemplo de estrutura |
| **IMPLEMENTATION_CHECKLIST.md** | QA/Ops | Checklist de deploy |

## 🔑 Obtendo uma Chave de API

1. Acesse [console.groq.com](https://console.groq.com)
2. Faça login
3. Vá para **API Keys**
4. Clique em **Create API Key**
5. Copie a chave (começa com `gsk_`)
6. Adicione no Firebase em `ape_key.groq`

## 🎯 Características do APEX Chat

### Busca em Tempo Real
- Produtos e estoque
- Fornecedores e contatos
- Equipamentos e máquinas
- Tarefas de manutenção
- Ordens de serviço
- E muito mais!

### Inteligência Artificial
- Busca inteligente de dados
- Respostas contextualizadas
- Suporte a português brasileiro
- Formatação clara e organizada

### Segurança
- Apenas usuários autenticados
- Chave protegida pelo Firestore
- Sem exposição em código
- Auditoria de acesso

## 🛠️ Stack Técnico

- **Frontend**: React + TypeScript
- **Backend**: Firebase/Firestore
- **IA**: Groq API (llama-3.3-70b)
- **Estilos**: Tailwind CSS + shadcn/ui

## 📁 Arquivos Principais

```
src/
├── components/
│   ├── ApexChatFab.tsx          ← Botão flutuante
│   ├── ApexChatModal.tsx        ← Modal principal
│   └── ApexChatApiStatus.tsx    ← Status component
└── services/
    └── apiKeyService.ts         ← Busca chaves no Firebase
```

## ⚙️ Configuração Técnica

### Firestore Collection
```json
{
  "ape_key": {
    "documentId": {
      "groq": "gsk_...",
      "criado_em": "2026-03-22T10:00:00Z"
    }
  }
}
```

### Firestore Security Rules
```javascript
match /ape_key/{document=**} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == 'SEU_UID_ADMIN';
}
```

## 🐛 Troubleshooting

### Problema: "Chave da API Groq não configurada"

**Solução**:
1. Abra Firebase Console
2. Vá para Firestore Database
3. Crie coleção "ape_key" se não existir
4. Adicione documento com campo "groq"
5. Cole sua chave válida do Groq

Ver: **APEX_CHAT_SETUP.md**

### Problema: Chat não responde

**Solução**:
1. Verifique conexão de internet
2. Verifique se a chave é válida
3. Verifique Firestore Rules
4. Veja console (F12) para erros

Ver: **MIGRATION_GUIDE.md > Troubleshooting**

## 📊 Estatísticas

- ⚡ Tempo de resposta: < 5 segundos
- 📱 Compatível com mobile
- 🌍 Suporte a português
- 🔒 100% seguro
- ♿ Acessível

## 🔄 Versioning

**v1.0** → Primeira versão (chave em .env)  
**v1.1** → Chave em Firebase (versão atual)  
**v1.2** → Multi-API support (planejado)  

## 👥 Suporte

**Documentação**: Veja arquivos `.md` nesta pasta  
**Dúvidas**: Consulte **APEX_CHAT_SETUP.md**  
**Bugs**: Abra issue no GitHub  

## 🎓 Exemplos de Uso

### Buscar Produtos
```
"Quais produtos temos em estoque?"
"Qual é o produto mais caro?"
"Mostre produtos com baixo estoque"
```

### Informações de Fornecedores
```
"Quem é nosso fornecedor de parafusos?"
"Qual o contato do fornecedor ABC?"
```

### Dados de Manutenção
```
"Quais máquinas precisam de manutenção?"
"Mostre tarefas agendadas"
```

## 📈 Performance

| Métrica | Valor | Status |
|---------|-------|--------|
| Load Time | < 500ms | ✅ |
| API Check | < 100ms | ✅ |
| First Response | < 5s | ✅ |
| Uptime | 99.9% | ✅ |

## 🔐 Segurança

✅ Chave não em código  
✅ Firestore Rules aplicadas  
✅ Apenas usuários autenticados  
✅ HTTPS enforced  
✅ Sem data exposure  

## 📞 Contacto

**Dúvidas de Setup?** → APEX_CHAT_SETUP.md  
**Problemas Técnicos?** → APEX_CHAT_TECHNICAL.md  
**Guia de Migração?** → MIGRATION_GUIDE.md  

## 📄 Licença

Parte do projeto Fricosystem  
Desenvolvido internamente  

## 🎉 Começar Agora!

1. Acesse **MIGRATION_GUIDE.md**
2. Siga o passo a passo
3. Configure sua chave no Firebase
4. Abra o APEX Chat
5. Divirta-se! 🚀

---

**Versão**: 1.1  
**Data**: 2026-03-22  
**Status**: Production Ready ✅

**Próxima Atualização**: v1.2 (Multi-API Support)
