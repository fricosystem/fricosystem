# Setores

## Visao Geral
A pagina de Setores permite gerenciar as areas e departamentos da empresa. Setores sao usados para organizar maquinas, usuarios e requisicoes.

## Rota
`/setores`

## Funcionalidades

### Gestao de Setores
- **Listar**: Todos os setores cadastrados
- **Criar**: Novo setor
- **Editar**: Alterar dados
- **Vincular**: Associar maquinas e usuarios

### Informacoes do Setor
- Codigo do setor
- Nome/Descricao
- Unidade vinculada
- Responsavel
- Maquinas do setor

## Como Usar (Passo a Passo)

### Criar Novo Setor
1. Clique em "Novo Setor"
2. Informe codigo e nome
3. Selecione a unidade
4. Defina o responsavel
5. Salve o cadastro

### Vincular Maquinas
1. Acesse o setor
2. Clique em "Vincular Maquinas"
3. Selecione os equipamentos
4. Confirme a vinculacao

## Tratativas Operacionais

### Situacao 1: Maquina em setor errado
**Solucao**: Edite a maquina e altere o setor vinculado.

### Situacao 2: Setor sera desativado
**Solucao**: Mova maquinas e usuarios para outro setor antes de desativar.

## Permissoes Necessarias
- **Visualizar**: Todos
- **Editar**: Gestores e administradores

## Relacionamentos
- **Maquinas**: Equipamentos do setor
- **Usuarios**: Colaboradores lotados
- **Requisicoes**: Solicitacoes por setor
