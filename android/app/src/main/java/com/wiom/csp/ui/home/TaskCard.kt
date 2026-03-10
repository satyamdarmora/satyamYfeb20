package com.wiom.csp.ui.home

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.domain.model.*
import com.wiom.csp.ui.common.formatCountdown
import com.wiom.csp.ui.common.isOverdue
import com.wiom.csp.ui.theme.WiomCspTheme
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

@Composable
fun TaskCard(
    task: Task,
    bucket: Int,
    onAction: (String, String) -> Unit,
    onClick: () -> Unit,
    isFading: Boolean = false,
    modifier: Modifier = Modifier
) {
    val colors = WiomCspTheme.colors

    // Left border color = urgency-based (matching web getLeftBorderColor)
    val borderColor = getLeftBorderColor(bucket, task, colors)

    // Type dot color by task type (design spec: Install=blue, Restore=red, NetBox=amber)
    val typeDotColor = when (task.taskType) {
        TaskType.INSTALL -> colors.brandPrimary
        TaskType.RESTORE -> colors.accentRestore
        TaskType.NETBOX -> colors.accentGold
    }

    val cta = getCTA(task)
    val deadline = getDeadlineInfo(task)
    val contextId = task.connectionId ?: task.netboxId ?: task.taskId
    val area = task.customerArea ?: "--"
    val reasonLabel = getReasonLabel(task, deadline)

    val cardDescription = buildString {
        append("${task.taskType.name} task $contextId")
        append(", $reasonLabel")
        if (deadline != null) append(", ${deadline.text}")
        if (cta != null) append(", action: ${cta.label}")
    }

    AnimatedVisibility(
        visible = !isFading,
        exit = fadeOut() + slideOutHorizontally { it / 2 }
    ) {
        Box(
            modifier = modifier
                .fillMaxWidth()
                .padding(bottom = 14.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(colors.bgCard)
                .drawBehind {
                    // Left border accent (urgency-based)
                    drawLine(
                        color = borderColor,
                        start = Offset(0f, 0f),
                        end = Offset(0f, size.height),
                        strokeWidth = 3.dp.toPx()
                    )
                }
                .clickable { onClick() }
                .semantics { contentDescription = cardDescription }
                .padding(start = 20.dp, end = 20.dp, top = 18.dp, bottom = 20.dp)
        ) {
            Column {
                // Line 1: Type dot + Type · Context ID · Locality (identity line)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // 8px type dot (design spec)
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(typeDotColor)
                    )

                    // Identity: TYPE · CN-2847 · Sector 12
                    Text(
                        text = "${task.taskType.name} \u00B7 $contextId \u00B7 $area",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = colors.textSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(Modifier.height(10.dp))

                // Line 2: Reason label — the largest text element on the card
                Text(
                    text = reasonLabel,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(Modifier.height(12.dp))

                // Line 3: Timer + Note indicator + CTA
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Timer (left-aligned)
                    if (deadline != null) {
                        Text(
                            text = "\u23F1 ${deadline.text}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (deadline.overdue) colors.negative else colors.textMuted
                        )
                    }

                    // Note indicator (if task has notes in event log)
                    val noteCount = task.eventLog.count {
                        it.eventType in listOf("CSP_NOTE", "TECH_NOTE", "WIOM_RESPONSE")
                    }
                    val hasWiomReply = task.eventLog.any { it.eventType == "WIOM_RESPONSE" }
                    if (noteCount > 0 || hasWiomReply) {
                        Text(
                            text = if (hasWiomReply) "Wiom replied" else "$noteCount note${if (noteCount > 1) "s" else ""}",
                            fontSize = 11.sp,
                            color = if (hasWiomReply) colors.brandPrimary else colors.textMuted
                        )
                    }

                    Spacer(Modifier.weight(1f))

                    // CTA button (right-aligned)
                    if (cta != null) {
                        val ctaBg = when {
                            cta.urgent -> colors.negative
                            cta.isSecondary -> Color.Transparent
                            else -> colors.brandPrimary
                        }
                        val ctaTextColor = when {
                            cta.urgent -> Color.White
                            cta.isSecondary -> colors.textSecondary
                            else -> Color.White
                        }
                        val ctaModifier = if (cta.isSecondary) {
                            Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .border(1.dp, colors.borderSubtle, RoundedCornerShape(8.dp))
                                .clickable { onAction(task.taskId, cta.action) }
                                .padding(horizontal = 14.dp, vertical = 6.dp)
                        } else {
                            Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(ctaBg)
                                .clickable { onAction(task.taskId, cta.action) }
                                .padding(horizontal = 14.dp, vertical = 6.dp)
                        }
                        Box(modifier = ctaModifier) {
                            Text(
                                text = cta.label,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = ctaTextColor
                            )
                        }
                    } else {
                        // Chevron for non-actionable cards
                        Text("\u203A", fontSize = 14.sp, color = colors.textMuted)
                    }
                }
            }
        }
    }
}

/** Generate the single reason label for a task card (design spec: one reason only, no badge stacking) */
fun getReasonLabel(task: Task, deadline: DeadlineInfo? = null): String {
    val flag = task.queueEscalationFlag

    // Escalation flags take priority
    if (flag == EscalationFlag.BLOCKED_STALE) {
        val reason = task.blockedReason ?: "action needed"
        return "Blocked \u2014 $reason"
    }
    if (flag == EscalationFlag.OFFER_TTL_EXPIRING) {
        return "Offer expires \u2014 ${deadline?.text ?: "soon"}"
    }
    if (flag == EscalationFlag.CLAIM_TTL_EXPIRING) {
        return "Claim expiring \u2014 ${deadline?.text ?: "soon"}"
    }
    if (flag == EscalationFlag.RETURN_OVERDUE) {
        return "Return overdue${if (deadline != null) " \u2014 ${deadline.text}" else ""}"
    }
    if (flag == EscalationFlag.VERIFICATION_PENDING) {
        return "Verification pending"
    }
    if (flag == EscalationFlag.INSTALL_OVERDUE) {
        return "Install overdue${if (deadline != null) " \u2014 ${deadline.text}" else ""}"
    }
    if (flag == EscalationFlag.PICKUP_OVERDUE) {
        return "Pickup overdue${if (deadline != null) " \u2014 ${deadline.text}" else ""}"
    }
    if (flag == EscalationFlag.ASSIGNMENT_UNACCEPTED) {
        return "Assignment unaccepted"
    }
    if (flag == EscalationFlag.CHAIN_ESCALATION_PENDING) {
        return "Chain escalation pending"
    }
    if (flag == EscalationFlag.RESTORE_RETRY) {
        return "Restore retry \u2014 attempt ${task.retryCount}"
    }
    if (flag == EscalationFlag.MANUAL_EXCEPTION) {
        return "Manual exception"
    }

    // High priority restore with deadline
    if (task.taskType == TaskType.RESTORE && task.priority == TaskPriority.HIGH && deadline != null) {
        return "Customer outage \u2014 ${deadline.text}"
    }

    // State-based defaults
    if (deadline?.overdue == true) {
        return when (task.taskType) {
            TaskType.INSTALL -> "Install overdue \u2014 ${deadline.text}"
            TaskType.RESTORE -> "Restore overdue \u2014 ${deadline.text}"
            TaskType.NETBOX -> "Return overdue \u2014 ${deadline.text}"
        }
    }

    // Approaching deadline
    if (deadline != null && task.state !in Task.TERMINAL_STATES) {
        return when (task.taskType) {
            TaskType.INSTALL -> "Install deadline \u2014 ${deadline.text}"
            TaskType.RESTORE -> "Restore deadline \u2014 ${deadline.text}"
            TaskType.NETBOX -> "Return due \u2014 ${deadline.text}"
        }
    }

    // Default state labels
    return when (task.state) {
        "OFFERED" -> "New connection available"
        "CLAIMED" -> "Claimed \u2014 awaiting acceptance"
        "ACCEPTED" -> "Accepted \u2014 assign technician"
        "SCHEDULED" -> "Scheduled"
        "INSTALLED" -> "Installed \u2014 pending verification"
        "ALERTED" -> "Service alert \u2014 assign technician"
        "ASSIGNED" -> "Assigned \u2014 in progress"
        "IN_PROGRESS" -> "In progress"
        "RESOLVED" -> "Resolved"
        "COLLECTED" -> "Collected \u2014 confirm return"
        "PICKUP_REQUIRED" -> "Pickup required"
        else -> task.state.replace("_", " ").lowercase()
            .replaceFirstChar { it.uppercase() }
    }
}

data class CTAInfo(
    val label: String,
    val action: String,
    val urgent: Boolean = false,
    val isSecondary: Boolean = false
)

/** Check if task is currently in technician's hands */
fun isInTechnicianHands(task: Task): Boolean {
    if (task.assignedTo != null &&
        task.delegationState in listOf(DelegationState.ASSIGNED, DelegationState.ACCEPTED, DelegationState.IN_PROGRESS) &&
        task.state in listOf("ASSIGNED", "IN_PROGRESS", "SCHEDULED")
    ) return true
    return false
}

/** Check if task is self-assigned */
fun isSelfAssigned(task: Task): Boolean {
    return isInTechnicianHands(task) && task.assignedTo?.startsWith("Self") == true
}

/** Get CTA matching web getCTA logic exactly */
fun getCTA(task: Task): CTAInfo? {
    val state = task.state

    // Self-assigned: CSP can perform work actions directly
    if (isSelfAssigned(task)) {
        when (task.taskType) {
            TaskType.INSTALL -> {
                if (state == "SCHEDULED" || state == "ASSIGNED") return CTAInfo("Start Work", "START_WORK")
                if (state == "IN_PROGRESS") return CTAInfo("Mark Installed", "INSTALL")
            }
            TaskType.RESTORE -> {
                if (state == "ASSIGNED") return CTAInfo("Start Work", "START_WORK")
                if (state == "IN_PROGRESS") return CTAInfo("Resolve", "RESOLVE")
            }
            TaskType.NETBOX -> {
                if (state == "ASSIGNED") return CTAInfo("Mark Collected", "COLLECTED")
            }
        }
    }

    // Technician assigned (not self) — CSP can only reassign
    if (isInTechnicianHands(task)) {
        return CTAInfo("Reassign", "ASSIGN", isSecondary = true)
    }

    val flag = task.queueEscalationFlag

    if (state == "OFFERED") return CTAInfo("View", "VIEW")
    if (state == "CLAIMED") return CTAInfo("Accept", "ACCEPT")
    if (state == "ACCEPTED" || state == "PICKUP_REQUIRED") return CTAInfo("Assign", "SCHEDULE")
    if (state == "ALERTED") return CTAInfo("Assign", "ASSIGN", urgent = task.priority == TaskPriority.HIGH)
    if (flag == EscalationFlag.BLOCKED_STALE) return CTAInfo("Unblock", "RESOLVE_BLOCKED", urgent = true)
    if (state == "COLLECTED") return CTAInfo("Confirm Return", "CONFIRM_RETURN")
    if (state == "INSTALLED" && flag == EscalationFlag.VERIFICATION_PENDING) return CTAInfo("Verify", "VERIFY")

    return null
}

data class DeadlineInfo(val text: String, val overdue: Boolean)

fun getDeadlineInfo(task: Task): DeadlineInfo? {
    val candidates = listOfNotNull(
        task.slaDeadlineAt, task.offerExpiresAt, task.acceptExpiresAt,
        task.returnDueAt, task.pickupDueAt, task.dueAt
    )
    if (candidates.isEmpty()) return null
    val nearest = candidates.minByOrNull {
        try { java.time.Instant.parse(it).toEpochMilli() } catch (_: Exception) { Long.MAX_VALUE }
    } ?: return null
    val remaining = com.wiom.csp.ui.common.formatCountdown(nearest) ?: return null
    return DeadlineInfo(remaining, remaining == "Overdue")
}

/** Left border = urgency-based (matching web getLeftBorderColor) */
private fun getLeftBorderColor(bucket: Int, task: Task, colors: com.wiom.csp.ui.theme.WiomColors): Color {
    val deadlines = listOfNotNull(
        task.slaDeadlineAt, task.offerExpiresAt, task.acceptExpiresAt,
        task.returnDueAt, task.pickupDueAt, task.dueAt
    )
    val isOverdue = deadlines.any { com.wiom.csp.ui.common.isOverdue(it) }
    if (isOverdue) return colors.negative
    if (task.priority == TaskPriority.HIGH) return colors.negative
    if (bucket <= 1) return colors.negative
    if (bucket <= 3) return colors.warning
    return colors.positive
}
