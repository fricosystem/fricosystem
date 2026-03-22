# Dashboard de Manutencao

## Visao Geral
O Dashboard de Manutencao oferece uma visao consolidada de todos os indicadores de manutencao. Apresenta metricas de disponibilidade, preventivas, ordens de servico e desempenho da equipe.

## Rota
`/dashboard-manutencao`

## Funcionalidades

### Indicadores Principais
- **Disponibilidade**: Percentual de maquinas operando
- **MTBF**: Tempo medio entre falhas
- **MTTR**: Tempo medio de reparo
- **Backlog**: OS pendentes acumuladas
- **Aderencia**: Cumprimento de preventivas

### Graficos e Visualizacoes
- Paradas por tipo (grafico pizza)
- Evolucao de OS abertas x fechadas
- Preventivas por status
- Ranking de maquinas com mais paradas
- Desempenho por manutentor

### Alertas
- Preventivas vencidas
- OS urgentes abertas
- Maquinas criticas paradas
- Backlog elevado

## Como Usar (Passo a Passo)

### Visualizar Indicadores
1. Acesse o Dashboard de Manutencao
2. Veja os cards com metricas principais
3. Passe o mouse para mais detalhes
4. Clique para acessar a origem do dado

### Analisar Graficos
1. Selecione o periodo desejado
2. Veja os graficos atualizados
3. Clique em elementos para filtrar
4. Compare com periodos anteriores

### Verificar Alertas
1. Veja a secao de alertas
2. Itens em vermelho sao criticos
3. Clique para ir ao detalhe
4. Tome as acoes necessarias

### Filtrar por Setor
1. Use o filtro de setor
2. O dashboard atualiza automaticamente
3. Analise indicadores especificos
4. Compare entre setores

## Tratativas Operacionais

### Situacao 1: Disponibilidade baixa
**Problema**: Muitas maquinas paradas
**Solucao**:
1. Identifique as maquinas paradas
2. Priorize equipamentos criticos
3. Aloque recursos para resolver
4. Acompanhe evolucao no dashboard

### Situacao 2: Backlog alto
**Problema**: Muitas OS acumuladas
**Solucao**:
1. Analise as OS por prioridade
2. Redistribua entre manutentores
3. Considere hora extra se necessario
4. Priorize por impacto na producao

### Situacao 3: Preventivas atrasadas
**Problema**: Baixa aderencia ao plano
**Solucao**:
1. Identifique causas dos atrasos
2. Reprogram o mais rapido possivel
3. Avalie necessidade de mais recursos
4. Ajuste plano se necessario

## Dicas e Boas Praticas
- Monitore dashboard diariamente
- Atue nos alertas rapidamente
- Compare indicadores semanalmente
- Use para reunioes de gestao
- Defina metas para os indicadores

## Permissoes Necessarias
- **Visualizar**: Equipe de manutencao
- **Filtros avancados**: Gestores
- **Exportar dados**: Gestores

## Relacionamentos
- **Maquinas**: Indicadores de disponibilidade
- **Ordens de Servico**: Metricas de atendimento
- **Manutencao Preventiva**: Aderencia ao plano
- **Manutentores**: Desempenho da equipe
