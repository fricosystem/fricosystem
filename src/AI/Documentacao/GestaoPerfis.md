# Gestao de Perfis de Acesso

## Visao Geral

O modulo de **Gestao de Perfis** permite criar e gerenciar perfis de acesso, definindo quais funcionalidades cada grupo de usuarios pode acessar no sistema.

## Conceitos Importantes

### Perfil de Acesso

Um perfil agrupa permissoes que serao atribuidas aos usuarios. Exemplos:
- **Administrador**: Acesso total
- **Almoxarife**: Acesso ao estoque
- **Manutentor**: Acesso a manutencao
- **Visualizador**: Apenas consulta

### Permissoes

Cada permissao define o que pode ser feito:
- **Visualizar**: Ver informacoes
- **Criar**: Adicionar registros
- **Editar**: Alterar registros
- **Excluir**: Remover registros

## Funcionalidades Principais

### 1. Criar Perfil

- **Nome**: Identifique o perfil
- **Descricao**: Explique o proposito
- **Permissoes**: Selecione acessos

### 2. Gerenciar Permissoes

- **Modulos**: Ative/desative modulos
- **Acoes**: Defina o que pode fazer
- **Restricoes**: Limite por setor/unidade

### 3. Atribuir a Usuarios

- **Vincular**: Associe perfil ao usuario
- **Multiplos**: Usuario pode ter varios perfis
- **Heranca**: Permissoes se acumulam

## Como Usar

### Criar Novo Perfil

1. Acesse "Novo Perfil"
2. Informe nome e descricao
3. Selecione os modulos permitidos
4. Para cada modulo, defina acoes
5. Configure restricoes se necessario
6. Salve o perfil

### Editar Permissoes

1. Selecione o perfil
2. Clique em "Editar"
3. Ajuste os modulos e acoes
4. Salve as alteracoes
5. Usuarios serao atualizados automaticamente

### Atribuir Perfil a Usuario

1. Acesse Gestao de Usuarios
2. Selecione o usuario
3. Clique em "Perfis de Acesso"
4. Marque os perfis desejados
5. Salve a configuracao

## Dicas Operacionais

- **Minimo necessario**: De apenas as permissoes necessarias
- **Perfis especificos**: Crie perfis por funcao
- **Revisao**: Revise permissoes periodicamente
- **Documentacao**: Mantenha registro das alteracoes

## Tratativas Comuns

### Usuario Sem Acesso

1. Verifique perfis atribuidos
2. Confira permissoes do perfil
3. Verifique restricoes por setor
4. Ajuste conforme necessario

### Permissao Excessiva

1. Identifique o perfil responsavel
2. Avalie se deve ajustar o perfil
3. Ou crie perfil mais restritivo
4. Reatribua ao usuario

### Novo Modulo no Sistema

1. Acesse Gestao de Perfis
2. Edite cada perfil relevante
3. Configure permissoes do novo modulo
4. Salve as alteracoes
