# AMANAH AI — UI/UX and Design System

**Status:** Proposed direction — visual design not approved  
**Version:** 0.1  
**Related:** [PRD.md](PRD.md), [appFlow.md](appFlow.md)

## 1. Design goals

The interface should communicate trust, clarity, calm, and urgency without creating unnecessary panic. Safety-critical actions must be easy to find and understand. The interface must distinguish clearly between an active session, a pending check, an unconfirmed missed check, an active emergency, and a resolved emergency.

No established brand palette, logo, typography, or visual reference has been supplied. The following is a proposal only.

## 2. Proposed visual direction

**Recommendation:** A calm, modern safety-focused interface with a light neutral base, deep navy/indigo structure, and restrained teal accents. Use red only for emergency states and destructive actions. Avoid decorative visual effects that reduce readability.

Potential directions for approval:
- A. Calm light interface with navy and teal.
- B. Dark navy interface with cyan accents.
- C. Neutral light/dark theme with accessible status colors.

Do not assume any option is approved.

## 3. Proposed design tokens

The values below are starting suggestions, not approved brand tokens.

| Token | Proposed value | Intended use |
|---|---|---|
| `color-bg` | `#F7F8FC` | Main background |
| `color-surface` | `#FFFFFF` | Cards and panels |
| `color-text` | `#172033` | Primary text |
| `color-muted` | `#5B6475` | Secondary text |
| `color-primary` | `#243B6B` | Primary navigation/actions |
| `color-accent` | `#0F9D91` | Positive/secondary accent |
| `color-warning` | `#B7791F` | Caution |
| `color-danger` | `#B42318` | Emergency/destructive |
| `color-border` | `#DCE1EA` | Dividers and outlines |

### Typography

Proposed: a widely available sans-serif stack such as Inter with system fallbacks. Exact font licensing/loading strategy is unresolved.

### Spacing and shape

Proposed baseline:
- 4px spacing scale.
- 8–12px card radius.
- 44px minimum interactive target where practical.
- Consistent spacing and alignment.
- Use shadows sparingly; rely on borders and hierarchy.

## 4. Layout and responsiveness

- Mobile-first layouts are recommended because safety sessions are likely to be used on phones, but the hackathon guardian dashboard is same-device.
- On narrow screens, use a single-column layout and keep Start Session / SOS actions easy to reach.
- On larger screens, the guardian dashboard may use a main alert panel and secondary details panel.
- Forms should use clear labels, inline validation, and readable error messages.
- Do not communicate status by color alone; include text and/or an icon.
- Breakpoint values are not selected; choose and document them during implementation if the frontend stack is approved.

## 5. Component guidance

| Component | Proposed behavior and states |
|---|---|
| Primary button | Clear verb label; default, hover, focus, disabled, loading |
| SOS button | Visually distinct and always labelled; confirmation policy must not add delay to immediate SOS |
| Check-in prompt | Clear YES and NO choices; SOS separate and unmistakable |
| Session status | Text plus icon; active/ended state |
| Emergency banner | Strong contrast, status text, timestamp, available action |
| Guardian alert card | Trigger reason, timestamp, location freshness, status |
| Location indicator | Permission, available, stale, or unavailable state |
| Consent control | Plain-language explanation of public sharing; no preselected consent |
| AI draft panel | Clearly labels generated content and requires user review |
| Map marker/legend | Explains that markers are user-reported concerns, not verified crime or safety ratings |
| Toast/feedback | Confirms only server-acknowledged operations; distinguish queued from delivered |

## 6. Screen-specific design notes

### Women's dashboard
- Prominent Start Safety Session action.
- Clear current session status.
- Next check time only if reliably known.
- SOS accessible without searching through menus.
- Location permission/freshness indicator.
- Avoid implying the service protects the user when the backend/device is offline.

### Active session
- Clear check-in prompt when due.
- YES, NO, and SOS labels must be understandable.
- Show whether the response was accepted by the backend.
- If the browser/backend is unavailable, do not show a false successful state.

### Emergency status
- Strong, calm emergency status.
- Show trigger reason and timestamp.
- Show latest available location and its timestamp, or explain that location is unavailable.
- Deliberate cancellation requires a confirmation step.
- Do not imply that external authorities have been contacted unless verified.

### Guardian dashboard
- Clear active/resolved state and last update.
- Show only information authorized by the account holder.
- Distinguish new, acknowledged, queued, and failed notification states only when those states are actually tracked.
- Same-device demonstration must support clear logout/account switching.

### Incident report
- User's original account remains editable.
- AI output is visually distinguished as a suggestion.
- Require explicit review/approval.
- Public sharing consent is separate from private submission.

### Community map
- Use a clear legend and explanatory text.
- Show publication/report dates where approved.
- Do not use green “safe area” labels or danger scores without an evidence-based, approved methodology.
- Include an empty state and map-service failure state.

## 7. Accessibility requirements

- Use semantic headings, buttons, labels, and form controls.
- All controls must be keyboard reachable with visible focus.
- Provide accessible names for icon-only controls.
- Ensure sufficient text/background contrast; validate the final palette against WCAG guidance.
- Do not rely on red/green alone to convey emergency or safety status.
- Support zoom and text resizing.
- Use plain language, short instructions, and clear confirmation feedback.
- Avoid flashing animation or sound-only alerts.
- Respect reduced-motion preferences if animation is introduced.

## 8. Motion and feedback

Motion should be minimal. Do not use animation that delays SOS or emergency actions. Any countdown must be supplementary: the backend's persisted deadline is authoritative, not a browser-only animation.

## 9. Assets and branding

No logo, illustration, photography, or official brand asset has been provided. Do not invent claims of official affiliation with police, government, or a women's organization. Use temporary text branding until a logo is approved.

## 10. Open design decisions

1. Light, dark, or adaptive theme.
2. Final palette and typography.
3. Logo and brand mark.
4. Mobile-first layout and exact breakpoints.
5. Dashboard navigation structure.
6. SOS interaction and confirmation details.
7. Map marker language and public-report visual treatment.
8. Whether Urdu/English localization is included in the MVP.
