# Aipron Quick Start Guide

Get Aipron up and running in 5 minutes.

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 14+ running locally
- OpenAI API key with Realtime API access

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install mobile dependencies
cd mobile && npm install && cd ..

# Install web dependencies (optional)
cd web && npm install && cd ..
```

### 2. Set Up Database

Create a PostgreSQL database:

```bash
createdb aipron
```

Or using psql:

```sql
CREATE DATABASE aipron;
```

### 3. Configure Environment Variables

Copy and edit environment files:

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your:
# - DATABASE_URL (e.g., postgresql://user:password@localhost:5432/aipron)
# - OPENAI_API_KEY (your OpenAI API key)
# - JWT_SECRET (generate a random string)

# Mobile
cp mobile/.env.example mobile/.env
# Edit mobile/.env with your backend URL (default: http://localhost:3001)
```

### 4. Run Database Migrations

```bash
cd backend
npm run migrate
```

### 5. Start the Backend

```bash
cd backend
npm run dev
```

The backend should start on `http://localhost:3001`

### 6. Start the Mobile App

In a new terminal:

```bash
cd mobile
npm run dev
```

Then:
- Press `i` to open iOS simulator (Mac only)
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your phone

### 7. (Optional) Start the Web App

In another terminal:

```bash
cd web
npm run dev
```

Visit `http://localhost:3000`

## Testing the Setup

1. **Register a new account** in the mobile app
2. **Generate a recipe** by typing something like "Make me a pasta dish"
3. **Start cooking mode** by tapping on a generated recipe

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL format: `postgresql://user:password@host:port/database`
- Ensure database exists: `psql -l | grep aipron`

### OpenAI API Errors

- Verify your API key is correct
- Ensure you have Realtime API access (may require waitlist)
- Check API usage limits

### Mobile App Not Connecting

- Verify backend is running on the correct port
- Check `EXPO_PUBLIC_API_URL` in `mobile/.env`
- For physical device, use your computer's IP address instead of localhost

### Port Already in Use

- Backend: Change `PORT` in `backend/.env`
- Web: Change port in `web/package.json` scripts

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
- Explore the codebase structure

## Need Help?

Open an issue on GitHub or reach out to the maintainers.
