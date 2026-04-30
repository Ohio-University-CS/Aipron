# Aipron

**Repository:** [github.com/Ohio-University-CS/Aipron](https://github.com/Ohio-University-CS/Aipron)

![AI-Powered](https://img.shields.io/badge/AI-Powered-orange?style=flat&logo=openai)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)
![Version](https://img.shields.io/badge/version-1.1.0-informational?style=flat)

---

## Project description

Aipron is an **AI-powered cooking assistant** for planning and preparing meals. The project’s purpose is to give home cooks a single place to **discover and generate recipes**, **track what they have in the pantry**, **save favorites**, and **walk through cooking step-by-step**—with optional **voice** help via the OpenAI Realtime API when the stack is configured.

The **primary product** is the **Expo (React Native) app** in `mobile/` (including **Expo web** for browser preview). A **Node.js + Express** API in `backend/` connects to **Supabase** (Postgres, auth, RLS) and **OpenAI** for chat, recipe generation, substitutions, and realtime sessions. The `web/` Next.js package is **legacy** and not the main release surface.

---

## Features

- **Chat assistant** — Multi-turn cooking help, saved conversation threads, recipe creation from chat tools (recipes can be saved to your library).
- **Recipe search** — Filter by cuisine, dietary tags, and text; **public catalog** plus **your own recipes** when signed in; local catalog slice for more resilient UI when the network is poor.
- **Recipe generation** — Server-side generation with servings, skill level, dietary filters, and optional **use my pantry** steering.
- **Library** — **Recipes** and **Favorites** tabs; save/unsave; scale servings; **ingredient substitution** suggestions that respect profile dietary preferences.
- **Pantry** — Add/remove ingredients at home; suggestions based on what you have.
- **Cooking mode** — Step-by-step sessions tied to a recipe (start, advance steps, complete).
- **Account & profile** — Supabase Auth (register, login); dietary preferences synced to the server; settings (e.g. language, notifications-related options), help/about, onboarding.
- **Voice (optional)** — Realtime session creation and WebRTC negotiation for web voice when enabled and configured.
- **API quality-of-life** — Rate limiting, Helmet, CORS; Vitest + Supertest tests on the backend.

---

## Installation

**Prerequisites**

- **Node.js 18+**
- A **Supabase** project (URL, anon key, service role key)
- An **OpenAI API key** (chat, generation, substitutions, Realtime as applicable)
- This repo does **not** include production secrets—copy **`.env.example` → `.env`** in `backend/` and `mobile/` and fill in your own values.

**1. Clone the repository**

```bash
git clone https://github.com/Ohio-University-CS/Aipron.git
cd Aipron
```

**2. Install dependencies (full stack)**

From the repository root:

```bash
cd backend && npm install
cd ../mobile && npm install
```

Alternatively, from root: `npm run install:all` (installs mobile, backend, and shared per root `package.json`).

**3. Database setup**

Apply the SQL in Supabase as described in-repo (for example `backend/src/db/schema.sql` and `backend/src/db/migrations/001_conversations.sql`) so profiles, recipes, pantry, chat, cooking, and related tables exist. Use backend seed scripts (see `backend/package.json`, e.g. `npm run seed` where available) after migrations if you need **public recipe** data for search.

**4. Environment files**

- **Backend:** `cd backend` → copy `.env.example` to `.env`. Set at minimum `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `OPENAI_API_KEY`. Optional: `PORT` (default `3001`), `NODE_ENV`, `ALLOWED_ORIGINS` for production CORS.
- **Mobile:** `cd mobile` → copy `.env.example` to `.env`. Set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_API_URL` (e.g. `http://localhost:3001` for web; for a **physical device**, use your machine’s **LAN IP** and port, e.g. `http://192.168.x.x:3001`).

---

## How to run

**Backend API**

```bash
cd backend
npm run dev
```

Confirm: open or `curl` `http://localhost:3001/health` — expect JSON like `{"status":"ok",...}` (exact shape may vary slightly by version).

**Mobile app (Expo — web or device)**

```bash
cd mobile
npx expo start --web
```

Or start the dev server and press `w` for web, or open iOS/Android simulators from the Expo CLI. For **full** chat, search, auth, and generation, keep the backend running with valid Supabase and OpenAI configuration.

**UI-only quick preview (limited)**

You can run `cd mobile && npm install && npx expo start --web` without the API; screens may render but **auth, live search, and chat** need the backend + Supabase to behave end-to-end.

**Backend tests (optional)**

```bash
cd backend
npm test
```

**Mobile typecheck (optional)**

```bash
cd mobile
npm run typecheck
```

---

## Usage examples

**Example 1 — Health check**

- **Input:** `GET http://localhost:3001/health`
- **Output (conceptual):** `200 OK` with a small JSON body including `"status":"ok"`.

**Example 2 — Chat (via app)**

- **Input:** Open the **Chat** tab after signing in, send: *“Suggest a vegetarian dinner under 400 calories using rice and beans.”*
- **Output:** Assistant reply with suggestions; if tools create a recipe, it can appear in-thread and be saved depending on flow and auth.

**Example 3 — Recipe search (via app)**

- **Input:** **Search** tab → optional query text → choose filters (e.g. dietary tag).
- **Output:** List of recipe cards from the catalog and/or your library; tap for detail and cooking.

**Example 4 — Generate recipe (API shape, illustrative)**

Authenticated `POST /api/recipes/generate` with a JSON body such as:

```json
{
  "prompt": "Weeknight chickpea curry for two",
  "servings": 2,
  "skillLevel": "easy",
  "dietaryFilters": ["vegetarian"],
  "usePantry": true
}
```

- **Output (conceptual):** `201` with generated recipe payload as implemented by the server (IDs, ingredients, steps, etc.).


---

## Known issues

- **Secrets & environment:** Nothing works end-to-end until `.env` files are populated; missing or wrong Supabase/OpenAI keys show as auth or API failures in the UI.
- **Physical devices:** `EXPO_PUBLIC_API_URL` must reach your dev machine on the LAN; firewall or wrong IP breaks mobile ↔ API calls.
- **Empty database:** Without migrations and optional seeds, search may show little or no public catalog content.
- **`web/` Next.js:** Retained as **legacy**; the documented product path is **`mobile/` + `backend/`** (see Architecture below).
- **Offline / degraded network:** Search can fall back to a **local catalog slice**; results may not match the live server until back online.

---

## Future work

- Meal planning and shopping lists aligned with pantry and dietary prefs.
- Deeper integrations (e.g. grocery delivery APIs) where product and policy allow.
- Stronger **accessibility** (screen reader labeling, contrast, motion).
- Expanded **localization** beyond current language settings.
- Performance work: caching, background jobs for cleanup, optional Redis for sessions (ideas reflected in historical planning docs).
- Analytics and error reporting for production deployments (privacy-reviewed).



---

## Contributors

| Name              | Role / responsibility                                      |
|-------------------|------------------------------------------------------------|
| *Devin*       | *Expo routing, UI, database work*                         |
| *Mike*      | *Recipe generation*                   |
| *Alex*      | *AI, login*       |
| *Rowan*      | *Pantry*                               |


---

## Architecture (reference)

- **Mobile:** React Native (**Expo SDK 54**) + **Expo Router**, Zustand, design tokens (`mobile/`).
- **Backend:** Node (ESM) + Express, `PORT` default **3001** (`backend/`).
- **Data & auth:** Supabase Postgres + RLS + JWT validated on API routes.
- **AI:** OpenAI server-side only (chat, tools, substitutions, Realtime).
- **Shared:** TypeScript types in `shared/` for mobile and tooling.

**Project structure (abbreviated)**

```
Aipron/
├── mobile/          # Primary Expo app
├── backend/         # Express API + Vitest tests
├── web/             # Next.js — legacy / not primary product
├── shared/          # Shared TS types
└── package.json     # Workspace helpers (e.g. install:all)
```

---

## HTTP API (summary)

- `GET /health` — liveness  
- **`/api/auth`** — register, login, `/me`, `PUT /preferences`  
- **`/api/recipes`** — search, generate, saved lists, detail, scale, substitutions, save/unsave  
- **`/api/pantry`** — CRUD-style pantry + suggest recipes  
- **`/api/chat`** — conversations + messages (persistent threads)  
- **`/api/cooking`** — sessions (start, active, step, complete)  
- **`/api/realtime`** — session creation, negotiate (WebRTC), cleanup  

See route comments in `backend/src/` for exact paths and validation.

---

## Security (brief)

Supabase JWT on protected routes; **no** OpenAI or service-role keys in the mobile bundle; rate limiting on `/api/*`; Helmet; CORS configurable via `ALLOWED_ORIGINS` in production.

---

## Contributing & license

- Contributing workflow: fork, branch, PR — see [CONTRIBUTING.md](CONTRIBUTING.md).
- License: [MIT](LICENSE).

---

## Acknowledgments

- [OpenAI](https://openai.com/) — API and Realtime  
- [Expo](https://expo.dev/) & React Native community  
- [Supabase](https://supabase.com/) — Postgres and Auth  

---

<p align="center">Built for home cooks who want a calmer, smarter kitchen.</p>
