# 🚀 Fastfy — API de Transcrição e Capítulos para Vídeos do YouTube

API construída com **Node.js + Fastify** para gerenciar vídeos do YouTube e gerar automaticamente, com **IA (Google Gemini)**, transcrições e capítulos a partir das legendas de cada vídeo — tudo processado de forma **assíncrona** através de filas **BullMQ**.

> Projeto de estudo (trilha Node.js da Rocketseat) que coloca em prática Clean Architecture, validação com Zod, autenticação JWT com refresh token, cache, filas de trabalho e testes automatizados.

---

## ✨ Funcionalidades

- 👤 **Autenticação completa** — cadastro, login, confirmação de conta, refresh token e logout;
- 🎬 **CRUD de vídeos** — cadastre vídeos apenas com a URL do YouTube (extraída e validada automaticamente);
- 📝 **Transcrição por IA** — reescreve as legendas em português (pt-BR), formatadas em parágrafos e seções;
- 📑 **Capítulos por IA** — agrupa o conteúdo por tópicos e retorna capítulos no formato `mm:ss - Título`;
- ⚙️ **Processamento assíncrono** — ao criar um vídeo, jobs de transcrição e capítulos são enfileirados e processados por workers;
- 🔒 **Autorização por papel** — rotas de escrita restritas a administradores;
- 🧠 **Agentes de IA (Mastra + AI SDK)** — agentes especialistas com ferramentas (tools) para buscar legendas do YouTube;
- 📚 **Documentação OpenAPI** — gerada automaticamente a partir dos schemas Zod, com UI interativa (Scalar);
- ✅ **Testes** — unitários, de integração e e2e com o runner nativo do Node.

---

## 🧰 Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 24 (+ TypeScript, ESM) |
| Framework HTTP | Fastify |
| Validação & Schemas | Zod + `@fastify/type-provider-zod` |
| ORM | Drizzle ORM + `drizzle-kit` |
| Banco de dados | PostgreSQL |
| Cache & Sessões | Redis (ioredis) |
| Filas | BullMQ (Redis) |
| IA | Google Gemini (via Mastra AI Agent e AI SDK) |
| Autenticação | JWT (access token) + refresh token em sessão |
| Docs | `@fastify/swagger` + `@scalar/fastify-api-reference` |
| Testes | Node Test Runner |

---

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture**, organizado em camadas por feature:

```
src/
├── app.ts                                  # Composição da aplicação (DI, plugins, rotas, erros)
├── server.ts                               # Bootstrap + workers + graceful shutdown
├── features/
│   ├── users/                              # Módulo de autenticação
│   ├── videos/                             # Módulo de vídeos
│   ├── transcriptions/                     # Geração de transcrições
│   └── chapters/                           # Geração de capítulos
└── modules/shared/
    ├── contracts/                          # Contratos (ex.: interface UseCase)
    ├── db/                                 # Conexão e schema do banco (Drizzle)
    ├── exceptions/                         # Exceções de domínio
    ├── lib/                                # Infra compartilhada (redis, queue, auth, youtube)
    ├── middlewares/                        # Autenticação (JWT + sessão)
    └── types/                              # Tipos globais do Fastify
```

Cada feature segue a mesma estrutura em camadas:

```
feature/
├── domain/                                 # Entidades e regras de negócio
├── application/                            # Use cases e DTOs
├── infrastructure/storage/                 # Implementações concretas (repositórios)
└── interfaces/http/                        # Rotas e handlers (Fastify)
```

Essa separação permite que as **dependências apontem para dentro**: o `interface/http` e o `infrastructure` dependem do `application`, que por sua vez depende do `domain`.

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org) 24+
- [Docker](https://www.docker.com) e Docker Compose (para Postgres e Redis)
- Uma **API key do Google Generative AI** ([console.cloud.google.com](https://console.cloud.google.com))

---

## 🚀 Como rodar

### 1. Subir as dependências (Postgres + Redis)

```bash
docker compose up -d
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Preencha no `.env`:

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexão com o Postgres | `postgresql://postgres:postgres@localhost:5432/videos` |
| `REDIS_URL` | URL de conexão com o Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Chave secreta para assinar os tokens | `minha-secret-super-secreta` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Chave da API do Google Gemini | *(sua chave)* |
| `GEMINI_TRANSCRIPTION_MODEL` | Modelo usado para transcrição | `gemini-3.6-flash` |
| `GEMINI_CHAPTERS_MODEL` | Modelo usado para capítulos | `gemini-3.6-flash` |

### 3. Instalar dependências, migrar o banco e rodar

```bash
npm install
npm run db:migrate
npm run dev
```

A API sobe em **http://localhost:3333** e a documentação interativa em **http://localhost:3333/docs**.

> ℹ️ Ao iniciar, o servidor também dispara os **workers** que consomem as filas de transcrição e capítulos — o processamento é totalmente assíncrono.

---

## 🔌 Endpoints

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/auth/sign-up` | Cria uma conta (gera token de confirmação) |
| `POST` | `/api/v1/auth/sign-in` | Autentica e retorna `token` + `refresh_token` |
| `POST` | `/api/v1/auth/confirm` | Ativa a conta com o token de confirmação |
| `POST` | `/api/v1/auth/refresh-token` | Renova o token de acesso |
| `POST` | `/api/v1/auth/sign-out` | Encerra a sessão ativa |

### Vídeos

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/videos` | Cria um vídeo a partir da URL e enfileira os jobs de IA |
| `GET` | `/api/v1/videos` | Lista todos os vídeos |
| `GET` | `/api/v1/videos/:id` | Busca um vídeo por id (com cache em Redis) |

### Transcrições

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/videos/:id/transcriptions` | Gera a transcrição de um vídeo |
| `GET` | `/api/v1/videos/:id/transcriptions` | Consulta a transcrição |
| `DELETE` | `/api/v1/videos/:id/transcriptions` | Remove a transcrição |

### Capítulos

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/videos/:id/chapters` | Gera os capítulos de um vídeo |
| `GET` | `/api/v1/videos/:id/chapters` | Consulta os capítulos |
| `DELETE` | `/api/v1/videos/:id/chapters` | Remove os capítulos |

> 🔒 Criações/edições exigem `Authorization: Bearer <token>` e permissões de **admin**.

---

## 🧪 Testes

Os testes usam o **runner nativo do Node** e o banco de dados real do Postgres.

```bash
npm test                 # Todos os testes
npm run test:unit        # Somente unitários
npm run test:integration # Somente integração
npm run test:e2e         # Somente e2e
npm run test:coverage    # Com report de cobertura
```

> ⚠️ Os testes de integração/e2e exigem o Postgres e o Redis em execução (veja o passo 1 de instalação).

---

## 📦 Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Sobe o servidor em modo watch (tsx) |
| `npm run build` | Build de produção (esbuild → `dist/`) |
| `npm start` | Executa o build de produção |
| `npm run typecheck` | Checagem de tipos (tsc) |
| `npm run db:generate` | Gera novas migrations (drizzle) |
| `npm run db:migrate` | Aplica as migrations |
| `npm run db:studio` | Abre o Drizzle Studio |

---

## 🛠️ Roadmap de ideias

- [ ] Envio de e-mail real para confirmação de conta
- [ ] Upload e procesamento de vídeos próprios (não apenas YouTube)
- [ ] Paginação na listagem de vídeos
- [ ] Resumo do vídeo além de transcrição/capítulos
- [ ] Fila com filas separadas por prioridade e retry

---

## 📄 Licença

Projeto com fins educacionais. Sinta-se à vontade para estudar, usar e evoluir.