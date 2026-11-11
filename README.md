# AMANAH AI — Your Safety. Your Circle. Your City.

Personal safety monitoring app — hackathon MVP.

## Quick start

**Prerequisites:** Python 3.14+, Node 26+

```bash
# 1. Copy environment config
cp .env.example .env
# Edit .env to set SECRET_KEY and adjust check timing for your demo

# 2. Start backend (terminal 1)
./start-backend.sh

# 3. Start frontend (terminal 2)
./start-frontend.sh
# Opens at http://localhost:5173
```

## Demo accounts

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Woman | woman@demo.local | Demo1234! | Safety monitoring |
| Guardian | guardian@demo.local | Demo1234! | Alert view |

## Demo flow

1. Sign in as **woman@demo.local**
2. Click **Start session** — monitoring begins
3. Wait for a check-in to appear (configurable via `FIRST_CHECK_MINUTES` in `.env`)
4. Respond **YES** (safe), **NO** (need help), or press **SOS**
5. Open a second browser window, sign in as **guardian@demo.local** to see the alert
6. Guardian sees the alert within 2 seconds (polling)
7. After confirming safe, resolve the emergency

## Check-in timing (configurable in `.env`)

| Setting | Default (demo) | Production |
|---------|----------------|------------|
| `FIRST_CHECK_MINUTES` | 1 | 5 |
| `CHECK_INTERVAL_MINUTES` | 1 | 3 |
| `RESPONSE_WINDOW_SECONDS` | 30 | 60 |

## Architecture

- **Backend:** FastAPI + SQLite + SQLAlchemy + APScheduler (persistent SQLiteJobStore)
- **Auth:** JWT (python-jose + passlib/bcrypt)
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Notifications:** In-app polling (2s interval)

## Safety disclaimer

This is a **demonstration application**. It does not contact emergency services or police.
In a real emergency, call your local emergency services.

## Project structure

```
backend/
  app/
    models/       — SQLAlchemy models
    routes/       — FastAPI routers (auth, sessions, guardian)
    services/     — Business logic (session, emergency, seed)
    security/     — JWT + bcrypt auth
    scheduler/    — APScheduler setup + job functions + reconciliation
frontend/
  src/
    pages/        — LoginPage, WomanDashboard, ActiveSession, Emergency, Guardian
    services/     — API client
    hooks/        — usePolling
data/             — SQLite database files (gitignored)
```
