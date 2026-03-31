package com.wiom.csp.ui.install

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Call
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.wiom.csp.domain.model.TaskType
import com.wiom.csp.ui.home.TaskCardData
import com.wiom.csp.ui.home.TimerState
import com.wiom.csp.ui.theme.WiomTokens

// ════════════════════════════════════════════════════════════════════════════════
// Restore Flow Components — v1.0
// Authority: Home v2.3 → Addendum v2.3.1 → Restore Spec v1.0
// Key differences from Install:
//   - Red accent ALWAYS (#C62828)
//   - 🔧 icon (build, filled)
//   - ONE CTA per card max, no secondary, no exceptions
//   - No exit/decline — escalation handles
//   - Resolve = DRILLDOWN_REQUIRED (opens drilldown with guided proof)
//   - Guided proof: one step at a time, not checklist
//   - Call/Diagnose in drilldown only, WORKING+ only
// ════════════════════════════════════════════════════════════════════════════════

// ── Restore States ──────────────────────────────────────────────────────────────

enum class RestoreCardState {
    RESPOND_NOW,
    WORKING,
    ESCALATED_CSP_ACTIVE,
    ESCALATED_PLATFORM_TAKEOVER,
    VERIFICATION_PENDING,
    CUSTOMER_DENIED,
    RESOLVED,
    RECLASSIFIED
}

// ── Restore Task Data ───────────────────────────────────────────────────────────

data class RestoreTask(
    val taskId: String,
    val connectionId: String,
    val locality: String,
    val state: RestoreCardState,
    val reasonText: String,
    val timerState: TimerState = TimerState.NORMAL,
    val isEscalated: Boolean = false,
    val escalationTier: Int = 0,
    val maskedCallAvailable: Boolean = false,
    val serviceAddress: String = "",
    val issueType: String = "SERVICE_ISSUE",
    val executorName: String? = null,
    val canDiagnose: Boolean = false,
    val proofState: ProofState = ProofState(),
    val timeline: List<TimelineEntry> = emptyList(),
    val autoDismissSeconds: Int? = null  // for terminal states (§4a)
)

data class ProofState(
    val deviceEvent: ProofResult = ProofResult.PENDING,
    val systemCheck: ProofResult = ProofResult.NOT_STARTED,
    val customerConfirm: ProofResult = ProofResult.NOT_STARTED,
    val activeStep: ProofStep = ProofStep.DEVICE_EVENT
)

enum class ProofResult { NOT_STARTED, PENDING, PASS, FAIL }
enum class ProofStep { DEVICE_EVENT, SYSTEM_CHECK, CUSTOMER_CONFIRM }

// ── Helper: RestoreTask → TaskCardData ──────────────────────────────────────────

