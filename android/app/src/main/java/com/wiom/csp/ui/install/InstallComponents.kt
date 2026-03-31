package com.wiom.csp.ui.install

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Home
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.domain.model.TaskType
import com.wiom.csp.ui.home.IndividualTaskCardV2
import com.wiom.csp.ui.home.TaskCardData
import com.wiom.csp.ui.home.TimerState
import com.wiom.csp.ui.theme.WiomTokens
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Calendar

// ════════════════════════════════════════════════════════════════════════════════
// Install Flow Components — v1.4
// Authority: Home v2.3 → Addendum v2.3.1 → Install Spec v1.4
// ════════════════════════════════════════════════════════════════════════════════

// ── Install States ──────────────────────────────────────────────────────────────

enum class InstallCardState {
    AWAITING_SLOT_PROPOSAL,
    AWAITING_CUSTOMER_SELECTION,
    SLOT_CONFIRMED,
    SCHEDULED,
    SCHEDULED_TODAY,
    NEEDS_RESCHEDULING,
    SCHEDULING_FAILED,
    IN_PROGRESS,
    INSTALL_SUBMITTED
}

// ── Install card data from server ───────────────────────────────────────────────

data class InstallTask(
    val taskId: String,
    val connectionId: String,
    val locality: String,
    val state: InstallCardState,
    val reasonText: String,
    val timerState: TimerState = TimerState.NORMAL,
    val maskedCallAvailable: Boolean = false,
    val assignmentSource: String = "new",
    val serviceAddress: String = "",
    val nearestConnection: String = "",
    val executorName: String? = null,
    val p74DaysRemaining: Int? = null,
    val slotDay: String? = null,
    val slotTime: String? = null,
    val slot1: SlotInfo? = null,
    val slot2: SlotInfo? = null,
    val timeline: List<TimelineEntry> = emptyList()
)

data class SlotInfo(
    val date: String,
    val timeRange: String,
    val status: SlotStatus
)

enum class SlotStatus { PROPOSED, ACTIVE, CONFIRMED, EXPIRED, CANCELLED }

data class TimelineEntry(
    val timestamp: String,
    val event: String,
    val actor: String
)

// ── Helper: Convert InstallTask → TaskCardData (Home v2.3 §5) ──────────────────

fun InstallTask.toCardData(
    onPrimaryClick: () -> Unit = {},
    onSecondaryClick: (() -> Unit)? = null,
    onCardClick: () -> Unit = {}
): TaskCardData {
    // No secondary CTA on ANY install card. Zero exceptions.
    // Call lives in drilldown Contact section only. Same rule as Restore.
    val primary = when (state) {
        InstallCardState.AWAITING_SLOT_PROPOSAL -> "समय भेजें"
        InstallCardState.SLOT_CONFIRMED -> "व्यक्ति चुनें"
        InstallCardState.SCHEDULED -> "शुरू करें"       // was "भेजें" — now matches spec
        InstallCardState.SCHEDULED_TODAY -> "शुरू करें"  // same CTA, call in drilldown only
        InstallCardState.NEEDS_RESCHEDULING -> "समय भेजें"
        InstallCardState.IN_PROGRESS -> "पूरा करें"
        // Passive states + INSTALL_SUBMITTED → no CTA
        InstallCardState.AWAITING_CUSTOMER_SELECTION,
        InstallCardState.SCHEDULING_FAILED,
        InstallCardState.INSTALL_SUBMITTED -> null
    }

    return TaskCardData(
        taskId = taskId,
        taskType = TaskType.INSTALL,
        typeLabel = "इंस्टॉल",
        objectId = connectionId,
        locality = locality,
        reasonTimerText = reasonText,
        timerState = timerState,
        primaryCtaLabel = primary,
        primaryCtaEnabled = primary != null,
        // No secondary CTA on any install card. Zero exceptions.
        secondaryCtaLabel = null,
        secondaryCtaIcon = null,
        onPrimaryClick = onPrimaryClick,
        onSecondaryClick = null,
        onCardClick = onCardClick
    )
}

