# Enderecamento de Estoque

## Visao Geral

O modulo de **Enderecamento** permite organizar e gerenciar a localizacao fisica dos produtos no almoxarifado, facilitando a localizacao e movimentacao de itens.

## Estrutura de Enderecamento

### Hierarquia de Localizacao

1. **Unidade/Filial**: Local macro (ex: Matriz, Filial 01)
2. **Deposito**: Area de armazenamento (ex: Deposito Central, Almoxarifado Manutencao)
3. **Corredor**: Divisao dentro do deposito (ex: Corredor A, B, C)
4. **Prateleira**: Estrutura de armazenamento (ex: Prateleira 01, 02)
5. **Posicao**: Local especifico (ex: Nivel 1, Gaveta 3)

## Funcionalidades Principais

### 1. Cadastrar Enderecos

- **Criar estrutura**: Monte a arvore de localizacoes
- **Definir capacidade**: Informe limites de peso/volume
- **Atribuir tipo**: Classifique por tipo de produto adequado

### 2. Vincular Produtos

- **Associar endereco**: Defina onde cada produto fica armazenado
- **Endereco padrao**: Configure local principal do produto
- **Enderecos alternativos**: Registre locais secundarios

### 3. Consultar Localizacao

- **Busca rapida**: Encontre onde esta um produto
- **Mapa visual**: Visualize a ocupacao do deposito
- **Produtos por local**: Veja o que ha em cada endereco

## Como Usar

### Cadastrar Novo Endereco

1. Acesse "Novo Endereco"
2. Selecione a unidade/filial
3. Informe o deposito
4. Preencha corredor, prateleira e posicao
5. Defina capacidade e tipo
6. Salve o endereco

### Enderecar um Produto

1. Localize o produto no sistema
2. Clique em "Enderecar"
3. Selecione o endereco na hierarquia
4. Defina se e endereco principal
5. Confirme a vinculacao

### Transferir Produto de Local

1. Selecione o produto
2. Clique em "Alterar Endereco"
3. Escolha o novo local
4. Informe o motivo da transferencia
5. Confirme a mudanca

## Dicas Operacionais

- **Padronizacao**: Siga um padrao logico de nomenclatura (ex: A-01-03)
- **Sinalizacao**: Identifique fisicamente os locais com etiquetas
- **Atualizacao**: Mantenha o sistema atualizado apos movimentacoes
- **Proximidade**: Coloque produtos de alta rotatividade em locais de facil acesso

## Tratativas Comuns

### Produto Sem Endereco

1. Verifique se o produto foi recebido recentemente
2. Localize fisicamente no deposito
3. Cadastre o endereco encontrado
4. Atualize o sistema

### Endereco Duplicado

1. Identifique qual registro esta correto
2. Atualize os produtos para o endereco certo
3. Exclua o endereco duplicado

### Espaco Insuficiente

1. Verifique produtos com baixo giro no local
2. Considere redistribuir para outros enderecos
3. Avalie a necessidade de novo mobiliario
