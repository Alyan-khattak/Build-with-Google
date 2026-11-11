# AMANAH AI — Product Requirements Document

**Document status:** Draft for review — not approved  
**Version:** 0.1  
**Product tagline:** Your Safety. Your Circle. Your City.  
**Primary challenge domain:** Women Empowerment  
**Relevant SDGs:** SDG 5 — Gender Equality; SDG 11 — Sustainable Cities and Communities

> Status labels used throughout: **Confirmed** = explicitly decided or stated; **Inferred** = strongly implied; **Proposed** = recommendation requiring approval; **Unresolved** = not decided.

## 1. Product overview

AMANAH AI is an AI-assisted women's safety concept. It is intended to let a user voluntarily start a safety-monitoring session, receive scheduled check-ins, notify trusted guardians when assistance may be needed, and contribute consent-controlled, anonymized personal incident reports to a community safety map. AI may assist with structuring incident descriptions, but it must not decide whether a user is safe or control emergency escalation.

The current target is a **three-hour hackathon MVP developed with an AI coding assistant**. The MVP is a demonstrable prototype, not a production-grade emergency-response service.

## 2. Problem and opportunity

Women may want a simple way to let trusted people know that they are undertaking an activity and may need assistance if they stop responding. Community members may also benefit from carefully anonymized reports of personal safety concerns. The product aims to connect voluntary check-ins, trusted contacts, and privacy-conscious community information in one prototype.

The project does not claim that software can prevent all harm, verify that a reported incident occurred, or guarantee that emergency services will respond.

## 3. Goals

- **G-001:** Demonstrate a user-initiated safety session.
- **G-002:** Demonstrate scheduled check-ins and a defined missed-response escalation.
- **G-003:** Demonstrate an emergency record visible to an authorized guardian.
- **G-004:** Demonstrate access to the latest available location when permission and device support allow.
- **G-005:** Demonstrate AI-assisted drafting of a personal incident report, subject to user review.
- **G-006:** Demonstrate a basic community view using only approved anonymized reports or clearly labelled demo data.
- **G-007:** Keep emergency logic independent of AI availability.

## 4. Non-goals

For the three-hour MVP, the following are not promised:

- Production-grade continuous/background monitoring when a browser is closed, suspended, or the device is offline.
- Real police dispatch or an official police-system integration.
- Guaranteed SMS, push, or email delivery.
- Remote guardian access from arbitrary networks; the chosen demo arrangement is same-device.
- Full-scale public deployment, high availability, or multi-instance operation.
- Full journey routing, route deviation detection, or advanced geospatial risk analysis.
- AI determination of danger, guilt, crime occurrence, or a person's safety.
- A verified crime map or claims that an area is safe because no reports appear.

## 5. Users and roles

| Role | Status | Needs / permitted purpose |
|---|---|---|
| Woman / account holder | Confirmed product user | Start/stop own session, respond to checks, trigger SOS, manage guardian access, submit own incident report and sharing consent |
| Guardian | Confirmed product user | View emergency information explicitly authorized by the account holder |
| Public map viewer | Confirmed concept | View anonymized public community reports; registration requirement is not decided |
| Police / official responder | Proposed external stakeholder | Access or receive information only through a verified, authorized arrangement; not part of the confirmed MVP |
| Administrator | Unresolved | No admin role or administrative console has been approved |

Witness-submitted incident reports are out of scope: the user decided that incident reports must be based on the reporting user's own personal experience.

## 6. Functional requirements

Priority: **P0** = essential core demonstration; **P1** = secondary MVP capability if time permits; **Future** = deferred.

