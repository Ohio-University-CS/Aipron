# Aipron Project Summary

## Overview

Aipron is a mobile-first, AI-powered cooking assistant built according to the PRD v1.1. The **shipping product is the Expo mobile app**; **web UI for developers** is **Expo web on localhost** only. The `web/` Next.js package is not a release target.

## Project Structure

```
Aipron/
├── backend/          # Node.js + Express API server
├── mobile/           # React Native + Expo — primary app (stores / TestFlight / Play)
├── web/              # Next.js (legacy / optional; not shipped)
├── shared/           # Shared TypeScript types
└── [config files]
```

## Implementation Status

### ✅ Completed (Phase 1)

#### Backend
- [x] Express server setup with security middleware
- [x] PostgreSQL database schema and migrations
- [x] JWT authentication system
- [x] Recipe generation API (OpenAI GPT-4o)
- [x] Pantry management endpoints
- [x] Cooking session management
- [x] Realtime API session creation
- [x] Ingredient substitution API
- [x] Recipe scaling API
- [x] Rate limiting and error handling

#### Mobile App
- [x] Expo Router navigation setup
- [x] Design tokens (spacing, colors, typography)
- [x] Core components:
  - ChatComposer
  - RecipeCard
  - CookingStep
  - TimerChip
  - IngredientRow
  - VoiceIndicator
- [x] Bottom tab navigation (Chat, Pantry, Recipes, Profile)
- [x] Authentication screens (Login/Register)
- [x] Chat screen with recipe generation
- [x] Cooking mode screen (full-screen)
- [x] API service layer
- [x] Zustand state management

#### Web (`web/` — not shipped)
- [x] Next.js 14 setup (optional; CI does not require a web production build)

#### Shared
- [x] TypeScript type definitions
- [x] Shared interfaces (Recipe, Ingredient, etc.)

### 🚧 In Progress / Pending

#### Backend
- [ ] Redis integration for session management
- [ ] WebRTC connection handling for Realtime API
- [ ] Background job for session cleanup
- [ ] Recipe caching/optimization

#### Mobile App
- [ ] Pantry mode UI implementation
- [ ] Recipe list/detail screens
- [ ] Voice input/output integration
- [ ] Realtime API WebRTC connection
- [ ] Background audio during cooking mode
- [ ] Screen lock disable during cooking
- [ ] Offline recipe caching

#### Web App (`web/` — deprioritized)
- [ ] (Not planned for product; mobile-only roadmap)

## Key Features Implemented

### 1. Recipe Generation
- Natural language input via chat
- Dietary filter support
- Serving size customization
- Skill level adaptation

### 2. Cooking Mode
- Step-by-step guidance
- Timer integration per step
- Progress tracking
- Session persistence

### 3. Authentication
- User registration/login
- JWT token management
- Persistent sessions

### 4. API Architecture
- RESTful endpoints
- Error handling middleware
- Input validation
- Rate limiting

## Design System

### Spacing
- 4, 8, 12, 16, 24, 32px scale

### Typography
- Cooking mode: 3 sizes max, min 24px for active steps
- Regular app: H1, H2, Body, Caption

### Colors
- Semantic tokens (primary, success, error, etc.)
- Cooking mode: Dark background (#1A1A1A)

## Database Schema

### Tables
- `users` - User accounts
- `recipes` - Generated recipes
- `pantry_items` - User pantry inventory
- `cooking_sessions` - Active cooking sessions
- `saved_recipes` - User favorites
- `realtime_sessions` - Ephemeral Realtime API sessions

## API Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Recipes
- `POST /api/recipes/generate`
- `GET /api/recipes/:id`
- `GET /api/recipes`
- `POST /api/recipes/:id/scale`
- `POST /api/recipes/substitutions`

### Pantry
- `GET /api/pantry`
- `POST /api/pantry`
- `DELETE /api/pantry/:id`
- `POST /api/pantry/recipes`

### Cooking
- `POST /api/cooking/sessions`
- `GET /api/cooking/sessions/active`
- `PATCH /api/cooking/sessions/:id/step`
- `POST /api/cooking/sessions/:id/complete`

### Realtime
- `POST /api/realtime/session`

## Environment Configuration

### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection
- `OPENAI_API_KEY` - OpenAI API key
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 3001)

### Mobile (.env)
- `EXPO_PUBLIC_API_URL` - Backend API URL

### Web (.env)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Next Steps

1. **Complete Pantry Mode**
   - UI for adding/managing ingredients
   - Recipe matching algorithm integration

2. **Implement Voice Features**
   - WebRTC connection to Realtime API
   - Audio input/output handling
   - Voice command recognition

3. **Enhance Cooking Mode**
   - Background audio support
   - Screen lock disable
   - Offline mode

4. **Performance Optimization**
   - Recipe caching
   - Image optimization
   - Bundle size reduction

5. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

## Technical Debt

- [ ] Add comprehensive error handling
- [ ] Implement logging system
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring/analytics
- [ ] Implement proper TypeScript types throughout
- [ ] Add input sanitization
- [ ] Implement proper session cleanup

## Notes

- Realtime API integration requires WebRTC client-side implementation
- Mobile app uses Expo Router for file-based routing
- Backend uses ES modules (type: "module")
- Shared types are in TypeScript for type safety across projects
