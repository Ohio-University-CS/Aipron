# 👨‍🍳 AIpron

**Your AI-powered cooking assistant** — get personalized recipes, step-by-step guidance, and smart kitchen help, all in one place.

![Aipron Banner](https://img.shields.io/badge/AI-Powered-orange?style=for-the-badge&logo=openai)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-green?style=for-the-badge)

---

## 🍽️ What is AIpron?

AIpron is an intelligent cooking assistant that helps home cooks and culinary enthusiasts:

- Generate personalized recipes based on ingredients you already have
- Follow step-by-step cooking guidance with real-time tips
- Substitute ingredients on the fly
- Scale recipes up or down automatically
- Discover meals based on dietary preferences, allergies, or cuisine style
- **Hands-free voice guidance** powered by OpenAI Realtime API

Whether you're a beginner fumbling through your first stir-fry or a seasoned cook looking for inspiration, AIpron has you covered.

---

## ✨ Features

- **🧠 AI Recipe Generation** — Describe what you're craving or what's in your fridge and get a tailored recipe instantly
- **🔄 Ingredient Substitution** — Out of an ingredient? AIpron suggests smart swaps that won't ruin the dish
- **📏 Serving Scaler** — Automatically adjusts ingredient quantities for any number of servings
- **⏱️ Cooking Timers** — Built-in step timers to keep you on track
- **🥗 Dietary Filters** — Supports vegan, vegetarian, gluten-free, keto, halal, and more
- **🌍 Cuisine Explorer** — Browse recipes by cuisine — Italian, Thai, Mexican, Japanese, and beyond
- **📖 Pantry Mode** — Input what you have at home and get recipe suggestions with zero waste
- **💬 Conversational Interface** — Ask follow-up questions mid-recipe, just like talking to a real chef
- **🎤 Voice-Guided Cooking** — Hands-free cooking mode with real-time AI assistance

---

## 🏗️ Architecture

AIpron is built as a monorepo with:

- **Mobile App** (Primary): React Native + Expo
- **Web App** (Secondary): Next.js 14
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **AI Engine**: OpenAI Realtime API (GPT-4o Realtime)

---

## 🚀 Getting Started (Simple)

You can run AIpron in **two modes**:
- **Full stack** (backend + mobile app)
- **UI only** (mobile web preview, no backend / DB required)

### Prerequisites

- Node.js **v18+** installed
- An OpenAI API key (optional if you just want to see the UI)

> Note: This repo **does not include any real API keys**. The `.env` files are **gitignored**, so you will need to create your own `.env` from the provided `.env.example` and paste in your own `OPENAI_API_KEY`.

---

### Option A – UI only (fastest preview, no backend/DB)

This lets you see and play with the mobile UI in your browser.

1. **Install mobile dependencies**
   ```bash
   cd C:\Aipron\mobile
   npm install
   ```

2. **Start Expo Web**
   ```bash
   cd C:\Aipron\mobile
   npx expo start --web
   ```

3. In the Expo terminal, press:
   - `w` to open the web preview

4. Your browser should now show the **Chat screen UI**.

> Note: In this mode, calls to the backend (recipe generation, pantry, etc.) will fail if the backend isn’t running, but the UI will still render.

---

### Option B – Full stack (backend + mobile UI)

This gives you API + UI together.

#### 1. Install dependencies

```bash
# Backend
cd C:\Aipron\backend
npm install

# Mobile
cd C:\Aipron\mobile
npm install
```

#### 2. Configure the backend

```bash
cd C:\Aipron\backend
copy .env.example .env
```

Edit `backend/.env` and set:

- `OPENAI_API_KEY` = your real OpenAI API key  
- You can leave `DATABASE_URL` and others as-is for now if you’re just testing; DB-dependent endpoints may fail, but the server will still start.

> Reminder: `backend/.env` is **ignored by git**. Each developer must provide their own API key locally.

#### 3. Start the backend

```bash
cd C:\Aipron\backend
npm run dev
```

You should see:
- `🚀 Server running on port 3001`

#### 4. Configure the mobile app

```bash
cd C:\Aipron\mobile
copy .env.example .env
```

Edit `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

> Reminder: `mobile/.env` is **ignored by git**. You’ll need your own local values (and your own `OPENAI_API_KEY` in `backend/.env`) to use AI features.

#### 5. Start the mobile app (web preview)

```bash
cd C:\Aipron\mobile
npx expo start --web
```

Then:
- Press `w` in the terminal to open the app in your browser.

You should now see the mobile **Chat UI** running in your browser, hitting the backend at `http://localhost:3001`.

---

## 📁 Project Structure

```
Aipron/
├── mobile/              # React Native + Expo app
│   ├── app/            # Expo Router pages
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── services/   # API clients
│   │   ├── store/      # State management
│   │   └── constants/  # Design tokens
│   └── package.json
├── web/                 # Next.js web app
│   ├── src/
│   │   └── app/        # Next.js app router
│   └── package.json
├── backend/             # Node.js backend
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   ├── db/         # Database schema & migrations
│   │   └── middleware/ # Express middleware
│   └── package.json
├── shared/              # Shared TypeScript types
│   └── src/
│       └── types.ts
└── package.json         # Root workspace config
```

---

## 🛠️ Tech Stack

| Layer       | Technology              |
|-------------|------------------------|
| Mobile      | React Native + Expo    |
| Web         | Next.js 14             |
| Backend     | Node.js 20 + Express   |
| AI Engine   | OpenAI Realtime API    |
| Database    | PostgreSQL              |
| State       | Zustand                |
| Styling     | React Native StyleSheet / Tailwind CSS |

---

## 📱 Mobile App Features

### Core Screens

- **Chat**: Conversational recipe generation
- **Pantry**: Manage ingredients and find recipes
- **Recipes**: Browse saved recipes
- **Profile**: User settings and preferences
- **Cooking Mode**: Full-screen, hands-free cooking guidance

### Design System

- Spacing: 4, 8, 12, 16, 24, 32px
- Typography: Optimized for kitchen distance (min 24px for active steps)
- Colors: Semantic tokens (primary, success, error, etc.)

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Recipes
- `POST /api/recipes/generate` - Generate recipe from prompt
- `GET /api/recipes/:id` - Get recipe by ID
- `GET /api/recipes` - Get user's recipes
- `POST /api/recipes/:id/scale` - Scale recipe servings
- `POST /api/recipes/substitutions` - Get ingredient substitutions

### Pantry
- `GET /api/pantry` - Get pantry items
- `POST /api/pantry` - Add pantry item
- `DELETE /api/pantry/:id` - Delete pantry item
- `POST /api/pantry/recipes` - Find recipes from pantry

### Cooking
- `POST /api/cooking/sessions` - Start cooking session
- `GET /api/cooking/sessions/active` - Get active session
- `PATCH /api/cooking/sessions/:id/step` - Update step
- `POST /api/cooking/sessions/:id/complete` - Complete session

### Realtime
- `POST /api/realtime/session` - Create Realtime API session

---

## 🔒 Security

- JWT-based authentication
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- CORS configuration
- Input validation with express-validator
- No API keys shipped to client

---

## 📊 Database Schema

See `backend/src/db/schema.sql` for the complete database schema.

Key tables:
- `users` - User accounts
- `recipes` - Generated and saved recipes
- `pantry_items` - User's pantry inventory
- `cooking_sessions` - Active cooking sessions
- `realtime_sessions` - Ephemeral Realtime API sessions

---

## 🧪 Development

### Running Tests
```bash
# Backend tests (when implemented)
cd backend
npm test

# Mobile tests (when implemented)
cd mobile
npm test
```

### Code Formatting
```bash
# Format all code
npm run format
```

---

## 📋 Roadmap

### Phase 1 (Weeks 1-4) ✅
- [x] Realtime session setup
- [x] Chat + recipe generation
- [x] Mobile shell + navigation

### Phase 2 (Weeks 5-8)
- [ ] Pantry mode
- [ ] Substitutions
- [ ] Recipe scaling

### Phase 3 (Weeks 9-12)
- [ ] Cooking mode
- [ ] Voice commands
- [ ] Timers + background audio

### Phase 4 (Weeks 13-16)
- [ ] Performance tuning
- [ ] Accessibility audit
- [ ] Analytics + QA

### Future Enhancements
- [ ] Meal planning
- [ ] Grocery delivery integration
- [ ] Smart appliance integration
- [ ] AR cooking guidance
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions are welcome! Here's how to get involved:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please check the [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- OpenAI for the Realtime API
- Expo team for the amazing React Native tooling
- All contributors and early testers

---

<p align="center">Made with ❤️ for home cooks everywhere</p>
