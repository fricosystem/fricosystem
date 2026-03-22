# Baixa de Requisicao

## Visao Geral
A pagina de Baixa de Requisicao e usada pelo almoxarifado para registrar a entrega dos materiais solicitados. Permite separar, conferir e dar baixa nos itens das requisicoes aprovadas.

## Rota
`/baixa-requisicao`

## Funcionalidades

### Gestao de Entregas
- **Requisicoes aprovadas**: Lista de requisicoes para separacao
- **Em separacao**: Requisicoes sendo preparadas
- **Prontas**: Aguardando retirada
- **Entregues**: Historico de baixas realizadas

### Processo de Baixa
- Selecao da requisicao
- Separacao dos itens
- Conferencia de quantidades
- Registro da entrega
- Assinatura do recebedor

### Informacoes da Baixa
- Numero da requisicao
- Solicitante
- Itens e quantidades
- Data de aprovacao
- Data de entrega
- Quem entregou/recebeu

## Como Usar (Passo a Passo)

### Visualizar Requisicoes para Baixa
1. Acesse Baixa de Requisicao
2. Veja a lista de requisicoes aprovadas
3. Filtre por solicitante ou data se necessario
4. Selecione uma requisicao para separar

### Separar Itens da Requisicao
1. Clique na requisicao
2. Veja a lista de itens solicitados
3. Separe fisicamente cada produto
4. Marque os itens separados
5. Informe se algum item nao tem estoque

### Realizar a Baixa/Entrega
1. Com os itens separados, chame o solicitante
2. Entregue os materiais
3. Confira junto com o recebedor
4. Registre a entrega no sistema
5. Colha assinatura ou confirmacao
6. A requisicao sera finalizada

### Tratar Item sem Estoque
1. Se produto nao tiver estoque
2. Marque como "Sem estoque"
3. Informe quantidade disponivel
4. Entregue o que tiver
5. Pendencia ficara registrada

## Tratativas Operacionais

### Situacao 1: Produto sem estoque
**Problema**: Requisicao aprovada mas item zerado
**Solucao**:
1. Verifique se ha em outro local
2. Se nao houver, entregue parcialmente
3. Informe ao solicitante sobre falta
4. Crie nova requisicao quando repuser

### Situacao 2: Solicitante nao compareceu
**Problema**: Requisicao separada mas nao buscaram
**Solucao**:
1. Mantenha como "Pronta para retirada"
2. Notifique o solicitante
3. Defina prazo para retirada
4. Se nao buscar, considere devolver ao estoque

### Situacao 3: Quantidade errada na requisicao
**Problema**: Solicitante pediu quantidade incorreta
**Solucao**:
1. Entregue o solicitado se aprovado
2. Solicitante pode devolver excedente
3. Ou criar nova requisicao do que faltou
4. Nao altere quantidade sem aprovacao

### Situacao 4: Produto substituido
**Problema**: Item solicitado em falta, tem similar
**Solucao**:
1. Consulte o solicitante sobre substituicao
2. Se aceitar, entregue o alternativo
3. Registre a substituicao nas observacoes
4. Ajuste o estoque corretamente

## Dicas e Boas Praticas
- Separe requisicoes na ordem de aprovacao
- Priorize requisicoes urgentes
- Confira quantidades com atencao
- Registre entregas imediatamente
- Comunique solicitantes sobre pendencias
- Mantenha area de separacao organizada

## Permissoes Necessarias
- **Visualizar requisicoes**: Almoxarifado
- **Realizar baixa**: Estoquistas e conferentes
- **Entregar**: Almoxarifado
- **Cancelar baixa**: Gestores

## Relacionamentos
- **Requisicoes**: Origem dos pedidos
- **Produtos**: Itens sendo entregues
- **Estoque**: Saida de materiais
- **Usuarios**: Solicitante e entregador
