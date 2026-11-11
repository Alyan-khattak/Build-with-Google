# AMANAH AI — Technical Requirements Document

**Status:** Draft for review — not approved  
**Version:** 0.1  
**Related:** [PRD.md](PRD.md), [Architecture.md](Architecture.md), [database.md](database.md)

## 1. Technical direction

The user's stated preferences are FastAPI for the backend, SQLite for the database, and local hosting for the hackathon. A same-device guardian portal, persistent scheduler, and local-first future direction are also confirmed.

All other technologies in this document are proposals until explicitly approved.

## 2. Technology decision register

| Area | Current choice / option | Status | Rationale / trade-off |
|---|---|---|---|
| Backend framework | Python + FastAPI | User preference; treat as selected direction | Python ecosystem, typed API definitions, suitable for a small API backend |
| Database | SQLite | Confirmed | Single local database file; simple setup; limited concurrent writes |
| Hosting | Local development machine | Confirmed | Simplifies demo; no remote guardian access by default |
| Frontend | React + TypeScript | Proposed | Component reuse and type checking; adds setup overhead |
| Frontend alternative | Plain HTML/CSS/JS | Alternative | Less setup, but harder to organize growing UI |
| Build tool | Vite | Proposed, contingent on React | Common lightweight frontend development/build tool |
| CSS | Tailwind CSS | Proposed | Rapid styling; requires configuration and class discipline |
| ORM | SQLAlchemy | Proposed | Python model layer and possible SQLite-to-PostgreSQL migration path |
| Validation | Pydantic | Proposed / FastAPI-aligned | Request/response validation |
| Authentication | JWT or secure cookie sessions | Unresolved | Must choose after comparing same-origin/local web security and implementation complexity |
| Password hashing | Argon2id or bcrypt via maintained library | Proposed | Passwords must never be stored in plaintext |
| API style | REST | Proposed | Straightforward request/response interfaces |
| Live updates | Polling initially; WebSocket alternative | Proposed / unresolved | Polling is simpler for same-device demo; WebSockets add connection lifecycle complexity |
| Scheduler | Database-driven persistent scheduler or persistent scheduler library | Unresolved | Must recover deadlines and avoid duplicate event processing |
| AI | Gemini API | Proposed | User discussed Gemini-assisted incident drafting; exact model/API version unresolved |
| Map | Leaflet + OpenStreetMap | Proposed | Lightweight map option; tile/geocoding terms and service availability must be checked |
| Location | Browser Geolocation API | Proposed for web MVP | Permission-based and subject to browser/device limitations |
| Notifications | In-app; email optional; SMS/push deferred | In-app proposed for core demo; provider unresolved | Local app can display alerts; external delivery needs internet/provider credentials |
| Development assistant | Not selected | Unresolved | User mentioned AI coding assistant but did not choose a specific tool |
| Version control | Not specified | Unresolved | Do not assume branch/commit conventions |

## 3. Runtime and environment

- Backend runtime: Python; exact supported version must be selected and recorded at setup.
- Frontend runtime: Node.js only if a JavaScript build tool/framework is approved; exact version unresolved.
- Local backend URL: proposed `http://127.0.0.1:8000`.
- Local frontend URL: depends on selected frontend tooling.
- SQLite file location: proposed `backend/data/amanah.db` or project-level `data/amanah.db`; exact path unresolved.
- Development OS: user commonly works in Windows and VS Code; this is an inferred working environment, not a strict deployment constraint.

## 4. API requirements

The API contract has not yet been designed or approved. Proposed conventions:

- Use versioned REST paths, such as `/api/v1/...`, if the team approves.
- Use JSON request/response bodies.
- Validate request data on the server.
- Return consistent error shapes without exposing stack traces or secrets.
- Enforce authentication and object-level authorization on every private resource.
- Never trust a user-supplied role, owner ID, or guardian relationship without checking it against persisted authorization data.
- Make emergency transitions idempotent or otherwise protected against duplicate processing.
- Keep AI endpoints separate from emergency-state transitions.

Detailed endpoint paths, schemas, status codes, and authentication transport remain TODOs.

## 5. Scheduler and reliability requirements

- Store session start time, next due check, response deadline, event status, and processing status durably.
- Calculate the first check at session start + 5 minutes.
- Calculate subsequent checks at 3-minute intervals anchored to session start.
- Set each check response deadline to 60 seconds after its due time.
- Explicit NO and SOS must trigger immediately.
- A missed check is unconfirmed; it is not a verified danger classification.
- Repeated missed checks during an active emergency update the same emergency and cause another notification attempt.
- Use transactional state changes and duplicate-processing protection.
- On startup, reconcile overdue events against persisted session/emergency state.
- Define how downtime affects missed deadlines; do not imply that alerts are sent while the machine is off.
- Do not rely on FastAPI `BackgroundTasks` as a durable scheduler. It is not a persistent job system.
- A simple in-process timer alone is insufficient for the confirmed persistence requirement.

