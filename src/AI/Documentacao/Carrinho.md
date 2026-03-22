# Carrinho

## Visao Geral
O Carrinho e onde os usuarios montam suas solicitacoes de materiais antes de enviar como requisicao. Funciona como um carrinho de compras, permitindo adicionar, remover e ajustar quantidades dos produtos desejados.

## Rota
`/carrinho`

## Funcionalidades

### Gerenciamento de Itens
- **Lista de produtos**: Todos os itens adicionados
- **Ajuste de quantidade**: Aumentar ou diminuir
- **Remocao de item**: Excluir do carrinho
- **Limpar carrinho**: Remover todos os itens

### Informacoes Exibidas
- Codigo e descricao do produto
- Quantidade solicitada
- Quantidade disponivel em estoque
- Unidade de medida
- Centro de custo (se aplicavel)
- Subtotal por item

### Finalizacao
- **Revisar itens**: Conferir antes de enviar
- **Adicionar observacoes**: Notas para o aprovador
- **Selecionar urgencia**: Normal ou urgente
- **Enviar requisicao**: Finalizar e enviar para aprovacao

## Como Usar (Passo a Passo)

### Adicionar Produtos ao Carrinho
1. Acesse a pagina de Produtos
2. Localize o produto desejado
3. Clique no icone de carrinho
4. Informe a quantidade
5. O produto sera adicionado

### Ajustar Quantidades
1. Acesse o Carrinho
2. Localize o produto
3. Use os botoes + e - para ajustar
4. Ou digite a quantidade diretamente
5. O valor e atualizado automaticamente

### Remover Item do Carrinho
1. Localize o produto no carrinho
2. Clique no icone de lixeira
3. Confirme a remocao
4. O item sera excluido

### Finalizar Requisicao
1. Revise todos os itens do carrinho
2. Verifique as quantidades
3. Adicione observacoes se necessario
4. Clique em "Finalizar Requisicao"
5. Confirme o envio
6. A requisicao sera enviada para aprovacao

## Tratativas Operacionais

### Situacao 1: Produto sem estoque suficiente
**Problema**: Quantidade solicitada maior que disponivel
**Solucao**:
1. Ajuste a quantidade para o disponivel
2. Ou aguarde reposicao do estoque
3. Verifique se ha em outra unidade
4. Considere produto alternativo

### Situacao 2: Carrinho esvaziou sozinho
**Problema**: Itens desapareceram do carrinho
**Solucao**:
1. Verifique se fez logout do sistema
2. O carrinho e por sessao do usuario
3. Adicione os itens novamente
4. Finalize a requisicao em seguida

### Situacao 3: Produto errado adicionado
**Problema**: Adicionou produto incorreto
**Solucao**:
1. Localize o item no carrinho
2. Clique em remover
3. Va para Produtos e adicione o correto
4. Continue com a requisicao

### Situacao 4: Preciso de produto nao cadastrado
**Problema**: Item necessario nao existe no sistema
**Solucao**:
1. Solicite o cadastro ao setor responsavel
2. Informe codigo, descricao e fornecedor
3. Aguarde o cadastro ser realizado
4. Depois adicione ao carrinho

## Dicas e Boas Praticas
- Revise os itens antes de finalizar
- Agrupe produtos relacionados na mesma requisicao
- Adicione observacoes claras para o aprovador
- Nao deixe itens no carrinho por muito tempo
- Verifique quantidades disponiveis antes
- Use a urgencia apenas quando necessario

## Permissoes Necessarias
- **Acessar carrinho**: Todos os usuarios autenticados
- **Finalizar requisicao**: Usuarios com permissao de requisicao

## Relacionamentos
- **Produtos**: Origem dos itens
- **Requisicoes**: Destino ao finalizar
- **Estoque**: Verificacao de disponibilidade
- **Centro de Custo**: Alocacao de custos
