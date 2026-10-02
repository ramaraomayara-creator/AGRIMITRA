# AgriMitra — Smart Farming Assistant for Every Farmer

No login. Direct access. For Indian small & marginal farmers. Green agriculture UI (desktop/tablet/mobile).

## 1. Project overview
Vanilla-JS single-page frontend (`index.html` + `css/` + `js/` + `src/data/`, hash routes, no build step)
plus a dependency-free Node.js 18+ REST backend (`backend/`) that serves the site and proxies
government mandi data and keyless Open-Meteo weather/image data with caching. No database — catalog data is bridged from the
existing verified frontend data files at backend boot.

## 2. Frontend setup
No build needed: open `agrimitra/index.html` directly (works offline; live features degrade gracefully),
or serve statically: `python3 -m http.server` inside `agrimitra/` → http://localhost:8000

## 3. Backend setup (needs Node.js 18+ installed — no `npm install` required)
```
cd agrimitra/backend
copy .env.example .env        # Windows; on Linux/macOS: cp .env.example .env
# edit .env — add DATA_GOV_API_KEY (free at https://data.gov.in/user) and/or WEATHER_API_KEY
node server.js
```
Open http://localhost:5000 — the same AgriMitra site, now with live-data capability.

## 4. Environment variables (`backend/.env`; never commit it)
PORT=5000, FRONTEND_URL=http://localhost:5173, DATA_GOV_API_KEY= (MARKET_API_KEY= also accepted), MARKET_API_URL= (+RESOURCE_ID),
IMAGE_API_URL= (Wikimedia Commons, no key needed), IMAGE_API_KEY= (optional provider),
WEATHER_API_KEY=, WEATHER_API_URL=, DATABASE_URL= (unused), CACHE_TTL=900, IMAGE_CACHE_TTL=86400.
Frontend override (only when served apart from backend): `window.AGRIMITRA_API_BASE="http://localhost:5000"`.

## 5–8. API configuration
- **Market:** data.gov.in dataset “Current Daily Price … (Mandi)”, resource `9ef84268-d588-465a-a308-a864a43d0070`,
  called server-side with key + `filters[state|district|market|commodity|variety|arrival_date]`, `limit`, `offset`.
- **Images:** Wikimedia Commons API (keyless) — query only, attribution preserved.
- **Weather:** Open-Meteo keyless forecast/current API; no weather API key is required for the free non-commercial API. Open-Meteo is a forecast source, not an official IMD advisory.

## 9–11. Running / production
- Frontend alone: open `index.html` (see §2). Backend: `node server.js` (or `npm start`, `npm run dev` with `--watch`).
- Production: run `node backend/server.js` behind any process manager; set `PORT` + real `.env`; no build step exists.
- Endpoints: `GET /api/health`, `/api/crops[/:id]`, `/api/seeds[/:id]`, `/api/fertilizers[/:id]`,
  `/api/farming-types[/:id]`, `/api/paddy-varieties[/:id]`, `/api/market[/prices][/markets]`,
  `/api/weather`, `/api/images/search?query=`.

## 12. Troubleshooting
- Market shows sample/“unavailable”: set `DATA_GOV_API_KEY` in the backend `.env` and restart; check `/api/health`. Weather is keyless through Open-Meteo.
- Images stay generic: needs internet (Commons) — otherwise current images remain.
- Port busy: change `PORT`. No Node? Install Node 18+ LTS (no npm packages needed).

## 13. API fallback behavior
LIVE API → normalize → cache → display • fail → cached verified data + warning • none →
verified local data • none → “Information currently unavailable”. Status pills: 🟢 Live / 🟡 Cached /
🔵 Reference / 🔴 Unavailable. “Live” is never shown without a successful fetch + real timestamp.

## 14. Security notes
Keys live only in server `.env` (git-ignored); frontend has none. CORS allowlist, security headers,
per-IP rate limits (120/min general, 30/min market/images), strict query validation (no arbitrary
server-side URLs — only fixed provider hosts), upstream timeouts + 2 MB response cap, no stacks to clients.
