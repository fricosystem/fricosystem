# Manutencao Preventiva

## Visao Geral
A pagina de Manutencao Preventiva gerencia o planejamento e agendamento de manutencoes programadas. Permite configurar frequencias, atribuir responsaveis e acompanhar a execucao das tarefas de manutencao preventiva.

## Rota
`/manutencao-preventiva`

## Funcionalidades

### Calendario de Preventivas
- **Visao mensal**: Calendario com todas as preventivas
- **Visao semanal**: Detalhe da semana atual
- **Visao por maquina**: Agenda especifica por equipamento
- **Cores por status**: Verde (ok), Amarelo (proximo), Vermelho (atrasado)

### Configuracao de Preventivas
- Frequencia (diaria, semanal, mensal, trimestral, anual)
- Maquina ou grupo de maquinas
- Tarefas a executar (checklist)
- Manutentor responsavel
- Tempo estimado de execucao
- Materiais necessarios
- Documentacao de referencia

### Monitoramento
- **Proximas a vencer**: Preventivas dos proximos dias
- **Atrasadas**: Pendentes alem da data programada
- **Executadas**: Historico de realizacoes
- **Taxa de cumprimento**: Indicador de aderencia ao plano

### Acoes Disponiveis
- **Criar plano**: Configurar nova preventiva
- **Editar frequencia**: Ajustar periodicidade
- **Reprogramar**: Alterar data especifica
- **Visualizar checklist**: Ver tarefas da preventiva
- **Gerar execucao**: Criar tarefa para manutentor

## Como Usar (Passo a Passo)

### Criar Plano de Preventiva
1. Clique em "Novo Plano Preventivo"
2. Selecione a maquina ou grupo
3. Defina a frequencia desejada
4. Configure o checklist de tarefas
5. Atribua manutentor padrao
6. Salve o plano

### Verificar Preventivas Pendentes
1. Acesse o calendario de preventivas
2. Veja os indicadores coloridos
3. Itens em vermelho estao atrasados
4. Itens em amarelo estao proximos
5. Clique para ver detalhes

### Reprogramar uma Preventiva
1. Localize a preventiva no calendario
2. Clique sobre ela
3. Selecione "Reprogramar"
4. Informe a nova data
5. Adicione justificativa
6. Confirme a alteracao

### Acompanhar Execucao
1. Acesse a aba "Em Execucao"
2. Veja as preventivas sendo realizadas
3. Clique para ver o progresso
4. Acompanhe os itens do checklist

## Tratativas Operacionais

### Situacao 1: Preventiva atrasada
**Problema**: Manutencao passou da data programada
**Solucao**:
1. Verifique disponibilidade de manutentor
2. Reprogram para a data mais proxima possivel
3. Priorize equipamentos criticos
4. Registre justificativa do atraso

### Situacao 2: Maquina indisponivel para preventiva
**Problema**: Equipamento em uso continuo, sem janela
**Solucao**:
1. Negocie parada programada com producao
2. Considere preventiva em horario alternativo
3. Divida as tarefas em partes menores
4. Reprogram se nao houver alternativa

### Situacao 3: Falta de peca para preventiva
**Problema**: Material necessario nao disponivel
**Solucao**:
1. Verifique estoque de pecas preventivas
2. Solicite com antecedencia os materiais
3. Crie requisicao vinculada a preventiva
4. Reprogram se material for critico

### Situacao 4: Manutentor ausente
**Problema**: Responsavel nao esta disponivel
**Solucao**:
1. Atribua a outro manutentor capacitado
2. Consulte a matriz de habilidades
3. Se nao houver substituto, reprogram
4. Documente a mudanca

## Dicas e Boas Praticas
- Planeje preventivas com antecedencia
- Configure alertas para proximidade de vencimento
- Mantenha checklists atualizados
- Revise frequencias periodicamente
- Equilibre carga entre manutentores
- Documente todas as execucoes
- Analise historico para otimizar intervalos

## Permissoes Necessarias
- **Visualizar**: Todos da manutencao
- **Criar/Editar planos**: Gestores de manutencao
- **Reprogramar**: Gestores e supervisores
- **Executar**: Manutentores

## Relacionamentos
- **Maquinas**: Equipamentos das preventivas
- **Execucao de Manutencao**: Realizacao das tarefas
- **Manutentores**: Responsaveis pela execucao
- **Gestao de Tarefas**: Checklists configurados
- **Dashboard Manutencao**: Indicadores de cumprimento
