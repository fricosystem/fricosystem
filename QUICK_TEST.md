# ⚡ Quick Test - APEX Chat v1.1

## 🎯 Objetivo
Validar rapidamente se o APEX Chat está configurado e funcionando corretamente.

**Tempo estimado**: 5 minutos

---

## ✅ Test 1: Verificação Básica

### Pré-requisito
- [ ] Você está autenticado no aplicativo
- [ ] Você está em uma página autenticada

### Teste
1. Procure pelo botão do **APEX Chat** (ícone do robô 🤖)
2. Ele deve estar no **canto inferior direito**
3. Se ver o botão → ✅ **Teste passou**
4. Se não vê → ❌ **Verifique se está autenticado**

---

## ✅ Test 2: Abrir o Modal

### Teste
1. **Clique** no botão do robô 🤖
2. Deve abrir um modal com título **"APEX Chat"**
3. Deve mostrar mensagem de boas-vindas
4. Se abriu → ✅ **Teste passou**
5. Se não → ❌ **Verifique console (F12)**

---

## ✅ Test 3: Verificar Status da API

### O que Você Deve Ver

#### Caso A: ✅ API Configurada (Verde)
```
Sem aviso amarelo
Input habilitado
Botão de envio habilitado
→ Pronto para usar!
```

#### Caso B: ⚠️ API Não Configurada (Amarelo)
```
Aviso amarelo dizendo:
"Chave da API Groq não configurada"
Input desabilitado
Botão de envio desabilitado
→ Precisa configurar no Firebase
```

### Qual Você Vê?
- [ ] Caso A (tudo verde) → Passe para Test 4
- [ ] Caso B (aviso amarelo) → Passe para "Configurar" abaixo

### Se Recebeu Caso B: Configure Agora (5 min)
1. Abra [Firebase Console](https://console.firebase.google.com)
2. Crie coleção `api_key`
3. Adicione campo `groq` com sua chave
4. Volte ao app e **recarregue (F5)**
5. Modal deve agora mostrar Caso A

---

## ✅ Test 4: Enviar Uma Mensagem

### Teste com API Configurada

1. **Digite** uma pergunta simples na caixa de texto:
   ```
   Quantos produtos temos?
   ```

2. **Clique** no botão de envio (ícone de seta)

3. **Espere** pela resposta (5-10 segundos)

4. Você deve ver:
   - [ ] Mensagem aparece no histórico
   - [ ] Um "loading spinner" durante o processamento
   - [ ] Resposta do APEX Chat com dados

5. Se viu tudo → ✅ **Teste passou**

6. Se recebeu erro:
   - ❌ "Sem conexão" → Verifique internet
   - ❌ "Erro na API" → Verifique chave do Groq
   - ❌ "Timeout" → Tente novamente em 30s

---

## ✅ Test 5: Teste de Funcionalidade

### Perguntas para Testar

Tente estas perguntas para validar funcionalidade:

#### Produtos
```
"Quais produtos temos em estoque?"
"Mostre produtos com baixo estoque"
"Qual é o produto mais caro?"
```

#### Fornecedores
```
"Quem é nosso fornecedor?"
"Mostre contatos de fornecedores"
```

#### Outros
```
"Quantos equipamentos temos?"
"Mostre tarefas de manutenção"
```

### Validação
- Cada pergunta deve retornar resposta relevante
- Se retorna dados → ✅ Chat funcional
- Se recusa responder → ⚠️ Dados podem estar vazios
- Se error → ❌ Problema com API ou Firebase

---

## ✅ Test 6: Teste de Erro (Opcional)

### Simular Offline
1. Abra DevTools (F12)
2. Vá para **Network**
3. Selecione **Offline**
4. Tente enviar mensagem
5. Deve mostrar erro amigável
6. ✅ Teste passou

### Voltar Online
1. DevTools > Network > Online
2. Chat volta ao normal
3. ✅ Recovery automático

---

## 📊 Resultado Final

### Scoring

**6/6 Testes Passando** 🟢 **EXCELENTE**
- APEX Chat totalmente funcional
- Pronto para produção
- Sem problemas conhecidos

**5/6 Testes Passando** 🟡 **BOM**
- Chat funcional para uso básico
- Recomenda-se verificar o teste falhado
- Possivelmente seguro para produção

**4/6 ou Menos** 🔴 **PROBLEMAS**
- Não recomendado para produção
- Verificar troubleshooting
- Contactar suporte

---

## 🐛 Se Algo Falhar

### Erro: "Chave da API não configurada"

**Solução**:
1. Firebase Console > Firestore
2. Procure coleção `api_key`
3. Procure campo `groq`
4. Se não existe → Crie
5. Recarregue a página (F5)

### Erro: "Sem resposta do chat"

**Solução**:
1. Verifique conexão de internet
2. Verifique se input está habilitado
3. Verifique console (F12) para erros
4. Recarregue e tente novamente

### Erro: "API Indisponível"

**Solução**:
1. Aguarde 30 segundos
2. Tente novamente
3. Se persistir, verifique status do Groq
4. Pode ser timeout temporário

### Aviso: "Nenhum dado encontrado"

**Esperado**:
- Significa seu banco de dados está vazio
- Ou seus produtos/dados não correspondem ao búsca
- Chat funciona normalmente neste caso

---

## ✨ Dicas para Teste Eficaz

### ✅ Faça
- Teste com perguntas claras
- Teste coisas que você sabe que existem
- Use diferentes tipos de perguntas
- Espere o tempo de resposta

### ❌ Não Faça
- Não feche o modal enquanto responde
- Não envie múltiplas mensagens muito rápido
- Não teste sem internet
- Não desconecte do Firebase

---

## 📋 Checklist de Teste Completo

```
[ ] Test 1: Botão visível
[ ] Test 2: Modal abre
[ ] Test 3: Status da API
[ ] Test 4: Envio de mensagem
[ ] Test 5: Funcionalidade
[ ] Test 6: Tratamento de erro (opcional)

Status Final: _____________ (PASSOU/FALHOU)
Data: _____________________
Responsável: ______________
```

---

## 🚀 Próximo Passo

### Se Todos os Testes Passaram ✅
1. Chat está pronto para uso
2. Proceder com deploy em produção
3. Informar time que está ativo
4. Coletar feedback de usuários

### Se Algum Teste Falhou ❌
1. Consulte seção "Se Algo Falhar" acima
2. Verificar documentação completa
3. Se não resolver: Abrir issue no GitHub
4. Contactar time de desenvolvimento

---

## 📞 Suporte Rápido

| Problema | Solução Rápida |
|----------|-----------------|
| Sem botão | Verifique autenticação |
| Modal não abre | F12 > Console |
| Aviso amarelo | Configure Firebase |
| Sem resposta | Verifique internet |
| Erro de API | Verifique chave Groq |

---

**Teste Criado**: 2026-03-22  
**Versão**: 1.0  
**Tempo**: ~5 minutos  

**Boa sorte! 🍀**
