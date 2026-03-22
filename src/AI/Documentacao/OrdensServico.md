# Ordens de Servico

## Visao Geral
A pagina de Ordens de Servico (OS) gerencia todas as solicitacoes de manutencao corretiva e servicos tecnicos. Permite criar, acompanhar e encerrar chamados de manutencao em equipamentos e instalacoes.

## Rota
`/ordens-servico`

## Funcionalidades

### Listagem de OS
- **Tabela de ordens**: Todas as OS da unidade
- **Filtros por status**: Aberta, Em Andamento, Finalizada, Cancelada
- **Filtros por prioridade**: Baixa, Media, Alta, Urgente
- **Filtros por maquina**: Busca por equipamento
- **Visualizacao Kanban**: Arrastar e soltar entre colunas

### Status de Ordem de Servico
- **Aberta**: Aguardando inicio do atendimento
- **Em Andamento**: Sendo executada pelo manutentor
- **Aguardando Peca**: Parada por falta de material
- **Finalizada**: Concluida com sucesso
- **Cancelada**: Cancelada antes da conclusao

### Informacoes da OS
- Numero sequencial
- Data/hora de abertura
- Maquina/Equipamento
- Descricao do problema
- Prioridade
- Solicitante
- Manutentor responsavel
- Tempo de atendimento
- Pecas utilizadas
- Fotos antes/depois
- Assinatura de conclusao

### Acoes Disponiveis
- **Criar OS**: Abrir nova ordem de servico
- **Assumir**: Manutentor assume a OS
- **Atualizar status**: Mudar para em andamento, finalizar
- **Adicionar comentario**: Registrar observacoes
- **Anexar fotos**: Documentar a intervencao
- **Solicitar peca**: Requisitar material para a OS
- **Imprimir**: Gerar documento da OS

## Como Usar (Passo a Passo)

### Criar Nova OS
1. Clique em "Nova Ordem de Servico"
2. Selecione o equipamento ou local
3. Descreva o problema detalhadamente
4. Selecione a prioridade
5. Adicione fotos se possivel
6. Confirme a abertura

### Assumir e Executar OS (Manutentor)
1. Acesse a lista de OS abertas
2. Clique em "Assumir" na OS desejada
3. Mude o status para "Em Andamento"
4. Execute o servico necessario
5. Registre as acoes realizadas
6. Adicione fotos da conclusao
7. Finalize a OS

### Acompanhar OS Aberta
1. Localize a OS pelo numero ou filtros
2. Clique para ver detalhes
3. Veja o historico de atualizacoes
4. Acompanhe o status atual

### Solicitar Peca para OS
1. Na OS em andamento, clique em "Solicitar Peca"
2. Busque o produto necessario
3. Informe a quantidade
4. A requisicao sera vinculada a OS
5. Aguarde aprovacao e entrega

## Tratativas Operacionais

### Situacao 1: OS urgente nao atendida
**Problema**: Chamado urgente sem atendimento
**Solucao**:
1. Verifique se ha manutentor disponivel
2. Escale para o supervisor de manutencao
3. Considere redistribuir outras OS
4. Priorize conforme impacto na producao

### Situacao 2: Falta de peca para finalizar
**Problema**: OS parada por falta de material
**Solucao**:
1. Mude o status para "Aguardando Peca"
2. Crie requisicao do material necessario
3. Verifique alternativas ou canibalizacao
4. Informe previsao ao solicitante

### Situacao 3: Problema reincidente
**Problema**: Mesmo defeito ocorre frequentemente
**Solucao**:
1. Analise o historico de OS do equipamento
2. Identifique a causa raiz do problema
3. Sugira manutencao preventiva ou troca
4. Documente para analise gerencial

### Situacao 4: OS finalizada mas problema persiste
**Problema**: Solicitante relata que problema continua
**Solucao**:
1. Reabra a OS original ou crie nova vinculada
2. Documente que e reincidencia
3. Atribua ao mesmo manutentor se possivel
4. Analise se diagnostico estava correto

## Dicas e Boas Praticas
- Descreva o problema com detalhes suficientes
- Sempre adicione fotos da situacao
- Informe a localizacao exata do equipamento
- Defina prioridade de forma realista
- Acompanhe OS abertas por voce
- Documente todas as acoes realizadas
- Solicite pecas com antecedencia se souber

## Permissoes Necessarias
- **Criar OS**: Operadores, lideres, gestores
- **Assumir/Executar**: Manutentores
- **Finalizar**: Manutentor responsavel
- **Cancelar**: Gestores de manutencao
- **Visualizar todas**: Gestores da unidade

## Relacionamentos
- **Maquinas**: Equipamento da OS
- **Manutentores**: Responsaveis pela execucao
- **Requisicoes**: Pecas solicitadas
- **Parada de Maquina**: Origem de algumas OS
- **Relatorios**: Indicadores de manutencao
