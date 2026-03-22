# Gestao de Unidades

## Visao Geral
A pagina de Gestao de Unidades permite administrar as filiais e unidades operacionais da empresa. Cada unidade possui seu proprio estoque, usuarios e configuracoes.

## Rota
`/unidades`

## Funcionalidades

### Gestao de Unidades
- **Listar**: Todas as unidades cadastradas
- **Criar**: Nova unidade/filial
- **Editar**: Alterar dados
- **Ativar/Desativar**: Controlar status

### Informacoes da Unidade
- Codigo da unidade
- Nome/Razao social
- CNPJ
- Endereco completo
- Responsavel
- Status (ativa/inativa)

## Como Usar (Passo a Passo)

### Criar Nova Unidade
1. Clique em "Nova Unidade"
2. Preencha codigo e nome
3. Informe CNPJ e endereco
4. Defina o responsavel
5. Salve o cadastro

### Editar Unidade
1. Localize a unidade
2. Clique em "Editar"
3. Altere os dados necessarios
4. Salve as alteracoes

## Tratativas Operacionais

### Situacao 1: Precisa de nova unidade
**Solucao**: Crie o cadastro com todos os dados fiscais e defina os usuarios responsaveis.

### Situacao 2: Unidade sera fechada
**Solucao**: Desative a unidade mas mantenha para historico. Transfira usuarios e estoque antes.

## Permissoes Necessarias
- **Visualizar/Editar**: Administradores

## Relacionamentos
- **Usuarios**: Vinculo de lotacao
- **Estoque**: Produtos por unidade
- **Transferencias**: Entre unidades
