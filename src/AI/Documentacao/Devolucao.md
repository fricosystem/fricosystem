# Devolucoes

## Visao Geral
A pagina de Devolucoes permite registrar o retorno de materiais ao estoque. Usada quando sobra material de uma requisicao ou quando um produto nao sera mais utilizado pelo solicitante.

## Rota
`/devolucao`

## Funcionalidades

### Registro de Devolucao
- **Nova devolucao**: Registrar retorno de material
- **Vincular requisicao**: Associar a requisicao original
- **Conferir material**: Verificar estado do produto
- **Dar entrada**: Retornar ao estoque

### Motivos de Devolucao
- Sobra de material
- Produto errado retirado
- Projeto cancelado
- Material nao utilizado
- Troca de produto

### Informacoes da Devolucao
- Produto devolvido
- Quantidade
- Requisicao de origem
- Motivo da devolucao
- Estado do material
- Quem devolveu

## Como Usar (Passo a Passo)

### Registrar Devolucao Simples
1. Clique em "Nova Devolucao"
2. Busque o produto a devolver
3. Informe a quantidade
4. Selecione o motivo
5. Adicione observacoes se necessario
6. Confirme a devolucao

### Devolucao Vinculada a Requisicao
1. Clique em "Devolver de Requisicao"
2. Selecione a requisicao original
3. Marque os itens a devolver
4. Informe as quantidades
5. O sistema vincula automaticamente
6. Confirme a devolucao

### Conferir Material Devolvido
1. Receba o material fisicamente
2. Verifique o estado (novo, usado, danificado)
3. Registre a condicao no sistema
4. Se danificado, nao devolver ao estoque normal
5. Direcione para descarte ou reparo

### Rejeitar Devolucao
1. Se material impróprio para estoque
2. Clique em "Rejeitar"
3. Informe o motivo da rejeicao
4. Oriente o solicitante sobre destino
5. Documente a ocorrencia

## Tratativas Operacionais

### Situacao 1: Material danificado
**Problema**: Produto devolvido em mau estado
**Solucao**:
1. Nao aceite no estoque normal
2. Registre como "Danificado"
3. Direcione para area de avaria
4. Analise possibilidade de reparo
5. Se irrecuperavel, de baixa por perda

### Situacao 2: Quantidade diferente da requisicao
**Problema**: Devolvendo mais do que retirou
**Solucao**:
1. Verifique a requisicao original
2. Se realmente ha excedente, investigue
3. Pode ser de outra requisicao
4. Registre a diferenca para analise

### Situacao 3: Produto sem codigo
**Problema**: Material sem identificacao
**Solucao**:
1. Tente identificar pelo produto
2. Consulte com quem devolveu
3. Se identificar, registre normalmente
4. Se nao identificar, registre separado

### Situacao 4: Requisicao nao encontrada
**Problema**: Nao acha a requisicao de origem
**Solucao**:
1. Busque por diferentes filtros
2. Consulte com o solicitante
3. Se nao encontrar, registre sem vinculo
4. Documente nas observacoes

## Dicas e Boas Praticas
- Sempre vincule a requisicao quando possivel
- Confira o estado do material devolvido
- Nao aceite material impróprio no estoque
- Registre devolucoes imediatamente
- Mantenha rastreabilidade
- Oriente usuarios sobre processo correto

## Permissoes Necessarias
- **Registrar devolucao**: Estoquistas
- **Conferir material**: Conferentes
- **Rejeitar**: Gestores de estoque
- **Visualizar historico**: Todos do setor

## Relacionamentos
- **Requisicoes**: Origem do material
- **Produtos**: Itens devolvidos
- **Estoque**: Entrada do retorno
- **Inventario**: Pode gerar ajustes
