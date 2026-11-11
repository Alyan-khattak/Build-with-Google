# AMANAH AI — AI Development Rules

**Status:** Proposed project rules — approval required  
**Version:** 0.1  
**Applies to:** Any AI coding assistant and human contributor  
**Related:** All project documents, especially [PRD.md](PRD.md), [TRD.md](TRD.md), and [Architecture.md](Architecture.md)

## 1. Read before coding

1. Read all relevant files in `docs/` before changing code.
2. Treat `PRD.md` as the source of truth for product requirements.
3. Treat `TRD.md` as the source of truth for approved technical choices.
4. Treat `Architecture.md` as the source of truth for component boundaries.
5. Treat `appFlow.md` as the source of truth for navigation and interaction behavior.
6. Treat `database.md` as the source of truth for the approved data model.
7. Treat `design.md` as the source of truth for approved visual tokens and UI patterns.
8. Treat `phases.md` as a plan only; it is not proof that tasks are implemented.

## 2. Respect decision status

- **Confirmed** decisions are authoritative.
- **Proposed** decisions are not approved until the project owner explicitly approves them.
- **Inferred** details must not be silently promoted to confirmed requirements.
- **Unresolved** decisions must remain visible as TODOs or questions.
- Do not choose a new framework, database, provider, library, role, API, field, or feature without approval when it changes project direction.
- If a missing detail blocks safe implementation, ask one focused question.
- If it does not block implementation, document the assumption and proceed only within approved scope.

## 3. Product and safety rules

1. Emergency logic must never depend on Gemini or another AI service.
2. AI must not decide whether a person is safe, whether a crime occurred, whether a report is true, or whether emergency escalation should happen.
3. AI-generated incident content is a draft; the user must review and explicitly approve it.
4. Do not invent incident details, evidence, identities, accusations, or locations.
5. A missed check means unconfirmed, not proven danger.
6. NO and SOS trigger the defined emergency flow immediately; do not insert an AI step or arbitrary delay.
7. Keep the schedule anchored to the original session start: first check at +5 minutes, then every 3 minutes.
8. Each check has a 60-second response window.
9. Further missed checks during an active emergency update the existing emergency and cause another notification attempt.
10. Do not claim an alert was delivered when it was only queued or attempted.
11. Do not claim police were notified or dispatched unless a verified authorized integration confirms it.
12. Never claim browser-based monitoring works reliably when the browser is closed, suspended, or the device/backend is offline.
13. Do not present an anonymized user report as a verified crime or label an area safe because it has no reports.

## 4. Security and privacy rules

- Never store plaintext passwords.
- Never hardcode secrets, API keys, tokens, or provider credentials.
- Never expose secrets in frontend bundles, logs, screenshots, commits, or documentation.
- Enforce ownership and role permissions on the backend; frontend hiding is not authorization.
- Check guardian authorization on every protected request.
- Historical location access requires separate user authorization and must be revocable.
- Do not expose precise live location or identifying details in public community responses.
- Obtain explicit consent before public incident sharing.
- Keep public community records separate/minimized from private incident records.
- Minimize sensitive data sent to Gemini and external providers.
- Do not log full incident narratives, credentials, tokens, or precise location unless an approved operational need requires it.
- Use synthetic data for development and demonstrations wherever possible.
- Do not collect real user data until retention, deletion, backup, and security policies are approved.

## 5. Coding and architecture rules

- Follow the approved stack and documented folder structure.
- Keep the backend modular; do not introduce microservices for the local MVP without approval.
- Keep business rules out of UI-only code.
- Validate all incoming data on the backend.
- Use typed request/response models where the approved framework supports them.
- Use database transactions for emergency state transitions.
- Make scheduler event processing safe against duplicate execution.
- Persist deadlines and processing state; do not rely solely on in-memory timers.
- Keep database sessions/connections scoped correctly.
- Avoid unnecessary dependencies and large frameworks.
- Do not add features or refactor unrelated modules during a focused task.
- Reuse existing components and utilities where appropriate.
- Follow the actual formatter/linter configuration; do not invent one if none is approved.

## 6. Error handling and reliability

- Handle expected failures explicitly.
- Return useful user-facing errors without leaking stack traces or secrets.
- Do not report success until the backend confirms persistence/action.
- Preserve an emergency record if an external notification provider fails.
- Record notification state honestly.
- Recover persisted overdue scheduler events after restart according to the approved recovery policy.
- Do not promise processing while the local machine is powered off.
- Keep manual incident reporting available if Gemini is unavailable.
- Keep emergency processing available if mapping or AI services fail.

## 7. Testing rules

For each code change:
1. Add or update unit tests for changed business logic.
2. Add integration tests for changed API/database/provider boundaries where applicable.
3. Run relevant regression tests.
4. Test authorization boundaries, especially user-to-user and guardian access.
5. Test failure paths, not only successful paths.
6. Test scheduler timing using controllable/fake time where practical; do not wait real minutes for every automated test.
7. Test duplicate scheduler processing and restart recovery.
8. Record exact test commands and actual results.
9. Never claim tests passed unless they were run and passed.
10. If tests cannot run, state why and what remains unverified.

## 8. Documentation rules

- Update affected documents when requirements, APIs, data models, architecture, flows, design, or implementation constraints change.
- Do not silently rewrite approved requirements.
- Keep IDs stable; do not reuse requirement/task IDs.
- Update status labels when a proposal is approved or rejected.
- Keep diagrams consistent with code and prose.
- Record unresolved issues and implementation limitations.

## 9. Git and collaboration

No Git branching, commit-message, pull-request, or review convention has been approved. Do not invent a mandatory workflow. A simple Git workflow may be proposed for approval before team collaboration begins.

## 10. AI assistant task protocol

Before editing:
- State the requested task and relevant requirement IDs.
- Identify files expected to change.
- Identify any assumptions or blocking questions.
- Do not expand scope.

After editing:
- Summarize files changed.
- Explain implementation behavior.
- List tests run with commands and outcomes.
- List tests not run and why.
- Disclose limitations, TODOs, and deviations from documentation.
- Do not begin the next roadmap phase until its dependencies and verification gates are satisfied.

## 11. Stop conditions

Stop and ask the project owner before:
- Changing an approved technology or architecture decision.
- Adding a new user role or external integration.
- Changing emergency timing or escalation behavior.
- Changing public-sharing consent behavior.
- Exposing additional location or incident information to a guardian or public viewer.
- Implementing real police notification.
- Using real personal data or enabling public deployment.
