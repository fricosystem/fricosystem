
# Correção do Campo Unidade na Baixa Requisição

## Problema Identificado
Na página **Baixa Requisição**, o campo `unidade` enviado ao Firestore está sendo preenchido incorretamente com o **nome do usuário autenticado** ao invés da **unidade da empresa**.

**Código atual (linha 316):**
```typescript
unidade: userName,
```

## Solução

Alterar o campo `unidade` para usar o valor `userData?.unidade`, que contém a unidade da empresa associada ao usuário autenticado.

**Código corrigido:**
```typescript
unidade: userData?.unidade || "",
```

## O que será alterado

### Arquivo: `src/pages/BaixaRequisicao.tsx`

Modificar a **linha 316** para enviar a unidade correta da empresa:

| Campo | Antes | Depois |
|-------|-------|--------|
| `unidade` | `userName` (nome do usuário) | `userData?.unidade` (unidade da empresa) |

## Resultado Esperado

Após a alteração, quando um usuário realizar uma baixa de requisição, o documento salvo no Firestore (collection `relatorios`) terá o campo `unidade` preenchido com a unidade da empresa do usuário, não mais com o nome do usuário.

---

## Detalhes Técnicos

O `userData` já é obtido do contexto de autenticação na linha 55:
```typescript
const { user, userData } = useAuth();
```

E a interface `UserData` no `AuthContext.tsx` já define o campo `unidade`:
```typescript
interface UserData {
  // ... outros campos
  unidade: string;
  // ...
}
```

Portanto, basta substituir `userName` por `userData?.unidade || ""` na linha 316 para corrigir o problema.
