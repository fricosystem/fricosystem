# Manuais

## Visao Geral
A pagina de Manuais e o repositorio central de documentacao tecnica da empresa. Permite armazenar, organizar e consultar manuais de equipamentos, procedimentos operacionais e documentos tecnicos.

## Rota
`/manuais`

## Funcionalidades

### Biblioteca de Documentos
- **Listagem**: Todos os manuais cadastrados
- **Busca**: Por titulo, equipamento, categoria
- **Filtros**: Por tipo, maquina, setor
- **Visualizacao**: Abrir documento online

### Tipos de Documentos
- Manuais de operacao
- Manuais de manutencao
- Procedimentos operacionais (POP)
- Fichas tecnicas
- Desenhos e esquemas
- Instrucoes de trabalho

### Gestao de Arquivos
- Upload de PDFs e imagens
- Versionamento de documentos
- Vinculo com equipamentos
- Controle de validade

## Como Usar (Passo a Passo)

### Buscar um Manual
1. Use a barra de busca
2. Digite o nome do equipamento ou assunto
3. Veja os resultados encontrados
4. Clique para abrir o documento

### Adicionar Novo Manual
1. Clique em "Novo Manual"
2. Selecione o tipo de documento
3. Informe titulo e descricao
4. Vincule ao equipamento se aplicavel
5. Faca upload do arquivo
6. Salve o cadastro

### Vincular Manual a Maquina
1. Acesse o manual cadastrado
2. Clique em "Vincular Equipamento"
3. Busque e selecione a maquina
4. Confirme a vinculacao
5. O manual aparecera na ficha da maquina

### Atualizar Versao do Manual
1. Acesse o manual existente
2. Clique em "Nova Versao"
3. Faca upload do arquivo atualizado
4. Informe o que mudou
5. A versao anterior fica no historico

## Tratativas Operacionais

### Situacao 1: Manual nao encontrado
**Problema**: Precisa do manual mas nao acha no sistema
**Solucao**:
1. Tente buscar por termos diferentes
2. Verifique se esta vinculado a maquina
3. Consulte o fabricante do equipamento
4. Solicite ao setor de engenharia

### Situacao 2: Manual desatualizado
**Problema**: Documento com informacoes antigas
**Solucao**:
1. Verifique se ha versao mais recente
2. Consulte o fabricante
3. Se obtiver nova versao, faca upload
4. Mantenha versao antiga como historico

### Situacao 3: Arquivo nao abre
**Problema**: PDF corrompido ou formato incompativel
**Solucao**:
1. Tente baixar novamente
2. Abra em outro navegador
3. Solicite novo arquivo ao cadastrador
4. Converta para formato compativel

### Situacao 4: Preciso de manual especifico
**Problema**: Manual de procedimento nao existe
**Solucao**:
1. Solicite criacao ao setor responsavel
2. Documente o procedimento necessario
3. Apos criado, faca upload no sistema
4. Vincule aos setores pertinentes

## Dicas e Boas Praticas
- Mantenha manuais sempre atualizados
- Vincule aos equipamentos corretos
- Use nomes descritivos nos arquivos
- Organize por categorias logicas
- Revise periodicamente a validade
- Digitalize documentos fisicos importantes

## Permissoes Necessarias
- **Visualizar**: Todos os usuarios
- **Adicionar/Editar**: Gestores e engenharia
- **Excluir**: Administradores
- **Download**: Todos com acesso

## Relacionamentos
- **Maquinas**: Manuais vinculados
- **Manutencao**: Referencia para procedimentos
- **Setores**: Documentos por area
