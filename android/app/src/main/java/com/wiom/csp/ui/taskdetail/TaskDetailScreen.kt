package com.wiom.csp.ui.taskdetail

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.domain.model.*
import com.wiom.csp.ui.common.formatCountdown
import com.wiom.csp.ui.common.formatTimeAgo
import com.wiom.csp.ui.common.WiomAsyncImage
import com.wiom.csp.ui.home.isSelfAssigned
import com.wiom.csp.ui.home.isInTechnicianHands
import com.wiom.csp.ui.theme.WiomCspTheme
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.core.content.FileProvider
import androidx.compose.ui.platform.LocalContext
import java.io.File
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val DECLINE_REASONS = listOf(
    "Too far from my area",
    "Insufficient bandwidth / too busy",
    "Customer area not serviceable",
    "Not enough technicians available",
    "SLA timeline too tight"
)

private fun getActorColor(actorType: ActorType, colors: com.wiom.csp.ui.theme.WiomColors): Color {
    return when (actorType) {
        ActorType.SYSTEM -> colors.textMuted
        ActorType.CSP -> colors.brandPrimary
        ActorType.ADMIN -> colors.warning
        ActorType.TECHNICIAN -> colors.positive
    }
}

private fun getStateColor(state: String, colors: com.wiom.csp.ui.theme.WiomColors): Color {
    val activeStates = setOf("IN_PROGRESS", "ASSIGNED", "SCHEDULED", "ACCEPTED", "CLAIMED")
    val alertStates = setOf("ALERTED", "OFFERED", "PICKUP_REQUIRED")
    val doneStates = setOf("RESOLVED", "VERIFIED", "ACTIVATION_VERIFIED", "RETURN_CONFIRMED", "INSTALLED")
    val failStates = setOf("FAILED", "UNRESOLVED", "LOST_DECLARED")

    return when {
        state in activeStates -> colors.brandPrimary
        state in alertStates -> colors.warning
        state in doneStates -> colors.positive
        state in failStates -> colors.negative
        else -> colors.textSecondary
    }
}

private fun getBadgeBackground(taskType: TaskType, colors: com.wiom.csp.ui.theme.WiomColors): Color {
    return when (taskType) {
        TaskType.INSTALL -> colors.brandSubtle
        TaskType.RESTORE -> colors.restoreSubtle
        TaskType.NETBOX -> colors.goldSubtle
    }
}

private fun getBadgeColor(taskType: TaskType, colors: com.wiom.csp.ui.theme.WiomColors): Color {
    return when (taskType) {
        TaskType.INSTALL -> colors.brandPrimary
        TaskType.RESTORE -> colors.accentRestore
        TaskType.NETBOX -> colors.accentGold
    }
}

private fun formatFullTimestamp(iso: String): String {
    return try {
        val instant = Instant.parse(iso)
        val zdt = instant.atZone(ZoneId.systemDefault())
        val formatter = DateTimeFormatter.ofPattern("d MMM yyyy, hh:mm:ss a", Locale.ENGLISH)
        zdt.format(formatter)
    } catch (_: Exception) { iso }
}

private fun getTimeRemaining(dateStr: String?): String {
    if (dateStr == null) return "--"
    return try {
        val diff = Instant.parse(dateStr).toEpochMilli() - System.currentTimeMillis()
        if (diff <= 0) return "Expired"
        val mins = (diff / 60000).toInt()
        if (mins < 60) return "$mins min"
        val hrs = mins / 60
        "${hrs}h ${mins % 60}m"
    } catch (_: Exception) { "--" }
}

