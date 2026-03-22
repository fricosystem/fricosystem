# Execucao de Manutencao

## Visao Geral
A pagina de Execucao de Manutencao e a interface principal dos manutentores para realizar as tarefas de manutencao preventiva e corretiva. Permite visualizar tarefas atribuidas, executar checklists e registrar a conclusao dos servicos.

## Rota
`/execucao-manutencao`

## Funcionalidades

### Painel do Manutentor
- **Minhas tarefas**: Lista de tarefas atribuidas
- **Tarefas do dia**: Preventivas e OS para hoje
- **Atrasadas**: Tarefas pendentes vencidas
- **Concluidas**: Historico de execucoes

### Tipos de Tarefas
- **Preventiva**: Manutencao programada com checklist
- **OS Corretiva**: Ordem de servico para reparo
- **Inspecao**: Verificacao de rotina

### Execucao de Checklist
- Lista de itens a verificar
- Campos para marcar OK/NOK
- Campo de observacoes por item
- Upload de fotos
- Medicoes e valores quando aplicavel

### Acoes Disponiveis
- **Iniciar tarefa**: Comecar a execucao
- **Pausar**: Interromper temporariamente
- **Solicitar peca**: Requisitar material
- **Finalizar**: Concluir a tarefa
- **Reportar problema**: Informar anomalia

## Como Usar (Passo a Passo)

### Ver Tarefas do Dia
1. Acesse Execucao de Manutencao
2. Veja a lista de tarefas atribuidas
3. Tarefas do dia aparecem em destaque
4. Itens atrasados aparecem em vermelho
5. Clique em uma tarefa para iniciar

### Executar Manutencao Preventiva
1. Selecione a preventiva na lista
2. Clique em "Iniciar"
3. Va ate a maquina e execute as tarefas
4. Marque cada item do checklist como OK ou NOK
5. Adicione observacoes relevantes
6. Tire fotos se necessario
7. Ao finalizar todos os itens, clique em "Concluir"

### Executar OS Corretiva
1. Selecione a OS na lista
2. Clique em "Assumir" e depois "Iniciar"
3. Diagnostique o problema
4. Execute o reparo necessario
5. Solicite pecas se precisar
6. Registre as acoes realizadas
7. Adicione fotos antes/depois
8. Finalize a OS

### Solicitar Peca Durante Execucao
1. Na tarefa em andamento, clique "Solicitar Peca"
2. Busque o produto necessario
3. Informe quantidade
4. A requisicao sera vinculada a tarefa
5. Continue apos receber o material

## Tratativas Operacionais

### Situacao 1: Item do checklist NOK
**Problema**: Encontrou problema durante preventiva
**Solucao**:
1. Marque o item como NOK
2. Descreva o problema encontrado
3. Tire foto do defeito
4. Gere OS corretiva se necessario
5. Continue com os demais itens
6. Finalize a preventiva normalmente

### Situacao 2: Nao consegue acessar a maquina
**Problema**: Equipamento em uso, sem acesso
**Solucao**:
1. Pause a tarefa
2. Informe nas observacoes o motivo
3. Negocie janela com producao
4. Retome quando possivel
5. Se nao conseguir, solicite reprogramacao

### Situacao 3: Falta de ferramenta ou peca
**Problema**: Material necessario indisponivel
**Solucao**:
1. Pause a tarefa
2. Solicite a peca pelo sistema
3. Informe o gestor sobre a pausa
4. Retome apos receber o material
5. Se urgente, busque alternativas

### Situacao 4: Descobriu problema maior
**Problema**: Durante preventiva, achou defeito grave
**Solucao**:
1. Pare a operacao da maquina se perigoso
2. Registre no checklist como NOK
3. Gere OS corretiva urgente
4. Informe supervisao imediatamente
5. Documente com fotos e descricao

## Dicas e Boas Praticas
- Verifique suas tarefas no inicio do turno
- Priorize itens atrasados
- Seja detalhado nas observacoes
- Sempre tire fotos de anomalias
- Nao pule itens do checklist
- Solicite pecas com antecedencia se souber
- Finalize tarefas no mesmo dia quando possivel

## Permissoes Necessarias
- **Acessar**: Manutentores e supervisores
- **Executar tarefas**: Manutentores
- **Solicitar pecas**: Manutentores
- **Visualizar equipe**: Supervisores

## Relacionamentos
- **Manutencao Preventiva**: Origem das preventivas
- **Ordens de Servico**: OS para execucao
- **Maquinas**: Equipamentos das tarefas
- **Requisicoes**: Solicitacao de pecas
- **Dashboard Manutencao**: Indicadores de produtividade
