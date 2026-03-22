# Notas Fiscais - Entrada XML

## Visao Geral
A pagina de Notas Fiscais permite importar e processar arquivos XML de notas fiscais de entrada. Automatiza o lancamento de produtos no estoque a partir do arquivo eletronico da nota.

## Rota
`/notas-fiscais`

## Funcionalidades

### Importacao de XML
- **Upload de arquivo**: Carregar XML da NF-e
- **Leitura automatica**: Extrai dados do XML
- **Validacao**: Verifica integridade do arquivo
- **Vinculacao**: Associa produtos da NF ao cadastro

### Informacoes Extraidas
- Dados do fornecedor (CNPJ, razao social)
- Numero e serie da nota
- Data de emissao
- Produtos (codigo, descricao, quantidade, valor)
- Impostos e valores totais
- Chave de acesso

### Processo de Entrada
- Upload do arquivo XML
- Leitura e validacao
- Vinculacao de produtos
- Conferencia fisica
- Confirmacao da entrada

### Acoes Disponiveis
- **Importar XML**: Carregar novo arquivo
- **Vincular produto**: Associar item da NF ao cadastro
- **Criar produto**: Cadastrar item novo
- **Confirmar entrada**: Dar entrada no estoque
- **Consultar historico**: Ver NFs processadas

## Como Usar (Passo a Passo)

### Importar Nota Fiscal
1. Clique em "Importar XML"
2. Selecione o arquivo XML da nota
3. Aguarde o processamento
4. Revise os dados extraidos
5. Verifique se o fornecedor esta correto

### Vincular Produtos
1. Para cada item da nota, vincule ao cadastro
2. Busque o produto pelo codigo ou descricao
3. Se nao encontrar, crie novo cadastro
4. Confirme as unidades de medida
5. Verifique os valores

### Dar Entrada no Estoque
1. Apos vincular todos os produtos
2. Confira as quantidades com o fisico
3. Informe lotes e validades se aplicavel
4. Selecione a localizacao de armazenagem
5. Confirme a entrada
6. Os produtos entram no estoque

### Tratar Divergencia Fisica
1. Se quantidade fisica diferir da nota
2. Registre a quantidade real recebida
3. Informe o tipo de divergencia
4. Documente o motivo
5. Trate com o fornecedor depois

## Tratativas Operacionais

### Situacao 1: XML invalido ou corrompido
**Problema**: Arquivo nao pode ser lido
**Solucao**:
1. Solicite novo XML ao fornecedor
2. Verifique se baixou corretamente
3. Tente outro navegador ou computador
4. Se persistir, faca entrada manual

### Situacao 2: Produto da NF nao existe no cadastro
**Problema**: Item nunca foi comprado antes
**Solucao**:
1. Clique em "Criar Produto"
2. Preencha os dados do cadastro
3. Defina categoria e localizacao
4. Salve e continue a vinculacao
5. O produto sera criado automaticamente

### Situacao 3: Quantidade da NF diferente do fisico
**Problema**: Recebeu mais ou menos que o faturado
**Solucao**:
1. Registre a quantidade real recebida
2. Documente a divergencia
3. Informe ao financeiro sobre a diferenca
4. Negocie credito ou complemento com fornecedor

### Situacao 4: Fornecedor nao cadastrado
**Problema**: CNPJ da nota nao existe no sistema
**Solucao**:
1. O sistema pode criar automaticamente
2. Ou cadastre manualmente antes
3. Informe os dados basicos
4. Complete o cadastro depois

## Dicas e Boas Praticas
- Importe a NF antes do recebimento fisico
- Confira os produtos na chegada
- Mantenha cadastros de produtos atualizados
- Vincule corretamente para evitar duplicatas
- Guarde os XMLs em backup
- Processe as notas no mesmo dia

## Permissoes Necessarias
- **Importar XML**: Estoquistas e conferentes
- **Vincular produtos**: Estoquistas
- **Criar produto**: Gestores de estoque
- **Confirmar entrada**: Conferentes

## Relacionamentos
- **Produtos**: Itens sendo importados
- **Fornecedores**: Emitente da nota
- **Estoque**: Entrada dos materiais
- **NF Lancamento**: Dados fiscais
