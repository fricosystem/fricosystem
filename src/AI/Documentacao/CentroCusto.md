# Centro de Custo

## Visao Geral
A pagina de Centro de Custo permite gerenciar a estrutura de centros de custo da empresa. Essencial para alocacao de despesas, controle orcamentario e analise de custos por area.

## Rota
`/centro-custo`

## Funcionalidades

### Gestao de Centros
- **Listar centros**: Todos os centros cadastrados
- **Criar centro**: Novo centro de custo
- **Editar**: Alterar informacoes
- **Ativar/Desativar**: Controlar centros ativos
- **Hierarquia**: Organizar em arvore

### Informacoes do Centro
- Codigo do centro
- Descricao/Nome
- Centro pai (hierarquia)
- Responsavel
- Orcamento anual/mensal
- Status (ativo/inativo)
- Unidade vinculada

### Relatorios e Analises
- Despesas por centro
- Comparativo orcado x realizado
- Evolucao mensal
- Ranking de custos

## Como Usar (Passo a Passo)

### Criar Novo Centro de Custo
1. Clique em "Novo Centro"
2. Informe o codigo (padronizado)
3. Digite a descricao
4. Selecione o centro pai se houver
5. Defina o responsavel
6. Informe o orcamento se aplicavel
7. Salve o cadastro

### Organizar Hierarquia
1. Acesse a visao em arvore
2. Arraste os centros para reorganizar
3. Ou edite e selecione o centro pai
4. A hierarquia reflete nos relatorios

### Consultar Despesas do Centro
1. Selecione o centro desejado
2. Clique em "Ver Despesas"
3. Filtre por periodo
4. Veja o detalhamento das alocacoes
5. Exporte para analise se necessario

### Definir Orcamento
1. Edite o centro de custo
2. Va para a aba de orcamento
3. Informe os valores por periodo
4. Salve as alteracoes
5. O sistema comparara com realizado

## Tratativas Operacionais

### Situacao 1: Centro de custo nao encontrado
**Problema**: Precisa alocar despesa mas centro nao existe
**Solucao**:
1. Verifique se buscou pelo codigo correto
2. Confira se o centro esta ativo
3. Solicite criacao ao financeiro
4. Use centro generico temporariamente

### Situacao 2: Orcamento estourado
**Problema**: Centro ultrapassou o orcamento
**Solucao**:
1. Analise as despesas realizadas
2. Identifique gastos extraordinarios
3. Solicite suplementacao se necessario
4. Ajuste previsao para proximos periodos

### Situacao 3: Despesa alocada no centro errado
**Problema**: Lancamento em centro incorreto
**Solucao**:
1. Identifique a despesa incorreta
2. Solicite estorno ao financeiro
3. Realoque no centro correto
4. Documente a correcao

### Situacao 4: Precisa desativar centro
**Problema**: Centro nao sera mais usado
**Solucao**:
1. Verifique se nao ha despesas pendentes
2. Transfira saldos se necessario
3. Desative o centro (nao exclua)
4. Historico sera mantido

## Dicas e Boas Praticas
- Use codigos padronizados
- Mantenha hierarquia logica
- Defina responsaveis claros
- Acompanhe orcamento mensalmente
- Revise centros anualmente
- Nao crie centros em excesso

## Permissoes Necessarias
- **Visualizar**: Gestores e financeiro
- **Criar/Editar**: Financeiro e administradores
- **Definir orcamento**: Financeiro
- **Alocar despesas**: Gestores de area

## Relacionamentos
- **Requisicoes**: Alocacao de materiais
- **Compras**: Despesas de compra
- **Relatorios**: Analises de custo
- **Unidades**: Estrutura organizacional
