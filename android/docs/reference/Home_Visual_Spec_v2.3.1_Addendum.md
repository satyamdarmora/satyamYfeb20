# CSP App — Home Screen Visual Spec v2.3.1 (Addendum)

**Date:** March 30, 2026
**Extends:** Home Screen Visual Spec v2.3 (LOCKED)
**Status:** Draft — pending review + lock

---

## 0. Governance

**v2.3 is immutable.** This addendum can only ADD patterns for situations v2.3 does not address. It cannot override, redefine, or reinterpret any existing v2.3 rule.

**If any line in this addendum contradicts v2.3, v2.3 wins and the addendum line is invalid.**

### Conflict Verification

| Addendum item | v2.3 section affected | Conflict? | Proof |
|---|---|---|---|
| Execution modes (DIRECT / ACTION_SHEET) | §9: "Tap CTA → Optimistic UI, sync on reconnect" | No | DIRECT is consistent with existing "Optimistic UI" rule. ACTION_SHEET is a new CTA type v2.3 doesn't address. Refinement, not contradiction. |
| Card morphing (same position transform) | §9, §5 | No | v2.3 says nothing about card-to-card transformation. New territory. |
| Optimistic UI rollback | §9: "Optimistic UI, sync on reconnect" | No | "Sync on reconnect" implies reconciliation. Rollback is how reconciliation manifests when server disagrees. Completing the pattern, not changing it. |
| Passive card state (no CTA) | §5: "Secondary CTA exists only if primary action incomplete without it" | **Resolved** | v2.3 assumes a primary CTA exists. Addendum does NOT add secondary-without-primary. Instead: passive cards render NO CTA at all. Card body tap (§9) handles drilldown. v2.3 compliant. |
| Type icons on identity line | §5: Field A = "Type dot (● red for restore, ○ outline for rest)" | **Replaces** | ●/○ dot was a 2-value type signal. Icons extend the same function (type identification) to 4+ types. Position, color weight, and purpose unchanged. This is an upgrade of the existing type indicator, not a new element. |
| "देखें ›" drilldown affordance | §5: card layout + §9: "Tap card → Opens drilldown" | No | v2.3 §9 already defines card body tap → drilldown. This addendum makes that existing interaction visible via a label. No new interaction added. |

---

## 1. CTA Execution Modes [Layer 2 extension]

v2.3 §9 defines one interaction: "Tap CTA → Optimistic UI." This addendum adds a second mode for CTAs that require structured input before execution.

### Two modes

| Mode | Tap behavior | When used |
|---|---|---|
| DIRECT | Single tap → instant action. Optimistic UI. No confirmation. | Dispatch, simple state transitions |
| ACTION_SHEET | Tap → bottom sheet with structured input → confirm → action | Exit (needs reason), Schedule (needs dates), Assign (needs selection) |

### Rules

- Every CTA has exactly ONE locked execution mode. Module specs declare which mode each CTA uses.
- DIRECT CTAs never show confirmation dialogs, intermediate screens, or multi-step flows.
- ACTION_SHEET CTAs always open a bottom sheet overlay (not full screen, not dialog). Content is structured input — radio buttons, date pickers, selection lists. Free text only if module spec explicitly allows it.
- Client never decides execution mode. Module spec declares it. Server may send `execution_mode` per CTA for runtime flexibility (future).

### ACTION_SHEET Container (shared across all modules)

| Property | Value |
|---|---|
| Background | `#F7F5FA` (dialog bg) |
| Radius | 24dp (top corners only) |
| Drag handle | 36dp × 4dp, `stroke.secondary`, centered, 12dp from top |
| Overlay | 40% black on content behind |
| Dismiss | Tap overlay, swipe down, or back gesture |
| Confirm CTA | Primary CTA atom. Disabled until required input provided. |

This container is reusable across all modules. Module specs define the content inside it.

---

## 2. Card Morphing [Layer 2 extension]

v2.3 §5 defines card rendering. This addendum adds a pattern for when a CTA causes a card to change type while remaining in the queue.

### Pattern

When a CTA triggers a card type or level change (e.g., task progresses from one phase to another):

1. Card stays in same queue position. No remove + reinsert.
2. Content changes: identity line may update, reason line changes, CTAs change.
3. Card container unchanged (same §5 spec — accent, radius, padding, border).
4. For DIRECT CTAs: content morphs immediately (optimistic, ≤100ms fade).
5. For ACTION_SHEET CTAs: submit → close sheet → server refresh → card re-renders with new state. No optimistic morph.
6. Server confirms asynchronously in both cases.

### Rules

- Card morphing applies to any CTA that changes task type/level, regardless of execution mode.
- DIRECT mode: optimistic morph (instant content change, rollback on reject).
- ACTION_SHEET mode: server-confirmed morph (submit → refresh → new content). Safer for commitment steps.
- Morphing never changes card container properties (accent color, radius, elevation). Only content fields (A through E) change.

---

## 3. Optimistic UI Rollback [Layer 2 extension]