/** Get detail-view CTA (slightly different from card CTA — no CTA for OFFERED in detail) */
private fun getDetailCTA(task: Task): DetailCTAInfo? {
    val state = task.state
    if (state in Task.TERMINAL_STATES) return null
    if (state == "OFFERED") return null // handled separately

    if (isSelfAssigned(task)) {
        when (task.taskType) {
            TaskType.INSTALL -> {
                if (state == "SCHEDULED" || state == "ASSIGNED") return DetailCTAInfo("Start Work", "START_WORK")
                if (state == "IN_PROGRESS") return DetailCTAInfo("Mark Installed", "INSTALL")
            }
            TaskType.RESTORE -> {
                if (state == "ASSIGNED") return DetailCTAInfo("Start Work", "START_WORK")
                if (state == "IN_PROGRESS") return DetailCTAInfo("Resolve", "RESOLVE")
            }
            TaskType.NETBOX -> {
                if (state == "ASSIGNED") return DetailCTAInfo("Mark Collected", "COLLECTED")
            }
        }
    }

    if (isInTechnicianHands(task)) return DetailCTAInfo("Reassign", "ASSIGN")

    if (state == "CLAIMED") return DetailCTAInfo("Accept", "ACCEPT")
    if (state == "ACCEPTED" || state == "PICKUP_REQUIRED") return DetailCTAInfo("Schedule / Assign", "SCHEDULE")
    if (state == "ALERTED") return DetailCTAInfo("Assign", "ASSIGN", urgent = task.priority == TaskPriority.HIGH)
    if (task.queueEscalationFlag == EscalationFlag.BLOCKED_STALE) return DetailCTAInfo("Resolve (Urgent)", "RESOLVE_BLOCKED", urgent = true)
    if (state == "COLLECTED") return DetailCTAInfo("Confirm Return", "CONFIRM_RETURN")
    if (state == "INSTALLED" && task.queueEscalationFlag == EscalationFlag.VERIFICATION_PENDING) return DetailCTAInfo("Verify Manually", "VERIFY")

    return null
}

private data class DetailCTAInfo(val label: String, val action: String, val urgent: Boolean = false)

