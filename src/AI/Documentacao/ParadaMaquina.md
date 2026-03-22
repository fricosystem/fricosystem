# Parada de Maquina

## Visao Geral
A pagina de Parada de Maquina permite registrar e gerenciar todas as interrupcoes de funcionamento dos equipamentos. Essencial para controle de disponibilidade, analise de causas e geracao de indicadores de eficiencia.

## Rota
`/parada-maquina`

## Funcionalidades

### Registro de Paradas
- **Parada programada**: Manutencao preventiva, setup, limpeza
- **Parada nao programada**: Falhas, defeitos, falta de material
- **Parada operacional**: Falta de operador, troca de turno

### Informacoes da Parada
- Maquina/Equipamento afetado
- Setor da maquina
- Data e hora de inicio
- Data e hora de fim (quando retomar)
- Tipo de parada
- Motivo detalhado
- Responsavel pelo registro
- OS gerada (se aplicavel)

### Monitoramento
- **Paradas ativas**: Equipamentos parados agora
- **Historico**: Todas as paradas do periodo
- **Indicadores**: Tempo medio de parada, frequencia
- **Graficos**: Pareto de causas, timeline

### Acoes Disponiveis
- **Registrar parada**: Informar nova parada
- **Encerrar parada**: Registrar retorno da maquina
- **Gerar OS**: Criar ordem de servico vinculada
- **Editar registro**: Corrigir informacoes
- **Exportar dados**: Gerar relatorio

## Como Usar (Passo a Passo)

### Registrar Nova Parada
1. Clique em "Registrar Parada"
2. Selecione a maquina afetada
3. Escolha o tipo de parada
4. Selecione o motivo
5. Adicione descricao detalhada
6. A hora de inicio e registrada automaticamente
7. Confirme o registro

### Encerrar Parada
1. Localize a parada ativa
2. Clique em "Encerrar Parada"
3. A hora de fim e registrada
4. Adicione observacoes sobre a solucao
5. Confirme o encerramento

### Gerar OS a partir da Parada
1. Na parada registrada, clique em "Gerar OS"
2. Revise as informacoes pre-preenchidas
3. Adicione detalhes tecnicos se necessario
4. Defina a prioridade
5. Confirme a criacao da OS

### Consultar Historico de Paradas
1. Use os filtros de periodo
2. Filtre por maquina se necessario
3. Veja a lista de paradas
4. Clique para ver detalhes de cada uma
5. Exporte para analise se necessario

## Tratativas Operacionais

### Situacao 1: Maquina critica parou
**Problema**: Equipamento essencial para producao parado
**Solucao**:
1. Registre a parada imediatamente
2. Selecione "Parada nao programada"
3. Gere OS com prioridade urgente
4. Notifique supervisao de producao
5. Acompanhe o atendimento da manutencao

### Situacao 2: Parada recorrente
**Problema**: Mesmo equipamento para com frequencia
**Solucao**:
1. Consulte o historico de paradas da maquina
2. Identifique padrao nos motivos
3. Solicite analise de causa raiz
4. Sugira manutencao preventiva ou correcao definitiva

### Situacao 3: Nao sei o motivo da parada
**Problema**: Maquina parou sem causa aparente
**Solucao**:
1. Registre como "Em analise"
2. Descreva os sintomas observados
3. Gere OS para diagnostico
4. Atualize o motivo apos analise

### Situacao 4: Parada muito longa
**Problema**: Equipamento parado alem do esperado
**Solucao**:
1. Verifique status da OS vinculada
2. Identifique o gargalo (peca, mao de obra)
3. Escale para gestao se necessario
4. Atualize registro com justificativas

## Dicas e Boas Praticas
- Registre paradas imediatamente quando ocorrerem
- Seja detalhado na descricao do problema
- Sempre gere OS para paradas nao programadas
- Encerre paradas assim que a maquina retornar
- Use os indicadores para analises de melhoria
- Revise paradas recorrentes periodicamente

## Permissoes Necessarias
- **Registrar parada**: Operadores, lideres, manutentores
- **Encerrar parada**: Mesmo responsavel ou supervisor
- **Gerar OS**: Usuarios com permissao de OS
- **Visualizar historico**: Todos da unidade

## Relacionamentos
- **Maquinas**: Equipamento da parada
- **Ordens de Servico**: OS gerada da parada
- **Dashboard Manutencao**: Indicadores de disponibilidade
- **Relatorios**: Analise de paradas
- **Setores**: Localizacao do equipamento
