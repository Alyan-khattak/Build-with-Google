# Findings: AMANAH AI MVP

## Project State (2026-11-11)

**Source code:** None exists. Only `docs/` folder with 8 markdown files. Blank slate.

**Git:** branch `master`, no commits. Untracked: `.gitignore`, `docs/`.

**TASK.md:** Does NOT exist. phases.md defines TASK-001 through TASK-029+.

**Documentation completeness:** All 8 docs present (PRD, TRD, Architecture, appFlow, database, design, Rules, phases).

---

## Architecture Decisions Resolved (TASK-001)

| Item | Decision | Status in TRD |
|------|----------|----------------|
| Backend | Python + FastAPI | Confirmed |
| Database | SQLite | Confirmed |
| ORM | SQLAlchemy | Proposed → **APPROVED for MVP** |
| Frontend | React + TypeScript + Vite | Proposed → **APPROVED for MVP** |
| CSS | Tailwind CSS | Proposed → **APPROVED for MVP** |
| Auth | JWT (python-jose, passlib/bcrypt) | Unresolved → **RESOLVED: JWT** |
| Scheduler | APScheduler + SQLiteJobStore | Unresolved → **RESOLVED: APScheduler** |
| Notifications | In-app polling only | In-app proposed → **APPROVED for MVP** |
| Live updates | Frontend polling every 2s | Unresolved → **RESOLVED: polling** |
| AI | Gemini API (P1 only) | Proposed → deferred until P0 done |
| Map | Deferred | Deferred per MVP scope |
| Location | Browser Geolocation API (P1 only) | Deferred until P0 done |

---

## MVP Database Tables (Minimum for P0)

Per database.md section 8:
1. `users` — id, email, password_hash, role, display_name, created_at
2. `guardian_links` — id, user_id, guardian_user_id, status, created_at, revoked_at
3. `safety_sessions` — id, user_id, session_type, started_at, ended_at, status, created_at
4. `safety_checks` — id, session_id, due_at, response_deadline, status, response, responded_at, created_at
5. `emergencies` — id, session_id, user_id, trigger_type, triggered_at, status, resolved_at, sequence_number
6. `notifications` — id, emergency_id, recipient_id, type, status, created_at, delivered_at

Deferred (P1): location_records, incident_reports, consent_records, community_reports

---

## Check-in Schedule Rules (from TRD section 5)

- First check: session_start + 5 minutes
- Subsequent checks: every 3 minutes (anchored to session start, not to previous check)
- Response window: 60 seconds after check due_at
- Explicit NO or SOS → immediate emergency (no delay)
- Missed check → guardian escalation (not "danger confirmed")
- Repeated missed checks → update SAME emergency record + new notification attempt

---

## Safety-Critical Constraints (non-negotiable)

- Emergency logic must work WITHOUT Gemini
- AI must NEVER delay SOS action
- Explicit NO/SOS → emergency immediately
- Missed check → "unconfirmed", not "danger"
- No fake police dispatch
- No hardcoded secrets anywhere

---

## Folder Structure (from Architecture.md proposal)

```
amanah-ai/              ← project root = /home/aizen/BuildWithGoogle
├── docs/               ← existing
├── backend/
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── models/
│       ├── schemas/
│       ├── routes/
│       ├── services/
│       ├── security/
│       └── scheduler/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       └── styles/
├── data/               ← SQLite file; gitignored
├── tests/
├── .env.example
├── .gitignore
└── README.md
```

---

## P0 Screens Required

1. Login / account access
2. Women's safety dashboard (start/stop session, SOS button)
3. Active session / check-in (YES / NO / SOS)
4. Emergency status (active emergency + deliberate cancel)
5. Guardian dashboard (view emergency alert)

---

## 3-Hour Timebox Target

| Time | Target |
|------|--------|
| 0–15 min | Scaffold + health check |
| 15–40 min | DB + auth |
| 40–75 min | Session + scheduler |
| 75–105 min | Emergency engine + guardian view |
| 105–140 min | Integration + tests |
| 140–160 min | Optional AI report OR community map |
| 160–180 min | Regression + demo rehearsal + docs |
