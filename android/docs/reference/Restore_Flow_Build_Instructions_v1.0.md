# Restore Flow — Frontend Build Instructions (v1.0)

**Date:** March 31, 2026
**For:** Frontend engineer (Kotlin/Compose, has Home + Install codebase)
**Scope:** 4 new components + 8 card state renderers + 2 action sheets + 1 drilldown with guided proof

---

## 1. Read These First

| # | File | What you need |
|---|---|---|
| 1 | **Home Visual Spec v2.3 (LOCKED)** | §1 tokens. §5 card. §9 interactions. |
| 2 | **Home Addendum v2.3.1** | §1 execution modes (now 3: DIRECT/ACTION_SHEET/**DRILLDOWN_REQUIRED**). §3 rollback. §4 passive. §4a time-limited display. §5 icons. §6 "देखें ›". |
| 3 | **Restore Flow Spec v1.0** | Field values, guided proof, drilldown, all 8 states. |
| 4 | **WiomTokens.kt** | Colors, spacing, typography. |
| 5 | **csp_restore_labels_v1.0_hi_en.json** | 42 Hindi/English strings. |

**Authority:** v2.3 → v2.3.1 → Restore v1.0.

---

## 2. Key Differences from Install

Read this before building. Restore is NOT Install.

| Dimension | Install | Restore |
|---|---|---|
| Accent | Grey | **Red always** (`accent.restore` #C62828) |
| Urgency | Days | **Minutes/hours** |
| Exit option | Yes (drilldown) | **No — escalation handles** |
| Card CTAs | 1 (exception: Call on slot-day) | **Always exactly 1. No exceptions.** |
| Phone | On card (slot-day) | **Drilldown only (WORKING+)** |
| Proof | Onsite module (separate) | **In this module — guided flow in drilldown** |
| Execution: Resolve | N/A | **DRILLDOWN_REQUIRED (new mode)** |

---

## 3. Components

### New (4)

| Component | Used in | Notes |
|---|---|---|
| `GuidedProofFlow` | Drilldown | One step at a time. Device Event background. Async result updates. |
| `ProofStepResult` | Drilldown | ✅/❌/⏳ per proof item. Live-updating. |
| `DiagnoseFaultSheet` | Drilldown trigger | Device ID + fault code. ACTION_SHEET. |
| `EscalationBadge` | Card reason line | ⚠ prefix with contrast stacking per timer state. |

### Reuse from Install / Home

| Component | From |
|---|---|
| Card container, primary CTA, timer, accent | Home v2.3 §5 |
| Type icon (🔧 `build`) | Addendum v2.3.1 §5 |
| "देखें ›" | Addendum v2.3.1 §6 |
| Time-limited display | Addendum v2.3.1 §4a |
| ACTION_SHEET container | Addendum v2.3.1 §1 |
| Toast, rollback | Addendum v2.3.1 §3 |
| MaskedCallCTA | Install v1.4 (reuse) |
| Executor sheet | Install v1.4 (reuse) |

---

## 4. Card States (8 renderers)

Identity line always: `[🔧] Restore · #ID · Locality  देखें ›`
Accent always: **RED** (`accent.restore` #C62828).

### Active (ONE CTA each)

| State | Reason line | CTA (mode) |
|---|---|---|
| RESPOND_NOW | `reason_template` · X मिनट बाकी | "शुरू करें" (DIRECT) |
| WORKING | `reason_template` · X घंटे बाकी | "ठीक करें" (DRILLDOWN_REQUIRED) |
| ESCALATED_CSP_ACTIVE | ⚠ `reason_template` · P93 timer | "ठीक करें" (DRILLDOWN_REQUIRED) |
| CUSTOMER_DENIED | ⚠ `reason_template` · P93 timer | "ठीक करें" (DRILLDOWN_REQUIRED) |

### Passive (zero CTAs)

| State | Reason line |
|---|---|
| ESCALATED_PLATFORM_TAKEOVER | "प्लेटफ़ॉर्म संभाल रहा है" |
| VERIFICATION_PENDING | "जाँच हो रही है" |

### Terminal (time-limited display per Addendum §4a)

| State | Reason line | Display |
|---|---|---|
| RESOLVED | "✓ ठीक हो गया" (`state.positive`) | 3-5 seconds, then exits |
| RECLASSIFIED | "Device issue — प्लेटफ़ॉर्म देखेगा" | Brief display, then exits |

**CRITICAL: Always exactly ONE or ZERO CTAs. Never two. No Call, Diagnose, or Assign on card.**

---

## 5. Execution Mode: DRILLDOWN_REQUIRED (New)

"ठीक करें" on card does NOT open an action sheet. It opens the full drilldown, scrolled to the proof section.

```
Tap "ठीक करें" → drilldown opens → CSP completes proof → submits from drilldown
```

This is the third execution mode from Addendum v2.3.1 §1. The CTA on the card is the ENTRY POINT, not the action itself. The action (Resolve with proof) lives inside the drilldown.

---

## 6. Drilldown (Two Variants)

**Entry:** Card body tap, "देखें ›", or "ठीक करें" CTA.

### 6a. RESPOND_NOW Drilldown (minimal)

CSP needs: "where is this?" → "शुरू करें." That's it.

| Section | Content | Default |
|---|---|---|
| Status | State + response window timer | Expanded |
| Location | Service address + issue type | Expanded |
| Start Work CTA | "शुरू करें" — same as card | Expanded |

**Nothing else.** No proof. No executor. No call. No diagnose. No timeline. These appear after Start Work transitions the card to WORKING.

### 6b. WORKING / ESCALATED / CUSTOMER_DENIED Drilldown (resolve-focused)

**Above fold (expanded):**

| Section | Content |
|---|---|
| Status | State + escalation tier + SLA timer |
| **Proof (guided)** | **ONE step at a time — see below** |
| Resolve CTA | Disabled until ≥1 proof passes |

**Below fold (collapsed — tap to expand):**

| Section | Content |
|---|---|
| Location | Service address + issue type |
| Executor | Assigned name. Reassign if allowed. |
| Contact | Masked call (WORKING/ESCALATED only) |
| Diagnose | Text link → fault sheet (within reclass window only) |
| Timeline | Event log |

**CSP wants to fix, not read.** Status + Proof + Resolve above fold. Everything else one tap away.

### Guided Proof (NOT a checklist)

Build this as a progressive flow, not a multi-option menu:

1. **Device Event** → runs automatically. Background. No CSP action. If device reconnects → ✅ → Resolve enables.

2. **System Check** → shown as ONE active action: "System check करें." CSP taps → telemetry query → ✅/❌/⏳.

3. **Customer Confirm** → appears ONLY after System Check fails. "Customer से पुष्टि लें." CSP taps → customer prompted → ✅/❌/⏳.

**At any point:** If Device Event passes, Resolve enables immediately.

**What CSP sees:** ONE action at a time, not a menu of three. System decides which step is next.

### Proof result rendering

| Result | Icon | Color |
|---|---|---|
| ✅ Pass | Checkmark | `state.positive` |
| ❌ Fail | Cross | `state.negative` |
| ⏳ Pending | Spinner/dots | `text.hint` |

**Live updates required.** Proof results update without CSP closing/reopening drilldown. Implement via polling or push.

### Resolve CTA in drilldown

Disabled until ≥1 proof shows ✅. Server validates independently. Not just client-side check.

---

## 7. Escalation ⚠ Rendering

### On card reason line

⚠ prefix + `state.warning` text on reason. Used in ESCALATED_CSP_ACTIVE and CUSTOMER_DENIED.

### Contrast stacking with timer bg

| Timer state | ⚠ text color | Background |
|---|---|---|
| normal | `state.warning` (#BF360C) | None |
| urgent | `state.warning` (#BF360C) | `bg.urgent` |
| **overdue** | **`state.negative` (#C62828)** | **`bg.overdue`** — switch to red text for contrast |

---

## 8. Post-Action Rules

| Action | Mechanism |
|---|---|
| Start Work | DIRECT optimistic. Server reject → revert + toast. |
| Resolve (proof) | DRILLDOWN_REQUIRED. Server confirms. No optimistic. |
| Diagnose | ACTION_SHEET → server confirms. |
| Call | DIRECT. Fail → toast. No state change. |
| Assign | ACTION_SHEET → server refresh. **WORKING+ only. Not during RESPOND_NOW.** |

**First response rule:** Start Work = ONLY valid first response. Assign, Call, Diagnose cannot happen during RESPOND_NOW.

Full server refresh after every action. No partial updates.

---

## 9. What NOT to Build

- No exit/decline button — anywhere
- No resolve without proof
- No multiple CTAs on card
- No Call on card (drilldown only)
- No Diagnose on card (drilldown only)
- No phone before WORKING state
- No customer name/phone
- No accent color change by tier
- No escalation blame language
- No manual escalation button
- No restore dashboard/counter
- No animations beyond fade
- No proof checklist (use guided flow)
- No "देखें ›" on terminal states (RESOLVED, RECLASSIFIED) — non-interactive
- No "देखें ›" on PLATFORM_TAKEOVER — task leaving, drilldown adds no value
- No Assign/Call/Diagnose during RESPOND_NOW — Start Work first
- Diagnose ALWAYS below Resolve in drilldown — exception actions never above primary

---

## 10. Test Checklist

| # | Test | Pass |
|---|---|---|
| 1 | Red accent on every restore card | `accent.restore` #C62828 always |
| 2 | 🔧 icon | Filled wrench, 18dp, `text.secondary` |
| 3 | ONE CTA per card | Never two. No Call/Diagnose on card. |
| 4 | Start Work = 1 tap | DIRECT. Timer changes. No dialog. |
| 5 | "ठीक करें" opens drilldown | Not action sheet. Drilldown with proof. |
| 6 | Guided proof: one step at a time | NOT a 3-item checklist |
| 7 | Device Event runs in background | Auto-checks. No CSP tap needed. |
| 8 | Resolve disabled until proof passes | ≥1 ✅ required |
| 9 | Proof updates live | Results appear without re-opening drilldown |
| 10 | Call in drilldown only | WORKING/ESCALATED states. Not RESPOND_NOW. |
| 11 | Diagnose in drilldown only | Within reclass window. |
| 12 | ⚠ escalation badge | `state.warning` text. Overdue → `state.negative`. |
| 13 | RESOLVED = brief display | 3-5 seconds, then card exits |
| 14 | CUSTOMER_DENIED = card re-activates | Tier incremented. ⚠ shows. |
| 15 | PLATFORM_TAKEOVER = passive | No CTA. Card body tap only. |
| 16 | No exit anywhere | Zero decline/exit buttons. |
| 17 | Offline | All CTAs disabled. Toast. |
| 18 | Start Work rollback | Revert to RESPOND_NOW + toast. |
| 19 | **RESOLVED: no "देखें ›"** | Terminal card has no trailing label, no tap interaction. |
| 20 | **RECLASSIFIED: no "देखें ›"** | Same as RESOLVED — non-interactive. |
| 21 | **PLATFORM_TAKEOVER: no "देखें ›"** | Task leaving CSP. No navigation affordance. |
| 22 | **VERIFICATION_PENDING: HAS "देखें ›"** | CSP wants to check proof status. Keep affordance. |
| 23 | **RESPOND_NOW drilldown = minimal** | Only Status + Location + Start Work. No proof/assign/call/diagnose. |
| 24 | **Start Work = only first response** | Assign/Call/Diagnose NOT available during RESPOND_NOW. |
| 25 | **WORKING drilldown: above fold** | Status + Proof + Resolve visible. Location/Executor/Contact collapsed. |
| 26 | **Diagnose always below Resolve** | Exception actions never above primary in drilldown. |

---

## Quick Reference: File Dependency

```
Home v2.3 (LOCKED)
  ├── Card container, tokens, CTAs, timer, interaction rules
  │
  └── Home v2.3.1 (Addendum)
        ├── §1: 3 execution modes (DIRECT / ACTION_SHEET / DRILLDOWN_REQUIRED)
        ├── §3: Rollback + toast
        ├── §4: Passive card state
        ├── §4a: Time-limited card display
        ├── §5: Type icons (🔧 Restore)
        └── §6: "देखें ›" drilldown affordance

Restore v1.0 (this module)
  ├── 8 card states
  ├── 2 action sheets (Executor, Diagnose)
  ├── 1 drilldown with guided proof
  ├── Escalation rendering
  └── 42 Hindi copy keys (JSON attached)
```

---

*Restore Flow Build Instructions v1.0 | March 31, 2026*
