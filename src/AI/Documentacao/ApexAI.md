# APEX AI - Configurações do Assistente

## Visão Geral

A página **APEX AI** permite aos desenvolvedores e administradores configurar completamente o assistente de inteligência artificial do APEX HUB, incluindo modelo, parâmetros, segurança e comportamento.

## Para Quem é Esta Página?

- Desenvolvedores do sistema
- Administradores de sistema
- Usuários com perfil de desenvolvedor

## Abas de Configuração

### 1. Aba Modelo

Configurações do modelo de IA e parâmetros de geração.

**Campos disponíveis:**
- **Modelo**: Seleção do modelo de IA (ex: groq-mixtral, groq-llama, etc.)
- **Temperatura**: Controla criatividade (0 = determinístico, 1 = criativo)
- **Max Tokens**: Tamanho máximo da resposta
- **Top P**: Controla diversidade de palavras
- **Frequency Penalty**: Penaliza palavras repetidas
- **Presence Penalty**: Penaliza novos tópicos

**Como usar:**
1. Acesse a aba "Modelo"
2. Ajuste os sliders conforme necessário
3. Veja a preview em tempo real
4. Clique "Salvar" para aplicar

**Recomendações:**
- Temperatura: 0.7 para equilíbrio entre coerência e criatividade
- Max Tokens: 1000-2000 para respostas detalhadas
- Top P: 0.9 para boa diversidade

### 2. Aba Skill

Editor de texto para o skill (comportamento e instruções do assistente).

**Recursos:**
- **Editor de Texto**: Campo grande para editar as instruções do assistente
- **Usar Padrão**: Botão para restaurar as instruções padrão do arquivo skill.md
- **Prefixo do Prompt**: Texto adicionado antes do skill
- **Sufixo do Prompt**: Texto adicionado depois do skill
- **Contador de Caracteres**: Mostra tamanho do skill
- **Estimativa de Tokens**: Calcula quantidade de tokens

**Como usar:**
1. Acesse a aba "Skill"
2. Edite as instruções do assistente se desejar customizar
3. Se não modificar, o sistema usa automaticamente o skill.md
4. Clique "Salvar" para aplicar as mudanças

**Boas práticas:**
- Mantenha as instruções de contexto exclusivo APEX HUB
- Sempre mencione as páginas do sistema nas respostas
- Use linguagem clara e profissional
- Referencie o mapeamento semântico de páginas

### 3. Aba Segurança

Configurações de segurança e proteção do chat.

**Parâmetros:**
- **Rate Limiting**: Máximo de mensagens por minuto
- **Limite de Mensagens**: Quantidade de mensagens permitidas
- **Janela de Tempo**: Período em minutos para contagem
- **Bloqueio Após Limite**: Tempo em minutos para desbloquear

- **Validação de Input**: Ativar/desativar detecção de prompt injection
- **Padrões Detectados**: Número de padrões de segurança ativados
- **Timeout de Sessão**: Minutos até expiração da sessão
- **Logs de Auditoria**: Manter histórico de interações

**Como usar:**
1. Acesse a aba "Segurança"
2. Configure rate limiting (recomendado: 30 msg/min)
3. Ajuste timeout de sessão (recomendado: 30 minutos)
4. Ative validação de input para proteção
5. Clique "Salvar"

**Recomendações:**
- Rate limit: 30 mensagens por minuto
- Timeout: 30 minutos de inatividade
- Manter validação ativa sempre

### 4. Aba Interface

Personalização da interface do chat.

**Configurações:**
- **Mensagem de Boas-vindas**: Texto que aparece quando o chat abre
- **Placeholder**: Texto sugestivo no campo de entrada
- **Indicador de Digitação**: Mostrar quando a IA está gerando resposta
- **Efeitos Sonoros**: Habilitar sons ao receber mensagens
- **Mostrar Timestamp**: Exibir hora das mensagens
- **Temas**: Claro ou escuro

**Como usar:**
1. Acesse a aba "Interface"
2. Edite a mensagem de boas-vindas
3. Configure placeholder personalizado
4. Habilite/desabilite indicadores visuais e sonoros
5. Clique "Salvar" para aplicar

**Preview em tempo real:**
Visualize as mudanças instantaneamente no card de preview

## Fluxo de Trabalho

### Configuração Inicial

1. Acesse **APEX AI** no menu lateral (categoria Desenvolvedor)
2. Revise o modelo atual na aba "Modelo"
3. Revise o skill na aba "Skill"
4. Configure segurança conforme política da empresa
5. Personalize interface se desejar

### Modificar Configurações

1. Vá para a aba desejada
2. Faça as alterações
3. Veja preview em tempo real
4. Clique "Salvar" para aplicar
5. As configurações são salvas no Firestore automaticamente

### Restaurar Padrões

1. Na aba "Skill", clique em "Restaurar Padrão"
2. Confirme a ação
3. O skill.md padrão será carregado
4. Salve as alterações

## Armazenamento e Sincronização

Todas as configurações são salvas na coleção `apex_ai_config` do Firestore com:
- **skill**: Instruções do assistente
- **model**: Modelo selecionado
- **temperature**: Valor de temperatura
- **max_tokens**: Limite de tokens
- **rate_limit**: Configuração de rate limit
- **security**: Parâmetros de segurança
- **interface**: Configurações de interface
- **updated_at**: Data e hora da última modificação
- **updated_by**: Email do usuário que modificou

## Comportamento do Assistente

O assistente APEX AI funciona com base no skill configurado, que inclui:

1. **Contexto Exclusivo APEX HUB**: Nunca menciona outros sistemas
2. **Busca Semântica**: Relaciona termos similares às páginas corretas
3. **Sugestão Inteligente**: Se não tiver certeza, pergunta "Você está se referindo a...?"
4. **Proteção contra Injection**: Valida todas as entradas
5. **Rastreamento**: Registra todas as interações para auditoria

## Dicas e Boas Práticas

- **Teste as mudanças**: Converse com o chat após atualizar configurações
- **Mantenha segurança ativa**: Rate limiting e validação protegem o sistema
- **Monitore logs**: Verifique auditoria para comportamentos suspeitos
- **Documente mudanças**: Anote por que mudou cada configuração
- **Use padrões**: Restaure e reutilize configurações que funcionam bem

## Problemas Comuns

| Problema | Solução |
|----------|---------|
| Chat não responde | Verifique se modelo está correto e token não expirou |
| Respostas muito curtas | Aumente max_tokens na aba Modelo |
| Assistente menciona outros sistemas | Revise o skill, deve estar com contexto exclusivo APEX HUB |
| Taxa alta de rate limiting | Aumentar limite em Segurança ou revisar qualidade das respostas |
| Interface fora do padrão | Clique "Restaurar Padrão" na aba Interface |

## Próximos Passos

- Após configurar, teste com uma pergunta no chat
- Revise os logs de auditoria regularmente
- Atualize documentação se o skill mudar
- Comunique mudanças para os usuários do sistema
