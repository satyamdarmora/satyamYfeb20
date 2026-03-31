# CSP APP — Service Resolution (Restore) Flow Visual Spec v1.0

**Date:** March 31, 2026
**Surface:** Restore Flow (task arrival → resolution → verification → closure)
**Depends on:**
- Home Screen Visual Spec v2.3 (LOCKED) — card spec, tokens, interaction rules
- Home Screen Visual Spec v2.3.1 (Addendum) — execution modes (DIRECT/ACTION_SHEET/DRILLDOWN_REQUIRED), rollback, passive state, type icons, "देखें ›", time-limited card display
**Brief:** UX Agent Brief — Service Resolution (Restore) v1 (FINAL)
**Status:** Draft — pending freeze

---

## 0. Objective

```
Primary job: Make restore task urgency obvious. CSP acts NOW.
Secondary job: Guide CSP through resolution with proof.
Key principle: Restore ≠ Install. No scheduling. No choosing.
Every minute counts. One CTA per card. System guides proof.
```

---

## 1. Surface Classification

| Surface | Type | Job |
|---|---|---|
| Restore Card (L0/L2) | Execution (Home card) | Single action per state |
| Restore Drilldown | Hybrid | Context + guided proof + resolve + supporting actions |
| Executor Assignment Sheet | ACTION_SHEET | Team selection |
| Diagnose Router Fault Sheet | ACTION_SHEET | Structured diagnosis |

---

## 2. Card Field Values

