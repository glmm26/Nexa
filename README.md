# Nexa Online

Loja de roupas online com frontend em React, backend em Node.js + Express, banco local em SQLite e autenticacao por OTP com envio de email pela API da Brevo.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Banco de dados: SQLite
- Sessao: `express-session` + `connect-sqlite3`
- Seguranca: `bcrypt`, rate limit nas rotas de autenticacao e OTP com expiracao curta

## Estrutura

```text
.
|-- controllers/
|-- database/
|-- middleware/
|-- public/
|   `-- assets/
|-- routes/
|-- services/
|-- src/
|   |-- components/
|   |-- context/
|   |-- hooks/
|   |-- pages/
|   |-- services/
|   `-- styles/
|-- utils/
|-- index.html
|-- package.json
|-- server.js
`-- vite.config.mjs
```

## Como executar

1. Instale as dependencias:

```bash
npm install
```

2. Configure o ambiente:

```bash
copy .env.example .env
```

Use este formato no `.env`:

```text
PORT=3000
EMAIL_PROVIDER=api
EMAIL_API_URL=https://api.brevo.com/v3/smtp/email
EMAIL_API_KEY=COLOQUE_SUA_CHAVE_BREVO_AQUI
EMAIL_API_SENDER_EMAIL=seu-email-remetente@dominio.com
EMAIL_API_SENDER_NAME=Gestao de Gastos
```

Para testes locais sem envio real, voce pode trocar para:

```text
EMAIL_PROVIDER=console
```

3. Inicie a aplicacao:

```bash
npm start
```

Se preferir rodar apenas o backend com:

```bash
node server.js
```

o servidor agora gera a pasta `dist/` automaticamente na primeira subida quando o build do frontend ainda nao existir.

4. Acesse:

```text
http://localhost:3000
```

## OTP com Brevo

- O cadastro gera um OTP de 6 digitos
- O codigo expira em 5 minutos
- O login so e liberado apos verificacao
- O reenvio de OTP usa o mesmo fluxo de email

Quando `EMAIL_PROVIDER=api`, o backend envia o email pela API transacional da Brevo. Quando `EMAIL_PROVIDER=console`, o codigo aparece no console do servidor para testes locais.

## Banco local

O SQLite e criado automaticamente em:

```text
database/store.db
```

Na primeira inicializacao, as tabelas sao criadas automaticamente e o catalogo inicial e populado.
