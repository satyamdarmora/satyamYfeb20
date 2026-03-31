# Install Flow — Frontend Build Instructions (v1.4)

**Date:** March 31, 2026
**For:** Frontend engineer (Kotlin/Compose, has Home codebase)
**Scope:** 4 new components + 7 card state renderers + 3 action sheets + 1 drilldown

---

## 1. Read These First

| # | File | What you need |
|---|---|---|
| 1 | **Home Visual Spec v2.3 (LOCKED)** | §1 tokens. §5 card container. §9 interactions. |
| 2 | **Home Addendum v2.3.1** | §1 execution modes. §3 rollback. §4 passive state. **§5 type icons. §6 "देखें ›".** |
| 3 | **Install Flow Spec v1.4** | Field values, drilldown, sheets, masked calling, journey continuity. |
| 4 | **WiomTokens.kt** | Colors, spacing, typography. |
| 5 | **csp_install_labels_v1.4_hi_en.json** | 49 Hindi/English strings. |

**Authority:** v2.3 (immutable) → v2.3.1 (extends) → Install v1.4 (consumes).

---

## 2. What Changed from v1.3

### Added

- **Type icon:** 🏠 `home` (filled, 18dp, `text.secondary`) on identity line. Per Addendum §5.
- **"देखें ›":** Card trailing edge, 12sp, `text.secondary`. Per Addendum §6.
- **Masked calling CTA:** "कॉल करें (Material `call` icon, filled)" — DIRECT. Day of confirmed slot only. `masked_call_available` flag from server.
- **SCHEDULED splits:** Two variants — pre-slot-day (Dispatch only) and slot-day (Dispatch + Call).
- **Service address:** In drilldown. Full address + nearest existing connection.
- **Contact section:** In drilldown. Call CTA on slot day, "समय आने पर उपलब्ध" otherwise.
- **Journey continuity:** IN_PROGRESS + INSTALL_SUBMITTED card shells (Onsite module owns drilldown).
- **New keys:** `reason.scheduled_today`, `cta.call_customer`, `contact.not_yet`, `contact.call_label`, `reason.in_progress`, `reason.submitted`, `drilldown.location_section`

### Unchanged from v1.3

Exit in drilldown, no Accept, implicit acceptance, post-action refresh, slot proposal, executor sheet, passive states.

---

## 3. Components

### New (4)

| Component | Used in |
|---|---|
| `DatePickerTrigger` | Slot Proposal Sheet |
| `TimeRangePicker` | Slot Proposal Sheet |
| `SlotStatusBadge` | Drilldown |
| `MaskedCallCTA` | Card (slot-day) + Drilldown. Wraps DIRECT call action. |

### Reuse

| Component | From |
|---|---|
| Card container, primary CTA atom, timer, accent | Home v2.3 §5 |
| **Type icon (🏠)** | **Addendum v2.3.1 §5** — NEW |
| **"देखें ›" label** | **Addendum v2.3.1 §6** — NEW |
| Secondary CTA atom (for Call only) | Home v2.3 §5 |
| ACTION_SHEET container | Addendum v2.3.1 §1 |
| Toast | Addendum v2.3.1 §3 |
| Radio buttons | Wallet/NetBox pattern |

---

## 4. Card States (7 renderers)

### Identity line (all states, never changes)

```
[🏠] इंस्टॉल · #CN-4021 · सेक्टर 15               देखें ›
```

- 🏠 `home` icon: 18dp, filled, `text.secondary`. Per Addendum §5.
- "देखें ›": 12sp, `text.secondary`, trailing edge, aligned with identity line (top row). Per Addendum §6.
- Truncation priority: Locality first. Icon and ID never truncate.

### Active states

| State | Reason line | Primary CTA | Secondary CTA |
|---|---|---|---|
| AWAITING_SLOT_PROPOSAL | `reason_template` · X दिन बाकी | "समय भेजें" (ACTION_SHEET) | None |
| SLOT_CONFIRMED | "समय पक्का हो गया" · Day, Time | "व्यक्ति चुनें" (ACTION_SHEET) | None |
| SCHEDULED (not slot day) | "तैयार — भेजने से पहले" · Day, Time | "भेजें" (DIRECT) | None |
| **SCHEDULED (slot day)** | **"आज का काम — तैयार" · आज 3-5 PM** | **"भेजें" (DIRECT)** | **"कॉल करें (Material `call` icon, filled)" (DIRECT)** |
| NEEDS_RESCHEDULING | `reason_template` · X दिन बाकी | "समय भेजें" (ACTION_SHEET) | None |

**Call CTA appears ONLY when `masked_call_available: true` from server.** Only on day of confirmed slot. This is the ONE card state with a secondary CTA.

### Passive states (zero CTAs)

| State | Reason line |
|---|---|
| AWAITING_CUSTOMER_SELECTION | "ग्राहक चुन रहा है" |
| SCHEDULING_FAILED | "ग्राहक से पुष्टि हो रही है" |

### Journey preview states (card shell only — Onsite module owns drilldown)

| State | Reason line | CTA |
|---|---|---|
| IN_PROGRESS | "इंस्टॉल चल रहा है" | "पूरा करें" (Onsite) + Call if available |
| INSTALL_SUBMITTED | "सिस्टम जाँच रहा है" | None |

---

## 5. Masked Calling