fun RestoreTask.toCardData(
    onPrimaryClick: () -> Unit = {},
    onCardClick: () -> Unit = {}
): TaskCardData {
    val (cta, dekhein) = when (state) {
        RestoreCardState.RESPOND_NOW -> "शुरू करें" to true
        RestoreCardState.WORKING -> "ठीक करें" to true
        RestoreCardState.ESCALATED_CSP_ACTIVE -> "ठीक करें" to true
        RestoreCardState.CUSTOMER_DENIED -> "ठीक करें" to true
        // Passive
        RestoreCardState.ESCALATED_PLATFORM_TAKEOVER -> null to false  // no देखें — departing
        RestoreCardState.VERIFICATION_PENDING -> null to true          // देखें stays — CSP wants proof status
        // Terminal (time-limited)
        RestoreCardState.RESOLVED -> null to false
        RestoreCardState.RECLASSIFIED -> null to false
    }

    // Reason text with ⚠ prefix for escalated states
    val displayReason = if (isEscalated && state in listOf(
            RestoreCardState.ESCALATED_CSP_ACTIVE,
            RestoreCardState.CUSTOMER_DENIED
        )
    ) {
        "⚠ $reasonText"
    } else if (state == RestoreCardState.RESOLVED) {
        "✓ $reasonText"
    } else {
        reasonText
    }

    return TaskCardData(
        taskId = taskId,
        taskType = TaskType.RESTORE,
        typeLabel = "Restore",
        objectId = connectionId,
        locality = locality,
        reasonTimerText = displayReason,
        timerState = timerState,
        primaryCtaLabel = cta,
        primaryCtaEnabled = cta != null,
        // NO secondary CTA ever on restore. Invariant #3.
        secondaryCtaLabel = null,
        secondaryCtaIcon = null,
        onPrimaryClick = onPrimaryClick,
        onSecondaryClick = null,
        onCardClick = onCardClick,
        showDekhein = dekhein
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// Component 1: EscalationBadge
// ⚠ prefix with contrast stacking per timer state
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun EscalationBadge(
    timerState: TimerState,
    modifier: Modifier = Modifier
) {
    val color = when (timerState) {
        TimerState.NORMAL -> WiomTokens.State.warning
        TimerState.URGENT -> WiomTokens.State.warning
        TimerState.OVERDUE -> WiomTokens.State.negative  // switch to red for contrast on bg.overdue
    }
    Text(
        text = "⚠",
        color = color,
        style = WiomTokens.Type.reasonTimer,
        modifier = modifier
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// Component 2: ProofStepResult
// ✅/❌/⏳ per proof item. Live-updating.
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun ProofStepResult(
    label: String,
    result: ProofResult,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        val (icon, color) = when (result) {
            ProofResult.PASS -> "✅" to WiomTokens.State.positive
            ProofResult.FAIL -> "❌" to WiomTokens.State.negative
            ProofResult.PENDING -> "⏳" to WiomTokens.Text.hint
            ProofResult.NOT_STARTED -> "○" to WiomTokens.Text.hint
        }
        Text(icon, style = WiomTokens.Type.body, color = color)
        Spacer(Modifier.width(8.dp))
        Text(
            text = label,
            style = if (result == ProofResult.PENDING) WiomTokens.Type.bodySmall else WiomTokens.Type.body,
            color = if (result == ProofResult.NOT_STARTED) WiomTokens.Text.hint else WiomTokens.Text.primary
        )
        if (result == ProofResult.PASS) {
            Spacer(Modifier.width(8.dp))
            Text("पास", style = WiomTokens.Type.bodySmall, color = WiomTokens.State.positive)
        }
        if (result == ProofResult.FAIL) {
            Spacer(Modifier.width(8.dp))
            Text("फ़ेल", style = WiomTokens.Type.bodySmall, color = WiomTokens.State.negative)
        }
        if (result == ProofResult.PENDING) {
            Spacer(Modifier.width(8.dp))
            Text("जाँच हो रही...", style = WiomTokens.Type.bodySmall, color = WiomTokens.Text.hint)
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// Component 3: GuidedProofFlow
// One step at a time. NOT a checklist.
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun GuidedProofFlow(
    proofState: ProofState,
    onRunSystemCheck: () -> Unit,
    onRequestCustomerConfirm: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        // Device Event — always visible, auto-running
        ProofStepResult(label = "Device reconnect", result = proofState.deviceEvent)

        // If device event passed → done, resolve can enable
        if (proofState.deviceEvent == ProofResult.PASS) return@Column

        // System Check — shown when device event hasn't resolved it
        when (proofState.systemCheck) {
            ProofResult.NOT_STARTED -> {
                // Active step: "System check करें"
                Spacer(Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(WiomTokens.Bg.info)
                        .clickable { onRunSystemCheck() }
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Text(
                        "▶ System check करें",
                        style = WiomTokens.Type.body.copy(fontWeight = FontWeight.SemiBold),
                        color = WiomTokens.State.info
                    )
                }
            }
            else -> {
                ProofStepResult(label = "System check", result = proofState.systemCheck)
            }
        }

        // Customer Confirm — only after system check FAILS
        if (proofState.systemCheck == ProofResult.FAIL) {
            when (proofState.customerConfirm) {
                ProofResult.NOT_STARTED -> {
                    Spacer(Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(WiomTokens.Bg.info)
                            .clickable { onRequestCustomerConfirm() }
                            .padding(horizontal = 16.dp, vertical = 12.dp)
                    ) {
                        Text(
                            "▶ Customer से पुष्टि लें",
                            style = WiomTokens.Type.body.copy(fontWeight = FontWeight.SemiBold),
                            color = WiomTokens.State.info
                        )
                    }
                }
                else -> {
                    ProofStepResult(label = "Customer confirmation", result = proofState.customerConfirm)
                }
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// Component 4: DiagnoseFaultSheet (ACTION_SHEET)
// Device ID + fault code. Structured input only.
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun DiagnoseFaultSheet(
    onSubmit: (faultCode: String) -> Unit,
    onDismiss: () -> Unit
) {
    var selectedFault by remember { mutableStateOf<String?>(null) }

    val faults = listOf(
        "DEVICE_MALFUNCTION" to "Device खराब",
        "POWER_FAILURE" to "बिजली की समस्या",
        "PHYSICAL_DAMAGE" to "शारीरिक नुकसान",
        "FIRMWARE_ISSUE" to "Firmware समस्या"
    )

    ActionSheetContainer(onDismiss = onDismiss) {
        Column(modifier = Modifier.padding(horizontal = 20.dp)) {
            Text(
                "Device issue diagnose करें",
                style = WiomTokens.Type.headerTitle,
                color = WiomTokens.Text.primary
            )

            Spacer(Modifier.height(16.dp))

            faults.forEach { (code, label) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { selectedFault = code }
                        .padding(vertical = 12.dp, horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = selectedFault == code,
                        onClick = { selectedFault = code },
                        colors = RadioButtonDefaults.colors(selectedColor = WiomTokens.Brand.primary)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(label, style = WiomTokens.Type.body, color = WiomTokens.Text.primary)
                }
            }

            Spacer(Modifier.height(8.dp))
            Text(
                "System verify करेगा",
                style = WiomTokens.Type.bodySmall,
                color = WiomTokens.Text.secondary
            )

            Spacer(Modifier.height(20.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(WiomTokens.Radius.cta))
                    .background(if (selectedFault != null) WiomTokens.Cta.primaryBg else WiomTokens.Cta.primaryDisabledBg)
                    .then(
                        if (selectedFault != null) Modifier.clickable { onSubmit(selectedFault!!) }
                        else Modifier
                    )
                    .padding(vertical = WiomTokens.Space.md),
                contentAlignment = Alignment.Center
            ) {
                Text("भेजें", style = WiomTokens.Type.cta, color = WiomTokens.Text.onBrand)
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// Restore Drilldown — Two Variants
// RESPOND_NOW → minimal (Status + Location + Start Work)
// WORKING/ESCALATED/CUSTOMER_DENIED → resolve-focused (Status + Proof + Resolve above fold)
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun RestoreDrilldown(
    task: RestoreTask,
    onBack: () -> Unit,
    onStartWork: () -> Unit,
    onResolve: () -> Unit,
    onRunSystemCheck: () -> Unit,
    onRequestCustomerConfirm: () -> Unit,
    onCallCustomer: () -> Unit,
    onAssignExecutor: () -> Unit,
    onDiagnose: () -> Unit
) {
    val isRespondNow = task.state == RestoreCardState.RESPOND_NOW
    val isWorkingVariant = task.state in listOf(
        RestoreCardState.WORKING,
        RestoreCardState.ESCALATED_CSP_ACTIVE,
        RestoreCardState.CUSTOMER_DENIED
    )

    // Resolve enabled when ≥1 proof passes
    val canResolve = task.proofState.deviceEvent == ProofResult.PASS ||
            task.proofState.systemCheck == ProofResult.PASS ||
            task.proofState.customerConfirm == ProofResult.PASS

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(WiomTokens.Bg.surface)
            .systemBarsPadding()
    ) {
        // Back header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "‹ वापस",
                style = WiomTokens.Type.body.copy(fontWeight = FontWeight.SemiBold),
                color = WiomTokens.Brand.primary,
                modifier = Modifier.clickable { onBack() }
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
        ) {
            // Identity
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Filled.Build,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = WiomTokens.Text.secondary
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    "Restore · #${task.connectionId}",
                    style = WiomTokens.Type.cardIdentity,
                    color = WiomTokens.Text.primary
                )
            }

            Spacer(Modifier.height(20.dp))

            // ── Status Section (always expanded, above fold) ────────────────
            SectionHeader("स्थिति")
            Spacer(Modifier.height(8.dp))

            val statusLabel = when (task.state) {
                RestoreCardState.RESPOND_NOW -> "जवाब बाकी"
                RestoreCardState.WORKING -> "काम चल रहा है"
                RestoreCardState.ESCALATED_CSP_ACTIVE -> "Escalated — Tier ${task.escalationTier}"
                RestoreCardState.CUSTOMER_DENIED -> "⚠ ग्राहक ने कहा ठीक नहीं हुआ — Tier ${task.escalationTier}"
                RestoreCardState.VERIFICATION_PENDING -> "जाँच हो रही है"
                RestoreCardState.ESCALATED_PLATFORM_TAKEOVER -> "प्लेटफ़ॉर्म संभाल रहा है"
                RestoreCardState.RESOLVED -> "✓ ठीक हो गया"
                RestoreCardState.RECLASSIFIED -> "Device issue — प्लेटफ़ॉर्म देखेगा"
            }
            Text(statusLabel, style = WiomTokens.Type.body, color = WiomTokens.Text.primary)

            // Timer
            if (task.reasonText.contains("बाकी") || task.reasonText.contains("मिनट") || task.reasonText.contains("घंटे")) {
                Spacer(Modifier.height(4.dp))
                Text(
                    "⏱ ${task.reasonText}",
                    style = WiomTokens.Type.body,
                    color = when (task.timerState) {
                        TimerState.NORMAL -> WiomTokens.Text.primary
                        TimerState.URGENT -> WiomTokens.State.warning
                        TimerState.OVERDUE -> WiomTokens.State.negative
                    }
                )
            }

            Spacer(Modifier.height(20.dp))

            if (isRespondNow) {
                // ═══ RESPOND_NOW Drilldown (minimal) ═══════════════════════
                // Only: Status + Location + Start Work. Nothing else.

                SectionHeader("स्थान")
                Spacer(Modifier.height(8.dp))
                if (task.serviceAddress.isNotEmpty()) {
                    Text(task.serviceAddress, style = WiomTokens.Type.body, color = WiomTokens.Text.primary)
                }
                Spacer(Modifier.height(4.dp))
                Text("Issue: ${task.issueType}", style = WiomTokens.Type.bodySmall, color = WiomTokens.Text.secondary)

                Spacer(Modifier.height(24.dp))

                // Start Work CTA
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(WiomTokens.Radius.cta))
                        .background(WiomTokens.Cta.primaryBg)
                        .clickable { onStartWork() }
                        .padding(vertical = WiomTokens.Space.md),
                    contentAlignment = Alignment.Center
                ) {
                    Text("शुरू करें", style = WiomTokens.Type.cta, color = WiomTokens.Text.onBrand)
                }

            } else if (isWorkingVariant) {
                // ═══ WORKING / ESCALATED / CUSTOMER_DENIED (resolve-focused) ═══

                // ── Proof Section (above fold) ──────────────────────────────
                SectionHeader("Proof")
                Spacer(Modifier.height(8.dp))

                GuidedProofFlow(
                    proofState = task.proofState,
                    onRunSystemCheck = onRunSystemCheck,
                    onRequestCustomerConfirm = onRequestCustomerConfirm
                )

                Spacer(Modifier.height(16.dp))

                // Resolve CTA (disabled until ≥1 proof passes)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(WiomTokens.Radius.cta))
                        .background(if (canResolve) WiomTokens.Cta.primaryBg else WiomTokens.Cta.primaryDisabledBg)
                        .then(if (canResolve) Modifier.clickable { onResolve() } else Modifier)
                        .padding(vertical = WiomTokens.Space.md),
                    contentAlignment = Alignment.Center
                ) {
                    Text("ठीक करें", style = WiomTokens.Type.cta, color = WiomTokens.Text.onBrand)
                }

                Spacer(Modifier.height(20.dp))

                // ── Below fold (collapsed sections) ─────────────────────────
                CollapsibleSection("स्थान") {
                    if (task.serviceAddress.isNotEmpty()) {
                        Text(task.serviceAddress, style = WiomTokens.Type.body, color = WiomTokens.Text.primary)
                    }
                    Spacer(Modifier.height(4.dp))
                    Text("Issue: ${task.issueType}", style = WiomTokens.Type.bodySmall, color = WiomTokens.Text.secondary)
                }

                CollapsibleSection("व्यक्ति") {
                    Text(
                        task.executorName ?: "अभी तय नहीं",
                        style = WiomTokens.Type.body,
                        color = WiomTokens.Text.primary
                    )
                    if (task.executorName != null) {
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "बदलें",
                            style = WiomTokens.Type.body,
                            color = WiomTokens.Text.secondary,
                            modifier = Modifier.clickable { onAssignExecutor() }
                        )
                    }
                }

                if (task.maskedCallAvailable) {
                    CollapsibleSection("संपर्क") {
                        MaskedCallCTA(onClick = onCallCustomer)
                    }
                }

                // Diagnose — always BELOW resolve, within reclass window only
                if (task.canDiagnose) {
                    CollapsibleSection("Diagnose") {
                        Text(
                            "Device issue diagnose करें",
                            style = WiomTokens.Type.body,
                            color = WiomTokens.Text.secondary,
                            modifier = Modifier.clickable { onDiagnose() }
                        )
                    }
                }

                // Timeline
                if (task.timeline.isNotEmpty()) {
                    CollapsibleSection("इतिहास") {
                        task.timeline.forEach { entry ->
                            Row(modifier = Modifier.padding(start = 8.dp, top = 4.dp, bottom = 4.dp)) {
                                Text(
                                    entry.timestamp,
                                    style = WiomTokens.Type.bodySmall,
                                    color = WiomTokens.Text.hint,
                                    modifier = Modifier.width(80.dp)
                                )
                                Text(
                                    "${entry.event} — ${entry.actor}",
                                    style = WiomTokens.Type.bodySmall,
                                    color = WiomTokens.Text.secondary
                                )
                            }
                        }
                    }
                }

            } else {
                // VERIFICATION_PENDING / PLATFORM_TAKEOVER / RESOLVED / RECLASSIFIED
                // Read-only drilldown with proof status
                if (task.state == RestoreCardState.VERIFICATION_PENDING) {
                    SectionHeader("Proof")
                    Spacer(Modifier.height(8.dp))
                    GuidedProofFlow(
                        proofState = task.proofState,
                        onRunSystemCheck = {},
                        onRequestCustomerConfirm = {}
                    )
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "जाँच हो रही है — कुछ मिनट लग सकते हैं",
                        style = WiomTokens.Type.body,
                        color = WiomTokens.Text.secondary
                    )
                }
            }

            Spacer(Modifier.height(32.dp))
        }
    }
}

// ── Collapsible Section ─────────────────────────────────────────────────────────

@Composable
private fun CollapsibleSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = !expanded }
                .padding(vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (expanded) "▾" else "▸",
                style = WiomTokens.Type.body,
                color = WiomTokens.Text.hint
            )
            Spacer(Modifier.width(8.dp))
            Text(
                title,
                style = WiomTokens.Type.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                color = WiomTokens.Text.secondary
            )
            Spacer(Modifier.weight(1f))
            HorizontalDivider(
                modifier = Modifier.weight(2f),
                color = WiomTokens.Stroke.primary,
                thickness = 1.dp
            )
        }
        if (expanded) {
            Column(modifier = Modifier.padding(start = 20.dp, bottom = 12.dp)) {
                content()
            }
        }
    }
}
