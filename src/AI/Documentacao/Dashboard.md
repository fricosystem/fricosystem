# Dashboard Geral

## Visao Geral
O Dashboard Geral e a pagina inicial do sistema APEX HUB, oferecendo uma visao consolidada de todas as metricas e indicadores importantes da operacao. Apresenta graficos, alertas e resumos que permitem uma analise rapida do estado atual do negocio.

## Rota
`/dashboard`

## Funcionalidades

### Metricas Principais
- **Total de Produtos**: Quantidade total de itens cadastrados no estoque
- **Valor Total em Estoque**: Soma do valor de todos os produtos
- **Requisicoes Pendentes**: Numero de solicitacoes aguardando aprovacao
- **Manutencoes Agendadas**: Preventivas programadas para o periodo

### Graficos e Visualizacoes
- **Grafico de Movimentacao**: Entradas e saidas de estoque ao longo do tempo
- **Produtos por Categoria**: Distribuicao de produtos por categoria
- **Status de Manutencoes**: Visao geral das manutencoes preventivas
- **Alertas de Estoque**: Produtos com estoque baixo ou vencimento proximo

### Filtros Disponiveis
- Periodo de analise (dia, semana, mes, ano)
- Unidade/Filial
- Categoria de produto
- Setor

## Como Usar (Passo a Passo)

### Visualizar Metricas Gerais
1. Acesse o Dashboard atraves do menu lateral
2. Os cards superiores mostram as metricas principais
3. Clique em qualquer card para ver detalhes

### Analisar Graficos
1. Passe o mouse sobre os graficos para ver valores especificos
2. Use os filtros de periodo para ajustar a visualizacao
3. Clique em elementos do grafico para filtrar dados relacionados

### Verificar Alertas
1. A secao de alertas mostra itens que requerem atencao
2. Clique no alerta para ir diretamente ao item
3. Alertas vermelhos sao criticos, amarelos sao avisos

## Tratativas Operacionais

### Situacao 1: Estoque abaixo do minimo
**Problema**: Card mostrando muitos produtos com estoque baixo
**Solucao**: 
1. Clique no card de alertas de estoque
2. Identifique os produtos criticos
3. Acesse a pagina de Compras para criar pedidos
4. Ou acesse Requisicoes para solicitar transferencia de outra unidade

### Situacao 2: Manutencoes atrasadas
**Problema**: Indicador mostrando manutencoes vencidas
**Solucao**:
1. Clique no indicador de manutencoes
2. Verifique quais equipamentos estao com preventiva atrasada
3. Acesse Execucao de Manutencao para registrar a execucao
4. Ou Parada de Maquina se houver problema no equipamento

### Situacao 3: Requisicoes pendentes acumuladas
**Problema**: Muitas requisicoes aguardando aprovacao
**Solucao**:
1. Clique no card de requisicoes pendentes
2. Sera redirecionado para a pagina de Requisicoes
3. Analise e aprove/rejeite as solicitacoes pendentes

## Dicas e Boas Praticas
- Verifique o dashboard diariamente no inicio do expediente
- Configure alertas por email para itens criticos
- Use os filtros de periodo para analises comparativas
- Exporte graficos para relatorios gerenciais

## Permissoes Necessarias
- **Visualizacao**: Todos os usuarios autenticados
- **Filtros avancados**: Gestores e administradores
- **Exportacao**: Gestores e administradores

## Relacionamentos
- **Produtos**: Link direto para gestao de estoque
- **Requisicoes**: Acesso rapido a aprovacoes pendentes
- **Manutencao**: Conexao com preventivas e corretivas
- **Relatorios**: Dados alimentam relatorios gerenciais
