# Devolução de Materiais

## Visão Geral
A página **Devolução de Materiais** permite registrar e processar devoluções de itens que foram retirados do estoque mas não foram utilizados, danificados ou precisam ser devolvidos por outro motivo.

## Para Quem é Esta Página?
- Operadores e técnicos que precisam devolver material
- Supervisores que autorizam devoluções
- Pessoal de recepção/almoxarifado
- Pessoal de controle de estoque

## Como Funciona o Fluxo

### 1. Abrir Requisição de Devolução
1. Acesse **Devolução de Materiais** no menu
2. Clique em **Nova Devolução**
3. O sistema exibirá suas requisições abertas
4. Selecione a requisição que contém o material a devolver

### 2. Selecionar Materiais a Devolver
Na tela de devolução:
- **Listar itens**: Mostra todos os itens da requisição
- **Selecionar itens**: Marque os itens que quer devolver
- **Quantidade**: Indique quantos itens estão sendo devolvidos
- **Motivo**: Escolha o motivo da devolução

### 3. Informar Motivo da Devolução
Selecione uma das opções:
- **Não utilizado**: Material saiu mas não foi usado
- **Quantidade errada**: Recebeu mais do que pediu
- **Defeituoso**: Veio com defeito
- **Não conforme**: Não atende à especificação
- **Projeto cancelado**: Projeto foi cancelado
- **Outro**: Digite o motivo específico

### 4. Adicionar Observações
Campo livre para detalhar:
- Condição do material
- Por que está sendo devolvido
- Qualquer informação adicional
- Quem recebeu na devolução

### 5. Confirmar e Enviar
1. Revise os dados informados
2. Clique em **Confirmar Devolução**
3. O material volta ao estoque
4. Você receberá confirmação por email

## O que Acontece Depois

### Na Requisição Original
- A requisição é parcialmente cancelada (somente itens devolvidos)
- Se devolveu tudo: A requisição fica como cancelada
- Se devolveu parte: A requisição mantém os itens não devolvidos

### No Estoque
- O material retorna à quantidade original
- Fica disponível para outras requisições
- Se estava com defeito: Pode ser marcado como sucata
- Controlador de estoque recebe notificação

### Na Sua Conta
- Você pode consultar histórico de devoluções
- Status aparece no acompanhamento de requisições

## Principais Campos

| Campo | O que é | Obrigatório |
|-------|---------|-----------|
| Requisição Original | Qual requisição está devolvendo | Sim |
| Item | Código/nome do material | Sim |
| Quantidade | Quantos itens estão devolvendo | Sim |
| Motivo | Por que está devolvendo | Sim |
| Observações | Detalhes adicionais | Não |
| Recebido por | Quem recebeu a devolução | Recomendado |

## Dicas e Boas Práticas

### Para Operadores
- **Devolver rápido**: Quanto antes devolver, melhor para o controle
- **Manter em bom estado**: Material em bom estado pode ser reutilizado
- **Motivo preciso**: Detalhe bem o motivo para controle
- **Observações**: Se houver defeito, descreva bem

### Para Supervisores
- **Autorizar**: Revise as devoluções da equipe
- **Auditar**: Verifique se o motivo está correto
- **Acompanhar**: Monitore devoluções frequentes (pode indicar problema)

### Para Almoxarifado
- **Receber**: Confirme o recebimento fisicamente
- **Conferir**: Valide quantidade e condição
- **Registrar**: Use o campo "Recebido por"
- **Documentar**: Se o material está danificado, tire fotos

## Tratativas Operacionais

### Material Devolvido em Mau Estado
**Problema**: Produto devolvido danificado
**Solução**:
1. Não aceite no estoque normal
2. Registre como "Danificado"
3. Direcione para área de avaria
4. Analise possibilidade de reparo
5. Se irrecuperável, de baixa por perda

### Quantidade Diferente da Requisição
**Problema**: Devolvendo mais do que retirou
**Solução**:
1. Verifique a requisição original
2. Se realmente há excedente, investigue
3. Pode ser de outra requisição
4. Registre a diferença para análise

### Produto Sem Identificação
**Problema**: Material sem código
**Solução**:
1. Tente identificar pelo produto
2. Consulte com quem devolveu
3. Se identificar, registre normalmente
4. Se não identificar, registre separado

### Requisição Não Encontrada
**Problema**: Não acha a requisição de origem
**Solução**:
1. Busque por diferentes filtros
2. Consulte com o solicitante
3. Se não encontrar, registre sem vínculo
4. Documente nas observações

## Integração com Outras Páginas

- **Requisições** (/requisicoes): Veja requisições abertas
- **Produtos** (/produtos): Consulte dados do material
- **Relatórios** (/relatorios): Veja estatísticas de devoluções
- **Carrinho** (/carrinho): Prepare uma devolução em lotes

## Próximos Passos
- Se está com material para devolver: Use esta página
- Se precisa requisitar novo material: Vá para /requisicoes
- Para consultar estoque: Vá para /produtos

