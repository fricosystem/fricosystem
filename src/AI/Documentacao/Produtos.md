# Produtos

## Visao Geral
A pagina de Produtos e o centro de gestao do estoque do sistema APEX HUB. Permite visualizar, buscar, filtrar e gerenciar todos os itens cadastrados, incluindo informacoes de quantidade, localizacao, fornecedores e historico de movimentacoes.

## Rota
`/produtos`

## Funcionalidades

### Listagem de Produtos
- **Tabela completa**: Visualizacao de todos os produtos cadastrados
- **Busca inteligente**: Pesquisa por codigo, descricao, codigo de barras
- **Filtros avancados**: Por categoria, fornecedor, status, localizacao
- **Ordenacao**: Por qualquer coluna da tabela
- **Paginacao**: Navegacao entre paginas de resultados

### Informacoes por Produto
- Codigo interno e codigo de barras
- Descricao completa
- Unidade de medida
- Quantidade em estoque
- Estoque minimo e maximo
- Preco de custo e venda
- Localizacao (endereco no almoxarifado)
- Fornecedor principal
- Data de validade (quando aplicavel)
- Ultima movimentacao

### Acoes Disponiveis
- **Visualizar detalhes**: Ver todas as informacoes do produto
- **Editar**: Alterar dados cadastrais
- **Adicionar ao carrinho**: Solicitar produto para requisicao
- **Ver historico**: Consultar movimentacoes do produto
- **Imprimir etiqueta**: Gerar etiqueta com codigo de barras

## Como Usar (Passo a Passo)

### Buscar um Produto
1. Use a barra de busca no topo da pagina
2. Digite o codigo, descricao ou parte do nome
3. Os resultados aparecem automaticamente
4. Clique no produto para ver detalhes

### Filtrar Produtos
1. Clique no botao "Filtros"
2. Selecione os criterios desejados
3. Clique em "Aplicar"
4. Para limpar, clique em "Limpar Filtros"

### Adicionar Produto ao Carrinho
1. Localize o produto desejado
2. Clique no icone de carrinho na linha do produto
3. Informe a quantidade necessaria
4. O produto sera adicionado ao seu carrinho

### Exportar Lista de Produtos
1. Configure os filtros desejados
2. Clique no botao "Exportar"
3. Selecione o formato (Excel, PDF, CSV)
4. O arquivo sera baixado automaticamente

## Tratativas Operacionais

### Situacao 1: Produto nao encontrado na busca
**Problema**: O produto existe mas nao aparece na busca
**Solucao**:
1. Verifique se esta buscando pelo campo correto
2. Tente buscar por parte do nome ou codigo
3. Verifique se os filtros estao limitando os resultados
4. Confira se o produto esta cadastrado na unidade correta

### Situacao 2: Estoque divergente do fisico
**Problema**: Quantidade no sistema diferente do estoque real
**Solucao**:
1. Acesse o historico de movimentacoes do produto
2. Verifique as ultimas entradas e saidas
3. Se necessario, realize um inventario do item
4. Ajuste o estoque atraves de Entrada Manual

### Situacao 3: Produto sem fornecedor
**Problema**: Precisa comprar mas nao tem fornecedor cadastrado
**Solucao**:
1. Acesse Gestao de Fornecedores para cadastrar
2. Ou solicite ao setor de Compras a inclusao
3. Apos cadastro, vincule o fornecedor ao produto

### Situacao 4: Produto com validade vencida
**Problema**: Sistema mostra produto vencido
**Solucao**:
1. Verifique fisicamente o lote do produto
2. Se realmente vencido, registre a baixa por perda
3. Atualize a data de validade se for lote diferente
4. Informe o setor de Qualidade se necessario

## Dicas e Boas Praticas
- Mantenha o cadastro de produtos sempre atualizado
- Configure alertas de estoque minimo para itens criticos
- Use codigos de barras para agilizar operacoes
- Revise periodicamente produtos sem movimentacao
- Agrupe produtos similares em categorias

## Permissoes Necessarias
- **Visualizar**: Todos os usuarios com acesso ao estoque
- **Editar**: Gestores de estoque e administradores
- **Adicionar ao carrinho**: Usuarios com permissao de requisicao
- **Exportar**: Gestores e administradores

## Relacionamentos
- **Carrinho**: Adiciona produtos para requisicao
- **Requisicoes**: Produtos solicitados geram movimentacao
- **Entrada Manual**: Ajustes de estoque
- **Inventario**: Conferencia fisica
- **Fornecedores**: Vinculo para compras
- **Relatorios**: Dados para analises
