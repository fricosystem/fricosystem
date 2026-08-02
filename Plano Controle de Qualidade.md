# 📊 Plano de Controle de Qualidade: Finalização e Refinamento
*Foco: Dados Reais, Conformidade e Padronização Visual Industrial.*

### 🚀 Etapa 8: Refinamento Produtivo e UI Mestre
*Objetivo: Eliminar placeholders e unificar a experiência visual com a identidade APEX HUB.*

#### 1. Limpeza de Dados Fictícios (Purge Mock Data)
*   **Ação**: Revisar todas as páginas da categoria CQ (`CadastrosCQ.tsx`, `PlanilhasCQ.tsx`, `ExecucaoCQ.tsx`, `MelhoriaContinuaCQ.tsx`, `RastreabilidadeCQ.tsx`, `RelatoriosCQ.tsx`).
*   **Critério**: Remover arrays de exemplo (ex: `const [users, setUsers] = useState([...])` com nomes genéricos).
*   **Implementação**: Garantir que o estado inicial seja `[]` e que todos os dados venham exclusivamente das coleções Firestore via `CQService`.

#### 2. Padronização de Fontes e Tipografia (UI Industrial)
*   **Ação**: Atualizar os estilos CSS de títulos e labels.
*   **Identidade**: Aplicar a fonte padrão do sistema (Roboto/Poppins) com pesos específicos conforme a imagem de referência.
*   **Estilo**: Utilizar `font-family: 'Poppins', sans-serif;` ou `'Roboto', sans-serif;` com `font-weight: 700` ou `800` para títulos de seção, garantindo o visual "premium" e legível para ambientes industriais.
*   **Contraste**: Manter o fundo escuro com textos em alto contraste (Branco/Cyan) para facilitar a leitura em dispositivos móveis.

#### 3. Validação de Fluxo de Dados
*   **Integridade**: Verificar se todas as telas estão capturando corretamente o `user.uid` e `timestamp` real do servidor Firebase.
*   **Performance**: Validar o carregamento assíncrono para evitar telas em branco durante a busca de dados reais.

---

> [!IMPORTANT]
> **Conformidade MAPA/ISO**: Ao remover os dados fictícios, o sistema deve estar pronto para auditorias reais. Nenhum dado de teste deve permanecer em produção.

---

### 🛠️ Lista de Arquivos para Revisão:
- [x] `src/pages/CQ/CadastrosCQ.tsx`
- [x] `src/pages/CQ/PlanilhasCQ.tsx`
- [x] `src/pages/CQ/ExecucaoCQ.tsx`
- [x] `src/pages/CQ/MelhoriaContinuaCQ.tsx`
- [x] `src/pages/CQ/RastreabilidadeCQ.tsx`
- [x] `src/pages/CQ/RelatoriosCQ.tsx`
- [x] `src/pages/CQ/AgendamentoCQ.tsx` (Módulo integrado em RelatoriosCQ)