| ID | Priority | Requirement | Status / acceptance summary |
|---|---|---|---|
| FR-001 | P0 | A user can start a manual safety session without entering a destination. | Confirmed. A session record is created and its start time is persisted. |
| FR-002 | Future | A user can start a journey-based session with a destination and optional origin/expected duration. | Confirmed product concept, deferred from three-hour MVP. |
| FR-003 | P0 | The first safety check is scheduled five minutes after session start. | Confirmed. |
| FR-004 | P0 | Subsequent checks follow a three-minute cadence anchored to the original session start. | Confirmed; responding does not reset the schedule. |
| FR-005 | P0 | Each check has a 60-second response window. | Confirmed. |
| FR-006 | P0 | A YES response records that the user currently reports being safe and monitoring continues. | Confirmed. |
| FR-007 | P0 | An explicit NO or SOS triggers the emergency flow immediately, without waiting for the response window to expire. | Confirmed. |
| FR-008 | P0 | An unanswered check becomes unconfirmed after its 60-second window and triggers a guardian alert. | Confirmed. A missed check is not proof of danger. |
| FR-009 | P0 | Further missed checks during an active emergency update the existing emergency and cause another guardian notification. | Confirmed. |
| FR-010 | P0 | The user can deliberately confirm emergency cancellation/resolution. | Confirmed. Guardian receives an update. If police have already been notified, a withdrawal/update is only possible if the authorized integration supports it. |
| FR-011 | P0 | A guardian can view an alert and authorized emergency details in the same-device demonstration. | Confirmed demo choice. Guardian access must be separately authenticated/authorized. |
| FR-012 | P0 | The application requests location permission before accessing device location. | Confirmed. |
| FR-013 | P0 | If a fresh location is unavailable, an alert may use the last available location and its timestamp, or proceed without location. | Confirmed. |
| FR-014 | P1 | A user can add at least one guardian contact. | One guardian is proposed for MVP; exact guardian count and verification process unresolved. |
| FR-015 | P1 | Guardian notification attempts and their statuses are recorded. | Status model was discussed; actual external channel not selected. |
| FR-016 | P1 | Failed notifications can be queued and retried when connectivity returns. | Confirmed policy concept; actual retry mechanism and channel unresolved. |
| FR-017 | P1 | A user can create a personal incident report with AI assistance. | Confirmed. AI output is a draft and user must review/approve before submission. |
| FR-018 | P1 | AI can help structure, summarize, categorize, and translate facts supplied by the user. | Confirmed capability intent. No invented facts or evidence. |
| FR-019 | P1 | A report is shared publicly only after explicit consent. | Confirmed. Declining public sharing must not prevent private submission. |
| FR-020 | P1 | Public community reports are anonymized and do not expose identity, exact live location, or identifying details. | Confirmed principle; precision, delay, and aggregation policy unresolved. |
| FR-021 | P1 | A public map can display approved anonymized reports. | Confirmed concept; use clearly labelled sample data if real approved reports are unavailable. |
| FR-022 | Future | A user can find nearby verified police assistance and use a calling/navigation option. | Product requirement discussed; trusted data source and coverage unresolved. |
| FR-023 | Future | Official police notification can be integrated through an authorized channel. | External dependency; no real dispatch claim until authority and channel are verified. |
| FR-024 | P0 | Emergency processing must continue independently of Gemini availability. | Confirmed safety boundary. |
| FR-025 | P0 | Guardian access to historical location is controlled separately by the user and can be revoked. | Confirmed policy; detailed UI and retention rules unresolved. |
| FR-026 | P1 | If a user changes sharing preferences for previously published reports, the system asks whether prior reports should be removed or retained. | Confirmed. Until answered, previously published reports are temporarily hidden. |

### 6.1 Check-in schedule example

For a session starting at 10:00:

- 10:05 — first check.
- 10:06 — if unanswered, the 60-second response window expires and the guardian escalation is triggered.
- 10:08 — second check, anchored to session start.
- 10:09 — if unanswered, update the active emergency and send another notification.
- 10:11 — next check.

A late YES after a guardian alert has not been decided; see open questions.

## 7. Non-functional requirements

| ID | Requirement | Status |
|---|---|---|
| NFR-001 | Emergency processing must not depend on AI service availability. | Confirmed |
| NFR-002 | Private location and incident information must be protected by server-side authorization. | Confirmed principle |
| NFR-003 | Passwords must not be stored in plaintext. | Proposed baseline security requirement |
| NFR-004 | Secrets and API keys must not be committed to source control or exposed to the browser. | Proposed baseline |
| NFR-005 | Safety session deadlines and event state must survive an application restart. | Confirmed persistent-scheduler decision |
| NFR-006 | The system must distinguish queued, sent, delivered, and acknowledged notifications where the provider supports those states. | Confirmed policy |
| NFR-007 | The interface should communicate location, connectivity, monitoring, and notification limitations honestly. | Proposed |
| NFR-008 | The three-hour prototype should be runnable locally with documented setup steps. | Confirmed local-first direction |
| NFR-009 | The interface should support keyboard use, readable contrast, clear focus, and responsive layouts. | Proposed |
| NFR-010 | No safety-critical action should be delayed while waiting for AI generation. | Confirmed |

No numerical performance, availability, or scale targets have been approved.

## 8. MVP scope for the three-hour hackathon

