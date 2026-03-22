# Entrada Manual

## Visao Geral
A pagina de Entrada Manual permite registrar movimentacoes de entrada de produtos sem nota fiscal. Usada para ajustes de estoque, devolucoes, transferencias entre unidades e correcoes de inventario.

## Rota
`/entrada-manual`

## Funcionalidades

### Tipos de Entrada
- **Ajuste de estoque**: Correcao de quantidade
- **Devolucao interna**: Retorno de requisicao
- **Transferencia recebida**: Entrada de outra unidade
- **Producao**: Entrada de produto fabricado
- **Outros**: Entradas diversas

### Registro de Entrada
- Selecao do produto
- Quantidade a dar entrada
- Motivo da entrada
- Lote e validade (quando aplicavel)
- Centro de custo
- Observacoes

### Validacoes
- Verificacao do produto no cadastro
- Conferencia de unidade de medida
- Vinculo com documento de origem
- Aprovacao quando necessario

### Acoes Disponiveis
- **Nova entrada**: Registrar entrada de produto
- **Entrada em lote**: Varios produtos de uma vez
- **Vincular documento**: Anexar comprovante
- **Historico**: Ver entradas realizadas

## Como Usar (Passo a Passo)

### Registrar Entrada Simples
1. Clique em "Nova Entrada"
2. Busque e selecione o produto
3. Informe a quantidade
4. Selecione o tipo/motivo da entrada
5. Adicione observacoes se necessario
6. Confirme a entrada

### Entrada com Lote e Validade
1. Selecione o produto
2. Informe a quantidade
3. Digite o numero do lote
4. Informe a data de validade
5. Selecione a localizacao
6. Confirme a entrada

### Entrada por Transferencia
1. Selecione "Transferencia Recebida"
2. Informe a unidade de origem
3. Digite o numero da transferencia
4. Confira os itens recebidos
5. Confirme as quantidades
6. Finalize a entrada

### Corrigir Estoque apos Inventario
1. Selecione "Ajuste de Estoque"
2. Busque o produto divergente
3. Informe a quantidade de ajuste
4. Referencie o inventario realizado
5. Adicione justificativa detalhada
6. Aguarde aprovacao se necessario

## Tratativas Operacionais

### Situacao 1: Produto nao encontrado
**Problema**: Item para dar entrada nao existe no sistema
**Solucao**:
1. Verifique se buscou pelo codigo correto
2. Tente buscar pela descricao
3. Solicite cadastro se for produto novo
4. Aguarde cadastro antes de dar entrada

### Situacao 2: Entrada duplicada
**Problema**: Deu entrada no mesmo item duas vezes
**Solucao**:
1. Faca uma saida de ajuste da mesma quantidade
2. Ou solicite estorno ao gestor
3. Documente o motivo do erro
4. Verifique o saldo atual

### Situacao 3: Quantidade errada
**Problema**: Registrou quantidade incorreta
**Solucao**:
1. Se acabou de registrar, solicite estorno
2. Faca entrada ou saida da diferenca
3. Documente a correcao
4. Confira o saldo final

### Situacao 4: Sem aprovacao necessaria
**Problema**: Entrada requer aprovacao e esta parada
**Solucao**:
1. Verifique quem e o aprovador
2. Entre em contato para agilizar
3. Explique a urgencia se houver
4. Acompanhe o status

## Dicas e Boas Praticas
- Sempre informe o motivo corretamente
- Documente a origem da entrada
- Confira o saldo antes e depois
- Use entrada em lote para agilizar
- Anexe comprovantes quando possivel
- Revise antes de confirmar

## Permissoes Necessarias
- **Registrar entrada**: Estoquistas e conferentes
- **Aprovar ajustes**: Gestores de estoque
- **Entrada em lote**: Gestores
- **Visualizar historico**: Todos do setor

## Relacionamentos
- **Produtos**: Itens sendo movimentados
- **Inventario**: Origem de ajustes
- **Transferencia**: Entradas de outras unidades
- **Relatorios**: Movimentacoes registradas
