# Transferencia

## Visao Geral
A pagina de Transferencia permite movimentar produtos entre unidades ou filiais da empresa. Gerencia o envio e recebimento de materiais, mantendo o controle de estoque em cada localidade.

## Rota
`/transferencia`

## Funcionalidades

### Tipos de Transferencia
- **Entre unidades**: De uma filial para outra
- **Entre almoxarifados**: Dentro da mesma unidade
- **Para producao**: Envio para area produtiva
- **Devolucao**: Retorno a unidade de origem

### Processo de Transferencia
- Criacao da transferencia (origem)
- Separacao dos itens
- Envio (saida do estoque origem)
- Recebimento (entrada no destino)
- Conferencia e finalizacao

### Status da Transferencia
- **Rascunho**: Em criacao, nao enviada
- **Pendente**: Aguardando separacao
- **Em Transito**: Enviada, aguardando recebimento
- **Recebida**: Conferida e finalizada
- **Cancelada**: Cancelada antes do envio

### Acoes Disponiveis
- **Criar transferencia**: Iniciar nova movimentacao
- **Separar itens**: Preparar para envio
- **Confirmar envio**: Registrar saida
- **Receber**: Confirmar chegada e conferir
- **Imprimir**: Gerar documento de transferencia

## Como Usar (Passo a Passo)

### Criar Nova Transferencia
1. Clique em "Nova Transferencia"
2. Selecione a unidade de destino
3. Adicione os produtos a transferir
4. Informe as quantidades
5. Adicione observacoes
6. Salve como rascunho ou envie

### Separar e Enviar
1. Acesse a transferencia pendente
2. Separe fisicamente os itens
3. Confira as quantidades
4. Clique em "Confirmar Envio"
5. Imprima o documento se necessario
6. Envie junto com a mercadoria

### Receber Transferencia
1. Acesse transferencias "Em Transito"
2. Localize a transferencia recebida
3. Confira os itens fisicamente
4. Registre as quantidades recebidas
5. Informe divergencias se houver
6. Confirme o recebimento

### Tratar Divergencia no Recebimento
1. Registre a quantidade realmente recebida
2. Informe o tipo de divergencia
3. Documente com fotos se necessario
4. A diferenca sera analisada
5. Ajustes serao feitos conforme apuracao

## Tratativas Operacionais

### Situacao 1: Produto chegou danificado
**Problema**: Material recebido com avarias
**Solucao**:
1. Nao aceite os itens danificados
2. Registre a divergencia no recebimento
3. Tire fotos dos danos
4. Informe a unidade de origem
5. Solicite reenvio ou credito

### Situacao 2: Quantidade diferente do enviado
**Problema**: Recebeu mais ou menos que o informado
**Solucao**:
1. Registre a quantidade real recebida
2. Documente a divergencia
3. A diferenca ficara como pendencia
4. Unidade de origem deve verificar
5. Ajuste sera feito apos apuracao

### Situacao 3: Transferencia atrasada
**Problema**: Material nao chegou no prazo
**Solucao**:
1. Consulte o status no sistema
2. Entre em contato com unidade de origem
3. Verifique se foi realmente enviado
4. Rastreie se houver transportadora
5. Solicite reenvio se necessario

### Situacao 4: Preciso devolver material
**Problema**: Recebi material que nao precisava
**Solucao**:
1. Crie nova transferencia de retorno
2. Informe o motivo da devolucao
3. Aguarde aprovacao se necessario
4. Envie de volta a origem
5. Acompanhe o recebimento

## Dicas e Boas Praticas
- Confira os itens antes de enviar
- Embale adequadamente para transporte
- Documente com fotos se necessario
- Imprima documento para acompanhar
- Comunique o destino sobre o envio
- Confira imediatamente ao receber

## Permissoes Necessarias
- **Criar transferencia**: Gestores de estoque
- **Enviar**: Estoquistas e conferentes
- **Receber**: Estoquistas da unidade destino
- **Cancelar**: Gestores

## Relacionamentos
- **Produtos**: Itens sendo transferidos
- **Unidades**: Origem e destino
- **Entrada Manual**: Entrada por transferencia
- **Relatorios**: Movimentacoes entre unidades
