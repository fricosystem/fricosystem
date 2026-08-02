# Setores: árvore de nós até a última peça + vida útil e responsividade

## Objetivo
Na página `/setores`, ao selecionar um setor e uma máquina, abrir o mapa/diagrama em nós expansíveis (Setor → Máquina → Sistema → Peça → Sub-peça) até o último componente cadastrado, exibindo vida útil e risco de parada por falta de estoque, usando os dados reais já existentes no Firestore. Nada é removido: tudo é adicionado ao lado do que já funciona.

## Fonte de dados (coleções reais já usadas no sistema)
- `equipamentos` — setor, máquina e o array aninhado `sistemas[].pecas[].subPecas[]` (x, y, status, vidaUtil, vidaUtilRestante, ultimaManutencao, proximaManutencao, emEstoque, estoqueMinimo, codigo, fornecedor, valorUnitario).
- `produtos` — estoque real do almoxarifado, cruzado por `codigo` da peça (fallback: nome normalizado).
- `tarefas_manutencao` + `historico_execucoes` — próxima preventiva e última execução real por componente.
- `paradas_maquina` e `ordens_servicos` — histórico de parada/OS aberta por máquina/peça.
Nenhuma coleção nova é criada; nenhum valor mockado é usado.

## Etapas

### 1. Camada de dados (novos hooks, sem tocar nos existentes)
- `src/hooks/useArvoreSetor.ts`: monta a árvore Setor → Máquinas → Sistemas → Peças → Sub-peças a partir de `equipamentos`, com contagem de nós e propagação de status do filho mais crítico para o pai.
- `src/hooks/useEstoquePecas.ts`: indexa `produtos` por código/nome e devolve a quantidade real disponível para cada peça/sub-peça, com `estoqueMinimo` do cadastro.
- `src/utils/vidaUtilPeca.ts`: funções puras de cálculo — percentual de vida útil restante, dias até a próxima preventiva, e nível de risco de parada combinando vida útil + cobertura de estoque (Crítico / Atenção / Normal). Sem estado, testável.

### 2. Árvore de nós no diagrama
- Novo componente `src/components/Setores/ArvoreComponentes.tsx`: nós expansíveis/recolhíveis com indentação por nível, badge de status, barra de vida útil e chip de estoque (`emEstoque/estoqueMinimo`). Expansão em cascata até a última sub-peça cadastrada, com "Expandir tudo"/"Recolher tudo" e busca por nome/código.
- `src/components/Setores/NoComponente.tsx`: item recursivo da árvore (renderiza a si mesmo para os filhos), com clique abrindo o modal de detalhes existente.
- Integração no `MaquinaDetalhes`: o diagrama SVG atual permanece intacto; a árvore entra como uma segunda visão ("Diagrama" / "Árvore") controlada por um toggle, e no mobile a árvore vira a visão padrão porque o SVG de 900px não cabe.
- Clique em um nó da árvore seleciona o mesmo sistema/peça no diagrama (estado compartilhado), preservando todos os handlers atuais.

### 3. Vida útil e prevenção de parada
- Cada nó exibe: % de vida útil restante (barra colorida), data da próxima manutenção e dias restantes, estoque atual vs. mínimo.
- Regra de risco (em `vidaUtilPeca.ts`): peça com vida útil restante abaixo do limite **e** estoque abaixo do mínimo é marcada como "Risco de parada" com destaque visual e é somada em um painel-resumo no topo do setor/máquina (total de peças, críticas, sem estoque, preventivas vencendo em 30 dias).
- O resumo reaproveita os cálculos já existentes de `pecasStats`, sem duplicar lógica de negócio.

### 4. Responsividade (tablet e mobile)
- `/setores`: container `p-4 sm:p-6`, cabeçalho empilhando em coluna no mobile, botão "Adicionar Setor" em largura total abaixo do título, títulos `text-2xl sm:text-3xl`, busca em largura total.
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` nos cards de setor e no resumo de estatísticas.
- Diagrama: altura responsiva (`h-[60vh] sm:h-[600px]`), controles de zoom e camadas com quebra de linha e rolagem horizontal, toolbar compacta no mobile.
- Modais: `w-[95vw] max-w-[…] max-h-[90vh] overflow-y-auto`, rodapés com botões empilhados no mobile — aplicado aos modais de setor, peça, sub-peça, sistema, manutenção e métrica.
- Textos e tabelas com truncamento e `text-sm sm:text-base`, sem estouro horizontal em 360px.

### 5. Verificação
- Typecheck do projeto.
- Testes no navegador em 390px (mobile), 820px (tablet) e desktop: abrir setor, expandir a árvore até a sub-peça, abrir modais, conferir ausência de scroll horizontal e de erros de console.

## Detalhes técnicos
- Sem alteração de schema, de regras do Firestore ou de rotas existentes.
- Nenhum componente ou funcionalidade atual é removido — o diagrama SVG, filtros de camada, abas e modais continuam como estão.
- Cores e espaçamentos usam os tokens semânticos já definidos em `index.css` (nada de cores fixas).
- Cruzamento peça↔produto é tolerante a falha: se não houver correspondência em `produtos`, o valor de `emEstoque` do próprio cadastro da peça é usado.
