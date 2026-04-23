# Aipron

**AI-powered cooking assistant** — recipe generation, pantry-aware suggestions, search across a public catalog and your own saves, step-by-step cooking mode, and optional voice guidance via the OpenAI Realtime API.

![AI-Powered](https://img.shields.io/badge/AI-Powered-orange?style=flat&logo=openai)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)
![Version](https://img.shields.io/badge/version-1.1.0-informational?style=flat)

---

## What is Aipron?

Aipron helps you plan and cook with:

- **Conversational recipe help** on the **Chat** tab, with **saved chat threads** and a model that can **create recipes** (saved to your library automatically when generated from chat tools).
- **Search** with filters: browse a **curated public catalog** (and, when signed in, **your own generated recipes**), with cuisine and dietary tags and full-text style matching.
- **Favorites** and **Recipes** tabs for quick access to saved and owned recipes, with hero imagery and card layouts tuned for mobile.
- **Pantry** for ingredients you have at home, including **“use my pantry”** hints when generating new recipes.
- **Cooking mode** for focused, step-by-step sessions tied to a recipe.
- **Profile & settings**: dietary preferences synced to the server, **app language**, notifications-related toggles, help/about, and sign-in state.

Whether you are learning basics or iterating on weeknight meals, the app is built around a single product surface: the **Expo (React Native) app** (including **Expo web** for local browser preview).

---

## Feature overview

| Area | What you get |
|------|----------------|
| **Chat** | Multi-turn assistant, optional **voice (Realtime)**, user context from **profile + pantry**, **persistent conversations** (list, open, message, delete). |
| **Recipe generation** | `POST /api/recipes/generate` with **servings**, **skill level**, **dietary filters**, and optional **use pantry** to steer ingredients. |
| **Search** | `GET /api/recipes/search` — public recipes for anonymous users; **public + your recipes** when authenticated. Optional `q`, `dietaryTag`, `cuisine`, pagination. **Offline/nearline**: local catalog slice for instant UI when the API is away. |
| **Library** | **Save / unsave** recipes, **Favorites** tab, list **saved IDs** for fast UI, scale servings and **substitution** suggestions that **merge** profile dietary prefs. |
| **Pantry** | List / add / remove items, **suggest recipes** from what you have. |
| **Cooking** | Start and advance **cooking sessions**, complete steps, **active session** query. |
| **Account** | **Supabase Auth** (register, login, **me**), **PUT preferences** for `profiles.dietary_preferences`. |
| **Realtime (voice)** | Create **Realtime sessions**, **WebRTC negotiate** for web, **cleanup** of expired server-side session records. |
| **Quality of life** | Onboarding, login gating, **light/dark** styling via design tokens, **Rate limiting** and **Helmet** on the API, **Vitest** + Supertest for backend. |

---

## Architecture

- **Product app**: **React Native (Expo SDK 54)** + **Expo Router** — this is what you run day to day. Use `npx expo start --web` for a **localhost browser** preview; use a device or simulator for the full native experience.
- **Backend**: **Node.js** + **Express** (ESM), `PORT` default **3001** — see `GET /health`.
- **Data & auth**: **Supabase** — **Postgres**, **Row Level Security**, **Auth** (JWT access tokens validated on the API). The backend uses the **service role** for admin tasks and a **per-user Supabase client** for RLS-scoped work.
- **AI**: **OpenAI** (chat completion for assistant + recipe tools, **substitutions**, and **Realtime** for voice sessions). API keys stay on the **server** only.
- **`web/` (Next.js)**: **Legacy / non–product** — not the primary release surface; the README focuses on `mobile/` + `backend/`.
- **`shared/`**: Shared **TypeScript types** (e.g. `Recipe`) for mobile and tooling.

---

## Prerequisites

- **Node.js 18+** (backend tooling aligns with current Node LTS usage).
- A **Supabase** project (URL, anon key, service role key).
- An **OpenAI API key** (required for generation, chat AI, substitutions, and Realtime).
- This repo does **not** ship real secrets: copy **`.env.example` → `.env`** in `backend/` and `mobile/` and fill in your own values.

---

## Getting started

You can run in two modes: **UI-focused** (minimal backend) or **full stack** (recommended for end-to-end behavior).

### Option A — UI only (quickest; limited API)

1. `cd mobile && npm install`
2. `npx expo start --web` (or `npm run dev` / press `w` for web).
3. Screens render; **search**, **chat**, and **auth** flows need a running backend + Supabase to behave fully.

### Option B — Full stack (backend + mobile)

**1. Install dependencies**

```bash
cd C:\Aipron\backend
npm install

cd C:\Aipron\mobile
npm install
```

**2. Backend environment**

```bash
cd C:\Aipron\backend
copy .env.example .env
```

Set at minimum:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- Optional: `PORT` (default `3001`), `NODE_ENV`, `ALLOWED_ORIGINS` (for production CORS; dev allows common localhost and LAN patterns)

**3. Run the API**

```bash
cd C:\Aipron\backend
npm run dev
```

Expect: server listening (e.g. port **3001**). `GET http://localhost:3001/health` should return `{"status":"ok",...}`.

**4. Mobile environment**

```bash
cd C:\Aipron\mobile
copy .env.example .env
```

Set:

- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (client-side; anon only)
- `EXPO_PUBLIC_API_URL` — e.g. `http://localhost:3001` for web; for a **physical device**, use your computer’s **LAN IP** (e.g. `http://192.168.x.x:3001`) and ensure the phone and PC share a network. The backend can bind to all interfaces by default so LAN access works (see `BIND_HOST` in examples if you need to lock it down).

**5. Start the app**

```bash
cd C:\Aipron\mobile
npx expo start --web
```

Or open iOS/Android simulators from the Expo CLI. Sign in, then use **Chat**, **Search**, **Recipes**, **Favorites**, **Profile**, and **Pantry** as usual.

**6. Optional: seed / catalog data**

The backend includes **seed scripts** for local development (e.g. `npm run seed` / catalog helpers — see `backend/package.json`). Use these after migrations are applied in Supabase so **public recipes** and search have content to show.

---

## Project structure

```
Aipron/
├── mobile/                 # Expo app (primary product)
│   ├── app/                # Expo Router: tabs, recipe, cooking, pantry, settings, …
│   ├── src/
│   │   ├── components/     # UI (chat, cooking, cards, …)
│   │   ├── services/       # API clients (Supabase + REST)
│   │   ├── store/          # Zustand (auth, settings, preferences, …)
│   │   ├── hooks/          # e.g. Realtime voice, theme
│   │   ├── constants/      # Design tokens, dietary options, images
│   │   └── data/           # e.g. local catalog for resilient Search UI
│   └── package.json
├── backend/                # Express API
│   ├── src/
│   │   ├── routes/         # auth, recipes, pantry, chat, cooking, realtime
│   │   ├── services/       # OpenAI, Realtime, user context, …
│   │   ├── middleware/     # auth, errors, request context
│   │   └── db/             # Supabase client, schema reference, seeds
│   ├── unit_tests/         # Vitest
│   └── package.json
├── web/                    # Next.js (legacy; not the main app)
├── shared/                 # Shared types
└── package.json            # Workspaces (mobile, web, backend, shared)
```

Root scripts (see root `package.json`): `dev:mobile`, `dev:backend`, `install:all`, `check:react`.

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Mobile | React Native, Expo 54, Expo Router, React 19, Zustand |
| Styling | Design tokens, StyleSheet, Plus Jakarta Sans / Noto Serif (Expo Google Fonts) |
| Backend | Node (ESM), Express, express-validator, Helmet, express-rate-limit |
| Data | Supabase (Postgres, Auth, RLS) |
| AI | OpenAI (chat & tools, substitutions, Realtime) |
| Tests | Vitest, Supertest (`backend/`) |

---

## Main mobile surfaces

| Screen / area | Role |
|---------------|------|
| **Chat** | Chef assistant, **voice** hookup, **recipe cards** in-thread, **new recipe** from AI tools. |
| **Search** | Query + filters, blend of **API** and **local catalog**; opens recipe detail. |
| **Recipes** | Your generated/saved collection. |
| **Favorites** | Hearted recipes. |
| **Profile** | Account and navigation into **Settings**, **Help**, **About**, **Onboarding** replay as needed. |
| **Pantry** | Full-screen pantry management (tab stack / modal flow depending on entry). |
| **Recipe detail** | `recipe/[id]` — view, save, start cooking. |
| **Cooking** | `cooking/[id]` — `CookingSessionView` for step focus. |
| **Login** | Auth gate before tab shell. |

---

## HTTP API (summary)

**General**

- `GET /health` — liveness

**Auth** (`/api/auth`)

- `POST /register` — create user (returns `token`)
- `POST /login` — sign in
- `GET /me` — profile + dietary preferences
- `PUT /preferences` — persist `dietaryPreferences` array

**Recipes** (`/api/recipes`)

- `GET /search` — **optional auth**: public only, or public + your recipes; query params: `q`, `dietaryTag`, `cuisine`, `limit`, `offset`
- `POST /generate` — authenticated; body: `prompt`, optional `dietaryFilters`, `servings`, `skillLevel`, `usePantry`
- `GET /saved`, `GET /saved/ids` — saved lists
- `GET /`, `GET /:id` — your recipes; single recipe
- `POST /:id/scale` — scale by `servings`
- `POST /substitutions` — `ingredient` + optional `dietaryFilters` (merged with profile)
- `POST /:id/save`, `DELETE /:id/save` — favorite toggle

**Pantry** (`/api/pantry`)

- `GET /`, `POST /`, `DELETE /:id`, `POST /recipes` (suggest from pantry)

**Chat** (`/api/chat`)

- `POST /` — stateless one-shot chat (optional `Authorization` for user context)
- `GET /conversations` — list threads
- `POST /conversations` — new thread
- `GET /conversations/:id/messages`, `POST /conversations/:id/messages` — history + send (persists, runs assistant with `create_recipe` tool on server)
- `DELETE /conversations/:id`

**Cooking** (`/api/cooking`)

- `POST /sessions` — start
- `GET /sessions/active`
- `PATCH /sessions/:id/step` — advance
- `POST /sessions/:id/complete`

**Realtime** (`/api/realtime`)

- `POST /session` — create client session payload
- `POST /negotiate` — WebRTC SDP exchange for web voice
- `POST /cleanup` — expire old session rows (cron/call manually)

> **Note:** Route order matters on the server (e.g. `/search` and `/saved` before `/:id`). Client apps should use the same paths as above.

---

## Security

- **Supabase JWT** validation on protected routes; user-scoped Supabase client for RLS.
- **No OpenAI or service role keys in the mobile bundle** — only public Supabase keys where needed.
- **Rate limiting** on `/api/*` (e.g. 100 requests / 15 minutes per IP), **Helmet** headers, **CORS** with dev-friendly localhost/LAN and configurable `ALLOWED_ORIGINS` in production.
- **Input validation** on mutating routes (`express-validator`).

---

## Database

Authoritative **Postgres** schema and RLS patterns live in **Supabase**. In-repo references:

- `backend/src/db/schema.sql` — core tables: `profiles`, `recipes` (including `search_vector`, `is_public`, `is_ai_generated`), `pantry_items`, `cooking_sessions`, `saved_recipes`, `realtime_sessions`
- `backend/src/db/migrations/001_conversations.sql` — **`conversations`** and **`conversation_messages`** for persisted chat

Apply these in **Supabase** (SQL editor, or your migration pipeline) before expecting search, profile, or chat to work end-to-end. A helper script `backend/src/db/run-migration.js` can print the SQL for `001_conversations.sql` if the automated path is not available.

---

## Development

**Backend tests**

```bash
cd C:\Aipron\backend
npm test
```

**Mobile typecheck**

```bash
cd C:\Aipron\mobile
npm run typecheck
```

---

## Roadmap and ideas

**Recently shipped (high level):** tabbed app with **Search**, **Favorites**, **saved conversations**, **profile dietary sync**, **optional auth** on recipe search, **Real-time voice** plumbing, and **cooking sessions**.

**Future ideas (not committed):** meal planning, grocery integrations, deeper accessibility passes, analytics, and expanded languages — track these in your own planning docs or issues.

---

## Contributing

1. Fork the repository
2. Branch: `git checkout -b feature/your-feature-name`
3. Commit with clear messages
4. Open a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## License

[MIT](LICENSE)

---

## Acknowledgments

- [OpenAI](https://openai.com/) for API and Realtime
- [Expo](https://expo.dev/) and the React Native community
- [Supabase](https://supabase.com/) for managed Postgres and Auth

---

<p align="center">Built for home cooks who want a calmer, smarter kitchen.</p>
