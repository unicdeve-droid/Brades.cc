# Checkout mascarado — Next.js + Neon + ImageKit

Site de checkout mobile com campos formatados (máscara definida pelo admin),
painel administrativo, rate limit configurável, upload de logo via ImageKit
e armazenamento das respostas no Postgres (Neon).

## Como funciona o formato dos campos

No painel admin, cada campo tem um "formato" onde `x` = uma posição digitável
e qualquer outro caractere = separador fixo exibido automaticamente.

Exemplo: `xxxx xxxx xxx x` → o usuário digita só os `x`, e os espaços
aparecem sozinhos enquanto ele digita (12 caracteres no total). Funciona
para qualquer padrão: `xxx.xxx.xxx-xx`, `xxxx-xxxx-xxxx-xxxx`, etc.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com suas credenciais
npm run dev
```

- Site público: `http://localhost:3000`
- Painel admin: `http://localhost:3000/admin`

As tabelas do banco são criadas automaticamente na primeira requisição
(não precisa rodar `schema.sql` manualmente — ele está aí só de referência).

## Variáveis de ambiente necessárias

| Variável | Onde conseguir |
|---|---|
| `DATABASE_URL` | Painel do [Neon](https://neon.tech) → sua project → Connection string (use a que já vem com `sslmode=require`) |
| `ADMIN_PASSWORD` | Você escolhe — senha de acesso ao `/admin` |
| `ADMIN_JWT_SECRET` | Uma string aleatória longa, ex: `openssl rand -hex 32` |
| `IMAGEKIT_PUBLIC_KEY` | Painel do [ImageKit](https://imagekit.io) → Developer options |
| `IMAGEKIT_PRIVATE_KEY` | Idem (mantenha em segredo, só server-side) |
| `IMAGEKIT_URL_ENDPOINT` | Idem, algo como `https://ik.imagekit.io/seu_id` |

## Deploy na Vercel

1. Suba esta pasta para um repositório no GitHub.
2. Na Vercel: **New Project** → importe o repositório.
3. Em **Environment Variables**, adicione as 5 variáveis da tabela acima.
4. Deploy. Pronto — o app cria as tabelas sozinho no primeiro acesso.

## Estrutura

```
app/
  page.tsx                 → checkout público (mobile)
  aprovado/page.tsx         → tela de sucesso pós-envio
  admin/page.tsx            → login do admin
  admin/dashboard/page.tsx  → painel (config + envios recebidos)
  api/config/route.ts       → config pública (somente leitura)
  api/submit/route.ts       → recebe o formulário (com rate limit)
  api/admin/*               → rotas protegidas do painel
lib/
  mask.ts        → lógica de máscara/formatação dos campos
  db.ts          → conexão Neon + leitura/gravação da config
  ratelimit.ts   → rate limit configurável por IP
  auth.ts        → sessão do admin (cookie httpOnly + JWT)
  imagekit.ts    → cliente do ImageKit (upload da logo)
middleware.ts    → protege /admin/dashboard e /api/admin/*
```

## O que dá para editar pelo painel admin

- Logo (upload direto para o ImageKit)
- Título principal
- Rótulo e formato de cada um dos 3 campos (principal + 2 menores)
- Textos livres sem limite de caracteres (quantos quiser, adicionar/remover)
- Texto do rodapé
- Título e mensagem da tela de "Aprovado"
- Rate limit (quantos envios e em qual janela de tempo, por IP)

## Segurança / próximos passos sugeridos

- Troque `ADMIN_PASSWORD` e `ADMIN_JWT_SECRET` antes de ir pra produção.
- O rate limit atual é por IP e guardado no banco (funciona bem em serverless,
  mas para volumes muito altos considere Upstash Redis).
- Os dados enviados pelos usuários ficam na tabela `submissions` — acesse
  pela aba "Envios recebidos" no painel.