v2.3 §9 says "Optimistic UI, sync on reconnect." This addendum specifies what happens when sync reveals the server rejected the action.

### Rollback rule

| Scenario | Behavior |
|---|---|
| DIRECT CTA succeeds (server confirms) | Full refresh. Card renders server-confirmed state. |
| DIRECT CTA fails (server rejects) | Revert card to pre-action state. Show error toast (2 seconds). |
| DIRECT CTA + underlying entity gone (e.g., expired) | Card disappears from queue. Show context toast (2 seconds). |
| ACTION_SHEET submit succeeds | Sheet closes. Card refreshes from server. |
| ACTION_SHEET submit fails | Sheet stays open. Inline error. User can retry or dismiss. |

### Toast pattern

| Property | Value |
|---|---|
| Position | Bottom of screen, above safe area |
| Duration | 2 seconds, auto-dismiss |
| Background | `bg.secondary` (#E8E4F0) |
| Text | `type.body` (14sp/400), `text.primary` |
| Max 1 toast | New toast replaces previous |

### Rules

- UI is never authoritative. Server state is truth. Optimistic rendering must reconcile.
- No retry loops. One attempt. If failed, revert + toast. User can re-tap if they want.
- No blocking overlays during optimistic period. Card is interactive throughout.

---

## 4. Passive Card State [Layer 2 extension]

v2.3 §5 defines cards with primary + optional secondary CTA. This addendum adds a pattern for cards where the CSP has no action — the card is informational only.

### When it applies

Some task states have no CSP action. Examples: waiting for customer response, system processing, external dependency. The card is visible (CSP should know the task exists) but has no CTA.

### Rendering

```
┌─[4dp accent]──────────────────────────────┐
│  [●/○] TYPE · #ID · Locality              │  ← A: Identity
│  [reason_display_template]                 │  ← B+C: Status message (no timer)
│                                            │  ← No D, no E. No CTAs.
└────────────────────────────────────────────┘
```

- **No primary CTA.** No secondary CTA. Not disabled — absent.
- **Card body tap → drilldown** (per v2.3 §9). This is the only interaction.
- **Card height is shorter** (no CTA row). Variable height = information (v2.3 §5 collapse rule: "Empty slots collapse vertically").
- **Accent color unchanged.** Same type-based accent as active states.

### Rules

- Passive cards never show a "Details" or "देखें" CTA. Card body tap handles drilldown access per §9.
- Passive cards are still server-ordered by TAS. They don't sink to bottom or get grouped.
- If a passive card becomes active (server sends new CTA), card re-renders with CTA. Normal refresh.

### Compliance with v2.3 §5

v2.3 secondary CTA rule: "Secondary CTA exists only if the primary action is incomplete without it. If the primary CTA is self-sufficient → secondary CTA is absent."

This addendum is compliant: when NO primary exists, secondary is also absent. v2.3 §5 collapse rule handles the height. v2.3 §9 handles the tap interaction. No new patterns needed.

---

## 5. Type Icons on Identity Line [Layer 2 — replaces ●/○ dot]

v2.3 §5 Field A uses a binary dot (● restore, ○ rest) for type identification. This addendum replaces the dot with a semantic icon per task type, enabling visual distinction across 4+ task types on a mixed Home feed.

### Why icons replace dots

The CSP's scan path is: **shape → color → text.** On a mixed feed with Install, Restore, NetBox, Renewal cards, the ●/○ dot gives one bit of information (restore vs. everything else). Icons give instant type recognition before reading the label.

### Identity line structure

```
[Type Icon]  Label · #ID · Locality
```

Replaces:

```
[●/○]  Label · #ID · Locality
```

### Icon set (locked)

| Task type | Icon | Material Symbol (filled) | Rationale |
|---|---|---|---|
| Install | House | `home` | Install = connecting a HOME. CSP goes to customer's house. |
| Restore | Wrench | `build` | Fix something broken. Universal repair symbol. |
| NetBox | Box | `inventory_2` | Physical device logistics. Matches "NetBox" naming. |
| Renewal / Recharge | ₹ symbol | `currency_rupee` | Money collection. Unmistakable. |
| Outage / Incident | ⚠ Triangle | `warning` | Already in v2.3 §7. Unchanged. |

### Icon rendering spec

| Property | Value |
|---|---|
| Style | Material Symbols, **filled** variant (not outlined — outlined loses legibility at 16dp on low-DPI) |
| Size | 18dp |
| Color — individual task & batch | `text.secondary` (#5C5469). Neutral — accent border carries urgency/type color. |
| Color — incident block | `state.warning` — alert signal (unchanged from v2.3 §7) |
| Position | Before text label, replacing ●/○ dot position |
| Gap | 4dp between icon and first text character |
| Lifecycle | **Fixed for card's lifetime.** Icon = task type, not state. Never changes. |

### Icon selection principle

Icons encode the **action/destination**, not the **object involved.** Install and NetBox both involve the same physical device — but Install is about the home (🏠) and NetBox is about the device (📦). Future task types follow the same principle: distinct silhouette, action-based, no overlap with existing icons.

### Batch and incident cards

Batch cards use the same icon as their individual task counterpart:
- Batch (recharge) → ₹ (same as Renewal)
- Batch (NetBox pickup/return) → Box (same as NetBox)

Incident cards keep ⚠ with `state.warning` color (already in v2.3 §7).

### Width guardrail (Guardrail B)

On ~280dp card width, truncation priority:

```
Priority 1: Icon — never truncate
Priority 2: ID — never truncate
Priority 3: Type label — truncate last
Priority 4: Locality — truncate first (ellipsis)
```

### Compliance with v2.3 §5

The ●/○ dot in v2.3 §5 Field A served one purpose: type identification. Icons serve the same purpose with more fidelity. Same position, same function, upgraded signal. The card layout, accent, padding, and all other properties are unchanged.

---

## 6. Drilldown Affordance — "देखें ›" [Layer 2 extension]

v2.3 §9 defines "Tap card (outside CTA) → Opens drilldown." But on a card with a prominent pink CTA, nothing signals to the CSP that the card body itself is tappable. The existing grey chevron (v2.3 §5) is too subtle for this persona.

### Pattern

Individual task cards and incident block cards get a visible "देखें ›" label at the card's trailing edge:

```
┌─[4dp grey]──────────────────────────────────────┐
│  [🏠] इंस्टॉल · #CN-4021 · सेक्टर 15           │ देखें ›
│  [reason] · X दिन बाकी                          │
│                                [समय भेजें]       │
└──────────────────────────────────────────────────┘
```

### Spec

| Property | Value |
|---|---|
| Text | "देखें" + chevron `›` |
| Style | `type.bodySmall` (12sp/400), `text.secondary` (#5C5469) |
| Position | Card trailing edge, **aligned with identity line (top row)** — not vertical center |
| Padding | 8dp from right card border |
| Tap target | Entire card body (same as v2.3 §9 — label just makes it visible) |
| Touch feedback | Same ripple as card body tap. No separate ripple for the label. |

### Guardrail A — "देखें" must not compete with primary CTA

| Check | Requirement |
|---|---|
| Font size | 12sp (vs 16sp for CTA) |
| Color | `text.secondary` (vs `text.onBrand` white-on-pink for CTA) |
| Weight | 400 (vs 700 for CTA) |
| Position | Trailing edge, aligned with identity line (vs bottom-right thumb zone for CTA) |
| Touch feedback | No distinct ripple — shares card body ripple |

**Test:** If CSP's eye lands on "देखें" before primary CTA → design has failed. "देखें" should be noticed only when CSP is looking for more context, not during primary scan.

### Where "देखें ›" appears

| Card type | Shows "देखें ›"? | Behavior |
|---|---|---|
| Individual task (Install, Restore, NetBox, Renewal) | Yes | Card body tap → drilldown |
| Incident block | Yes | Card body tap → status drilldown |
| Batch block | **No** | Batch uses its own "देखें" CTA button for inline expand |
| Passive individual task (no CTA) | Yes | Card body tap → drilldown (only interaction) |

### Why batch is excluded

Batch "देखें" = inline accordion expand (≤6 items). Individual/incident "देखें ›" = open drilldown. Different intent, different behavior. Batch keeps its own CTA-style "देखें" button per v2.3 §6. Individual cards get the trailing-edge navigation label. No conflict because they appear on different card types.

### Batch threshold rule (future-proofing)

| Item count | Behavior |
|---|---|
| ≤6 items | Inline accordion expand (current v2.3 §6 behavior) |
| >6 items | Opens batch drilldown list (future — not implemented in v1) |

This threshold is documented here but NOT implemented now. Current batch sizes are 3-5. When batch sizes grow, this rule governs the transition.

### Compliance with v2.3

v2.3 §9 already defines card body tap → drilldown. This addendum makes that existing interaction visible. No new interaction added. No layout change (label is at the card's trailing edge, outside the content area).

---

## 7. Summary of Additions

| Addition | Extends which v2.3 section | v2.3 contradiction? |
|---|---|---|
| Execution modes (§1) | §9 Interaction Rules | No — refines "Tap CTA" |
| ACTION_SHEET container (§1) | New — reusable component | No — new territory |
| Card morphing (§2) | §5 Task Card + §9 Interaction | No — new pattern |
| Optimistic rollback (§3) | §9 "sync on reconnect" | No — completes pattern |
| Toast pattern (§3) | New — feedback component | No — new territory |
| Passive card state (§4) | §5 card rendering | No — uses existing collapse + tap rules |
| Type icons (§5) | §5 Field A (replaces ●/○ dot) | **Replaces** — same purpose, better signal |
| "देखें ›" affordance (§6) | §5 card layout + §9 interaction | No — makes existing interaction visible |
| Batch threshold (§6) | §6 batch block (future) | No — documents future rule, no current change |

---

*Home Screen Visual Spec v2.3.1 (Addendum) | March 31, 2026*
*9 additions. 0 contradictions (1 purposeful upgrade of ●/○ → icons). Verified conflict-free against v2.3.*
