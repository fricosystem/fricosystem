# Relatorios

## Visao Geral
A pagina de Relatorios oferece diversas analises e visualizacoes de dados do sistema. Permite gerar relatorios de estoque, movimentacoes, consumo e outros indicadores importantes.

## Rota
`/relatorios`

## Funcionalidades

### Tipos de Relatorios
- **Posicao de Estoque**: Saldo atual de produtos
- **Movimentacoes**: Entradas e saidas por periodo
- **Consumo por Centro de Custo**: Gastos por area
- **Produtos sem Movimentacao**: Itens parados
- **Vencimentos**: Produtos proximos ao vencimento
- **ABC de Estoque**: Classificacao por valor/giro

### Filtros Disponiveis
- Periodo (data inicial e final)
- Categoria de produto
- Fornecedor
- Centro de custo
- Unidade/Filial

### Formatos de Exportacao
- Excel (XLSX)
- PDF
- CSV
- Impressao direta

## Como Usar (Passo a Passo)

### Gerar Relatorio de Posicao de Estoque
1. Selecione "Posicao de Estoque"
2. Defina a data de referencia
3. Filtre por categoria se necessario
4. Clique em "Gerar"
5. Visualize ou exporte o resultado

### Analisar Movimentacoes
1. Selecione "Movimentacoes"
2. Defina o periodo desejado
3. Filtre por tipo (entrada/saida)
4. Gere o relatorio
5. Analise os dados

### Verificar Produtos Vencidos
1. Selecione "Vencimentos"
2. Defina o horizonte (proximos X dias)
3. Gere o relatorio
4. Identifique itens criticos
5. Tome as providencias necessarias

### Exportar para Excel
1. Gere o relatorio desejado
2. Clique em "Exportar"
3. Selecione formato Excel
4. O arquivo sera baixado
5. Abra no Excel para analises adicionais

## Tratativas Operacionais

### Situacao 1: Relatorio muito grande
**Problema**: Relatorio demora ou trava
**Solucao**:
1. Aplique mais filtros
2. Reduza o periodo
3. Gere por partes
4. Solicite em horario de menor uso

### Situacao 2: Dados parecem incorretos
**Problema**: Valores nao batem com esperado
**Solucao**:
1. Verifique os filtros aplicados
2. Confira o periodo selecionado
3. Compare com outros relatorios
4. Se persistir, reporte ao suporte

### Situacao 3: Nao consegue exportar
**Problema**: Erro ao baixar arquivo
**Solucao**:
1. Tente outro formato
2. Reduza a quantidade de dados
3. Use outro navegador
4. Limpe cache e tente novamente

## Dicas e Boas Praticas
- Gere relatorios periodicamente
- Salve configuracoes frequentes
- Compare periodos para analises
- Use filtros para focar no necessario
- Exporte dados importantes

## Permissoes Necessarias
- **Visualizar**: Gestores e administradores
- **Exportar**: Gestores
- **Relatorios financeiros**: Financeiro e diretoria

## Relacionamentos
- **Produtos**: Base dos relatorios de estoque
- **Movimentacoes**: Dados de entrada/saida
- **Centro de Custo**: Analises de consumo
