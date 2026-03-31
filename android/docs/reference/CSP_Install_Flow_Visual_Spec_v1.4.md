# CSP APP — Install Flow Visual Spec v1.4

**Date:** March 31, 2026
**Surface:** Install Flow (assignment → scheduling → dispatch → onsite preview)
**Depends on:**
- Home Screen Visual Spec v2.3 (LOCKED) — card spec, tokens, interaction rules
- Home Screen Visual Spec v2.3.1 (Addendum) — execution modes, rollback, passive state, type icons, "देखें ›"
**Brief:** UX Agent Brief — Install Flow v3 (FINAL)
**Status:** Draft — pending freeze

---

## What changed v1.3 → v1.4

| # | Change | Source |
|---|---|---|
| 1 | Service address + nearest connection in drilldown | Brief v3 §5 |
| 2 | Masked calling CTA — day of slot only | Brief v3 §5.3 |
| 3 | SCHEDULED splits: pre-slot-day vs slot-day | Brief v3 §6 |
| 4 | Journey continuity: IN_PROGRESS + INSTALL_SUBMITTED card shells | Brief v3 §9 |
| 5 | Type icon: 🏠 `home` (from Addendum v2.3.1 §5) | Home-level change |
| 6 | "देखें ›" on card trailing edge (from Addendum v2.3.1 §6) | Home-level change |
| 7 | Contact section in drilldown | Brief v3 §8 |
| 8 | New keys: `reason.scheduled_today`, `cta.call_customer`, `contact.not_yet`, `contact.call_label` | Brief v3 §12 |

---

## 0. Objective

```
Primary job: Make the next install action obvious on Home.
Secondary job: Complete scheduling and dispatch with minimal steps.
Key principle: Scheduling IS acceptance. No Accept button.
```

---

## 1. Surface Classification

| Surface | Type | Job |
|---|---|---|
| Install Card (L6 → L4) | Execution (Home card) | Progress install |
| Install Drilldown | Hybrid | Context + act + exit |
| Slot Proposal Sheet | ACTION_SHEET | Date/time input |
| Exit Reason Sheet | ACTION_SHEET | Structured exit reason |
| Executor Assignment Sheet | ACTION_SHEET | Team selection |

---

## 2. Card Field Values

All cards use Home v2.3 §5 container. Type icon 🏠 `home` per Addendum §5. "देखें ›" at trailing edge per Addendum §6. Grey accent. No secondary CTA.

### 2.1 Identity line (all states, never changes)

```
[🏠] इंस्टॉल · #CN-4021 · सेक्टर 15                    देखें ›
```

| Element | Spec |
|---|---|
| Icon | `home` (filled), 18dp, `text.secondary` |
| Label + ID + Locality | `type.cardIdentity` (14sp/600), `text.primary` |
| "देखें ›" | `type.bodySmall` (12sp/400), `text.secondary`, trailing edge, **aligned with identity line (top row)** |

Locality truncates first if width constrained. Icon and ID never truncate.

### 2.2 Active states (have primary CTA)

| State | B+C: Reason line | D: Primary CTA (mode) |
|---|---|---|
| AWAITING_SLOT_PROPOSAL | `reason_template` · X दिन बाकी (P74) | "समय भेजें" (ACTION_SHEET) |
| SLOT_CONFIRMED | `[COPY:reason.slot_confirmed]` · Day, Time | "व्यक्ति चुनें" (ACTION_SHEET) |
| SCHEDULED (not slot day) | `[COPY:reason.scheduled]` · Day, Time | "भेजें" (DIRECT) |
| SCHEDULED (slot day) | `[COPY:reason.scheduled_today]` · आज 3-5 PM | "भेजें" (DIRECT) |
| NEEDS_RESCHEDULING | `reason_template` · X दिन बाकी (P74) | "समय भेजें" (ACTION_SHEET) |

**SCHEDULED (slot day) — Call Customer CTA:**

When `masked_call_available: true` (server-driven, day of confirmed slot only):

