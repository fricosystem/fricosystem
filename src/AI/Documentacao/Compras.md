# Compras

## Visao Geral
A pagina de Compras gerencia todo o processo de aquisicao de materiais e servicos. Permite criar pedidos, acompanhar cotacoes, aprovar compras e monitorar entregas de fornecedores.

## Rota
`/compras`

## Funcionalidades

### Gestao de Pedidos
- **Criar pedido**: Nova solicitacao de compra
- **Listar pedidos**: Todos os pedidos da unidade
- **Filtrar**: Por status, fornecedor, periodo
- **Acompanhar**: Status de cada pedido

### Status do Pedido
- **Rascunho**: Em elaboracao
- **Aguardando cotacao**: Pendente de precos
- **Cotado**: Com precos definidos
- **Aprovado**: Liberado para compra
- **Pedido enviado**: Enviado ao fornecedor
- **Em entrega**: Aguardando recebimento
- **Recebido**: Entregue e conferido
- **Cancelado**: Cancelado

### Informacoes do Pedido
- Numero do pedido
- Fornecedor
- Itens e quantidades
- Precos e condicoes
- Prazo de entrega
- Centro de custo
- Aprovacoes necessarias

## Como Usar (Passo a Passo)

### Criar Novo Pedido de Compra
1. Clique em "Novo Pedido"
2. Selecione o fornecedor
3. Adicione os produtos desejados
4. Informe as quantidades
5. Adicione observacoes
6. Envie para cotacao ou aprovacao

### Solicitar Cotacao
1. Com o pedido criado, clique "Solicitar Cotacao"
2. Selecione os fornecedores para cotar
3. Defina prazo para resposta
4. Envie a solicitacao
5. Aguarde retorno dos fornecedores

### Aprovar Pedido de Compra
1. Acesse pedidos aguardando aprovacao
2. Revise os itens e valores
3. Verifique o orcamento disponivel
4. Aprove ou solicite ajustes
5. O pedido segue para compra

### Acompanhar Entrega
1. Acesse pedidos em entrega
2. Veja a previsao de chegada
3. Quando receber, registre a entrada
4. Confira quantidades e qualidade
5. Finalize o recebimento

## Tratativas Operacionais

### Situacao 1: Fornecedor nao respondeu cotacao
**Problema**: Prazo de cotacao venceu sem resposta
**Solucao**:
1. Entre em contato com o fornecedor
2. Estenda o prazo se necessario
3. Busque fornecedores alternativos
4. Considere fornecedor que respondeu

### Situacao 2: Preco muito alto
**Problema**: Cotacao acima do orcamento
**Solucao**:
1. Negocie com o fornecedor
2. Busque fornecedores alternativos
3. Verifique produtos substitutos
4. Solicite aprovacao especial se necessario

### Situacao 3: Entrega atrasada
**Problema**: Fornecedor nao cumpriu prazo
**Solucao**:
1. Entre em contato com o fornecedor
2. Solicite nova previsao
3. Avalie impacto na operacao
4. Considere penalidades contratuais
5. Busque alternativas se critico

### Situacao 4: Produto recebido com defeito
**Problema**: Material chegou danificado ou errado
**Solucao**:
1. Recuse ou registre a divergencia
2. Documente com fotos
3. Entre em contato com fornecedor
4. Solicite troca ou credito
5. Atualize o pedido no sistema

## Dicas e Boas Praticas
- Planeje compras com antecedencia
- Mantenha cadastro de fornecedores atualizado
- Compare precos entre fornecedores
- Negocie prazos e condicoes
- Acompanhe entregas ativamente
- Avalie desempenho dos fornecedores

## Permissoes Necessarias
- **Criar pedido**: Compradores e gestores
- **Solicitar cotacao**: Compradores
- **Aprovar**: Gestores conforme alcada
- **Receber**: Almoxarifado

## Relacionamentos
- **Fornecedores**: Parceiros de compra
- **Produtos**: Itens sendo comprados
- **Notas Fiscais**: Entrada por NF
- **Centro de Custo**: Alocacao de despesas
- **Estoque**: Entrada dos materiais
