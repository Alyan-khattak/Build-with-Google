# Task Plan: AMANAH AI — MVP Implementation

## Goal
Deliver a functional 3-hour hackathon MVP: safety session with anchored check-ins, emergency escalation, same-device guardian view, and persistent scheduler recovery.

## Next Step
Implement TASK-001: Resolve all blocking architecture decisions and create TASK.md, then scaffold the project skeleton (TASK-002 through TASK-005).

## Current Phase
Phase 1

## Phases

### Phase 1: Decisions, scaffold, and project setup (PH-01)
- [x] Read all docs and audit project state
- [ ] TASK-001: Approve stack choices (frontend, ORM, auth, scheduler, CSS, notifications)
- [ ] TASK-002: Confirm Python + Node prerequisites locally
- [ ] TASK-003: Create folder structure, .env.example, .gitignore, requirements.txt, package.json
- [ ] TASK-004: FastAPI skeleton with /api/v1/health endpoint
- [ ] TASK-005: React+Vite frontend skeleton connecting to backend
- **Status:** in_progress

### Phase 2: Database foundation and auth (PH-02)
- [ ] TASK-006: User model — demo accounts seeded (synthetic, no real data)
- [ ] TASK-007: Password hashing (bcrypt) + JWT auth endpoints (login/me)
- [ ] TASK-008: Guardian link model and authorization checks
- [ ] TASK-009: SQLite tables init via SQLAlchemy (users, guardian_links, safety_sessions, safety_checks, emergencies, notifications)
- [ ] TASK-010: Server-side authorization middleware
- **Status:** pending

### Phase 3: Safety session and persistent scheduler (PH-03)
- [ ] TASK-011: POST /api/v1/sessions — start manual safety session
- [ ] TASK-012: APScheduler (database-backed) persistent job store; first check at start+5min, subsequent every 3min
- [ ] TASK-013: Check-in event creation and persistence
- [ ] TASK-014: POST /api/v1/sessions/{id}/respond — YES/NO/SOS responses; NO/SOS triggers emergency immediately
- [ ] TASK-015: 60-second response window enforcement; missed check → guardian escalation
- [ ] TASK-016: Scheduler restart recovery — reconcile overdue events on startup
- [ ] TASK-017: React session UI — start session, check-in prompt, YES/NO/SOS buttons
- **Status:** pending

### Phase 4: Emergency engine and guardian view (PH-04)
- [ ] TASK-018: Emergency record creation on NO/SOS/missed-check; idempotent (repeated misses update same record)
- [ ] TASK-019: Notification record creation for guardian; in-app polling
- [ ] TASK-020: Guardian dashboard — React view showing emergency alert with session details
- [ ] TASK-021: Deliberate emergency cancellation (guarded multi-step confirm)
- [ ] TASK-022: Emergency status screen for the user (shows active emergency state)
- [ ] TASK-023: Same-device login/logout for role switching (woman ↔ guardian demo)
- **Status:** pending

### Phase 5: Integration, testing, and demo readiness (PH-05)
- [ ] TASK-024: End-to-end manual walk: start → check-in → YES → NO → SOS → timeout → cancel
- [ ] TASK-025: Backend restart recovery test — session survives restart
- [ ] TASK-026: Location denied / network failure behavior check
- [ ] TASK-027: Guardian access restriction verification
- [ ] TASK-028: Fix in-scope defects, update docs
- [ ] TASK-029: Demo script (no fake police dispatch, no fake live location)
- **Status:** pending

### Phase 6: Optional — AI incident report (PH-06, only if P0 complete before 140min)
- [ ] TASK-030: Gemini API call for incident draft (env-var keyed, skips gracefully if key absent)
- [ ] TASK-031: Incident report editor UI — user reviews AI draft before submit
- **Status:** pending

### Phase 7: Final review (PH-08)
- [ ] TASK-032: README with local setup instructions
- [ ] TASK-033: Security scan — no hardcoded secrets, no plaintext passwords
- **Status:** pending

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Frontend: React + TypeScript + Vite | Approved by phases.md proposal; fastest component-based UI for hackathon |
| CSS: Tailwind CSS | Proposed in TRD; rapid utility-first styling |
| ORM: SQLAlchemy + Alembic | Proposed in TRD; model layer, easy SQLite init |
| Auth: JWT (python-jose + passlib[bcrypt]) | Unresolved in TRD → resolving now: stateless, standard, works for local MVP |
| Scheduler: APScheduler with SQLiteJobStore | Persistent, recovers on restart, Python-native, satisfies NFR-005 |
| Notifications: in-app only (polling) | Simplest for same-device demo; external email deferred |
| Live updates: polling (1-2s interval) | Simpler than WebSocket for same-device demo |
| Demo accounts: seeded synthetic data | No real personal data; Confirmed by Rules.md |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