@Composable
fun TaskDetailScreen(
    task: Task,
    onBack: () -> Unit,
    onAction: (String, String, Map<String, String>) -> Unit
) {
    val colors = WiomCspTheme.colors
    val context = LocalContext.current
    var offerStep by remember { mutableStateOf("details") }
    var capturedPhotoUri by remember { mutableStateOf<Uri?>(null) }

    // Camera launcher
    val tempPhotoUri = remember {
        val dir = File(context.cacheDir, "proof_images").apply { mkdirs() }
        val file = File(dir, "proof_${task.taskId}_${System.currentTimeMillis()}.jpg")
        FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
    }
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) capturedPhotoUri = tempPhotoUri
    }

    val isOffer = task.state == "OFFERED"
    val contextId = task.connectionId ?: task.netboxId ?: "--"
    val area = task.customerArea ?: "--"
    val canCaptureProof = !isOffer && !task.isTerminal

    // ---- OFFERED: Slot picker ----
    if (isOffer && offerStep == "slot_pick") {
        SlotPickerScreen(
            task = task,
            contextId = contextId,
            area = area,
            onSelectSlot = { slot ->
                onAction(task.taskId, "CLAIM_AND_ASSIGN", mapOf("preferred_slot" to slot))
            },
            onBack = { offerStep = "details" }
        )
        return
    }

    // ---- OFFERED: Decline reason ----
    if (isOffer && offerStep == "decline_reason") {
        DeclineReasonScreen(
            task = task,
            contextId = contextId,
            area = area,
            onSelectReason = { reason ->
                onAction(task.taskId, "DECLINE", mapOf("reason" to reason))
            },
            onBack = { offerStep = "details" }
        )
        return
    }

    // ---- Main detail view ----
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgPrimary)
            .statusBarsPadding()
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .drawBehind {
                        drawLine(
                            color = colors.borderSubtle,
                            start = Offset(0f, size.height),
                            end = Offset(size.width, size.height),
                            strokeWidth = 1.dp.toPx()
                        )
                    }
                    .padding(16.dp)
            ) {
                // Back button (text, not icon)
                Text(
                    text = "\u2190 Back to tasks",
                    modifier = Modifier
                        .clickable { onBack() }
                        .semantics { contentDescription = "Go back to task list" }
                        .padding(vertical = 4.dp),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.textSecondary
                )

                Spacer(Modifier.height(12.dp))

                // Type badge + Task ID + State badge
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Type badge with background
                    Text(
                        text = task.taskType.name,
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(getBadgeBackground(task.taskType, colors))
                            .padding(horizontal = 10.dp, vertical = 3.dp),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 0.3.sp,
                        color = getBadgeColor(task.taskType, colors)
                    )

                    // Task ID
                    Text(
                        text = task.taskId,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary
                    )

                    // State badge
                    Text(
                        text = task.state,
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .padding(horizontal = 8.dp, vertical = 2.dp),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = getStateColor(task.state, colors)
                    )
                }

                Spacer(Modifier.height(8.dp))

                // Context ID
                Text(
                    text = contextId,
                    fontSize = 14.sp,
                    color = colors.textPrimary
                )
                Spacer(Modifier.height(2.dp))
                // Area
                Text(
                    text = area,
                    fontSize = 12.sp,
                    color = colors.textSecondary
                )
            }

            // Scrollable content
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                // OFFERED: Customer Details Card
                if (isOffer) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                Brush.linearGradient(
                                    colors = listOf(colors.cardGradientStart, colors.bgSecondary)
                                )
                            )
                            .border(1.dp, colors.bgCardHover, RoundedCornerShape(12.dp))
                            .padding(20.dp)
                    ) {
                        Text(
                            text = "CUSTOMER DETAILS",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textSecondary,
                            letterSpacing = 0.5.sp
                        )
                        Spacer(Modifier.height(12.dp))
                        OfferInfoRow("Connection ID", contextId, colors.textPrimary)
                        Spacer(Modifier.height(10.dp))
                        OfferInfoRow("Area", area, colors.textPrimary)
                        Spacer(Modifier.height(10.dp))
                        OfferInfoRow("Task Type", task.taskType.name, getBadgeColor(task.taskType, colors))
                        Spacer(Modifier.height(10.dp))
                        OfferInfoRow(
                            "Priority",
                            task.priority.name,
                            if (task.priority == TaskPriority.HIGH) colors.negative else colors.textPrimary
                        )
                        if (task.offerExpiresAt != null) {
                            Spacer(Modifier.height(10.dp))
                            OfferInfoRow("Offer Expires", getTimeRemaining(task.offerExpiresAt), colors.warning)
                        }
                    }
                    Spacer(Modifier.height(20.dp))
                }

                // Info Section (non-OFFERED)
                if (!isOffer) {
                    // Assigned-to indicator
                    if (task.assignedTo != null) {
                        val selfAssigned = isSelfAssigned(task)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (selfAssigned) colors.brandSubtle else colors.warningSubtle)
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(if (selfAssigned) colors.brandPrimary else colors.warning)
                            )
                            Text(
                                text = if (selfAssigned) "You are working on this" else task.assignedTo!!,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = colors.textPrimary
                            )
                            Spacer(Modifier.weight(1f))
                            Text(
                                text = when (task.delegationState) {
                                    DelegationState.IN_PROGRESS -> "In Progress"
                                    DelegationState.ASSIGNED -> "Assigned"
                                    else -> task.delegationState.name
                                },
                                fontSize = 12.sp,
                                color = colors.textMuted
                            )
                        }
                        Spacer(Modifier.height(14.dp))
                    }

                    // Info rows with border separators
                    InfoRowWithBorder("Priority", task.priority.name,
                        if (task.priority == TaskPriority.HIGH) colors.negative else colors.textPrimary)
                    if (task.slaDeadlineAt != null) {
                        InfoRowWithBorder("SLA Deadline", formatFullTimestamp(task.slaDeadlineAt), colors.textPrimary)
                    }
                    InfoRowWithBorder("Created", formatFullTimestamp(task.createdAt), colors.textPrimary)
                    if (task.retryCount > 0) {
                        InfoRowWithBorder("Retries", "${task.retryCount}", colors.warning)
                    }
                    if (task.queueEscalationFlag != null) {
                        InfoRowWithBorder("Escalation", task.queueEscalationFlag.name, colors.warning)
                    }
                    if (task.blockedReason != null) {
                        InfoRowWithBorder("Blocked", task.blockedReason, colors.negative)
                    }

                    Spacer(Modifier.height(24.dp))
                }

                // Proof capture section (non-OFFERED, non-terminal)
                if (canCaptureProof) {
                    Text(
                        text = "PROOF",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.textSecondary,
                        letterSpacing = 0.5.sp
                    )
                    Spacer(Modifier.height(8.dp))

                    if (capturedPhotoUri != null) {
                        WiomAsyncImage(
                            model = capturedPhotoUri,
                            contentDescription = "Captured proof photo",
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(180.dp)
                        )
                        Spacer(Modifier.height(8.dp))
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(colors.bgCard)
                            .clickable { cameraLauncher.launch(tempPhotoUri) }
                            .padding(horizontal = 16.dp, vertical = 10.dp)
                    ) {
                        Text(
                            text = if (capturedPhotoUri != null) "Retake Photo" else "Capture Photo",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.brandPrimary
                        )
                    }

                    Spacer(Modifier.height(24.dp))
                }

                // Timeline header
                Text(
                    text = "TIMELINE",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textSecondary,
                    letterSpacing = 0.5.sp
                )
                Spacer(Modifier.height(16.dp))

                // Timeline events (sorted ascending — oldest first)
                val sortedEvents = remember(task.eventLog) {
                    task.eventLog.sortedBy {
                        try { Instant.parse(it.timestamp).toEpochMilli() } catch (_: Exception) { 0L }
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .drawBehind {
                            if (sortedEvents.isNotEmpty()) {
                                drawLine(
                                    color = colors.borderSubtle,
                                    start = Offset(7.dp.toPx(), 4.dp.toPx()),
                                    end = Offset(7.dp.toPx(), size.height - 4.dp.toPx()),
                                    strokeWidth = 2.dp.toPx()
                                )
                            }
                        }
                        .padding(start = 24.dp)
                ) {
                    sortedEvents.forEachIndexed { i, event ->
                        TimelineEventItem(
                            event = event,
                            isLast = i == sortedEvents.size - 1
                        )
                    }
                }

                Spacer(Modifier.height(80.dp))
            }

            // Bottom CTA area
            val cta = getDetailCTA(task)
            if (isOffer) {
                // OFFERED: Decline + Claim buttons
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .drawBehind {
                            drawLine(
                                color = colors.borderSubtle,
                                start = Offset(0f, 0f),
                                end = Offset(size.width, 0f),
                                strokeWidth = 1.dp.toPx()
                            )
                        }
                        .background(colors.bgPrimary)
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Decline (1fr)
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .border(1.dp, colors.negative, RoundedCornerShape(10.dp))
                            .clickable { offerStep = "decline_reason" }
                            .padding(vertical = 14.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Decline", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = colors.negative)
                    }
                    // Claim (2fr)
                    Box(
                        modifier = Modifier
                            .weight(2f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(colors.brandPrimary)
                            .clickable { offerStep = "slot_pick" }
                            .padding(vertical = 14.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Claim", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                    }
                }
            } else if (cta != null) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .drawBehind {
                            drawLine(
                                color = colors.borderSubtle,
                                start = Offset(0f, 0f),
                                end = Offset(size.width, 0f),
                                strokeWidth = 1.dp.toPx()
                            )
                        }
                        .background(colors.bgPrimary)
                        .padding(16.dp)
                ) {
                    if (isSelfAssigned(task)) {
                        // Self-assigned: Reassign (1fr) + CTA (2fr)
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .border(1.dp, colors.borderSubtle, RoundedCornerShape(10.dp))
                                    .clickable { onAction(task.taskId, "ASSIGN", emptyMap()) }
                                    .padding(vertical = 14.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("Reassign", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = colors.textSecondary)
                            }
                            Box(
                                modifier = Modifier
                                    .weight(2f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(colors.brandPrimary)
                                    .clickable { onAction(task.taskId, cta.action, emptyMap()) }
                                    .padding(vertical = 14.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(cta.label, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                            }
                        }
                    } else {
                        // Single full-width CTA
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (cta.urgent) colors.negative else colors.brandPrimary)
                                .clickable { onAction(task.taskId, cta.action, emptyMap()) }
                                .padding(vertical = 14.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(cta.label, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OfferInfoRow(label: String, value: String, valueColor: Color) {
    val colors = WiomCspTheme.colors
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontSize = 13.sp, color = colors.textSecondary)
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = valueColor)
    }
}

@Composable
private fun InfoRowWithBorder(label: String, value: String, valueColor: Color) {
    val colors = WiomCspTheme.colors
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .drawBehind {
                drawLine(
                    color = colors.borderSubtle,
                    start = Offset(0f, size.height),
                    end = Offset(size.width, size.height),
                    strokeWidth = 1.dp.toPx()
                )
            }
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontSize = 13.sp, color = colors.textSecondary)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = valueColor)
    }
}