// ════════════════════════════════════════════════════════════════════════════════
// Component 1: DatePickerTrigger
// bg.surface, 1dp stroke.primary, radius.chip, 44dp height
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun DatePickerTrigger(
    label: String,
    selectedDate: LocalDate?,
    onDateSelected: (LocalDate) -> Unit,
    modifier: Modifier = Modifier,
    error: String? = null
) {
    val context = LocalContext.current
    val displayText = selectedDate?.format(DateTimeFormatter.ofPattern("dd MMM yyyy")) ?: label

    Column(modifier = modifier) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp)
                .clip(RoundedCornerShape(WiomTokens.Radius.chip))
                .background(WiomTokens.Bg.surface)
                .border(
                    1.dp,
                    if (error != null) WiomTokens.State.negative else WiomTokens.Stroke.primary,
                    RoundedCornerShape(WiomTokens.Radius.chip)
                )
                .clickable {
                    val cal = Calendar.getInstance()
                    if (selectedDate != null) {
                        cal.set(selectedDate.year, selectedDate.monthValue - 1, selectedDate.dayOfMonth)
                    }
                    DatePickerDialog(
                        context,
                        { _, y, m, d -> onDateSelected(LocalDate.of(y, m + 1, d)) },
                        cal.get(Calendar.YEAR),
                        cal.get(Calendar.MONTH),
                        cal.get(Calendar.DAY_OF_MONTH)
                    )
                        .apply { datePicker.minDate = System.currentTimeMillis() }
                        .show()
                }
                .padding(horizontal = WiomTokens.Space.md),
            contentAlignment = Alignment.CenterStart
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = displayText,
                    style = WiomTokens.Type.body,
                    color = if (selectedDate != null) WiomTokens.Text.primary else WiomTokens.Text.hint
                )
                Icon(
                    Icons.Filled.ExpandMore,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = WiomTokens.Text.hint
                )
            }
        }
        if (error != null) {
            Text(
                text = error,
                style = WiomTokens.Type.bodySmall,
                color = WiomTokens.State.negative,
                modifier = Modifier.padding(top = 4.dp, start = 4.dp)
            )
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// Component 2: TimeRangePicker
// Two time triggers with "—" separator
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun TimeRangePicker(
    startTime: LocalTime?,
    endTime: LocalTime?,
    onStartSelected: (LocalTime) -> Unit,
    onEndSelected: (LocalTime) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Start time
        Box(
            modifier = Modifier
                .weight(1f)
                .height(44.dp)
                .clip(RoundedCornerShape(WiomTokens.Radius.chip))
                .background(WiomTokens.Bg.surface)
                .border(1.dp, WiomTokens.Stroke.primary, RoundedCornerShape(WiomTokens.Radius.chip))
                .clickable {
                    val h = startTime?.hour ?: 9
                    val m = startTime?.minute ?: 0
                    TimePickerDialog(context, { _, hr, min ->
                        onStartSelected(LocalTime.of(hr, min))
                    }, h, m, false).show()
                }
                .padding(horizontal = WiomTokens.Space.md),
            contentAlignment = Alignment.CenterStart
        ) {
            Text(
                text = startTime?.format(DateTimeFormatter.ofPattern("h:mm a")) ?: "शुरू",
                style = WiomTokens.Type.body,
                color = if (startTime != null) WiomTokens.Text.primary else WiomTokens.Text.hint
            )
        }

        Text("—", style = WiomTokens.Type.body, color = WiomTokens.Text.hint)

        // End time
        Box(
            modifier = Modifier
                .weight(1f)
                .height(44.dp)
                .clip(RoundedCornerShape(WiomTokens.Radius.chip))
                .background(WiomTokens.Bg.surface)
                .border(1.dp, WiomTokens.Stroke.primary, RoundedCornerShape(WiomTokens.Radius.chip))
                .clickable {
                    val h = endTime?.hour ?: 17
                    val m = endTime?.minute ?: 0
                    TimePickerDialog(context, { _, hr, min ->
                        onEndSelected(LocalTime.of(hr, min))
                    }, h, m, false).show()
                }
                .padding(horizontal = WiomTokens.Space.md),
            contentAlignment = Alignment.CenterStart
        ) {
            Text(
                text = endTime?.format(DateTimeFormatter.ofPattern("h:mm a")) ?: "अंत",
                style = WiomTokens.Type.body,
                color = if (endTime != null) WiomTokens.Text.primary else WiomTokens.Text.hint
            )
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// Component 3: SlotStatusBadge
// Per Spec v1.4 §5 drilldown slot badges
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun SlotStatusBadge(status: SlotStatus, modifier: Modifier = Modifier) {
    val (text, textColor, bgColor, strikethrough) = when (status) {
        SlotStatus.PROPOSED -> BadgeStyle("भेजा गया", WiomTokens.Text.secondary, Color.Transparent, false)
        SlotStatus.ACTIVE -> BadgeStyle("जवाब बाकी", WiomTokens.State.info, WiomTokens.Bg.info, false)
        SlotStatus.CONFIRMED -> BadgeStyle("पक्का", WiomTokens.State.positive, WiomTokens.Bg.positive, false)
        SlotStatus.EXPIRED -> BadgeStyle("समाप्त", WiomTokens.Text.hint, Color.Transparent, true)
        SlotStatus.CANCELLED -> BadgeStyle("रद्द", WiomTokens.Text.hint, Color.Transparent, true)
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(4.dp))
            .then(if (bgColor != Color.Transparent) Modifier.background(bgColor) else Modifier)
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(
            text = text,
            style = WiomTokens.Type.bodySmall.copy(
                textDecoration = if (strikethrough) TextDecoration.LineThrough else TextDecoration.None
            ),
            color = textColor
        )
    }
}

private data class BadgeStyle(
    val text: String,
    val textColor: Color,
    val bgColor: Color,
    val strikethrough: Boolean
)

// ════════════════════════════════════════════════════════════════════════════════
// Component 4: MaskedCallCTA
// Secondary CTA atom with Material `call` icon. DIRECT mode.
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun MaskedCallCTA(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(WiomTokens.Radius.cta))
            .background(WiomTokens.Cta.secondaryBg)
            .border(
                1.dp,
                WiomTokens.Cta.secondaryBorder,
                RoundedCornerShape(WiomTokens.Radius.cta)
            )
            .clickable { onClick() }
            .padding(horizontal = WiomTokens.Space.lg, vertical = WiomTokens.Space.md),
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                Icons.Filled.Call,
                contentDescription = "कॉल करें",
                modifier = Modifier.size(18.dp),
                tint = WiomTokens.Brand.primary
            )
            Text(
                text = "कॉल करें",
                style = WiomTokens.Type.ctaSecondary,
                color = WiomTokens.Cta.secondaryText
            )
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// Shared: ACTION_SHEET Container (Addendum v2.3.1 §1)
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun ActionSheetContainer(
    onDismiss: () -> Unit,
    content: @Composable ColumnScope.() -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0x66000000)) // 40% black overlay
            .clickable(
                indication = null,
                interactionSource = remember { MutableInteractionSource() }
            ) { onDismiss() }
    ) {
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                .background(Color(0xFFF7F5FA)) // dialog bg
                .clickable(enabled = false) {} // prevent dismiss on sheet body
                .padding(top = 12.dp, bottom = 24.dp)
        ) {
            // Drag handle
            Box(
                modifier = Modifier
                    .align(Alignment.CenterHorizontally)
                    .width(36.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(WiomTokens.Stroke.secondary)
            )
            Spacer(Modifier.height(16.dp))
            content()
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// Sheet 1: Slot Proposal Sheet
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun SlotProposalSheet(
    onSubmit: (slot1Date: LocalDate, slot1Start: LocalTime, slot1End: LocalTime,
               slot2Date: LocalDate, slot2Start: LocalTime, slot2End: LocalTime) -> Unit,
    onDismiss: () -> Unit
) {
    var slot1Date by remember { mutableStateOf<LocalDate?>(null) }
    var slot1Start by remember { mutableStateOf<LocalTime?>(null) }
    var slot1End by remember { mutableStateOf<LocalTime?>(null) }
    var slot2Date by remember { mutableStateOf<LocalDate?>(null) }
    var slot2Start by remember { mutableStateOf<LocalTime?>(null) }
    var slot2End by remember { mutableStateOf<LocalTime?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    val isValid = slot1Date != null && slot1Start != null && slot1End != null &&
            slot2Date != null && slot2Start != null && slot2End != null &&
            slot1Date != slot2Date

    ActionSheetContainer(onDismiss = onDismiss) {
        Column(modifier = Modifier.padding(horizontal = 20.dp)) {
            Text(
                text = "दो समय भेजें",
                style = WiomTokens.Type.headerTitle,
                color = WiomTokens.Text.primary
            )

            Spacer(Modifier.height(20.dp))

            // Slot 1
            Text("पहला समय", style = WiomTokens.Type.body, color = WiomTokens.Text.secondary)
            Spacer(Modifier.height(8.dp))
            DatePickerTrigger(
                label = "तारीख चुनें",
                selectedDate = slot1Date,
                onDateSelected = { slot1Date = it; error = null }
            )
            Spacer(Modifier.height(8.dp))
            TimeRangePicker(
                startTime = slot1Start, endTime = slot1End,
                onStartSelected = { slot1Start = it; error = null },
                onEndSelected = { slot1End = it; error = null }
            )

            Spacer(Modifier.height(20.dp))

            // Slot 2
            Text("दूसरा समय", style = WiomTokens.Type.body, color = WiomTokens.Text.secondary)
            Spacer(Modifier.height(8.dp))
            DatePickerTrigger(
                label = "तारीख चुनें",
                selectedDate = slot2Date,
                onDateSelected = { slot2Date = it; error = null },
                error = if (slot1Date != null && slot2Date != null && slot1Date == slot2Date)
                    "दोनों दिन अलग होने चाहिए" else null
            )
            Spacer(Modifier.height(8.dp))
            TimeRangePicker(
                startTime = slot2Start, endTime = slot2End,
                onStartSelected = { slot2Start = it; error = null },
                onEndSelected = { slot2End = it; error = null }
            )

            if (error != null) {
                Spacer(Modifier.height(8.dp))
                Text(text = error!!, style = WiomTokens.Type.bodySmall, color = WiomTokens.State.negative)
            }

            Spacer(Modifier.height(24.dp))

            // Submit CTA
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(WiomTokens.Radius.cta))
                    .background(if (isValid) WiomTokens.Cta.primaryBg else WiomTokens.Cta.primaryDisabledBg)
                    .then(
                        if (isValid) Modifier.clickable {
                            onSubmit(slot1Date!!, slot1Start!!, slot1End!!,
                                slot2Date!!, slot2Start!!, slot2End!!)
                        } else Modifier
                    )
                    .padding(vertical = WiomTokens.Space.md),
                contentAlignment = Alignment.Center
            ) {
                Text("समय भेजें", style = WiomTokens.Type.cta, color = WiomTokens.Text.onBrand)
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// Sheet 2: Exit Reason Sheet
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun ExitReasonSheet(
    onConfirm: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var selected by remember { mutableStateOf<String?>(null) }

    val reasons = listOf(
        "LOCATION_UNREACHABLE" to "जगह तक पहुँच नहीं",
        "CAPACITY_FULL" to "अभी क्षमता नहीं",
        "CUSTOMER_CANCELLED" to "ग्राहक ने रद्द किया",
        "TECHNICIAN_UNAVAILABLE" to "टेक्नीशियन उपलब्ध नहीं"
    )

    ActionSheetContainer(onDismiss = onDismiss) {
        Column(modifier = Modifier.padding(horizontal = 20.dp)) {
            Text(
                text = "ये काम क्यों नहीं हो सकता?",
                style = WiomTokens.Type.headerTitle,
                color = WiomTokens.Text.primary
            )

            Spacer(Modifier.height(16.dp))

            reasons.forEach { (key, label) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { selected = key }
                        .padding(vertical = 12.dp, horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = selected == key,
                        onClick = { selected = key },
                        colors = RadioButtonDefaults.colors(
                            selectedColor = WiomTokens.Brand.primary
                        )
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(text = label, style = WiomTokens.Type.body, color = WiomTokens.Text.primary)
                }
            }

            Spacer(Modifier.height(20.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(WiomTokens.Radius.cta))
                    .background(if (selected != null) WiomTokens.Cta.primaryBg else WiomTokens.Cta.primaryDisabledBg)
                    .then(
                        if (selected != null) Modifier.clickable { onConfirm(selected!!) }
                        else Modifier
                    )
                    .padding(vertical = WiomTokens.Space.md),
                contentAlignment = Alignment.Center
            ) {
                Text("पुष्टि करें", style = WiomTokens.Type.cta, color = WiomTokens.Text.onBrand)
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// Sheet 3: Executor Assignment Sheet
// ════════════════════════════════════════════════════════════════════════════════

data class ExecutorOption(
    val id: String,
    val name: String,
    val isSelf: Boolean = false
)

@Composable
fun ExecutorAssignmentSheet(
    options: List<ExecutorOption>,
    onAssign: (String) -> Unit,
    onDismiss: () -> Unit
) {
    // Self is pre-selected
    var selected by remember { mutableStateOf(options.firstOrNull { it.isSelf }?.id ?: options.firstOrNull()?.id) }

    ActionSheetContainer(onDismiss = onDismiss) {
        Column(modifier = Modifier.padding(horizontal = 20.dp)) {
            Text(
                text = "कौन करेगा इंस्टॉल?",
                style = WiomTokens.Type.headerTitle,
                color = WiomTokens.Text.primary
            )

            Spacer(Modifier.height(16.dp))

            options.forEach { option ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { selected = option.id }
                        .padding(horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = selected == option.id,
                        onClick = { selected = option.id },
                        colors = RadioButtonDefaults.colors(selectedColor = WiomTokens.Brand.primary)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = if (option.isSelf) "${option.name} (मैं खुद करूँगा)" else option.name,
                        style = WiomTokens.Type.body,
                        color = WiomTokens.Text.primary
                    )
                }
            }

            Spacer(Modifier.height(20.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(WiomTokens.Radius.cta))
                    .background(WiomTokens.Cta.primaryBg)
                    .clickable { selected?.let { onAssign(it) } }
                    .padding(vertical = WiomTokens.Space.md),
                contentAlignment = Alignment.Center
            ) {
                Text("चुनें", style = WiomTokens.Type.cta, color = WiomTokens.Text.onBrand)
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// Unified Drilldown (Spec v1.4 §5)
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun InstallDrilldown(
    task: InstallTask,
    onBack: () -> Unit,
    onPrimaryAction: () -> Unit,
    onCallCustomer: () -> Unit,
    onExit: () -> Unit
) {
    val showExit = task.state !in listOf(
        InstallCardState.SCHEDULING_FAILED,
        InstallCardState.IN_PROGRESS,
        InstallCardState.INSTALL_SUBMITTED
    )

    val showExecutor = task.state !in listOf(
        InstallCardState.AWAITING_SLOT_PROPOSAL,
        InstallCardState.AWAITING_CUSTOMER_SELECTION,
        InstallCardState.NEEDS_RESCHEDULING
    )

    val isSlotDay = task.state == InstallCardState.SCHEDULED_TODAY || task.maskedCallAvailable

    val primaryCtaLabel = when (task.state) {
        InstallCardState.AWAITING_SLOT_PROPOSAL, InstallCardState.NEEDS_RESCHEDULING -> "समय भेजें"
        InstallCardState.SLOT_CONFIRMED -> "व्यक्ति चुनें"
        InstallCardState.SCHEDULED, InstallCardState.SCHEDULED_TODAY -> "भेजें"
        InstallCardState.IN_PROGRESS -> "पूरा करें"
        else -> null
    }

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
                text = "‹ वापस",
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
                    Icons.Filled.Home,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = WiomTokens.Text.secondary
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    text = "इंस्टॉल · #${task.connectionId}",
                    style = WiomTokens.Type.cardIdentity,
                    color = WiomTokens.Text.primary
                )
            }

            Spacer(Modifier.height(20.dp))

            // ── Location Section ────────────────────────────────────────────
            SectionHeader("स्थान")
            Spacer(Modifier.height(8.dp))
            if (task.serviceAddress.isNotEmpty()) {
                Text(task.serviceAddress, style = WiomTokens.Type.body, color = WiomTokens.Text.primary)
            }
            if (task.nearestConnection.isNotEmpty()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    "निकटतम कनेक्शन: ${task.nearestConnection}",
                    style = WiomTokens.Type.bodySmall,
                    color = WiomTokens.Text.secondary
                )
            }
            // Assignment source — neutral styling per invariant 13
            val sourceLabel = when (task.assignmentSource) {
                "new" -> "नया अनुरोध"
                "retry" -> "पुनः प्रयास"
                "reallocation" -> "पुनः आवंटन"
                else -> task.assignmentSource
            }
            Spacer(Modifier.height(4.dp))
            Text(sourceLabel, style = WiomTokens.Type.body, color = WiomTokens.Text.secondary)

            Spacer(Modifier.height(20.dp))

            // ── Schedule Section ────────────────────────────────────────────
            SectionHeader("शेड्यूल")
            Spacer(Modifier.height(8.dp))

            // Status
            Text(
                "स्थिति: ${task.reasonText}",
                style = WiomTokens.Type.body,
                color = WiomTokens.Text.primary
            )

            // Slots with badges
            if (task.slot1 != null) {
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "पहला: ${task.slot1.date}, ${task.slot1.timeRange}",
                        style = WiomTokens.Type.body,
                        color = WiomTokens.Text.primary,
                        modifier = Modifier.weight(1f)
                    )
                    SlotStatusBadge(task.slot1.status)
                }
            }
            if (task.slot2 != null) {
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "दूसरा: ${task.slot2.date}, ${task.slot2.timeRange}",
                        style = WiomTokens.Type.body,
                        color = WiomTokens.Text.primary,
                        modifier = Modifier.weight(1f)
                    )
                    SlotStatusBadge(task.slot2.status)
                }
            }

            Spacer(Modifier.height(20.dp))

            // ── Executor Section ────────────────────────────────────────────
            if (showExecutor) {
                SectionHeader("व्यक्ति")
                Spacer(Modifier.height(8.dp))
                Text(
                    text = task.executorName ?: "अभी तय नहीं",
                    style = WiomTokens.Type.body,
                    color = WiomTokens.Text.primary
                )
                Spacer(Modifier.height(20.dp))
            }

            // ── Deadline Section ────────────────────────────────────────────
            SectionHeader("समय सीमा")
            Spacer(Modifier.height(8.dp))
            val deadlineText = if (task.p74DaysRemaining != null) {
                "⏱ ${task.p74DaysRemaining} दिन बाकी"
            } else {
                "⏱ —"
            }
            Text(deadlineText, style = WiomTokens.Type.body, color = WiomTokens.Text.primary)

            Spacer(Modifier.height(20.dp))

            // ── Contact Section ─────────────────────────────────────────────
            SectionHeader("संपर्क")
            Spacer(Modifier.height(8.dp))
            if (isSlotDay && task.maskedCallAvailable) {
                MaskedCallCTA(onClick = onCallCustomer)
            } else {
                Text(
                    "समय आने पर उपलब्ध",
                    style = WiomTokens.Type.body,
                    color = WiomTokens.Text.secondary
                )
            }

            Spacer(Modifier.height(20.dp))

            // ── Primary CTA (entry-point parity — same as card) ─────────────
            if (primaryCtaLabel != null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(WiomTokens.Radius.cta))
                        .background(WiomTokens.Cta.primaryBg)
                        .clickable { onPrimaryAction() }
                        .padding(vertical = WiomTokens.Space.md),
                    contentAlignment = Alignment.Center
                ) {
                    Text(primaryCtaLabel, style = WiomTokens.Type.cta, color = WiomTokens.Text.onBrand)
                }
                Spacer(Modifier.height(20.dp))
            }

            // ── Timeline (collapsed) ────────────────────────────────────────
            if (task.timeline.isNotEmpty()) {
                var expanded by remember { mutableStateOf(false) }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { expanded = !expanded }
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (expanded) "▾ शेड्यूल इतिहास" else "▸ शेड्यूल इतिहास",
                        style = WiomTokens.Type.body,
                        color = WiomTokens.Text.hint
                    )
                }
                if (expanded) {
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
                Spacer(Modifier.height(12.dp))
            }

            // ── Exit Link (always LAST — stacking rule) ────────────────────
            if (showExit) {
                HorizontalDivider(
                    color = WiomTokens.Stroke.primary,
                    thickness = 1.dp
                )
                Spacer(Modifier.height(12.dp))
                Text(
                    text = "नहीं कर पाएँगे",
                    style = WiomTokens.Type.body,
                    color = WiomTokens.Text.secondary,
                    modifier = Modifier.clickable { onExit() }
                )
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

@Composable
internal fun SectionHeader(title: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = WiomTokens.Type.bodySmall.copy(fontWeight = FontWeight.SemiBold),
            color = WiomTokens.Text.secondary
        )
        Spacer(Modifier.width(8.dp))
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            color = WiomTokens.Stroke.primary,
            thickness = 1.dp
        )
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// Toast (Addendum v2.3.1 §3)
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun RollbackToast(
    message: String?,
    modifier: Modifier = Modifier
) {
    if (message != null) {
        Box(
            modifier = modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(WiomTokens.Bg.secondary)
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Text(
                text = message,
                style = WiomTokens.Type.body,
                color = WiomTokens.Text.primary
            )
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// Notification Preview
// ════════════════════════════════════════════════════════════════════════════════

@Composable
fun NotificationPreview(
    title: String,
    body: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(WiomTokens.Bg.surface)
            .border(1.dp, WiomTokens.Stroke.primary, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Filled.Home,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = WiomTokens.Brand.primary
                )
                Spacer(Modifier.width(8.dp))
                Text("Wiom CSP", style = WiomTokens.Type.bodySmall, color = WiomTokens.Text.hint)
                Spacer(Modifier.weight(1f))
                Text("अभी", style = WiomTokens.Type.bodySmall, color = WiomTokens.Text.hint)
            }
            Spacer(Modifier.height(4.dp))
            Text(title, style = WiomTokens.Type.body.copy(fontWeight = FontWeight.SemiBold), color = WiomTokens.Text.primary)
            Text(body, style = WiomTokens.Type.bodySmall, color = WiomTokens.Text.secondary, maxLines = 2)
        }
    }
}