The precise scheduler implementation is unresolved.

## 6. Security and privacy requirements

- Hash passwords using a maintained password-hashing implementation.
- Keep API keys and provider credentials in environment variables or an appropriate local secret store; never put them in frontend code or Git.
- Use server-side authorization for user, guardian, emergency, location, and incident data.
- Apply least privilege: guardian access is limited to information authorized by the account holder.
- Historical location access is separately user-controlled and revocable.
- Public community data must be anonymized and must not expose identity, exact live location, or identifying details.
- Obtain explicit consent before public sharing.
- Validate and sanitize user input; limit upload/file features unless specifically approved.
- Avoid logging passwords, tokens, raw precise location, or full incident narratives unnecessarily.
- Use HTTPS for any non-loopback access; local loopback development does not remove the need for secure handling of secrets.
- Treat Gemini output as untrusted draft content; user review is required.
- Emergency logic must not depend on Gemini.
- Define database backup, encryption-at-rest, retention, and deletion policies before real personal data is used.

## 7. External integrations

### Gemini

Purpose: help structure, summarize, categorize, and translate a user's own account.

Requirements:
- Send only information needed for the task.
- Do not ask the model to infer facts, evidence, identities, guilt, or whether a user is safe.
- Present output as a draft.
- Require user review and approval before submission.
- If the service fails, allow manual report creation.

Exact SDK, model, prompt contract, privacy terms, and rate limits are unresolved.

### Mapping and geolocation

- Browser location requires explicit permission and may be unavailable or inaccurate.
- Public map markers must use approved anonymized/coarsened coordinates, not precise private coordinates.
- OpenStreetMap data/tile usage and geocoding services have separate usage policies; do not assume unrestricted production tile hosting.
- Nearby police station data must come from a trusted source and be labelled with its verification status.

### Notifications

- In-app guardian dashboard is the proposed core demonstration channel.
- Email can be added only after provider and credentials are selected.
- SMS/push is deferred unless a provider and setup are available.
- Persist notification state and distinguish queued from sent/delivered/acknowledged where supported.

### Police integration

No API, authority, dispatch channel, or permission has been confirmed. A phone/call link or trusted contact directory is not equivalent to dispatch. Do not represent simulated alerts as real police notifications.

## 8. Local deployment requirements

- Backend and database run on the same development machine.
- A single backend process is assumed for the SQLite MVP unless explicitly tested otherwise.
- The machine and backend must remain running for live scheduler processing.
- Persistent storage must be used for the SQLite file; temporary directories are unsuitable.
- Database backups should be made before schema changes or demos if data matters.
- The same-device guardian portal uses a separate authenticated view/account, not shared unrestricted access.
- Remote/LAN access is not part of the confirmed demo; any later exposure requires explicit approval and secure configuration.

## 9. Testing requirements

- Unit tests for schedule calculations, response-window expiration, emergency transitions, consent decisions, and authorization logic.
- Integration tests against a temporary SQLite database for persistence and API behavior.
- Scheduler recovery tests covering restart and overdue events.
- Duplicate-processing tests for concurrent/repeated scheduler ticks.
- API tests for unauthorized access to another user's sessions, guardian data, and location history.
- AI failure tests confirming emergency functionality remains available.
- Manual end-to-end demonstration of start → check → missed response/SOS → guardian alert → resolution.
- Test location-denied, location-unavailable, and internet-unavailable states.
- Do not use real emergency services or real personal data in tests without authorization.

## 10. Observability and operations

Proposed minimum:
- Structured application logs with timestamps and event identifiers.
- Clear scheduler start/recovery logs.
- Notification attempt status and failure reason.
- Avoid sensitive payloads in logs.
- A simple health endpoint may be useful, but is not yet approved.
- No monitoring platform or analytics service has been selected.

## 11. Technical open decisions

1. Frontend framework and build tool.
2. CSS/styling approach.
3. ORM and exact database file location.
4. Authentication method and token/session storage.
5. Scheduler implementation and downtime policy.
6. REST-only versus REST plus WebSockets.
7. Notification provider and channels.
8. Gemini SDK/model and data-sharing review.
9. Map library, tile provider, and geocoding source.
10. Exact Python/Node versions and dependency pinning.
11. Backup, encryption-at-rest, retention, and deletion.
12. Whether LAN access is ever permitted for the demo.
13. Development assistant and Git workflow.
