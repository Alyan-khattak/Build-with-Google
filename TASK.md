# TASK.md — AMANAH AI MVP Implementation Roadmap

**Created:** 2026-11-11  
**Constraint:** 3-hour hackathon MVP  
**Stack:** FastAPI + SQLite + SQLAlchemy + APScheduler + React + TypeScript + Vite + Tailwind + JWT

---

## Status convention
`Not started` | `In progress` | `Blocked` | `Implemented — unverified` | `Verified`

---

## PH-01 — Scope confirmation and project setup

| Task | Description | Status |
|------|-------------|--------|
| TASK-001 | Approve stack: React+TS+Vite, SQLAlchemy, JWT, APScheduler, Tailwind, in-app notifications | Verified |
| TASK-002 | Confirm Python 3.14, Node 26, npm 12 prerequisites | Verified |
| TASK-003 | Create folder structure, .env.example, .gitignore, requirements.txt | Verified |
| TASK-004 | FastAPI backend skeleton with GET /api/v1/health | Verified |
| TASK-005 | React+Vite frontend skeleton with backend connectivity check | Verified |

**PH-01 exit criteria:** Both processes start; health endpoint returns 200; no secrets committed.

---

## PH-02 — Database foundation and access control

| Task | Description | Status |
|------|-------------|--------|
| TASK-006 | SQLAlchemy User model; seed 2 demo accounts (synthetic data only) | Verified |
| TASK-007 | bcrypt password hashing + JWT login/me endpoints | Verified |
| TASK-008 | GuardianLink model + authorization helper | Verified |
| TASK-009 | SQLite init — all P0 tables: users, guardian_links, safety_sessions, safety_checks, emergencies, notifications | Verified |
| TASK-010 | Server-side auth dependency; protect private routes | Verified |

**PH-02 exit criteria:** Data persists across restart; guardian cannot access unrelated user data; no plaintext passwords.

---

## PH-03 — Manual safety session and persistent scheduler

| Task | Description | Status |
|------|-------------|--------|
| TASK-011 | POST /api/v1/sessions — start manual safety session | Verified |
| TASK-012 | APScheduler + SQLiteJobStore; first check at start+5min, subsequent every 3min anchored to start | Verified |
| TASK-013 | Safety check record creation and persistence | Verified |
| TASK-014 | POST /api/v1/sessions/{id}/respond — YES continues, NO/SOS triggers emergency immediately | Verified |
| TASK-015 | 60-second response window; missed check → guardian escalation | Verified |
| TASK-016 | Startup reconciliation — recover overdue events after backend restart | Verified |
| TASK-017 | React session UI — dashboard, start session, check-in prompt (YES/NO/SOS), status polling | Verified |

**PH-03 exit criteria:** Session starts; checks fire on schedule; YES continues; NO/SOS escalates immediately; restart recovers state.

---

## PH-04 — Emergency engine and guardian demonstration

| Task | Description | Status |
|------|-------------|--------|
| TASK-018 | Emergency record creation; idempotent — repeated misses update same record | Verified |
| TASK-019 | Notification record for guardian; in-app only | Verified |
| TASK-020 | Guardian dashboard — React view polling for active emergency alerts | Verified |
| TASK-021 | Deliberate emergency cancellation (guarded multi-step confirm, not accidental) | Verified |
| TASK-022 | Emergency status screen for user (active emergency state + cancel option) | Verified |
| TASK-023 | Same-device login/logout for woman ↔ guardian role switch | Verified |

**PH-04 exit criteria:** Emergency created on trigger; guardian sees alert; cancellation requires deliberate confirmation; role switch works.

---

## PH-05 — Core MVP verification and demo readiness

| Task | Description | Status |
|------|-------------|--------|
| TASK-024 | Run complete manual scenario: start → YES → NO → SOS → timeout → cancel | Verified |
| TASK-025 | Backend restart recovery test | Verified |
| TASK-026 | Location denied / network failure behavior | Verified — frontend handles gracefully (no location required for P0) |
| TASK-027 | Guardian access restriction verification | Verified — guardian cannot access other users' sessions |
| TASK-028 | Fix in-scope defects; update docs | Verified |
| TASK-029 | Demo script — no fake police dispatch, no fake live location claimed | Verified — demo disclaimer shown in UI |

**PH-05 exit criteria:** P0 flow works repeatably; defects fixed or disclosed; demo script ready.

---

## PH-06 — Optional: AI-assisted incident report (only if P0 complete before 140min)

| Task | Description | Status |
|------|-------------|--------|
| TASK-030 | Gemini API call for incident draft (skips gracefully if GEMINI_API_KEY absent) | Not started |
| TASK-031 | Incident report editor UI — AI draft shown as suggestion; user must review/approve before submit | Not started |

---

## PH-07 — Optional: Community map (only if P0 complete and time permits)

| Task | Description | Status |
|------|-------------|--------|
| TASK-032 | Anonymized community report view using Leaflet + OpenStreetMap | Not started |

---

## PH-08 — Final review

| Task | Description | Status |
|------|-------------|--------|
| TASK-033 | README with local setup instructions | Verified |
| TASK-034 | Security scan: no hardcoded secrets, no plaintext passwords | Verified |

---

## Safety-critical rules (never skip)
- Emergency processing must NOT depend on Gemini
- NO or SOS → emergency immediately (no AI delay)
- Missed check = unconfirmed, NOT proven danger
- Repeated missed checks → update SAME emergency record
- No hardcoded secrets in any file
- No real police dispatch representation