@Composable
private fun TimelineEventItem(event: TimelineEvent, isLast: Boolean) {
    val colors = WiomCspTheme.colors
    val actorColor = getActorColor(event.actorType, colors)

    Row(
        modifier = Modifier.padding(bottom = if (isLast) 0.dp else 20.dp)
    ) {
        // Dot (positioned to align with the vertical line)
        Box(
            modifier = Modifier
                .offset(x = (-20).dp)
                .padding(top = 4.dp)
                .size(10.dp)
                .clip(CircleShape)
                .border(2.dp, colors.bgPrimary, CircleShape)
                .background(actorColor)
        )

        Column(modifier = Modifier.weight(1f)) {
            // Actor name + timestamp
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = event.actor,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = actorColor
                )
                Text(
                    text = formatTimeAgo(event.timestamp),
                    fontSize = 11.sp,
                    color = colors.textMuted
                )
            }
            Spacer(Modifier.height(4.dp))

            // Event type
            Text(
                text = event.eventType,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = colors.textMuted,
                letterSpacing = 0.3.sp
            )
            Spacer(Modifier.height(4.dp))

            // Detail
            Text(
                text = event.detail,
                fontSize = 13.sp,
                color = colors.textPrimary,
                lineHeight = 20.sp
            )

            // Proof
            if (event.proof != null) {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "Proof: ${event.proof}",
                    fontSize = 11.sp,
                    color = colors.brandPrimary
                )
            }
        }
    }
}

