package com.wiom.csp.ui.technician

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.domain.model.Task
import com.wiom.csp.domain.model.TaskType
import com.wiom.csp.domain.model.Technician
import com.wiom.csp.ui.theme.WiomCspTheme

private val TERMINAL_STATES = setOf(
    "RESOLVED", "VERIFIED", "ACTIVATION_VERIFIED",
    "RETURN_CONFIRMED", "FAILED", "UNRESOLVED", "LOST_DECLARED"
)

@Composable
fun TechDashboardScreen(
    tech: Technician,
    tasks: List<Task>,
    onSelectTask: (String) -> Unit,
    onOpenProfile: () -> Unit,
    onToggleAvailability: () -> Unit
) {
    val colors = WiomCspTheme.colors
    var historyOpen by remember { mutableStateOf(false) }

    val activeTasks = tasks.filter { it.state !in TERMINAL_STATES }
    val completedTasks = tasks.filter { it.state in TERMINAL_STATES }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgPrimary)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.bgPrimary)
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Avatar (clickable → profile)
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(colors.brandPrimary)
                        .clickable { onOpenProfile() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        tech.name.first().toString(),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Column {
                    Text(
                        tech.name,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary
                    )
                    Spacer(Modifier.height(2.dp))
                    // Band badge
                    Text(
                        "Band ${tech.band.name}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.brandPrimary,
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(colors.brandPrimary.copy(alpha = 0.12f))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            // Availability toggle
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(
                        if (tech.available) colors.positive.copy(alpha = 0.15f)
                        else colors.textMuted.copy(alpha = 0.2f)
                    )
                    .clickable { onToggleAvailability() }
                    .padding(horizontal = 14.dp, vertical = 8.dp)
            ) {
                Text(
                    if (tech.available) "Available" else "Unavailable",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (tech.available) colors.positive else colors.textMuted
                )
            }
        }

        // Border under header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(colors.borderSubtle)
        )

        // Content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            // Active Tasks section
            Text(
                "ACTIVE TASKS (${activeTasks.size})",
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = colors.textSecondary,
                letterSpacing = 0.3.sp
            )

            Spacer(Modifier.height(12.dp))

            if (activeTasks.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(colors.bgCard)
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "No active tasks right now",
                        fontSize = 14.sp,
                        color = colors.textMuted,
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    activeTasks.forEach { task ->
                        TechTaskCard(
                            task = task,
                            onClick = { onSelectTask(task.taskId) },
                            isCompleted = false
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // Completed tasks section (collapsible)
            if (completedTasks.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { historyOpen = !historyOpen }
                        .padding(bottom = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "COMPLETED (${completedTasks.size})",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.textSecondary,
                        letterSpacing = 0.3.sp
                    )
                    Text(
                        if (historyOpen) "\u25B2" else "\u25BC",
                        fontSize = 14.sp,
                        color = colors.textMuted
                    )
                }

                AnimatedVisibility(visible = historyOpen) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        completedTasks.forEach { task ->
                            TechTaskCard(
                                task = task,
                                onClick = { onSelectTask(task.taskId) },
                                isCompleted = true
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(40.dp))
        }
    }
}

@Composable
private fun TechTaskCard(
    task: Task,
    onClick: () -> Unit,
    isCompleted: Boolean
) {
    val colors = WiomCspTheme.colors
    val alpha = if (isCompleted) 0.7f else 1f

    val deadline = task.slaDeadlineAt ?: task.dueAt ?: task.pickupDueAt ?: task.returnDueAt
    val timeLeft = formatTimeLeft(deadline)
    val actionLabel = if (!isCompleted) getNextActionLabel(task) else null

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(colors.bgCard)
            .border(1.dp, colors.borderSubtle, RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 14.dp)
            .then(if (isCompleted) Modifier else Modifier) // alpha handled via content
    ) {
        // Top row: type badge + connection ID + priority
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                val typeColor = getTypeColor(task.taskType, colors)
                Text(
                    task.taskType.name,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = typeColor.copy(alpha = alpha),
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(typeColor.copy(alpha = 0.09f))
                        .padding(horizontal = 7.dp, vertical = 2.dp)
                )
                Text(
                    task.connectionId ?: task.netboxId ?: "",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textPrimary.copy(alpha = alpha)
                )
            }

            if (task.priority == com.wiom.csp.domain.model.TaskPriority.HIGH && !isCompleted) {
                Text(
                    "HIGH",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.negative,
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(colors.negative.copy(alpha = 0.12f))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }

        Spacer(Modifier.height(8.dp))

        // Bottom row: area + state | time left + action label
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "${task.customerArea ?: ""} \u00B7 ${task.state}",
                fontSize = 12.sp,
                color = colors.textMuted.copy(alpha = alpha)
            )

            if (!isCompleted) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (timeLeft != null) {
                        Text(
                            timeLeft,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (timeLeft == "Overdue") colors.negative else colors.warning
                        )
                    }
                    if (actionLabel != null) {
                        Text(
                            "$actionLabel \u203A",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.brandPrimary
                        )
                    }
                }
            }
        }
    }
}

private fun getTypeColor(type: TaskType, colors: com.wiom.csp.ui.theme.WiomColors): Color {
    return when (type) {
        TaskType.INSTALL -> colors.brandPrimary
        TaskType.RESTORE -> colors.accentRestore
        TaskType.NETBOX -> colors.accentGold
    }
}

private fun formatTimeLeft(deadline: String?): String? {
    if (deadline == null) return null
    val diff = try {
        java.time.Instant.parse(deadline).toEpochMilli() - System.currentTimeMillis()
    } catch (_: Exception) {
        return null
    }
    if (diff <= 0) return "Overdue"
    val mins = (diff / 60000).toInt()
    if (mins < 60) return "${mins}m left"
    val hrs = mins / 60
    return "${hrs}h ${mins % 60}m left"
}

private fun getNextActionLabel(task: Task): String? {
    return when (task.taskType) {
        TaskType.INSTALL -> when (task.state) {
            "CLAIMED", "ASSIGNED" -> "Accept"
            "ACCEPTED" -> "Start Work"
            "SCHEDULED" -> "Mark Installed"
            else -> null
        }
        TaskType.RESTORE -> when (task.state) {
            "ALERTED", "ASSIGNED" -> "Accept"
            "ACCEPTED" -> "Start Work"
            "IN_PROGRESS" -> "Resolve"
            else -> null
        }
        TaskType.NETBOX -> when (task.state) {
            "ASSIGNED" -> "Accept"
            "ACCEPTED", "IN_PROGRESS" -> "Collect"
            "COLLECTED" -> "Return"
            else -> null
        }
    }
}
