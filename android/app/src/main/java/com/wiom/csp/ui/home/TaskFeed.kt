package com.wiom.csp.ui.home

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
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
import com.wiom.csp.domain.model.Task
import com.wiom.csp.domain.model.TaskType
import com.wiom.csp.ui.common.FilterChipRow
import com.wiom.csp.ui.common.parseIso
import com.wiom.csp.ui.theme.WiomCspTheme

@Composable
fun TaskFeed(
    tasks: List<Task>,
    fadingTasks: Map<String, Task>,
    getBucket: (Task) -> Int,
    onAction: (String, String) -> Unit,
    onCardClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = WiomCspTheme.colors
    var filter by remember { mutableStateOf("All") }

    // Filter out terminal-state tasks
    val activeTasks = remember(tasks) {
        tasks.filter { !it.isTerminal }
    }

    val filteredTasks = remember(activeTasks, filter) {
        when (filter) {
            "Install" -> activeTasks.filter { it.taskType == TaskType.INSTALL }
            "Restore" -> activeTasks.filter { it.taskType == TaskType.RESTORE }
            "NetBox" -> activeTasks.filter { it.taskType == TaskType.NETBOX }
            else -> activeTasks
        }
    }

    // Zone A: non-OFFERED tasks (Your Tasks)
    val zoneATasks = remember(filteredTasks) {
        filteredTasks.filter { it.state != "OFFERED" }
    }

    // Zone B: OFFERED tasks sorted by offer_expires_at ascending
    val zoneBTasks = remember(filteredTasks) {
        filteredTasks
            .filter { it.state == "OFFERED" }
            .sortedBy { parseIso(it.offerExpiresAt) ?: Long.MAX_VALUE }
    }

    // Safety check: if filter hides bucket 0/1 tasks, show warning
    val hiddenCriticalCount = remember(activeTasks, filter) {
        if (filter == "All") 0
        else activeTasks.count { task ->
            val bucket = getBucket(task)
            val filterType = when (filter) {
                "Install" -> TaskType.INSTALL
                "Restore" -> TaskType.RESTORE
                "NetBox" -> TaskType.NETBOX
                else -> null
            }
            (bucket == 0 || bucket == 1) && task.taskType != filterType
        }
    }

    // Fading resolved cards for Zone A
    val fadingZoneA = remember(fadingTasks) {
        fadingTasks.values.filter { it.state != "OFFERED" }
    }

    LazyColumn(
        modifier = modifier.fillMaxWidth(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 80.dp)
    ) {
        // Filter chips
        item {
            FilterChipRow(
                options = listOf("All", "Install", "Restore", "NetBox"),
                selected = filter,
                onSelect = { filter = it },
                modifier = Modifier.padding(vertical = 12.dp)
            )
        }

        // Safety banner for hidden critical tasks
        if (hiddenCriticalCount > 0) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(colors.negativeSubtle)
                        .border(
                            1.dp,
                            Color(0x4DE01E00),
                            RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 14.dp, vertical = 10.dp)
                ) {
                    Text(
                        text = "$hiddenCriticalCount critical task(s) hidden by current filter",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = colors.negative
                    )
                }
                Spacer(Modifier.height(8.dp))
            }
        }

        // Zone A header: YOUR TASKS (count)
        item {
            Row(
                modifier = Modifier.padding(top = 16.dp, bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "YOUR TASKS",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textMuted,
                    letterSpacing = 0.8.sp
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = "(${zoneATasks.size})",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Normal,
                    color = colors.textMuted
                )
            }
        }

        // Empty state for Zone A
        if (zoneATasks.isEmpty() && fadingZoneA.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No active tasks right now",
                        fontSize = 13.sp,
                        color = colors.textMuted
                    )
                }
            }
        }

        // Fading "resolved" cards
        if (fadingZoneA.isNotEmpty()) {
            items(fadingZoneA, key = { "fading-${it.taskId}" }) { task ->
                FadingResolvedCard(task = task)
            }
        }

        // Zone A task cards
        items(zoneATasks, key = { it.taskId }) { task ->
            TaskCard(
                task = task,
                bucket = getBucket(task),
                onAction = onAction,
                onClick = { onCardClick(task.taskId) }
            )
        }

        // Zone B header: AVAILABLE (count) with border separator
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp)
                    .drawBehind {
                        drawLine(
                            color = colors.borderSubtle,
                            start = Offset(0f, 0f),
                            end = Offset(size.width, 0f),
                            strokeWidth = 1.dp.toPx()
                        )
                    }
                    .padding(top = 20.dp, bottom = 8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "AVAILABLE",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.textMuted,
                        letterSpacing = 0.8.sp
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "(${zoneBTasks.size})",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Normal,
                        color = colors.textMuted
                    )
                }
            }
        }

        // Empty state for Zone B
        if (zoneBTasks.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No new connections available right now",
                        fontSize = 13.sp,
                        color = colors.textMuted
                    )
                }
            }
        }

        // Zone B task cards
        items(zoneBTasks, key = { it.taskId }) { task ->
            TaskCard(
                task = task,
                bucket = getBucket(task),
                onAction = onAction,
                onClick = { onCardClick(task.taskId) }
            )
        }
    }
}

/** Fading resolved card with overlay badge — matches web fadeSlideOut animation */
@Composable
private fun FadingResolvedCard(task: Task) {
    val colors = WiomCspTheme.colors
    val contextId = task.connectionId ?: task.netboxId ?: task.taskId
    val area = task.customerArea ?: "--"

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 10.dp)
    ) {
        // Dimmed card underneath
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(colors.bgCard.copy(alpha = 0.7f))
                .drawBehind {
                    drawLine(
                        color = colors.positive,
                        start = Offset(0f, 0f),
                        end = Offset(0f, size.height),
                        strokeWidth = 4.dp.toPx()
                    )
                }
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = task.taskType.name,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.positive
                )
                Text(
                    text = contextId,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.textPrimary
                )
            }
            Spacer(Modifier.height(6.dp))
            Text(
                text = area,
                fontSize = 12.sp,
                color = colors.textSecondary
            )
        }

        // Resolved overlay
        Box(
            modifier = Modifier
                .matchParentSize()
                .clip(RoundedCornerShape(10.dp))
                .background(colors.positiveSubtle),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(colors.positive)
                    .padding(horizontal = 20.dp, vertical = 6.dp)
            ) {
                Text(
                    text = "\u2713 Resolved",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    letterSpacing = 0.5.sp
                )
            }
        }
    }
}