```
┌─[4dp grey]──────────────────────────────────────┐
│  [🏠] इंस्टॉल · #CN-4021 · सेक्टर 15           │ देखें ›
│  [COPY:reason.scheduled_today] · आज 3-5 PM      │
│                  [कॉल करें]  [भेजें]           │
└──────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Call CTA | `[COPY:cta.call_customer]` — "कॉल करें" with Material `call` icon (filled) |
| Icon | Material Symbols `call` (filled), 18dp, `brand.primary` color. NOT emoji — emoji renders inconsistently across Android OEMs. |
| Position | Left of Dispatch (secondary position) |
| Style | Secondary CTA atom (`brand.tint` bg, `brand.primary` text) |
| Mode | DIRECT — tap → system connects masked call. No number visible. |
| Visibility | Server-driven: `masked_call_available: true` ONLY on day of confirmed slot |
| Disappears | Task resolved, escalated, or exited |

**This is the ONE exception where a secondary CTA appears.** It exists because calling the customer is a fundamentally different action from dispatch — not a "details" navigation. It passes v2.3 §5 rule: "secondary exists only if primary action incomplete without it." Dispatch may require coordination ("gate kholo") — the call enables the dispatch.

### 2.3 Passive states (NO CTA)

| State | B+C: Reason line |
|---|---|
| AWAITING_CUSTOMER_SELECTION | `[COPY:reason.awaiting_customer]` |
| SCHEDULING_FAILED | `[COPY:reason.scheduling_failed]` |

No CTA. Card body tap → drilldown. Card height collapses. Per Addendum v2.3.1 §4.

### 2.4 Journey continuity — Onsite preview states

Card shell only. Drilldown content governed by Onsite Installation brief (separate).

| State | B+C: Reason line | D: Primary CTA | Module |
|---|---|---|---|
| IN_PROGRESS | `[COPY:reason.in_progress]` | "पूरा करें" (Onsite) | Onsite Installation |
| INSTALL_SUBMITTED | `[COPY:reason.submitted]` | — (system verifying) | Onsite Installation |

Same card container, same 🏠 icon, same identity line, same accent. Card evolves — it doesn't restart.

**Call Customer CTA on IN_PROGRESS:** Available if `masked_call_available: true` (CSP is on-site, may need to coordinate).

### 2.5 Card rules

- **Grey accent always.** Timer handles urgency.
- **🏠 icon always.** Type-level. Never changes.
- **No Exit on card.** Exit is in drilldown only.
- **No secondary CTA** except Call Customer on slot-day SCHEDULED and IN_PROGRESS.
- **Reason line: one line max.** Truncate with ellipsis.
- **Reason understandable without timer.**
- **"देखें ›" on every install card** (Addendum §6).

### 2.6 P74 on card

| State | P74 on card? |
|---|---|
| AWAITING_SLOT_PROPOSAL | ✅ In reason line |
| NEEDS_RESCHEDULING | ✅ In reason line |
| All others | ❌ Drilldown only |

### 2.7 Timer behavior

Per Home v2.3 §5. Server sends `timer_state` + `countdown_display`.

| timer_state | Text color | Background |
|---|---|---|
| `normal` | `text.primary` | None |
| `urgent` | `state.warning` | `bg.urgent` strip |
| `overdue` | `state.negative` | `bg.overdue` strip |

### 2.8 Masked call rules

| Rule | Value |
|---|---|
| When available | Day of confirmed slot only. Not before. |
| Mechanism | Tap → system connects via cloud telephony. Masked. No number displayed. |
| Purpose | Coordination only ("gate kholo"). Not scheduling. Not renegotiation. |
| Server-driven | `masked_call_available: true/false` in TAS projection |
| Disappears | Task resolved, escalated, or exited |
| Call fails | Error toast. Card unchanged. |
| Never shows | Customer name or phone number. Anywhere. |

---

## 3. Exit Option

### Principle

```
Exception actions must not appear on execution surface (card).
Accessible through drilldown only.
```

### Availability

| State | Exit in drilldown? |
|---|---|
| AWAITING_SLOT_PROPOSAL | Yes |
| AWAITING_CUSTOMER_SELECTION | Yes |
| SLOT_CONFIRMED | Yes |
| SCHEDULED | Yes |
| NEEDS_RESCHEDULING | Yes |
| SCHEDULING_FAILED | No (released) |
| IN_PROGRESS | No (onsite — separate module) |
| INSTALL_SUBMITTED | No (submitted) |

### Discoverability test

- ❌ Eye lands on exit before primary CTA → failed
- ✅ Exit findable within 5 seconds → card tap → drilldown → exit visible

---

## 4. Action Sheets

All use shared ACTION_SHEET container (Addendum v2.3.1 §1).

### 4.1 Slot Proposal Sheet

**Trigger:** "समय भेजें" on card or drilldown.

| Element | Spec |
|---|---|
| Title | `[COPY:slots.title]` — "दो समय भेजें" |
| Slot 1 | `[COPY:slots.slot1]` — "पहला समय" + DatePicker + TimeRange |
| Slot 2 | `[COPY:slots.slot2]` — "दूसरा समय" + DatePicker + TimeRange |
| Submit | `[COPY:cta.submit_slots]` — disabled until valid |

Validation: different days, not past, within P74. Inline errors.

**On submit:** Implicit acceptance. Sheet closes → server refresh → AWAITING_CUSTOMER_SELECTION.

### 4.2 Exit Reason Sheet

**Trigger:** "नहीं कर पाएँगे" in drilldown.

| Element | Spec |
|---|---|
| Title | `[COPY:exit.title]` |
| Options | 4 radio buttons: LOCATION_UNREACHABLE, CAPACITY_FULL, CUSTOMER_CANCELLED, TECHNICIAN_UNAVAILABLE |
| Confirm | `[COPY:cta.confirm_exit]` — disabled until selected |

No free text. REQUIRES_ONLINE. On confirm → card disappears.

### 4.3 Executor Assignment Sheet

**Trigger:** "व्यक्ति चुनें" on card or drilldown.

| Element | Spec |
|---|---|
| Title | `[COPY:executor.title]` |
| Self option | `[COPY:executor.self]` + CSP name. Pre-selected. |
| Technicians | From roster. 48dp rows. |
| Assign | `[COPY:cta.assign]` — always enabled |

No technicians → skip sheet → auto-assign self → SCHEDULED.

---

## 5. Drilldown

**Entry:** Card body tap or "देखें ›" (all states).

One unified drilldown for the entire install lifecycle.

```
┌──────────────────────────────────────────────────┐
│  ‹ वापस                                          │
│                                                   │
│  [🏠] इंस्टॉल · #CN-4021                         │
│                                                   │
│  ── स्थान ──────────────────────────────────     │
│  [Full service address]                           │
│  निकटतम कनेक्शन: [locality, ~distance]           │
│  [COPY:assignment_source_label] — text.secondary  │
│                                                   │
│  ── शेड्यूल ──────────────────────────────       │
│  स्थिति: [COPY:status_label]                     │
│  पहला: Day, Time  [badge]                        │
│  दूसरा: Day, Time  [badge]                        │
│                                                   │
│  ── व्यक्ति ──────────────────────────────       │
│  अन्नू (स्वयं) / अभी तय नहीं                     │
│                                                   │
│  ── समय सीमा ──────────────────────────────      │
│  ⏱ X दिन बाकी                                    │
│                                                   │
│  ── संपर्क ─────────────────────────────────     │
│  [कॉल करें]  (slot day only)                   │
│  or [COPY:contact.not_yet] "समय आने पर उपलब्ध"  │
│                                                   │
│  [ [Primary CTA] ]  (active states only)         │
│                                                   │
│  ▸ [COPY:scheduling_timeline] (collapsed)        │
│                                                   │
│  ─────────────────────────────────────────────── │
│  [COPY:exit.link] "नहीं कर पाएँगे"               │  ← text.secondary, if exit available
│                                                   │
└──────────────────────────────────────────────────┘
```

### Sections

| Section | Content | Visibility |
|---|---|---|
| Location | Full service address + nearest existing connection (D&A) + assignment source | Always. Above fold. |
| Scheduling | Status + slot details + per-slot badges | Always |
| Executor | Assigned or "अभी तय नहीं" | From SLOT_CONFIRMED onward |
| Deadline | P74 countdown (always visible in drilldown) | Always |
| Contact | Masked call CTA (slot day) or "समय आने पर उपलब्ध" (not yet) | Always (content varies) |
| Primary CTA | Same as card. Entry-point parity. | Active states only |
| Timeline | Event log | Collapsed |
| Exit | "नहीं कर पाएँगे" text link. `text.secondary`. Below timeline. | All states except SCHEDULING_FAILED, IN_PROGRESS, INSTALL_SUBMITTED |

### Assignment source guardrail

All values (new/retry/reallocation) render identically: `type.body`, `text.secondary`. No color-coding. No icons. Prevents decline bias.

### Privacy rules in drilldown

| Data | Shown? |
|---|---|
| Full service address | ✅ Yes — location section |
| Nearest existing connection | ✅ Yes — location section |
| Customer name | ❌ Never |
| Customer phone | ❌ Never (masked call only) |
| Assignment source | ✅ Yes — neutral styling |

### Slot status badges

| Status | Style |
|---|---|
| PROPOSED | `text.secondary`, no bg |
| ACTIVE | `state.info`, `bg.info` pill |
| CONFIRMED | `state.positive`, `bg.positive` pill |
| EXPIRED | `text.hint`, strikethrough |
| CANCELLED | `text.hint`, strikethrough |

### Exit link spec

| Property | Value |
|---|---|
| Text | `[COPY:exit.link]` — "नहीं कर पाएँगे" |
| Style | `type.body` (14sp/400), `text.secondary` |
| Position | Bottom of drilldown, below timeline |
| Separator | 1dp `stroke.primary` rule above |
| Tap | Opens Exit Reason Sheet (§4.2) |

### Drilldown stacking rule (guardrail)

```
Primary CTA must always be visually ABOVE exit link.
Exit must always be the LAST interactive element in the drilldown.
No interactive element below exit. Timeline (collapsed) sits above exit.
```

This prevents future drift. If new sections are added to drilldown, they go ABOVE the exit separator — never below.

---

## 6. Post-Action Behavior

| Action | Before | After | Mechanism |
|---|---|---|---|
| Submit slots (first) | L6 AWAITING_SLOT | L4 AWAITING_CUSTOMER | Server refresh (implicit accept) |
| Submit slots (reschedule) | NEEDS_RESCHEDULING | AWAITING_CUSTOMER | Server refresh |
| Assign executor | SLOT_CONFIRMED | SCHEDULED | Server refresh |
| Dispatch | SCHEDULED | IN_PROGRESS | DIRECT optimistic. Rollback: revert + toast. |
| Call Customer | SCHEDULED (slot day) | No state change | DIRECT. Call fails → error toast. |
| Exit | Any eligible | Card disappears | Server refresh |

No optimistic morph for ACTION_SHEET flows. Optimistic only for DIRECT (Dispatch, Call).

### P41 expiry during slot sheet

Submit → server returns error → toast `[COPY:assignment_expired]` → card disappears.

---

## 7. Edge States

| State | Treatment |
|---|---|
| No install tasks | No card |
| P41 expires | Card disappears. Toast. |
| P41 expires during sheet | Submit fails. Toast. Card disappears. |
| Customer selects slot live | Card updates in-place |
| SCHEDULING_FAILED live | CTAs disappear. Passive. |
| P74 nearing expiry | Timer: normal → urgent → overdue |
| Offline | CTAs disabled. Toast. |
| Dispatch reject | Revert to SCHEDULED. Toast. |
| Call fails | Error toast. Card unchanged. |

---

## 8. Notifications

| Event | Push? | Key |
|---|---|---|
| New assignment | ✅ | `notif.new_assignment` |
| P41 urgent | ✅ | `notif.act_soon` |
| Customer confirmed | ✅ | `notif.slot_confirmed` |
| Reschedule needed | ✅ | `notif.reschedule_needed` |
| P74 urgent | ✅ | `notif.install_deadline` |
| Others | ❌ | — |

---

## 9. Behavioral Invariants (22)

| # | Invariant |
|---|---|
| 1 | **No Accept button.** Scheduling IS acceptance. |
| 2 | **Exit in drilldown only.** Never on card. |
| 3 | **Card = single direction.** One primary CTA. No decision forks. |
| 4 | **🏠 icon = install type.** Fixed. Never changes. |
| 5 | **"देखें ›" on every card.** Trailing edge. Makes drilldown discoverable. |
| 6 | **No secondary CTA** except Call Customer on slot-day/on-site. |
| 7 | **Call Customer = day of confirmed slot only.** Server-driven. |
| 8 | **No customer name or phone.** Masked call only. |
| 9 | **Service address in drilldown only.** Never on card. |
| 10 | **Grey accent always.** Timer handles urgency. |
| 11 | **Passive states = zero CTAs.** Card body tap only. |
| 12 | **P74 on card for bottleneck states only.** |
| 13 | **Assignment source in drilldown.** Visually neutral. |
| 14 | **Entry-point parity.** Same primary CTA in drilldown. |
| 15 | **Auto-assign if no team.** |
| 16 | **No exit consequences shown.** |
| 17 | **Reason line = one line max.** Truncate. |
| 18 | **Reason understandable without timer.** |
| 19 | **No optimistic morph for ACTION_SHEET.** |
| 20 | **Journey continuity.** Card evolves through phases 1-6. Same identity line. |
| 21 | **Full refresh after every action.** |
| 22 | **Drilldown stacking: CTA above exit, exit always last.** No interactive element below exit. |

---

## 10. Hindi Label Keys (49 keys)

### Flow keys (8)

| Key | Hindi | English |
|---|---|---|
| `reason.propose_slots` | समय भेजें — ग्राहक को बताना है | Propose visit times |
| `reason.awaiting_customer` | ग्राहक चुन रहा है | Customer selecting |
| `reason.slot_confirmed` | समय पक्का हो गया | Time confirmed |
| `reason.scheduled` | तैयार — भेजने से पहले | Scheduled — pre slot day |
| `reason.scheduled_today` | आज का काम — तैयार | Today's work — ready |
| `reason.reschedule` | फिर से समय भेजें | Repropose times |
| `reason.scheduling_failed` | ग्राहक से पुष्टि हो रही है | Confirming with customer |
| `reason.in_progress` | इंस्टॉल चल रहा है | Install in progress |

### CTA keys (8)

| Key | Hindi | English |
|---|---|---|
| `cta.propose_slots` | समय भेजें | Propose times |
| `cta.submit_slots` | समय भेजें | Submit times |
| `cta.assign_executor` | व्यक्ति चुनें | Assign person |
| `cta.assign` | चुनें | Assign |
| `cta.dispatch` | भेजें | Dispatch |
| `cta.call_customer` | कॉल करें | Call customer |
| `cta.confirm_exit` | पुष्टि करें | Confirm exit |
| `reason.submitted` | सिस्टम जाँच रहा है | System verifying |

### Exit keys (6)

| Key | Hindi | English |
|---|---|---|
| `exit.title` | ये काम क्यों नहीं हो सकता? | Why can't you do this? |
| `exit.link` | नहीं कर पाएँगे | Can't do this |
| `exit.LOCATION_UNREACHABLE` | जगह तक पहुँच नहीं | Location unreachable |
| `exit.CAPACITY_FULL` | अभी क्षमता नहीं | At capacity |
| `exit.CUSTOMER_CANCELLED` | ग्राहक ने रद्द किया | Customer cancelled |
| `exit.TECHNICIAN_UNAVAILABLE` | टेक्नीशियन उपलब्ध नहीं | Technician unavailable |

### Context keys (9)

| Key | Hindi | English |
|---|---|---|
| `slots.title` | दो समय भेजें | Propose two slots |
| `slots.slot1` | पहला समय | First slot |
| `slots.slot2` | दूसरा समय | Second slot |
| `executor.title` | कौन करेगा इंस्टॉल? | Who will install? |
| `executor.self` | मैं खुद करूँगा | I'll do it myself |
| `executor.not_assigned` | अभी तय नहीं | Not assigned yet |
| `contact.not_yet` | समय आने पर उपलब्ध | Available on slot day |
| `contact.call_label` | कॉल करें | Call |
| `scheduling_failed_system_handling` | ग्राहक से पुष्टि हो रही है | Confirming with customer |

### Source + section keys (6)

| Key | Hindi | English |
|---|---|---|
| `assignment_source.new` | नया अनुरोध | New request |
| `assignment_source.retry` | पुनः प्रयास | Retry |
| `assignment_source.reallocation` | पुनः आवंटन | Reassigned |
| `assignment_expired` | समय निकल गया | Expired |
| `requires_online` | इंटरनेट ज़रूरी है | Requires internet |
| `scheduling_timeline` | शेड्यूल इतिहास | Scheduling history |

### Badge keys (4)

| Key | Hindi | English |
|---|---|---|
| `slot.proposed` | भेजा गया | Proposed |
| `slot.active` | जवाब बाकी | Awaiting |
| `slot.confirmed` | पक्का | Confirmed |
| `slot.expired` | समाप्त | Expired |

### Notification keys (5)

| Key | Hindi | English |
|---|---|---|
| `notif.new_assignment` | नया इंस्टॉल — समय भेजें | New install — propose |
| `notif.act_soon` | जल्दी समय भेजें — काम जा सकता है | Respond soon |
| `notif.slot_confirmed` | ग्राहक ने समय चुना — व्यक्ति चुनें | Customer picked — assign |
| `notif.reschedule_needed` | फिर से समय भेजें | Repropose |
| `notif.install_deadline` | समय सीमा करीब | Deadline approaching |

### Section label keys (3)

| Key | Hindi | English |
|---|---|---|
| `drilldown.location_section` | स्थान | Location |
| `drilldown.schedule_section` | शेड्यूल | Schedule |
| `drilldown.executor_section` | व्यक्ति | Person |

**Total: 49 keys.**

---

## 11. Component Map

| Need | Source | New? |
|---|---|---|
| Card container, primary CTA, timer, accent | Home v2.3 §5 | No |
| Type icon (🏠) | Addendum v2.3.1 §5 | New (Home-level) |
| "देखें ›" label | Addendum v2.3.1 §6 | New (Home-level) |
| Secondary CTA (Call only) | Home v2.3 §5 | No |
| ACTION_SHEET container | Addendum v2.3.1 §1 | No |
| Toast | Addendum v2.3.1 §3 | No |
| **DatePickerTrigger** | — | **Yes** |
| **TimeRangePicker** | — | **Yes** |
| **SlotStatusBadge** | — | **Yes** |
| **MaskedCallCTA** | — | **Yes** (wraps DIRECT call action) |

4 new components.

---

## 12. What NOT to Build

- No Accept button
- No Exit on card
- No customer name or phone anywhere
- No address on card (drilldown only)
- No Call CTA before day of confirmed slot
- No actual phone number display
- No copy/paste of contact info
- No negotiation UI
- No install dashboard/counter
- No animations beyond fade
- No exit consequences
- No color-coded assignment source

---

## 13. Validation Checklist

| # | Check |
|---|---|
| 1 | First action = Propose Slots (not Accept) |
| 2 | 🏠 icon on identity line |
| 3 | "देखें ›" visible, doesn't compete with CTA |
| 4 | Exit in drilldown only, discoverable <5s |
| 5 | Service address in drilldown, not card |
| 6 | Customer name/phone never visible |
| 7 | Call CTA appears ONLY on slot day |
| 8 | Masked call — no number shown |
| 9 | Passive states = zero CTAs |
| 10 | Dispatch = 1 tap |
| 11 | Slot proposal <30s |
| 12 | Card feels like one journey (phases 1-6) |
| 13 | Timer treatment per Home v2.3 §5 |

---

*Install Flow Visual Spec v1.4 | March 31, 2026*
*1 flow. 7+ card states. 3 sheets. 1 drilldown. 49 keys. 22 invariants.*
*Depends on: Home v2.3 + Addendum v2.3.1.*
