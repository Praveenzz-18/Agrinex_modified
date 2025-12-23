# Agrinex

Agriculture intelligence platform with micro weather forecasting, crop recommendations, farm zone analysis, and farmer-first financial insights.

## Overview
- Frontend: React + Vite + Axios + Firebase Firestore
- Backend: FastAPI (weather, analytics, zones, optional Gemini insights)
- Storage: Firestore collections for `users`, `farms`, and `weather` snapshots
- Sync: Zone locks persist per farm and drive Financial totals

## Prerequisites
- Node.js 18+
- Python 3.10+
- Firebase project (Firestore enabled)
- Optional: Google Generative Language API key for Gemini (`GEMINI_API_KEY`)

## Setup
1. Configure frontend environment
   - Set `VITE_API_BASE_URL` to your backend URL (e.g. `http://localhost:8000`)
   - Ensure Firebase initialization in `src/lib/firebase.ts` points to your Firebase project
2. Install frontend dependencies
   ```bash
   npm install
   ```
3. Install backend dependencies
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

## Run
1. Start the backend
   ```bash
   uvicorn app.main2:app --reload --port 8000
   ```
2. Start the frontend (in `frontend`)
   ```bash
   npm run dev
   ```
3. Preview build (optional)
   ```bash
   npm run preview
   ```

## Key Pages
- Weather: fetches geocode, current, forecast, analytics and saves snapshots to Firestore
  - Endpoints: `/api/geocode`, `/api/weather/current`, `/api/weather/forecast`, `/api/weather/analytics`
  - Optional AI insights: `/api/weather/gemini-insights`
- Network: divides farm into zones using backend heuristic endpoint
  - Endpoint: `POST /api/network/zones`
  - Lock/unlock integrates with Financial totals
- Financial: shows totals and per-zone financials based only on locked zones from Network

## Firestore Data Model
- `users/{email}`: `{ id, name, email, farms: [...] }`
- `farms/{email}_{farmId}`: `{ owner, ...farm }`
- `weather/{userId}_{farmId}`: `{ location, lat, lon, current, forecast, analytics, gemini, updatedAt }`
- Zone locks: stored locally per farm (`agrinex_zone_locks_{farmId}`) via AuthContext

## Workflows
- Registration
  - Writes `users/{email}` and primary `farms/{email}_{farmId}` on signup
  - Dashboard greeting reads `user.name` and falls back to `Farmer` if missing
- Lock Zones → Financial
  - Lock in Network adds `{ id, crop, area, estimatedCostPerAcre, expectedRevenuePerAcre }`
  - Financial page reads locks and computes totals, crop breakdown, and per-zone ROI

## Troubleshooting
- CORS: FastAPI enables CORS for all origins in the app middleware
- 404s: use non-v1 weather routes (`/api/...`) as wired in the frontend
- Firebase: ensure Firestore is enabled and `src/lib/firebase.ts` is configured

## Scripts
- `npm run dev`: start Vite dev server
- `npm run build`: build production assets
- `npm run preview`: preview build locally
