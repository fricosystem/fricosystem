# Maquinas

## Visao Geral
A pagina de Maquinas e o cadastro central de todos os equipamentos e ativos da empresa. Permite gerenciar informacoes tecnicas, historico de manutencoes, documentacao e status operacional de cada maquina.

## Rota
`/maquinas`

## Funcionalidades

### Listagem de Maquinas
- **Catalogo visual**: Cards com foto e informacoes principais
- **Visualizacao em tabela**: Lista detalhada com todas as colunas
- **Filtros**: Por setor, status, tipo, fabricante
- **Busca**: Por codigo patrimonial, nome ou tag
- **Ordenacao**: Por nome, setor, ultima manutencao

### Informacoes por Maquina
- Codigo patrimonial
- Nome/Descricao
- Fabricante e modelo
- Ano de fabricacao
- Setor onde esta instalada
- Status operacional (Operando, Parada, Manutencao)
- Foto do equipamento
- QR Code para identificacao
- Historico completo de manutencoes
- Manuais e documentacao tecnica

### Acoes Disponiveis
- **Ver detalhes**: Acessar ficha completa da maquina
- **Editar**: Alterar informacoes cadastrais
- **Abrir OS**: Criar ordem de servico para o equipamento
- **Registrar parada**: Informar parada nao programada
- **Ver historico**: Consultar todas as intervencoes
- **Anexar documento**: Adicionar manuais ou fotos

## Como Usar (Passo a Passo)

### Localizar uma Maquina
1. Use a barra de busca com codigo ou nome
2. Ou navegue pelos filtros de setor
3. Clique no card ou linha para ver detalhes
4. Use o QR Code para acesso rapido via celular

### Consultar Historico de Manutencao
1. Acesse a ficha da maquina
2. Va para a aba "Historico"
3. Veja todas as intervencoes realizadas
4. Filtre por tipo (preventiva/corretiva)
5. Exporte para relatorio se necessario

### Registrar Parada de Maquina
1. Localize o equipamento
2. Clique em "Registrar Parada"
3. Selecione o motivo da parada
4. Informe observacoes relevantes
5. Confirme o registro

### Abrir Ordem de Servico
1. Na ficha da maquina, clique em "Abrir OS"
2. Selecione o tipo de servico
3. Descreva o problema ou necessidade
4. Defina a prioridade
5. Confirme a abertura

## Tratativas Operacionais

### Situacao 1: Maquina parou de funcionar
**Problema**: Equipamento parou inesperadamente
**Solucao**:
1. Registre a parada imediatamente no sistema
2. Selecione "Parada nao programada"
3. Informe o setor responsavel pela manutencao
4. Acompanhe a ordem de servico gerada
5. Aguarde a equipe de manutencao

### Situacao 2: Preventiva vencida
**Problema**: Manutencao preventiva atrasada
**Solucao**:
1. Verifique a agenda de manutencao
2. Entre em contato com o setor de manutencao
3. Programe a execucao o mais rapido possivel
4. Evite operar ate regularizar se critico

### Situacao 3: Maquina nao encontrada
**Problema**: Equipamento nao consta no sistema
**Solucao**:
1. Verifique se esta buscando pelo codigo correto
2. Confirme a unidade selecionada
3. Solicite cadastro ao setor administrativo
4. Informe numero patrimonial e localizacao

### Situacao 4: Foto ou manual desatualizado
**Problema**: Documentacao do equipamento antiga
**Solucao**:
1. Acesse a edicao da maquina
2. Faca upload da nova foto ou documento
3. Remova arquivos obsoletos
4. Salve as alteracoes

## Dicas e Boas Praticas
- Mantenha as fotos dos equipamentos atualizadas
- Anexe todos os manuais tecnicos disponiveis
- Registre todas as intervencoes no historico
- Use o QR Code para identificacao rapida
- Revise periodicamente o status das maquinas
- Configure alertas para preventivas

## Permissoes Necessarias
- **Visualizar**: Todos os usuarios da manutencao
- **Editar**: Gestores de manutencao
- **Abrir OS**: Operadores e manutentores
- **Registrar parada**: Operadores e lideres

## Relacionamentos
- **Manutencao Preventiva**: Agenda de preventivas
- **Ordens de Servico**: OS vinculadas ao equipamento
- **Parada de Maquina**: Registros de parada
- **Manuais**: Documentacao tecnica
- **Setores**: Localizacao do equipamento
