# Inventario

## Visao Geral
A pagina de Inventario permite realizar a contagem fisica do estoque, comparar com o sistema e fazer os ajustes necessarios. Fundamental para manter a acuracidade do estoque e identificar divergencias.

## Rota
`/inventario`

## Funcionalidades

### Tipos de Inventario
- **Geral**: Contagem de todos os produtos
- **Parcial**: Contagem de categorias especificas
- **Por localizacao**: Contagem por corredor/prateleira
- **Rotativo**: Contagem continua por amostragem

### Processo de Contagem
- Geracao de lista de contagem
- Registro das quantidades encontradas
- Comparacao automatica com sistema
- Identificacao de divergencias
- Aprovacao de ajustes

### Informacoes Exibidas
- Codigo e descricao do produto
- Quantidade no sistema
- Quantidade contada
- Diferenca (sobra ou falta)
- Valor da divergencia
- Status da contagem

### Acoes Disponiveis
- **Iniciar inventario**: Criar nova contagem
- **Registrar contagem**: Informar quantidade encontrada
- **Segunda contagem**: Recontar itens divergentes
- **Aprovar ajustes**: Validar e aplicar correcoes
- **Exportar**: Gerar relatorio do inventario

## Como Usar (Passo a Passo)

### Iniciar Novo Inventario
1. Clique em "Novo Inventario"
2. Selecione o tipo (geral, parcial, etc)
3. Defina o escopo (categorias, localizacoes)
4. Gere a lista de contagem
5. Distribua entre os conferentes

### Realizar Contagem
1. Acesse sua lista de contagem
2. Va ate o local do produto
3. Conte fisicamente a quantidade
4. Registre no sistema a quantidade encontrada
5. Passe para o proximo item
6. Repita ate concluir a lista

### Tratar Divergencias
1. Apos contagem, veja os itens divergentes
2. Solicite segunda contagem se necessario
3. Investigue a causa da divergencia
4. Documente a justificativa
5. Solicite aprovacao do ajuste

### Aprovar e Aplicar Ajustes
1. Revise os itens com divergencia
2. Analise as justificativas
3. Aprove os ajustes validos
4. Rejeite os que precisam investigacao
5. Os ajustes aprovados sao aplicados

## Tratativas Operacionais

### Situacao 1: Divergencia grande em produto
**Problema**: Quantidade muito diferente do sistema
**Solucao**:
1. Solicite segunda contagem por outra pessoa
2. Verifique se nao ha produto em outro local
3. Consulte movimentacoes recentes
4. Investigue possiveis causas (furto, erro)
5. Documente detalhadamente

### Situacao 2: Produto encontrado sem cadastro
**Problema**: Item fisico nao consta no sistema
**Solucao**:
1. Registre como "Produto nao identificado"
2. Tente identificar pelo codigo de barras
3. Solicite cadastro se for novo
4. Verifique se e de outra unidade

### Situacao 3: Produto no sistema mas nao encontrado
**Problema**: Sistema mostra estoque mas produto sumiu
**Solucao**:
1. Verifique outros locais possiveis
2. Consulte movimentacoes pendentes
3. Verifique requisicoes nao baixadas
4. Se nao encontrar, registre como falta

### Situacao 4: Erro na contagem
**Problema**: Registrou quantidade errada
**Solucao**:
1. Antes de fechar, edite a contagem
2. Se ja fechou, solicite reabertura
3. Ou faça nova contagem do item
4. Documente o motivo da correcao

## Dicas e Boas Praticas
- Faca inventarios periodicamente
- Organize o estoque antes de contar
- Conte duas vezes itens de alto valor
- Nao movimente estoque durante inventario
- Documente todas as divergencias
- Analise causas para evitar recorrencia

## Permissoes Necessarias
- **Iniciar inventario**: Gestores de estoque
- **Realizar contagem**: Conferentes e estoquistas
- **Aprovar ajustes**: Gestores e supervisores
- **Visualizar historico**: Todos do setor

## Relacionamentos
- **Produtos**: Itens sendo inventariados
- **Estoque**: Ajustes de quantidade
- **Relatorios**: Indicadores de acuracidade
- **Entrada Manual**: Ajustes de entrada
