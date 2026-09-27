# Portal de Empreendimentos

Plataforma interna para a construtora: cada empreendimento tem seus próprios documentos
(Manual do Síndico, manuais técnicos, garantias, procedimentos, manutenção, documentação do
condomínio etc.) e um chat com IA que responde **exclusivamente** com base nos documentos
daquele empreendimento (RAG com OpenAI).

## Stack

- **Next.js 16** (App Router, Route Handlers, Server Actions)
- **Prisma 7** + **PostgreSQL** (Supabase) com **pgvector** para busca por similaridade
- **Supabase Storage** para os arquivos originais
- **OpenAI** — `text-embedding-3-small` para embeddings e `gpt-4o-mini` para o chat
- Autenticação simples por sessão (cookie httpOnly + JWT), sem cadastro de usuários (uso interno)

## Configuração inicial

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → Database**, copie a connection string do **Transaction pooler**
   (porta 6543) para `DATABASE_URL` e a **Direct connection** (porta 5432) para `DIRECT_URL`.
3. Em **Project Settings → API**, copie **Project URL** para `SUPABASE_URL` e a
   **service_role key** para `SUPABASE_SERVICE_ROLE_KEY`.
4. Em **Storage**, crie um bucket **privado** chamado `documentos`.

### 2. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores (Supabase, `OPENAI_API_KEY`, e um
`SESSION_SECRET` aleatório — gere com `openssl rand -base64 32`).

### 3. Banco de dados

```bash
npm install
npm run db:setup   # habilita a extensão pgvector e cria as tabelas
npm run db:seed     # cria o usuário administrador (usa ADMIN_EMAIL/ADMIN_PASSWORD do .env)
```

### 4. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:3000` e entre com o email/senha definidos em `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

## Deploy (Vercel)

1. Suba o repositório para o GitHub e importe o projeto na [Vercel](https://vercel.com).
2. Configure as mesmas variáveis de ambiente do `.env` no painel da Vercel
   (Settings → Environment Variables).
3. Rode `npm run db:setup` e `npm run db:seed` uma vez (localmente, apontando para o banco do
   Supabase de produção) antes do primeiro deploy — ou após, contra a mesma `DATABASE_URL`.
4. Deploy automático a cada push na branch principal.

> Uploads de documentos muito grandes podem exigir aumentar `maxDuration` das rotas de API
> (`src/app/api/.../route.ts`) e, em planos gratuitos da Vercel, isso é limitado a 60s.

## Estrutura

- `prisma/schema.prisma` — modelos (Empreendimento, Documento, Chunk, Mensagem, User)
- `src/lib/rag.ts` — chunking, geração de embeddings e busca por similaridade (pgvector)
- `src/lib/chat.ts` — monta o prompt RAG e chama o modelo de chat
- `src/app/api/empreendimentos/[id]/documentos` — upload e processamento de documentos
- `src/app/api/empreendimentos/[id]/chat` — endpoint do chat
- `src/app/empreendimentos/[id]` — página do empreendimento (abas Chat / Documentos)

## Segurança

- Todas as rotas de `/dashboard` e `/empreendimentos` exigem sessão válida (ver `src/proxy.ts`
  e `src/lib/dal.ts`).
- Arquivos ficam em um bucket **privado** do Supabase Storage; nunca são expostos publicamente.
- Não há autoatendimento de cadastro — usuários são criados via `npm run db:seed` ou diretamente
  no banco.
