# Configuração do APEX Chat - Chave de API Groq

## O que mudou?

O APEX Chat agora busca a chave de API do Groq diretamente da coleção **"api_key"** no Firebase, em vez de usar variáveis de ambiente (.env). Isso oferece maior segurança, pois as chaves não ficam expostas em arquivos de configuração.

## Como configurar?

### 1. Usar a coleção "api_key" no Firebase

A coleção **"api_key"** já deve existir no seu Firebase Firestore conforme mostrado nas imagens:

1. Acesse seu [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá para **Firestore Database**
4. Você verá a coleção **"api_key"** já criada

### 2. Adicionar a chave de API do Groq

1. Na coleção **"api_key"**, selecione um documento existente ou crie um novo com **+ Add document**
2. Você pode deixar o ID como auto-gerado ou definir um ID personalizado
3. Adicione o seguinte campo:
   - **Campo**: `groq`
   - **Tipo**: String
   - **Valor**: Cole sua chave de API do Groq (comece com `gsk_`)

### 3. Obter sua chave de API do Groq

Se você ainda não tem uma chave de API do Groq:

1. Acesse [console.groq.com](https://console.groq.com)
2. Faça login ou crie uma conta
3. Vá para **API Keys**
4. Clique em **Create API Key**
5. Copie a chave gerada
6. Cole no Firebase conforme descrito acima

## Exemplo de documento no Firebase

```json
{
  "groq": "gsk_sua_chave_aqui_comeca_com_gsk"
}
```

## Segurança

✅ **Vantagens da nova abordagem:**
- A chave de API não fica armazenada em arquivos de código
- A chave fica protegida pelas regras de segurança do Firebase
- Facilita rotação e gerenciamento de chaves
- Nenhuma chave em variáveis de ambiente públicas

## Troubleshooting

### "Chave da API Groq não configurada"

Se você receber este erro, verifique:

1. ✓ A coleção **"api_key"** existe no Firebase
2. ✓ Existe um documento na coleção
3. ✓ O documento tem um campo chamado **"groq"**
4. ✓ O campo "groq" contém a chave de API válida (começa com `gsk_`)
5. ✓ Suas regras de segurança do Firebase permitem ler da coleção "api_key"

### Regras de Firestore recomendadas

Para maior segurança, adicione estas regras ao seu Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Apenas usuários autenticados podem ler a coleção api_key
    match /api_key/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == "seu_uid_admin_aqui";
    }
  }
}
```

## Suporte

Se tiver problemas, verifique:
- Console do navegador (F12) para mensagens de erro
- Logs do Firebase Console
- Validade da chave de API do Groq

---

**Última atualização**: 2026-03-22
**Versão**: 1.0
