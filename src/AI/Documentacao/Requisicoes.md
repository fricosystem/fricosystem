# Requisicoes

## Visao Geral
A pagina de Requisicoes gerencia todas as solicitacoes de materiais do sistema. Permite criar, aprovar, rejeitar e acompanhar o status de cada requisicao, desde a solicitacao ate a entrega ao solicitante.

## Rota
`/requisicoes`

## Funcionalidades

### Listagem de Requisicoes
- **Tabela de requisicoes**: Todas as solicitacoes da unidade
- **Filtros por status**: Pendente, Aprovada, Rejeitada, Entregue
- **Filtros por periodo**: Data de criacao
- **Filtros por solicitante**: Busca por usuario
- **Ordenacao**: Por data, status, solicitante

### Status de Requisicao
- **Pendente**: Aguardando aprovacao do gestor
- **Aprovada**: Liberada para separacao
- **Em Separacao**: Sendo preparada no almoxarifado
- **Pronta para Retirada**: Disponivel para o solicitante
- **Entregue**: Finalizada com sucesso
- **Rejeitada**: Negada pelo aprovador
- **Cancelada**: Cancelada pelo solicitante

### Acoes Disponiveis
- **Visualizar detalhes**: Ver todos os itens e historico
- **Aprovar**: Liberar requisicao (gestores)
- **Rejeitar**: Negar requisicao com justificativa
- **Cancelar**: Cancelar propria requisicao
- **Imprimir**: Gerar documento da requisicao

## Como Usar (Passo a Passo)

### Criar Nova Requisicao
1. Acesse a pagina de Produtos
2. Adicione os itens desejados ao Carrinho
3. Va para o Carrinho e revise os itens
4. Clique em "Finalizar Requisicao"
5. Adicione observacoes se necessario
6. Confirme a solicitacao

### Aprovar Requisicao (Gestores)
1. Acesse a pagina de Requisicoes
2. Filtre por status "Pendente"
3. Clique na requisicao para ver detalhes
4. Analise os itens solicitados
5. Clique em "Aprovar" ou "Rejeitar"
6. Se rejeitar, informe o motivo

### Acompanhar Requisicao
1. Acesse Requisicoes
2. Localize sua requisicao pela data ou numero
3. Veja o status atual na coluna de status
4. Clique para ver o historico completo

### Realizar Baixa (Almoxarifado)
1. Acesse Baixa de Requisicao
2. Selecione a requisicao aprovada
3. Confirme os itens entregues
4. Registre a entrega

## Tratativas Operacionais

### Situacao 1: Requisicao pendente ha muito tempo
**Problema**: Solicitacao sem aprovacao por varios dias
**Solucao**:
1. Verifique se o aprovador esta ciente
2. Entre em contato com o gestor responsavel
3. Se urgente, solicite aprovacao via chat ou email
4. Considere criar nova requisicao se necessario

### Situacao 2: Item rejeitado parcialmente
**Problema**: Parte dos itens foi rejeitada
**Solucao**:
1. Verifique o motivo da rejeicao nos detalhes
2. Ajuste a quantidade ou busque alternativa
3. Crie nova requisicao apenas com itens validos
4. Converse com aprovador sobre necessidades

### Situacao 3: Produto sem estoque
**Problema**: Item aprovado mas sem estoque disponivel
**Solucao**:
1. Verifique se ha estoque em outra unidade
2. Solicite transferencia se disponivel
3. Aguarde reposicao ou compra
4. Comunique o solicitante sobre previsao

### Situacao 4: Requisicao duplicada
**Problema**: Criou requisicao duplicada por engano
**Solucao**:
1. Cancele a requisicao duplicada
2. Informe o motivo do cancelamento
3. Mantenha apenas uma requisicao ativa
4. Ajuste quantidades se necessario

## Dicas e Boas Praticas
- Revise os itens antes de finalizar a requisicao
- Adicione observacoes relevantes para o aprovador
- Acompanhe o status regularmente
- Planeje requisicoes com antecedencia
- Evite requisicoes urgentes sempre que possivel
- Agrupe itens relacionados na mesma requisicao

## Permissoes Necessarias
- **Criar requisicao**: Todos os usuarios autenticados
- **Aprovar/Rejeitar**: Gestores e lideres de setor
- **Cancelar propria**: Solicitante original
- **Visualizar todas**: Gestores da unidade

## Relacionamentos
- **Carrinho**: Origem dos itens da requisicao
- **Produtos**: Itens solicitados
- **Baixa Requisicao**: Entrega ao solicitante
- **Estoque**: Movimentacao de saida
- **Usuarios**: Solicitante e aprovador