All cards use Home v2.3 §5 container. Type icon 🔧 `build` per Addendum §5. "देखें ›" at trailing edge per Addendum §6 — **except terminal states (RESOLVED, RECLASSIFIED) and PLATFORM_TAKEOVER which are non-interactive/departing.** **Red accent always** (`accent.restore` #C62828). No secondary CTA on any card.

### 2.1 Identity line (all states, never changes)

```
[🔧] Restore · #CN-8842 · सेक्टर 22                     देखें ›
```

| Element | Spec |
|---|---|
| Icon | `build` (filled wrench), 18dp, `text.secondary` |
| Label + ID + Locality | `type.cardIdentity` (14sp/600), `text.primary` |
| "देखें ›" | `type.bodySmall` (12sp/400), `text.secondary`, trailing edge, aligned with identity line |
| Accent | `accent.restore` (#C62828) — **always red. Never changes regardless of state.** |

### 2.2 Active states (ONE primary CTA each, no secondary)

**State 1: RESPOND_NOW** (task arrived — highest urgency)

```
┌─[4dp RED]───────────────────────────────────────┐
│  [🔧] Restore · #CN-8842 · सेक्टर 22            │ देखें ›
│  [reason_template] · 18 मिनट बाकी               │
│                                [शुरू करें]        │
└──────────────────────────────────────────────────┘
```

- Timer: P_SR_RESPONSE_WINDOW (20-30 min). Server-sent.
- CTA: `[COPY:cta.start_work]` — "शुरू करें" (DIRECT). Logs first response.
- **No Call on this state.** CSP hasn't committed yet. Phone access comes after Start Work.

**State 2: WORKING** (responded — resolving within SLA)

```
┌─[4dp RED]───────────────────────────────────────┐
│  [🔧] Restore · #CN-8842 · सेक्टर 22            │ देखें ›
│  [reason_template] · 3 घंटे 20 मिनट बाकी        │
│                                [ठीक करें]         │
└──────────────────────────────────────────────────┘
```

- Timer: P91 (4h) or P92 (24h) based on issue type. Server-sent.
- CTA: `[COPY:cta.resolve]` — "ठीक करें" (DRILLDOWN_REQUIRED). Opens resolve drilldown.
- **Call + Diagnose available in drilldown, not on card.**

**State 3: ESCALATED_CSP_ACTIVE** (Tier 0/1 — still can resolve)

```
┌─[4dp RED]───────────────────────────────────────┐
│  [🔧] Restore · #CN-8842 · सेक्टर 22            │ देखें ›
│  ⚠ [reason_template] · P93 timer                │
│                                [ठीक करें]         │
└──────────────────────────────────────────────────┘
```

- ⚠ prefix on reason line. `state.warning` (#BF360C) text color on reason.
- Timer: P93 (escalation intervention). Server-sent.
- CTA: `[COPY:cta.resolve]` — "ठीक करें" (DRILLDOWN_REQUIRED).
- **Same CTA as WORKING. Urgency communicated by ⚠ + timer, not by CTA change.**

**State 6: CUSTOMER_DENIED** (verification failed — back to work)

```
┌─[4dp RED]───────────────────────────────────────┐
│  [🔧] Restore · #CN-8842 · सेक्टर 22            │ देखें ›
│  ⚠ [reason_template] · P93 timer                │
│                                [ठीक करें]         │
└──────────────────────────────────────────────────┘
```

- Same rendering as ESCALATED_CSP_ACTIVE. Tier incremented. Card re-activates.
- CTA: `[COPY:cta.resolve]` — "ठीक करें" (DRILLDOWN_REQUIRED).

### 2.3 Passive states (NO CTA)

**State 4: ESCALATED_PLATFORM_TAKEOVER** (Tier 2 — CSP losing task)

```
┌─[4dp RED]───────────────────────────────────────┐
│  [🔧] Restore · #CN-8842 · सेक्टर 22            │
│  [COPY:reason.platform_takeover]                 │
│                                                  │
└──────────────────────────────────────────────────┘
```

No CTA. No phone. No "देखें ›." Task is leaving CSP — drilldown adds no value. Card shows state, then disappears. Per Addendum §4.

**State 5: VERIFICATION_PENDING** (CSP submitted — system checking)

```
┌─[4dp RED]───────────────────────────────────────┐
│  [🔧] Restore · #CN-8842 · सेक्टर 22            │ देखें ›
│  [COPY:reason.verifying]                         │
│                                                  │
└──────────────────────────────────────────────────┘
```

No CTA. No phone. System verifying. **"देखें ›" stays** — CSP has genuine info need ("did my fix work?"). Drilldown shows proof status. Card body tap → drilldown.

### 2.4 Terminal states (time-limited display per Addendum §4a)

**State 7: RESOLVED**

```
┌─[4dp RED]───────────────────────────────────────┐
│  [🔧] Restore · #CN-8842 · सेक्टर 22            │
│  ✓ [COPY:reason.resolved]                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

- `state.positive` (#2E7D32) text + ✓ prefix on reason line.
- Displays 3-5 seconds (server-configured `dismiss_after_seconds`).
- Not tappable. No "देखें ›". Pure confirmation, then card exits.

**State 8: RECLASSIFIED** (router fault confirmed)

```
┌─[4dp RED]───────────────────────────────────────┐
│  [🔧] Restore · #CN-8842 · सेक्टर 22            │
│  [COPY:reason.reclassified]                      │
│                                                  │
└──────────────────────────────────────────────────┘
```

- Displays briefly, then card exits. Task transferred to platform.
- Not tappable. No "देखें ›". Same as RESOLVED.

### 2.5 CTA summary

| State | Primary CTA | Mode | Call? | Diagnose? |
|---|---|---|---|---|
| RESPOND_NOW | शुरू करें | DIRECT | ❌ | ❌ |
| WORKING | ठीक करें | DRILLDOWN_REQUIRED | Drilldown | Drilldown |
| ESCALATED_CSP_ACTIVE | ठीक करें | DRILLDOWN_REQUIRED | Drilldown | Drilldown |
| ESCALATED_PLATFORM_TAKEOVER | — | — | ❌ | ❌ |
| VERIFICATION_PENDING | — | — | ❌ | ❌ |
| CUSTOMER_DENIED | ठीक करें | DRILLDOWN_REQUIRED | Drilldown | Drilldown |
| RESOLVED | — (time-limited) | — | ❌ | ❌ |
| RECLASSIFIED | — (time-limited) | — | ❌ | ❌ |

**Every card: zero or one CTA. No secondary. No decision forks.**

### 2.6 Card rules

- **Red accent always.** `accent.restore` (#C62828). Never changes regardless of state or escalation tier.
- **🔧 icon always.** Type-level. Fixed for card lifetime.
- **One CTA max per card.** Call, Diagnose, Assign → drilldown only.
- **No exit/decline.** Escalation handles non-response.
- **No [Details] CTA.** "देखें ›" + card body tap handles drilldown.
- **Reason line: one line max.** Truncate with ellipsis.
- **Timer on every bottleneck state.** Server-sent. App renders.

### 2.7 Escalation ⚠ + timer stacking rule

The reason line can have both ⚠ escalation prefix AND timer background strip. Precedence:

| Timer state | ⚠ text color | Background |
|---|---|---|
| `normal` | `state.warning` (#BF360C) | None |
| `urgent` | `state.warning` (#BF360C) | `bg.urgent` (#FFF3E0) — sufficient contrast |
| `overdue` | `state.negative` (#C62828) | `bg.overdue` (#FFEBEE) — ⚠ switches to `state.negative` to maintain contrast |

**Rule:** When timer bg is `bg.overdue` (red-tinted), ⚠ text uses `state.negative` (not `state.warning`) to avoid orange-on-red low contrast.

### 2.8 Deadline on card

| State | Timer on card? | Which deadline? |
|---|---|---|
| RESPOND_NOW | ✅ | P_SR_RESPONSE_WINDOW (20-30 min) |
| WORKING | ✅ | P91 (4h) or P92 (24h) by issue type |
| ESCALATED_CSP_ACTIVE | ✅ | P93 (escalation intervention) |
| CUSTOMER_DENIED | ✅ | P93 (re-escalation timer) |
| ESCALATED_PLATFORM_TAKEOVER | ❌ | — |
| VERIFICATION_PENDING | ❌ | — |
| RESOLVED / RECLASSIFIED | ❌ | — |

### 2.9 Masked calling rules

| Rule | Value |
|---|---|
| When available | From WORKING state onward. NOT in RESPOND_NOW. |
| Where | **Drilldown only.** Not on card. |
| Mechanism | DIRECT — tap → masked call. No number displayed. |
| Server-driven | `masked_call_available: true/false` |
| Disappears | VERIFICATION_PENDING, RESOLVED, PLATFORM_TAKEOVER |

**Why not on card:** Restore card = single CTA (Resolve). Call is a supporting action during resolution, not a separate decision. Drilldown provides it alongside proof and diagnosis.

---

## 3. Restore Drilldown (DRILLDOWN_REQUIRED)

**Entry:** Card body tap, "देखें ›", or tap "ठीक करें" CTA (DRILLDOWN_REQUIRED mode opens drilldown directly).

This is the primary working surface for Restore. CSP enters here to resolve with proof.

### 3.1 Layout — RESPOND_NOW (minimal)

```
┌──────────────────────────────────────────────────┐
│  ‹ वापस                                          │
│                                                   │
│  [🔧] Restore · #CN-8842                         │
│                                                   │
│  ── स्थिति ─────────────────────────────────     │
│  [COPY:status_label]                             │
│  ⏱ जवाब का समय: 18 मिनट बाकी                    │
│                                                   │
│  ── स्थान ──────────────────────────────────     │
│  [Full service address]                           │
│  Issue: [SERVICE_ISSUE / INSTALLATION_DEFECT]    │
│                                                   │
│  [ [COPY:cta.start_work] — शुरू करें ]           │
│                                                   │
└──────────────────────────────────────────────────┘
```

No proof. No executor. No call. No diagnose. No timeline. CSP sees where → taps Start Work → done.

### 3.1b Layout — WORKING / ESCALATED / CUSTOMER_DENIED (resolve-focused)

```
┌──────────────────────────────────────────────────┐
│  ‹ वापस                                          │
│                                                   │
│  [🔧] Restore · #CN-8842                         │
│                                                   │
│  ── स्थिति ─────────────────────────────────     │
│  [COPY:status_label]                             │
│  ⏱ SLA: X hours remaining                       │
│  [Escalation tier badge if applicable]            │
│                                                   │
│  ── Proof ──────────────────────────────────     │
│  Device check: ⏳ checking...                     │  ← auto, always running
│                                                   │
│  ▶ [COPY:proof.run_check]                        │  ← ONE active step
│    (or ✅ Passed / ❌ Failed)                     │
│                                                   │
│  [ [COPY:cta.resolve] — ठीक करें ]              │  ← disabled until ≥1 proof passes
│                                                   │
│  ▸ स्थान ──────────────────────── (collapsed)    │
│  ▸ व्यक्ति ─────────────────────── (collapsed)   │
│  ▸ संपर्क ──────────────────────── (collapsed)   │
│  ▸ Diagnose ────────────────────── (collapsed)   │
│  ▸ [COPY:event_timeline] ────────── (collapsed)  │
│                                                   │
└──────────────────────────────────────────────────┘
```

Above fold = Status + Proof + Resolve. Everything else collapsed. CSP expands if needed.

### 3.2 Drilldown varies by state

**RESPOND_NOW drilldown (minimal — CSP needs "where?" then "शुरू करें"):**

| Section | Content | Default |
|---|---|---|
| Status | Current state + response window timer | Expanded |
| Location | Service address + issue type | Expanded |
| Start Work CTA | "शुरू करें" — same as card CTA | Expanded |

That's it. No proof, no executor, no call, no diagnose, no timeline. CSP sees where to go, taps Start Work. Fast.

**WORKING / ESCALATED / CUSTOMER_DENIED drilldown (resolve-focused):**

| Section | Content | Default |
|---|---|---|
| Status | Current state + escalation tier + SLA timer | **Expanded** (above fold) |
| **Proof (guided)** | **System-guided. ONE active step. See §3.3.** | **Expanded** (above fold — core of drilldown) |
| Resolve CTA | "ठीक करें" — disabled until ≥1 proof passes | **Expanded** (above fold) |
| Location | Service address + issue type | **Collapsed** (CSP already knows from RESPOND_NOW) |
| Executor | Assigned name. Reassign if allowed. | **Collapsed** |
| Contact | Masked call CTA | **Collapsed** |
| Diagnose | Link to diagnosis sheet. Within reclass window only. | **Collapsed** |
| Timeline | Event log | **Collapsed** |

**Above fold = Status + Proof + Resolve.** Everything else is one tap to expand. Restore CSP wants to fix, not read.

### 3.3 Guided Proof Flow (NOT a checklist)

**Principle:** CSP should not choose proof strategy. System guides it.

The proof section shows **one active step at a time,** not a checklist of options.

**How it works:**

1. **Device Event** runs automatically in background at all times. If device reconnects → auto-passes → Resolve enables immediately. CSP may never see other proof steps.

2. If Device Event hasn't resolved it → system shows **one active proof step:** "Run System Check" as the primary action.

3. CSP taps → system queries telemetry → result returns (✅ Pass / ❌ Fail / ⏳ Pending).

4. If passes → Resolve enables.

5. If fails → system shows next step: "Request Customer Confirmation."

6. CSP taps → customer prompted → result returns async.

**What CSP sees at each stage:**

```
Stage 1 (auto):
  Device check: ⏳ checking...
  ▶ System check करें                    ← active step

Stage 2 (after system check passes):
  Device check: ⏳ checking...
  System check: ✅ passed
  [ ठीक करें ]                           ← ENABLED

Stage 3 (after system check fails):
  Device check: ⏳ checking...
  System check: ❌ failed
  ▶ Customer से पुष्टि लें               ← next step appears

Stage 4 (customer confirmation pending):
  Device check: ⏳ checking...
  System check: ❌ failed
  Customer confirmation: ⏳ waiting...
```

**At ANY stage:** If Device Event passes (device reconnects), Resolve enables immediately regardless of which guided step the CSP is on.

### 3.4 Proof item spec

| Proof item | CSP action | System behavior | Result states |
|---|---|---|---|
| Device Event | None — auto | System monitors device reconnect | ✅ Reconnected / ⏳ Checking |
| System Check | Tap "System check करें" | System queries telemetry | ✅ Pass / ❌ Fail / ⏳ Pending |
| Customer Confirm | Tap "Customer से पुष्टि लें" | System sends prompt to customer | ✅ Confirmed / ❌ Denied / ⏳ Waiting |

**Resolve enabled when:** ≥1 proof shows ✅. Server validates independently — CSP self-declaration alone is not proof.

### 3.5 Proof result rendering

| Result | Icon | Color | Style |
|---|---|---|---|
| ✅ Pass/Confirmed/Reconnected | Checkmark | `state.positive` | `type.body` |
| ❌ Fail/Denied | Cross | `state.negative` | `type.body` |
| ⏳ Pending/Checking/Waiting | Spinner or dots | `text.hint` | `type.bodySmall` |

**Live updates:** Proof results update in real-time without CSP re-opening drilldown. Drilldown must support push-based or polling updates for proof status.

### 3.6 Diagnose Router Fault (exception path)

Available in drilldown when:
- State is WORKING or ESCALATED_CSP_ACTIVE or CUSTOMER_DENIED
- Within P_SR_RECLASS_WINDOW (24-48h from assignment)

Rendered as text link in drilldown: `text.secondary`, below Contact section, above Timeline. Same subordinate treatment as Exit in Install.

**Stacking constraint (non-negotiable):**
- Diagnose must ALWAYS be below Resolve CTA
- Diagnose must ALWAYS be below Contact section
- Diagnose must NEVER appear above any primary action
- Visual treatment: `text.secondary`, 14sp/400 — must not compete with Resolve

Tap → opens Diagnose Router Fault ACTION_SHEET (§4.2).

**Not on card.** Exception path = drilldown only.

---

## 4. Action Sheets

All use shared ACTION_SHEET container (Addendum v2.3.1 §1).

### 4.1 Executor Assignment Sheet

Same as Install. CSP self pre-selected. No technicians → skip.

**Available from WORKING state onward only.** Not during RESPOND_NOW. Start Work is the ONLY valid first response — it cannot be bypassed by assigning an executor.

### 4.2 Diagnose Router Fault Sheet

**Trigger:** Text link in drilldown.

```
┌──────────────────────────────────────────────────┐
│          ─── (handle)                             │
│                                                   │
│  [COPY:diagnose.title]                            │  ← "Device issue diagnose करें"
│                                                   │
│  Device: [Device ID picker / scanner]             │
│                                                   │
│  ○  [COPY:fault.DEVICE_MALFUNCTION]              │
│  ○  [COPY:fault.POWER_FAILURE]                   │
│  ○  [COPY:fault.PHYSICAL_DAMAGE]                 │
│  ○  [COPY:fault.FIRMWARE_ISSUE]                  │
│                                                   │
│  [COPY:diagnose.system_will_verify]              │  ← "System verify करेगा"
│                                                   │
│  [ [COPY:cta.submit_diagnosis] ]                 │  ← disabled until both filled
│                                                   │
└──────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Input | Device ID (required) + fault code (radio, required) |
| Submit | Primary atom. Disabled until both filled. |
| Note below submit | `[COPY:diagnose.system_will_verify]` — `type.bodySmall`, `text.secondary` |
| Time constraint | Available only within P_SR_RECLASS_WINDOW |
| No free text | Structured codes only |

**On submit:** Sheet closes. If system confirms → card → RECLASSIFIED → exits. If system denies → card returns to previous state. Toast either way.

---

## 5. Post-Action Behavior

| Action | Before | After | Mechanism |
|---|---|---|---|
| Start Work | RESPOND_NOW | WORKING | DIRECT optimistic. Timer switches to P91/P92. |
| Resolve (proof submitted) | WORKING / ESCALATED / CUSTOMER_DENIED | VERIFICATION_PENDING | Server confirms from drilldown. No optimistic. |
| Diagnose Router Fault | WORKING / ESCALATED | RECLASSIFIED (if confirmed) or back to previous | ACTION_SHEET → server confirms. |
| Call Customer | WORKING / ESCALATED | No state change | DIRECT. Fail → error toast. |
| Assign Executor | WORKING / ESCALATED | Same state (executor changed) | ACTION_SHEET → server refresh. |

**First response rule:** Start Work is the ONLY valid first response. No other action (Assign, Call, Diagnose) can satisfy P_SR_RESPONSE_WINDOW. CSP must tap "शुरू करें" first.

### Verification outcomes

| Result | Card behavior |
|---|---|
| Telemetry confirms (SYSTEM_VERIFIED) | → RESOLVED → time-limited display → exits |
| Customer confirms (CUSTOMER_CONFIRMED) | → RESOLVED → time-limited display → exits |
| Customer denies | → CUSTOMER_DENIED (ESCALATED, tier incremented). Resolve CTA returns. |
| Timeout + telemetry inconclusive (AUTO_RESOLVED) | → RESOLVED → exits |

### Start Work rollback

| Scenario | Behavior |
|---|---|
| Server confirms | Full refresh. Card → WORKING. |
| Server rejects | Revert to RESPOND_NOW. Error toast. |

**Resolve = DRILLDOWN_REQUIRED.** Server confirms before UI updates. No optimistic behavior for Resolve.

---

## 6. No Exit (Unlike Install)

Install has exit because it's growth-opportunity (L6). Restore is customer harm (L0/L2).

**CSP cannot decline, exit, or opt out.**

System handles non-response:
- Tier 0: First response missed → warning
- Tier 1: SLA breached → supervisor notified
- Tier 2: Platform takes over → CSP's task closed

The ONE CSP-initiated alternative: **Diagnose Router Fault** — "this is hardware, not me." This is a diagnosis, not a decline. Available in drilldown only, within time window, system verifies independently.

---

## 7. Edge States

| State | Treatment |
|---|---|
| No restore tasks | No card |
| P_SR_RESPONSE_WINDOW expires | Auto-escalation. Card → ESCALATED_CSP_ACTIVE. |
| P91/P92 expires | Auto-escalation. Card → ESCALATED_CSP_ACTIVE. |
| P93 expires | Platform takeover. Card → ESCALATED_PLATFORM_TAKEOVER → disappears. |
| Customer denied | Card re-activates at ESCALATED. Tier incremented. |
| Offline | All CTAs disabled. Toast. |
| Start Work server reject | Revert to RESPOND_NOW. Toast. |
| Call fails | Error toast. Card unchanged. |
| Diagnose rejected by system | Card returns to previous state. Toast: "Diagnosis not confirmed." |

---

## 8. Notifications

| Event | Push? | Key |
|---|---|---|
| New restore task | ✅ | `notif.new_restore` |
| Response window urgent | ✅ | `notif.respond_now` |
| Tier 0 missed | ✅ | `notif.escalated_tier0` |
| Tier 1 SLA breached | ✅ | `notif.escalated_tier1` |
| Customer denied | ✅ | `notif.customer_denied` |
| Platform takeover | ❌ (inbox) | — |
| Resolved | ❌ | Card shows it |

---

## 9. Behavioral Invariants (22)

| # | Invariant |
|---|---|
| 1 | **Red accent always.** `accent.restore`. Never changes with state or escalation. |
| 2 | **🔧 icon always.** Type-level. Fixed for card lifetime. |
| 3 | **ONE CTA per card max.** No secondary. Call, Diagnose, Assign → drilldown. |
| 4 | **No exit/decline.** Escalation handles non-response. |
| 5 | **No Call in RESPOND_NOW.** Phone access after Start Work. |
| 6 | **Resolve = DRILLDOWN_REQUIRED.** Must enter drilldown, complete proof, submit. |
| 7 | **Guided proof, not checklist.** System shows one step at a time. Device Event runs in background. |
| 8 | **Resolve disabled until ≥1 proof passes.** Server validates independently. |
| 9 | **Diagnose Router Fault = drilldown only.** Exception path. Within reclass window. |
| 10 | **Escalation ⚠ = state.warning text, not new primitive.** Uses existing token. |
| 11 | **Timer stacking: overdue bg → ⚠ uses state.negative.** Contrast preservation. |
| 12 | **RESOLVED = time-limited display.** 3-5 seconds, then card exits. Per Addendum §4a. |
| 13 | **CUSTOMER_DENIED = card re-activates.** Backward transition. Tier incremented. |
| 14 | **No customer name or phone.** Masked call only. From drilldown. |
| 15 | **Timer on every bottleneck state.** Server-sent. |
| 16 | **Passive states = zero CTAs.** PLATFORM_TAKEOVER, VERIFICATION_PENDING. |
| 17 | **Proof updates live.** Drilldown supports real-time proof result updates. |
| 18 | **Full refresh after every action.** |
| 19 | **Start Work = ONLY valid first response.** No other action (Assign, Call, Diagnose) satisfies P_SR_RESPONSE_WINDOW. |
| 20 | **No "देखें ›" on terminal states + PLATFORM_TAKEOVER.** Departing or non-actionable cards show no navigation affordance. |
| 21 | **RESPOND_NOW drilldown = minimal.** Status + location + Start Work only. No proof, no assign, no call, no diagnose. |
| 22 | **Diagnose always below Resolve.** Exception actions never above primary action in drilldown. |

---

## 10. Hindi Label Keys (42 keys)

### Reason line keys (8)

| Key | Hindi | English |
|---|---|---|
| `reason.respond_now` | कनेक्शन खराब — अभी जाएं | Connection down — go now |
| `reason.working` | ठीक कर रहे हैं | Working on it |
| `reason.escalated` | ⚠ समय बढ़ रहा — अभी ठीक करें | Escalated — resolve now |
| `reason.platform_takeover` | प्लेटफ़ॉर्म संभाल रहा है | Platform taking over |
| `reason.verifying` | जाँच हो रही है | System verifying |
| `reason.customer_denied` | ⚠ ग्राहक ने कहा ठीक नहीं हुआ | Customer says not resolved |
| `reason.resolved` | ✓ ठीक हो गया | Resolved |
| `reason.reclassified` | Device issue — प्लेटफ़ॉर्म देखेगा | Router fault — platform handling |

### CTA keys (4)

| Key | Hindi | English |
|---|---|---|
| `cta.start_work` | शुरू करें | Start work |
| `cta.resolve` | ठीक करें | Resolve |
| `cta.call_customer` | कॉल करें | Call customer |
| `cta.submit_diagnosis` | भेजें | Submit diagnosis |

### Executor keys (3)

| Key | Hindi | English |
|---|---|---|
| `executor.title` | कौन ठीक करेगा? | Who will fix? |
| `executor.self` | मैं खुद करूँगा | I'll fix it |
| `cta.assign` | चुनें | Assign |

### Diagnosis keys (6)

| Key | Hindi | English |
|---|---|---|
| `diagnose.title` | Device issue diagnose करें | Diagnose device issue |
| `fault.DEVICE_MALFUNCTION` | Device खराब | Device malfunction |
| `fault.POWER_FAILURE` | बिजली की समस्या | Power failure |
| `fault.PHYSICAL_DAMAGE` | शारीरिक नुकसान | Physical damage |
| `fault.FIRMWARE_ISSUE` | Firmware समस्या | Firmware issue |
| `diagnose.system_will_verify` | System verify करेगा | System will verify |

### Proof keys (8)

| Key | Hindi | English |
|---|---|---|
| `proof.device_event` | Device reconnect | Device reconnect |
| `proof.system_check` | System check | System connectivity check |
| `proof.customer_confirm` | Customer confirmation | Customer confirmation |
| `proof.run_check` | System check करें | Run system check |
| `proof.request_confirm` | Customer से पुष्टि लें | Request confirmation |
| `proof.pass` | ✅ पास | Passed |
| `proof.fail` | ❌ फ़ेल | Failed |
| `proof.pending` | ⏳ जाँच हो रही | Checking |

### Notification keys (5)

| Key | Hindi | English |
|---|---|---|
| `notif.new_restore` | कनेक्शन खराब — अभी जाएं | Connection down — go now |
| `notif.respond_now` | जवाब का समय खत्म हो रहा | Response window closing |
| `notif.escalated_tier0` | जवाब नहीं दिया — अभी ठीक करें | First response missed |
| `notif.escalated_tier1` | SLA टूट गया — supervisor को पता चला | SLA breached |
| `notif.customer_denied` | ग्राहक ने कहा ठीक नहीं हुआ — फिर करें | Customer denied — try again |

### Context keys (5)

| Key | Hindi | English |
|---|---|---|
| `event_timeline` | इतिहास | Event history |
| `contact.call_label` | कॉल करें | Call |
| `drilldown.status_section` | स्थिति | Status |
| `drilldown.location_section` | स्थान | Location |
| `drilldown.proof_section` | Proof | Proof |

### Status labels (3)

| Key | Hindi | English |
|---|---|---|
| `status.responding` | जवाब बाकी | Responding |
| `status.working` | काम चल रहा है | Working |
| `status.escalated` | Escalated | Escalated |

**Total: 42 keys.**

---

## 11. Component Map

| Need | Source | New? |
|---|---|---|
| Card container, primary CTA, timer, accent | Home v2.3 §5 | No |
| Type icon (🔧) | Addendum v2.3.1 §5 | No (Home-level) |
| "देखें ›" | Addendum v2.3.1 §6 | No (Home-level) |
| ACTION_SHEET container | Addendum v2.3.1 §1 | No |
| Toast | Addendum v2.3.1 §3 | No |
| Time-limited display | Addendum v2.3.1 §4a | No (Home-level) |
| MaskedCallCTA | Install v1.4 | No (reuse) |
| Executor sheet | Install v1.4 | No (reuse) |
| **GuidedProofFlow** | — | **Yes** — one-step-at-a-time proof with async result updates |
| **ProofStepResult** | — | **Yes** — ✅/❌/⏳ rendering per proof item |
| **DiagnoseFaultSheet** | — | **Yes** — device ID + fault code sheet |
| **EscalationBadge** | — | **Yes** — ⚠ prefix rendering with contrast stacking |

4 new components.

---

## 12. Differences from Install

| Dimension | Install | Restore |
|---|---|---|
| Urgency | Days (scheduled) | Minutes/hours (immediate) |
| Accent | Grey | **Red always** |
| First action | Propose Slots (ACTION_SHEET) | Start Work (DIRECT) |
| Exit | Yes (drilldown) | **No — escalation handles** |
| Scheduling | 2-slot, 2-round | **None** |
| Proof | Onsite module (separate) | **In this module (guided flow)** |
| Escalation | Scheduling failure | **Tier 0 → 1 → 2 → platform** |
| Phone | Day of slot, on card | **WORKING onward, drilldown only** |
| Card CTA count | 1 (exception: Call on slot-day) | **Always 1, no exceptions** |
| Verification | Invisible to CSP | **Visible: VERIFICATION_PENDING** |

---

## 13. What NOT to Build

- No decline/exit button
- No resolve without proof
- No customer name or phone
- No phone before WORKING state
- No phone on card (drilldown only)
- No Quality OS scores
- No escalation blame language ("you failed")
- No manual escalation button
- No Tier 2 platform surfaces
- No incident/outage blocks (separate module)
- No accent color change by escalation tier
- No animations beyond fade
- No summary counters
- No multiple CTAs on card

---

## 14. Validation Checklist

| # | Check |
|---|---|
| 1 | Red accent on every restore card (never grey) |
| 2 | 🔧 icon on identity line |
| 3 | ONE CTA per card. Never two. |
| 4 | Start Work = 1 tap (DIRECT) |
| 5 | Resolve opens drilldown with guided proof |
| 6 | Guided proof: one step at a time, not checklist |
| 7 | Device Event runs in background always |
| 8 | Resolve disabled until ≥1 proof passes |
| 9 | Call only in drilldown, only WORKING+ |
| 10 | Diagnose only in drilldown, within reclass window |
| 11 | ⚠ escalation visible on card reason line |
| 12 | Timer stacking: overdue bg → ⚠ uses state.negative |
| 13 | RESOLVED: brief display (3-5s) then exits |
| 14 | CUSTOMER_DENIED: card re-activates at ESCALATED |
| 15 | No exit/decline anywhere |
| 16 | Passive states = zero CTAs |
| 17 | Proof results update live in drilldown |

---

*Service Resolution (Restore) Flow Visual Spec v1.0 | March 31, 2026*
*1 flow. 8 card states. 2 action sheets. 1 drilldown (2 variants). 42 keys. 22 invariants.*
*Depends on: Home v2.3 + Addendum v2.3.1.*
