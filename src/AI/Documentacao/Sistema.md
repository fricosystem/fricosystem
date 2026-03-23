# Sistema

## Visão Geral
A página **Sistema** é um painel de diagnóstico e configuração técnica do APEX HUB. Aqui você pode verificar a saúde do sistema, fazer backups, gerenciar configurações globais e acessar informações técnicas importantes.

## Para Quem é Esta Página?
- Administradores do sistema
- Desenvolvedores
- Equipe de suporte técnico
- Gestores de TI

## Áreas Principais

### 1. Status e Saúde do Sistema
Visualização em tempo real do estado da aplicação:
- **Status geral**: Verde (funcionando), Amarelo (problemas menores), Vermelho (crítico)
- **Uptime**: Tempo que o sistema está ativo
- **Versão do APEX HUB**: Versão atual instalada
- **Data da última atualização**: Quando foi feita a última atualização
- **Ambiente**: Produção / Teste

### 2. Informações Técnicas
- **Base de dados**: Status da conexão, espaço em disco, quantidade de registros
- **Tempo de resposta**: Latência do banco de dados
- **Sesões ativas**: Quantos usuários estão logados agora
- **Última sincronização**: Quando foram sincronizados dados críticos

### 3. Configurações Globais
Parâmetros da empresa:
- **Razão Social**: Nome da organização
- **CNPJ**: Identificação legal
- **Logo**: Identidade visual do sistema
- **Cores do tema**: Personalização visual
- **Fuso horário**: Regional da empresa
- **Moeda**: Padrão para valores

### 4. Módulos Disponíveis
Listar todos os módulos do APEX HUB e seu status:
- **Ativo/Inativo**: Se o módulo está disponível
- **Permissões**: Quem tem acesso
- **Última atualização**: Quando foi modificado
- **Configurações específicas**: Parâmetros do módulo

Módulos principais:
- Estoque
- Manutenção
- Compras
- Financeiro
- Produção (PCP)
- Comunicação

### 5. Integrações Externas
Se APEX HUB está conectado a outros sistemas:
- **APIs externas**: Status das conexões
- **Webhooks**: Endpoints configurados
- **Sincronização de dados**: Status das sincronizações
- **Logs de integração**: Histórico de operações

### 6. Notificações e Alertas
Configurar como o sistema notifica sobre eventos:
- **Email de envio**: Servidor SMTP configurado
- **Templates de mensagem**: Modelos de notificação
- **Frequência de alertas**: Com que frequência avisar
- **Destinatários**: Quem recebe as notificações

### 7. Backup e Restore
Gerenciar cópias de segurança:
- **Frequência de backup**: Diário, semanal, mensal
- **Retenção de dados**: Por quanto tempo manter backups antigos
- **Local de armazenamento**: Onde os arquivos estão
- **Último backup**: Data e hora
- **Tamanho**: Quanto espaço os backups ocupam

## Como Usar - Fluxo Típico

### Verificar Saúde do Sistema
1. Acesse **Sistema** no menu lateral
2. Veja o **Status Geral** no topo (deve estar verde)
3. Revise **Informações Técnicas** para confirmar performance
4. Se houver alertas, clique neles para ver detalhes

### Fazer Backup Manual
1. Acesse **Sistema** → **Backup e Restore**
2. Clique em **Novo Backup**
3. Selecione o que deseja fazer backup:
   - Todos os dados
   - Apenas configurações
   - Apenas registros (sem dados pessoais)
4. Clique em **Iniciar Backup**
5. Aguarde conclusão (pode levar alguns minutos)
6. Baixe o arquivo gerado

### Restaurar de um Backup
1. Acesse **Sistema** → **Backup e Restore**
2. Veja a lista de backups disponíveis
3. Clique em **Restaurar** ao lado do backup desejado
4. **Atenção**: Isto vai SUBSTITUIR dados atuais
5. Digite a confirmação: "RESTAURAR"
6. Clique em **Confirmar**
7. Aguarde conclusão

### Configurar Notificações
1. Acesse **Sistema** → **Notificações**
2. Ative/desative tipos de notificação:
   - Novos usuários
   - Manutenção vencida
   - Requisições pendentes
   - Falhas do sistema
3. Configure o email de envio (SMTP)
4. Defina quem recebe as notificações
5. Salve as configurações

## Ações Disponíveis

### Diagnóstico
- **Executar Teste de Saúde**: Verifica tudo está funcionando
- **Limpar Cache**: Força recalculação de dados
- **Resetar Conexões**: Reconecta ao banco de dados
- **Verificar Integrações**: Testa conexões externas

### Manutenção
- **Backup Manual**: Cria cópia imediata
- **Restaurar**: Volta a um estado anterior
- **Exportar Dados**: Gera arquivo CSV/Excel
- **Limpeza de Logs**: Remove logs antigos
- **Otimizar Banco de Dados**: Melhora performance

### Configuração
- **Editar Empresa**: Razão social, CNPJ, logo
- **Ativar/Desativar Módulos**: Controlar quais módulos aparecem
- **Gerenciar Integrações**: Configurar conexões externas
- **Permissões Padrão**: Definir acesso por perfil

## Dicas de Segurança
- **Cuidado com restauração**: Você vai perder dados após o backup
- **Backup semanal**: Realize backups regularmente
- **Senha forte**: Proteja o sistema com senha segura
- **Limite de acesso**: Restrinja acesso a "Sistema" por IP se possível
- **Auditoria**: Revise logs de quem fez alterações

## Alertas Comuns

| Alerta | Causa | Solução |
|--------|-------|---------|
| Espaço em disco baixo | Muitos logs e backups | Limpe logs antigos, exclua backups não usados |
| Banco de dados lento | Muitos registros | Otimize banco, archive dados antigos |
| Taxa alta de erro | Problema na aplicação | Veja logs, reinicie sistema |
| Falha de integração | Sistema externo offline | Verifique conexão do sistema externo |

## Próximos Passos
- Se tudo está verde: Você pode voltar ao trabalho normal
- Se há alertas: Siga as ações sugeridas
- Para manutenção: Faça backup semanal
- Comunique-se: Avise usuários sobre manutenção planejada

