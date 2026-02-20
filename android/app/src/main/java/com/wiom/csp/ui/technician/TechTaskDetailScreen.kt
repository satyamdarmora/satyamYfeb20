package com.wiom.csp.ui.technician

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.domain.model.ActorType
import com.wiom.csp.domain.model.Task
import com.wiom.csp.domain.model.TaskType
import com.wiom.csp.ui.theme.WiomCspTheme
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun TechTaskDetailScreen(
    task: Task,
    techId: String,
    onAction: (String, String) -> Unit,
    onClose: () -> Unit
) {
    val colors = WiomCspTheme.colors
    val nextAction = getNextAction(task)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgPrimary)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp)
            ) {
                Text(
                    text = "\u2190 Back",
                    modifier = Modifier
                        .clickable { onClose() }
                        .padding(vertical = 4.dp),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.textMuted
                )
                Spacer(Modifier.height(10.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    val typeColor = getTypeColor(task.taskType, colors)
                    Text(
                        task.taskType.name,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = typeColor,
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(typeColor.copy(alpha = 0.09f))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                    Text(
                        task.taskId,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary
                    )
                }
            }

            // Border
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(colors.borderSubtle)
            )

            // Scrollable content
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp)
            ) {
                // Task info card (2-column grid)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(colors.bgCard)
                        .padding(18.dp)
                ) {
                    // Row 1: Connection + Area
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(20.dp)
                    ) {
                        InfoCell(
                            label = "CONNECTION",
                            value = task.connectionId ?: task.netboxId ?: "--",
                            modifier = Modifier.weight(1f)
                        )
                        InfoCell(
                            label = "AREA",
                            value = task.customerArea ?: "--",
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(Modifier.height(14.dp))

                    // Row 2: State + Priority
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(20.dp)
                    ) {
                        InfoCell(
                            label = "STATE",
                            value = task.state,
                            modifier = Modifier.weight(1f)
                        )
                        InfoCell(
                            label = "PRIORITY",
                            value = task.priority.name,
                            valueColor = if (task.priority == com.wiom.csp.domain.model.TaskPriority.HIGH) colors.negative else colors.textPrimary,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // SLA Deadline (full width)
                    if (task.slaDeadlineAt != null) {
                        Spacer(Modifier.height(14.dp))
                        InfoCell(
                            label = "SLA DEADLINE",
                            value = formatTimestamp(task.slaDeadlineAt),
                            valueColor = colors.warning,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    // Due date (full width)
                    if (task.dueAt != null) {
                        Spacer(Modifier.height(14.dp))
                        InfoCell(
                            label = "DUE",
                            value = formatTimestamp(task.dueAt),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                Spacer(Modifier.height(20.dp))

                // Timeline
                Text(
                    "Timeline",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textSecondary
                )

                Spacer(Modifier.height(14.dp))

                val sortedEvents = task.eventLog.sortedBy {
                    try { Instant.parse(it.timestamp).toEpochMilli() } catch (_: Exception) { 0L }
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .drawBehind {
                            if (sortedEvents.isNotEmpty()) {
                                drawLine(
                                    color = colors.borderSubtle,
                                    start = Offset(5.dp.toPx(), 4.dp.toPx()),
                                    end = Offset(5.dp.toPx(), size.height - 4.dp.toPx()),
                                    strokeWidth = 2.dp.toPx()
                                )
                            }
                        }
                        .padding(start = 20.dp)
                ) {
                    sortedEvents.forEachIndexed { i, event ->
                        Box(modifier = Modifier.padding(bottom = if (i < sortedEvents.lastIndex) 16.dp else 0.dp)) {
                            // Dot
                            Box(
                                modifier = Modifier
                                    .offset(x = (-17).dp, y = 3.dp)
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when (event.actorType) {
                                            ActorType.TECHNICIAN -> colors.positive
                                            ActorType.CSP -> colors.brandPrimary
                                            else -> colors.textMuted
                                        }
                                    )
                                    .drawBehind {
                                        // 2dp border matching bg
                                        drawCircle(
                                            color = colors.bgPrimary,
                                            radius = size.minDimension / 2 + 2.dp.toPx()
                                        )
                                        drawCircle(
                                            color = when (event.actorType) {
                                                ActorType.TECHNICIAN -> colors.positive
                                                ActorType.CSP -> colors.brandPrimary
                                                else -> colors.textMuted
                                            },
                                            radius = size.minDimension / 2
                                        )
                                    }
                            )

                            Column {
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.Bottom
                                ) {
                                    Text(
                                        formatTimestamp(event.timestamp),
                                        fontSize = 11.sp,
                                        color = colors.textMuted
                                    )
                                    Text(
                                        event.actor,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (event.actorType == ActorType.TECHNICIAN) colors.positive
                                        else colors.textSecondary
                                    )
                                }
                                Spacer(Modifier.height(2.dp))
                                Text(
                                    event.detail,
                                    fontSize = 13.sp,
                                    color = colors.textPrimary,
                                    lineHeight = 18.sp
                                )
                            }
                        }
                    }
                }

                Spacer(Modifier.height(20.dp))
            }

            // CTA button
            if (nextAction != null) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 16.dp)
                ) {
                    // Border
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(1.dp)
                            .background(colors.borderSubtle)
                    )
                    Spacer(Modifier.height(16.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(colors.brandPrimary)
                            .clickable { onAction(task.taskId, nextAction.action) }
                            .padding(vertical = 15.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            nextAction.label,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun InfoCell(
    label: String,
    value: String,
    valueColor: Color = WiomCspTheme.colors.textPrimary,
    modifier: Modifier = Modifier
) {
    val colors = WiomCspTheme.colors
    Column(modifier = modifier) {
        Text(
            label,
            fontSize = 11.sp,
            color = colors.textMuted,
            letterSpacing = 0.3.sp
        )
        Spacer(Modifier.height(3.dp))
        Text(
            value,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = valueColor
        )
    }
}

private fun getTypeColor(type: TaskType, colors: com.wiom.csp.ui.theme.WiomColors): Color {
    return when (type) {
        TaskType.INSTALL -> colors.brandPrimary
        TaskType.RESTORE -> colors.accentRestore
        TaskType.NETBOX -> colors.accentGold
    }
}

private data class ActionInfo(val label: String, val action: String)

private fun getNextAction(task: Task): ActionInfo? {
    return when (task.taskType) {
        TaskType.INSTALL -> when (task.state) {
            "CLAIMED", "ASSIGNED" -> ActionInfo("Accept Assignment", "ACCEPT_ASSIGNMENT")
            "ACCEPTED" -> ActionInfo("Start Work", "START_WORK")
            "SCHEDULED" -> ActionInfo("Mark Installed", "MARK_INSTALLED")
            else -> null
        }
        TaskType.RESTORE -> when (task.state) {
            "ALERTED", "ASSIGNED" -> ActionInfo("Accept Assignment", "ACCEPT_ASSIGNMENT")
            "ACCEPTED" -> ActionInfo("Start Work", "START_WORK")
            "IN_PROGRESS" -> ActionInfo("Resolve", "RESOLVE")
            else -> null
        }
        TaskType.NETBOX -> when (task.state) {
            "ASSIGNED" -> ActionInfo("Accept Assignment", "ACCEPT_ASSIGNMENT")
            "ACCEPTED", "IN_PROGRESS" -> ActionInfo("Mark Collected", "MARK_COLLECTED")
            "COLLECTED" -> ActionInfo("Confirm Return", "CONFIRM_RETURN")
            else -> null
        }
    }
}

private fun formatTimestamp(ts: String): String {
    return try {
        val instant = Instant.parse(ts)
        val zoned = instant.atZone(ZoneId.systemDefault())
        val formatter = DateTimeFormatter.ofPattern("d MMM, HH:mm", Locale.ENGLISH)
        zoned.format(formatter)
    } catch (_: Exception) {
        ts
    }
}
