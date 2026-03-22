# Gestao de Usuarios

## Visao Geral
A pagina de Gestao de Usuarios permite administrar os acessos ao sistema. Gerencia cadastro de usuarios, permissoes, perfis e status de ativacao.

## Rota
`/gestao-usuarios`

## Funcionalidades

### Gestao de Acessos
- **Listar usuarios**: Todos os usuarios cadastrados
- **Criar usuario**: Novo cadastro
- **Editar**: Alterar dados e permissoes
- **Ativar/Desativar**: Controlar acesso
- **Resetar senha**: Redefinir credenciais

### Informacoes do Usuario
- Nome completo
- Email (login)
- Cargo/Funcao
- Perfil de acesso
- Unidade vinculada
- Permissoes especificas
- Status (ativo/inativo)
- Ultimo acesso

### Perfis de Acesso
- Administrador: Acesso total
- Gestor: Acesso gerencial
- Operador: Funcoes operacionais
- Manutentor: Funcoes de manutencao
- Visualizador: Apenas consulta

## Como Usar (Passo a Passo)

### Criar Novo Usuario
1. Clique em "Novo Usuario"
2. Preencha nome e email
3. Selecione o perfil de acesso
4. Defina a unidade
5. Configure permissoes especificas
6. Salve o cadastro
7. Usuario recebera email com senha

### Alterar Permissoes
1. Localize o usuario
2. Clique em "Editar"
3. Va para aba de permissoes
4. Marque/desmarque as opcoes
5. Salve as alteracoes
6. Usuario vera mudancas no proximo login

### Desativar Usuario
1. Localize o usuario
2. Clique em "Desativar"
3. Confirme a acao
4. Usuario perde acesso imediatamente
5. Dados e historico sao mantidos

### Resetar Senha
1. Localize o usuario
2. Clique em "Resetar Senha"
3. Nova senha sera enviada por email
4. Usuario devera trocar no primeiro acesso

## Tratativas Operacionais

### Situacao 1: Usuario nao consegue logar
**Problema**: Usuario reporta que nao acessa
**Solucao**:
1. Verifique se usuario esta ativo
2. Confira se email esta correto
3. Resete a senha se necessario
4. Verifique se unidade esta correta

### Situacao 2: Funcionario desligado
**Problema**: Precisa remover acesso de ex-funcionario
**Solucao**:
1. Desative o usuario imediatamente
2. Nao exclua para manter historico
3. Documente a desativacao
4. Revise se tinha acessos criticos

### Situacao 3: Precisa de permissao especifica
**Problema**: Usuario precisa de acesso adicional
**Solucao**:
1. Avalie a necessidade
2. Verifique se perfil adequado existe
3. Adicione permissao especifica
4. Ou altere o perfil do usuario

### Situacao 4: Muitos usuarios inativos
**Problema**: Lista poluida com usuarios antigos
**Solucao**:
1. Filtre por usuarios inativos
2. Revise quais podem ser mantidos
3. Arquive os mais antigos
4. Mantenha para auditoria

## Dicas e Boas Praticas
- Use perfis padronizados quando possivel
- Revise acessos periodicamente
- Desative usuarios ao desligar
- Documente permissoes especiais
- Treine usuarios em suas funcoes

## Permissoes Necessarias
- **Visualizar**: Administradores
- **Criar/Editar**: Administradores
- **Desativar**: Administradores
- **Resetar senha**: Administradores

## Relacionamentos
- **Perfis**: Modelos de permissao
- **Unidades**: Vinculo organizacional
- **Requisicoes**: Usuario como solicitante
- **Logs**: Rastreabilidade de acoes
