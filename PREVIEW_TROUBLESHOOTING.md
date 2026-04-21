# Why Can't I See the Preview?

## Common Issues & Solutions

### 1. **Dependencies Not Installed**

**Problem**: `node_modules` folder doesn't exist or is incomplete.

**Solution**:
```bash
cd mobile
npm install
```

If npm is not found:
- Install Node.js from https://nodejs.org/ (v18 or higher)
- Restart your terminal/IDE after installation
- Verify: `node --version` and `npm --version`

### 2. **Expo Not Running**

**Problem**: Development server isn't started.

**Solution**:
```bash
cd mobile
npm run dev
```

Or:
```bash
npx expo start
```

### 3. **Preview Method**

**You need to choose how to view the app:**

**Option A: Expo Go App (Easiest)**
1. Install "Expo Go" on your phone (iOS/Android)
2. Start the dev server: `npm run dev`
3. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app
4. App loads on your phone

**Option B: Web Browser**
1. Start dev server: `npm run dev`
2. Press `w` in terminal
3. Opens in browser (limited functionality)

**Option C: Simulator/Emulator**
- iOS: Press `i` (requires Xcode on Mac)
- Android: Press `a` (requires Android Studio)

### 4. **Backend Not Running**

**Problem**: API calls fail, but UI should still show.

**Solution**: Start backend separately:
```bash
cd backend
npm install
npm run dev
```

### 5. **Port Conflicts**

**Problem**: Port 8081 already in use.

**Solution**:
```bash
npx expo start --port 8082
```

Or kill the process using port 8081.

### 6. **Cache Issues**

**Problem**: Old cached code showing.

**Solution**:
```bash
npx expo start -c
```

Or clear cache:
```bash
npx expo start --clear
```

### 7. **TypeScript Errors**

**Problem**: Type errors preventing compilation.

**Solution**: From the repo root (or `mobile/`), run:

```bash
npm run typecheck --workspace mobile
```

Check terminal for errors. Common fixes:
- Missing type definitions
- Import path issues
- Check `mobile/tsconfig.json` is correct

### 7b. **Mobile cannot reach the API (physical device vs emulator)**

**Problem**: Requests fail or hang; Metro works but recipe/chat calls error out.

**Checklist**:
- **Backend**: Run `cd backend && npm run dev` (default port **3001**). Confirm `http://localhost:3001/health` in a browser on the same machine.
- **Android emulator**: The app maps `localhost` to **10.0.2.2** for the API ([`mobile/src/services/api.ts`](mobile/src/services/api.ts)). Ensure the backend is listening on the host (default `BIND_HOST` is `0.0.0.0`).
- **Physical phone (Expo Go)**: `localhost` points at the phone. Set **`EXPO_PUBLIC_API_URL`** to `http://<your-computer-LAN-IP>:3001` (same Wi‑Fi as the phone), then restart Expo. Example: `EXPO_PUBLIC_API_URL=http://192.168.1.50:3001`.
- **Correlate failures**: API responses include header **`X-Request-Id`**. Use that value when matching a device error to backend logs.

### 7c. **Backend logs (structured errors)**

Errors are logged as JSON lines with `requestId`, `method`, and `path` so you can grep or ship logs to a collector. In development, the original `Error` is also printed after the JSON line for stack traces.

**Optional**: To use Sentry, install `@sentry/node`, set `SENTRY_DSN` in [`backend/.env.example`](backend/.env.example), and initialize Sentry in the server entry after `createApp()` (see comment in `.env.example`).

### 8. **Missing Assets**

**Problem**: Icon/splash image errors.

**Solution**: I've already fixed this - assets are now optional in `app.json`.

## Step-by-Step Setup

1. **Install Node.js** (if not installed)
   - Download from https://nodejs.org/
   - Choose LTS version
   - Restart terminal after install

2. **Install Dependencies**
   ```bash
   cd C:\Aipron\mobile
   npm install
   ```

3. **Start Expo**
   ```bash
   npm run dev
   ```
   OR
   ```bash
   npx expo start
   ```

4. **View Preview**
   - Install Expo Go app on phone
   - Scan QR code
   - OR press `w` for web preview

## Quick Test

Try this minimal test:

```bash
cd C:\Aipron\mobile
npx expo start --web
```

This should open the app in your browser immediately (if dependencies are installed).

## Release smoke test (core product flows)

Before a release or when validating bugfixes, walk through:

1. **Auth**: Register or log in; confirm session persists after backgrounding the app.
2. **Chat**: Send a message; confirm assistant reply and no unexpected logout (watch for 401s on non-search routes).
3. **Recipe**: Generate or open a recipe; save if applicable.
4. **Cooking**: Open cooking mode from a recipe; start a step timer and confirm UI updates.

Distinguish **missing UI** (e.g. roadmap items) from **bugs** (broken navigation, crashes, wrong data).

## Supabase schema and RLS

After you change migrations, RLS policies, or indexes in Supabase:

1. Open the Supabase project → **Database** → **Security** / **Performance** advisors (or run SQL/security checks you use in your org).
2. Fix any new RLS or performance warnings before shipping, to avoid “empty lists” or flaky 401/403 behavior that looks like an app bug.

## Still Not Working?

Check:
1. ✅ Node.js installed? (`node --version`)
2. ✅ Dependencies installed? (`cd mobile && dir node_modules`)
3. ✅ Expo running? (terminal shows QR code)
4. ✅ No errors in terminal?
5. ✅ Backend running? (if testing API)

Share the error message from terminal and I'll help debug!
