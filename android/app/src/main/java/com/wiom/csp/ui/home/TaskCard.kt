package com.wiom.csp.ui.home

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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

    // Badge color by task type
    val badgeColor = when (task.taskType) {
        TaskType.INSTALL -> colors.brandPrimary
        TaskType.RESTORE -> colors.accentRestore
        TaskType.NETBOX -> colors.accentGold
    }

    val cta = getCTA(task)
    val deadline = getDeadlineInfo(task)
    val contextId = task.connectionId ?: task.netboxId ?: task.taskId
    val area = task.customerArea ?: "--"
    val techWorking = isInTechnicianHands(task)

    val cardDescription = buildString {
        append("${task.taskType.name} task $contextId")
        if (task.priority == TaskPriority.HIGH) append(", high priority")
        append(", state ${task.state}")
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
                // Line 1: Type badge + HIGH + Context ID + Deadline
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Type badge (just colored text, no background — matching web)
                    Text(
                        text = task.taskType.name,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = badgeColor,
                        letterSpacing = 0.5.sp
                    )

                    // HIGH priority badge (with background)
                    if (task.priority == TaskPriority.HIGH) {
                        Text(
                            text = "HIGH",
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(colors.negativeSubtle)
                                .padding(horizontal = 6.dp, vertical = 2.dp),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.negative
                        )
                    }

                    // Context ID (flex: 1)
                    Text(
                        text = contextId,
                        modifier = Modifier.weight(1f),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.textPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    // Deadline countdown (right-aligned)
                    if (deadline != null) {
                        Text(
                            text = deadline.text,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (deadline.overdue) colors.negative else colors.textMuted
                        )
                    }
                }

                Spacer(Modifier.height(12.dp))

                // Line 2: Area + Tech assignment + CTA
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Area + tech info (flex: 1)
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = area,
                            fontSize = 14.sp,
                            color = colors.textSecondary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f, fill = false)
                        )
                        if (techWorking && task.assignedTo != null) {
                            Text("\u00B7", fontSize = 12.sp, color = colors.textMuted)
                            Text(
                                text = task.assignedTo!!,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = colors.warning,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

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
