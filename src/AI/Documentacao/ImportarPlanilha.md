# Importar Dados (Planilhas)

## Visao Geral

O modulo de **Importacao de Dados** permite carregar informacoes em massa no sistema a partir de planilhas Excel ou CSV, agilizando cadastros e atualizacoes.

## Tipos de Importacao

### Dados Suportados

- **Produtos**: Cadastro e atualizacao de estoque
- **Fornecedores**: Cadastro de novos fornecedores
- **Equipamentos**: Cadastro de maquinas
- **Movimentacoes**: Entradas e saidas em lote

## Funcionalidades Principais

### 1. Upload de Arquivo

- **Formatos aceitos**: .xlsx, .xls, .csv
- **Validacao**: Sistema verifica formato
- **Preview**: Visualize dados antes de importar

### 2. Mapeamento de Colunas

- **Associar campos**: Vincule colunas da planilha aos campos do sistema
- **Campos obrigatorios**: Sistema indica o que e necessario
- **Valores padrao**: Defina valores para campos vazios

### 3. Processamento

- **Validacao**: Sistema verifica dados
- **Erros**: Lista problemas encontrados
- **Importacao**: Confirme para processar

## Como Usar

### Preparar Planilha

1. Baixe o modelo de importacao
2. Preencha os dados conforme o modelo
3. Nao altere a estrutura das colunas
4. Salve em formato suportado

### Importar Dados

1. Acesse "Importar Dados"
2. Selecione o tipo de importacao
3. Faca upload do arquivo
4. Visualize o preview dos dados
5. Mapeie as colunas se necessario
6. Clique em "Importar"

### Tratar Erros

1. Revise a lista de erros
2. Corrija os dados na planilha
3. Faca nova importacao
4. Ou pule registros com erro

## Modelo de Planilha - Produtos

| codigo_estoque | nome | quantidade | valor_unitario | deposito |
|---------------|------|------------|----------------|----------|
| PROD001 | Parafuso 1/4 | 100 | 0.50 | Central |
| PROD002 | Arruela lisa | 200 | 0.10 | Central |

## Dicas Operacionais

- **Modelo**: Sempre use o modelo fornecido
- **Backup**: Faca backup antes de importar
- **Teste**: Importe poucos registros primeiro
- **Revisao**: Confira os dados apos importacao

## Tratativas Comuns

### Erro de Formato

1. Verifique se o arquivo e xlsx ou csv
2. Confira a codificacao (UTF-8 recomendado)
3. Remova formatacoes especiais
4. Tente salvar em formato diferente

### Dados Duplicados

1. Sistema alerta sobre duplicados
2. Escolha atualizar ou ignorar
3. Ou remova duplicados da planilha
4. Importe novamente

### Campo Obrigatorio Vazio

1. Identifique quais campos faltam
2. Preencha na planilha original
3. Ou defina valor padrao no sistema
4. Reimporte os dados