| Rule | Value |
|---|---|
| When | `masked_call_available: true` — day of confirmed slot only |
| CTA | "कॉल करें (Material `call` icon, filled)" — Secondary CTA atom. Left of Dispatch. |
| Mode | DIRECT — tap → system connects masked call |
| Never shows | Customer name or phone number. Anywhere. |
| Call fails | Error toast. Card unchanged. |
| Disappears | Task resolved, escalated, exited |

**Before slot day:** No Call CTA on card. Drilldown shows "समय आने पर उपलब्ध."
**On slot day:** Call CTA on card + in drilldown.

---

## 6. Drilldown

**Entry:** Card body tap or "देखें ›" (all states).

| Section | Content | Visibility |
|---|---|---|
| Location | Full service address + nearest existing connection + assignment source | Always |
| Scheduling | Status + slots + badges | Always |
| Executor | Assigned or "अभी तय नहीं" | From SLOT_CONFIRMED |
| Deadline | P74 countdown | Always |
| Contact | Call CTA (slot day) or "समय आने पर उपलब्ध" | Always (content varies) |
| Primary CTA | Same as card | Active states |
| Timeline | Event log | Collapsed |
| Exit | "नहीं कर पाएँगे" — `text.secondary`, below timeline | All except SCHEDULING_FAILED, IN_PROGRESS, SUBMITTED |

### Privacy in drilldown

- ✅ Full service address
- ✅ Nearest existing connection
- ❌ Customer name — NEVER
- ❌ Customer phone — NEVER (masked call only)

### Assignment source

All values identical styling: `text.secondary`. No color-coding. No icons.

---

## 7. Exit

**Drilldown only.** Not on card.

- Text link: "नहीं कर पाएँगे", `text.secondary`, below timeline
- Implement as **isolated render slot** — placement can change without restructuring
- Tap → Exit Reason Sheet (4 radio options, confirm required)
- On confirm → card disappears → server refresh

---

## 8. Post-Action Rules

| Action | After | Mechanism |
|---|---|---|
| Submit slots (first) | L6 → L4 AWAITING_CUSTOMER | Server refresh (implicit accept) |
| Assign executor | SCHEDULED | Server refresh |
| Dispatch | IN_PROGRESS | DIRECT optimistic. Rollback: revert + toast. |
| Call | No state change | DIRECT. Fail → error toast. |
| Exit | Card disappears | Server refresh |

Optimistic only for DIRECT (Dispatch, Call). ACTION_SHEET = submit → close → refresh.

---

## 9. What NOT to Build

- No Accept button
- No Exit on card
- No customer name/phone anywhere
- No address on card (drilldown only)
- No Call CTA before slot day
- No phone number display
- No install dashboard/counter
- No animations beyond fade
- No secondary CTA except Call on slot-day

---

## 10. Test Checklist

| # | Test | Pass |
|---|---|---|
| 1 | 🏠 icon on identity line | Filled, 18dp, `text.secondary` |
| 2 | "देखें ›" visible | 12sp, trailing edge, doesn't compete with pink CTA |
| 3 | First action = Propose Slots | No Accept button |
| 4 | Exit NOT on card | Only in drilldown |
| 5 | Exit discoverable <5s | Card tap → drilldown → exit visible |
| 6 | Service address in drilldown | Full address + nearest connection |
| 7 | No customer name/phone | Nowhere. Zero. |
| 8 | **Call CTA only on slot day** | `masked_call_available: false` → no Call CTA |
| 9 | **Call CTA appears on slot day** | `masked_call_available: true` → Call + Dispatch on card |
| 10 | Call = masked | No number displayed. System connects. |
| 11 | Passive = zero CTAs | AWAITING_CUSTOMER, SCHEDULING_FAILED |
| 12 | Dispatch = 1 tap | DIRECT. No dialog. |
| 13 | Dispatch rollback | Revert to SCHEDULED + toast |
| 14 | Call fails | Error toast. Card unchanged. |
| 15 | Slot proposal <30s | Sheet → 2 slots → submit |
| 16 | No technicians | Skip sheet → auto-assign |
| 17 | Timer treatment | normal/urgent/overdue per Home v2.3 §5 |
| 18 | Offline | CTAs disabled. Toast. |
| 19 | Assignment source neutral | All values same styling in drilldown |
| 20 | IN_PROGRESS card shell | Same identity, same icon. CTA from Onsite module. |
| 21 | Reason line overflow | Truncate. One line max. |
| 22 | Locality truncates first | Icon and ID never truncate |

---

## Quick Reference: File Dependency

```
Home v2.3 (LOCKED)
  ├── Card container, tokens, CTAs, timer, interaction rules
  │
  └── Home v2.3.1 (Addendum)
        ├── §1: Execution modes + sheet container
        ├── §3: Optimistic rollback + toast
        ├── §4: Passive card state
        ├── §5: Type icons (🏠 Install, 🔧 Restore, 📦 NetBox, ₹ Renewal)
        └── §6: "देखें ›" drilldown affordance

Install v1.4 (this module)
  ├── 7 card states + 2 journey preview states
  ├── 3 action sheets (Slots, Exit, Executor)
  ├── 1 drilldown (with location, contact, exit)
  ├── Masked calling rules
  └── 49 Hindi copy keys (JSON attached)
```

---

*Install Flow Build Instructions v1.4 | March 31, 2026*