// ---- Slot Picker Screen (matching web) ----

@Composable
private fun SlotPickerScreen(
    task: Task,
    contextId: String,
    area: String,
    onSelectSlot: (String) -> Unit,
    onBack: () -> Unit
) {
    val colors = WiomCspTheme.colors

    val slots = remember {
        val fmt = DateTimeFormatter.ofPattern("EEE, d MMM", Locale.ENGLISH)
        val today = java.time.LocalDate.now()
        listOf(
            "Today" to today.format(fmt),
            "Tomorrow" to today.plusDays(1).format(fmt),
            "Day After" to today.plusDays(2).format(fmt)
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgPrimary)
    ) {
        // Header
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .drawBehind {
                    drawLine(
                        color = colors.borderSubtle,
                        start = Offset(0f, size.height),
                        end = Offset(size.width, size.height),
                        strokeWidth = 1.dp.toPx()
                    )
                }
                .padding(16.dp)
        ) {
            Text(
                text = "\u2190 Back",
                modifier = Modifier
                    .clickable { onBack() }
                    .padding(vertical = 4.dp),
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = colors.textSecondary
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = "Choose Preferred Slot",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = "$contextId -- $area",
                fontSize = 13.sp,
                color = colors.textSecondary
            )
        }

        // Slot options
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp, vertical = 24.dp)
        ) {
            Text(
                text = "When would you like to schedule the installation?",
                fontSize = 13.sp,
                color = colors.textSecondary
            )
            Spacer(Modifier.height(16.dp))

            slots.forEach { (label, sublabel) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(colors.bgCard)
                        .border(1.dp, colors.borderSubtle, RoundedCornerShape(12.dp))
                        .clickable { onSelectSlot(label) }
                        .padding(horizontal = 20.dp, vertical = 18.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = label,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textPrimary
                        )
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = sublabel,
                            fontSize = 12.sp,
                            color = colors.textSecondary
                        )
                    }
                    Text("\u203A", fontSize = 18.sp, color = colors.textMuted)
                }
            }
        }
    }
}

// ---- Decline Reason Screen (matching web) ----

@Composable
private fun DeclineReasonScreen(
    task: Task,
    contextId: String,
    area: String,
    onSelectReason: (String) -> Unit,
    onBack: () -> Unit
) {
    val colors = WiomCspTheme.colors

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgPrimary)
    ) {
        // Header
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .drawBehind {
                    drawLine(
                        color = colors.borderSubtle,
                        start = Offset(0f, size.height),
                        end = Offset(size.width, size.height),
                        strokeWidth = 1.dp.toPx()
                    )
                }
                .padding(16.dp)
        ) {
            Text(
                text = "\u2190 Back",
                modifier = Modifier
                    .clickable { onBack() }
                    .padding(vertical = 4.dp),
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = colors.textSecondary
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = "Decline Offer",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = "$contextId -- $area",
                fontSize = 13.sp,
                color = colors.textSecondary
            )
        }

        // Reason options
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 24.dp)
        ) {
            Text(
                text = "Please select a reason for declining this offer:",
                fontSize = 13.sp,
                color = colors.textSecondary
            )
            Spacer(Modifier.height(16.dp))

            DECLINE_REASONS.forEach { reason ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 10.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(colors.bgCard)
                        .border(1.dp, colors.borderSubtle, RoundedCornerShape(12.dp))
                        .clickable { onSelectReason(reason) }
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = reason,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = colors.textPrimary,
                        modifier = Modifier.weight(1f)
                    )
                    Text("\u203A", fontSize = 18.sp, color = colors.textMuted)
                }
            }
        }
    }
}