### P0 — core demonstration

1. Local application setup and SQLite persistence.
2. Basic account/role separation sufficient for a controlled demo.
3. Manual safety session start/stop.
4. Anchored 5-minute / 3-minute check scheduling and 60-second response window.
5. YES, NO, SOS, missed-check, emergency update, and deliberate cancellation paths.
6. Persistent scheduler recovery after backend restart, within the limits of a running local machine.
7. Same-device guardian dashboard showing an emergency record and latest available location.
8. A clear indication that this is a local prototype and not a guaranteed emergency service.

### P1 — attempt only after P0 works

- One guardian contact workflow.
- Gemini-assisted incident draft with user review.
- Consent-controlled public report and simple community map using approved or clearly labelled demo data.
- Browser geolocation.
- In-app guardian notifications.

### Deferred

Journey sessions, route deviation, remote guardian access, SMS/push delivery, real police dispatch, advanced public-map aggregation, full production identity verification, and production deployment.

**Timebox note:** This is an aggressive three-hour target with an AI coding assistant and prepared development environment. The team should prioritize a verified P0 workflow over partially implemented P1 features. The earlier proposed minute-by-minute schedule is a planning estimate, not a guarantee.

## 9. Risks and dependencies

| Risk / dependency | Impact | Mitigation / disclosure |
|---|---|---|
| Local laptop stops or sleeps | Scheduler cannot execute while stopped | Keep machine/backend running; recover overdue events on restart; disclose limitation |
| Browser closes or suspends | Browser-side location and UI timers may stop | Do not rely on browser timers as authoritative scheduler |
| No internet | External AI/maps/email cannot be reached; notifications cannot transmit | Keep emergency logic local; queue external notifications for retry |
| GPS unavailable | No fresh location | Send alert with last known timestamped location or without location |
| Guardian same-device demo | Does not prove remote delivery | Demonstrate account separation and label demo scope |
| SQLite write contention | Concurrent writes may contend | Single local application instance; keep write transactions short |
| Gemini unavailable or inaccurate | AI draft unavailable or needs correction | Manual reporting remains possible; user reviews all AI output |
| Police integration unavailable | No official dispatch | Do not represent a simulated alert as police dispatch |
| Public report re-identification | Privacy/safety harm | Minimize and coarsen public data; unresolved publication rules must be approved |

## 10. Success criteria

No numerical targets are approved. For the hackathon demonstration, proposed qualitative criteria are:

- A manual session can be created and persisted.
- A check is due at the correct anchored time.
- A missed check triggers the intended emergency transition.
- An SOS/NO bypasses the grace period.
- The guardian dashboard displays the alert without exposing unauthorized historical details.
- Emergency cancellation generates a resolution update.
- AI failure does not interrupt emergency processing.
- Public reports are not exposed without consent and anonymization safeguards.

## 11. Open questions

1. What happens when a late YES arrives after the guardian has already been alerted?
2. What exactly ends a session: manual end, normal journey completion, emergency cancellation, or automatic expiration?
3. How many guardians are allowed in the final product? Is one sufficient for the MVP?
4. Which notification channels are required: in-app, email, SMS, push?
5. What happens if all guardian notification attempts fail? Should another guardian be contacted?
6. What verification is required for guardian contacts?
7. What is the public map's location precision, publication delay, and minimum aggregation threshold?
8. How long are location histories, emergency records, and incident reports retained?
9. What is the account deletion and data deletion policy, including any legal holds?
10. Which police authority, official channel/API, data-sharing permission, and acknowledgment process would support real police integration?
11. How are police accounts verified and authorized?
12. What are the exact session-expiration rules?
13. Is public map viewing available to unregistered visitors?
14. What happens when the user changes sharing consent for previously published reports? The current temporary-hide/ask policy is established, but the final retention outcome remains user-dependent.
15. Does the hackathon demonstration use real email delivery or in-app alerts only?

## 12. Glossary

- **Safety session:** A user-initiated period during which scheduled check-ins are expected.
- **Check-in:** A prompt asking the user to confirm their current status.
- **Unconfirmed / missed check:** A check for which no response arrived within the response window; not proof of danger.
- **Emergency record:** Persistent record of an SOS, explicit NO, or missed-check escalation.
- **Guardian:** A trusted person granted defined access by the account holder.
- **Public community report:** A personal-experience incident report explicitly consented to for anonymized public sharing.
- **Anchored schedule:** Check times calculated from the original session start rather than reset by responses.
