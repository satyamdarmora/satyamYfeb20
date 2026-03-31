package com.wiom.csp.ui.home

import com.wiom.csp.domain.model.AssuranceState
import com.wiom.csp.domain.model.SlaStanding
import com.wiom.csp.domain.model.Task
import com.wiom.csp.domain.model.TaskType
import com.wiom.csp.ui.common.formatCurrencyCompact
import com.wiom.csp.ui.common.isOverdue
import com.wiom.csp.ui.common.parseIso

// ── Task → TaskCardData ─────────────────────────────────────────────────────────

fun Task.toTaskCardData(
    bucket: Int,
    onPrimary: () -> Unit,
    onSecondary: (() -> Unit)?,
    onCardClick: () -> Unit,
): TaskCardData {
    val deadline = getDeadlineInfo(this)
    val cta = getCTA(this)

    val timerState = resolveTimerState(this, deadline)

    return TaskCardData(
        taskId = taskId,
        taskType = taskType,
        typeLabel = when (taskType) {
            TaskType.INSTALL -> "इंस्टॉल"
            TaskType.RESTORE -> "सेवा बहाली"
            TaskType.NETBOX -> "नेटबॉक्स"
        },
        objectId = connectionId ?: netboxId ?: taskId,
        locality = customerArea ?: "",
        reasonTimerText = getReasonLabel(this, deadline),
        timerState = timerState,
        primaryCtaLabel = cta?.label,
        primaryCtaEnabled = cta != null,
        onPrimaryClick = onPrimary,
        onSecondaryClick = onSecondary,
        onCardClick = onCardClick,
    )
}

private fun resolveTimerState(task: Task, deadline: DeadlineInfo?): TimerState {
    if (deadline == null) return TimerState.NORMAL
    if (deadline.overdue) return TimerState.OVERDUE

    val candidates = listOfNotNull(
        task.slaDeadlineAt, task.offerExpiresAt, task.acceptExpiresAt,
        task.returnDueAt, task.pickupDueAt, task.dueAt,
    )
    val nearestMs = candidates.mapNotNull { parseIso(it) }.minOrNull() ?: return TimerState.NORMAL
    val remainingMs = nearestMs - System.currentTimeMillis()

    return when {
        remainingMs <= 0 -> TimerState.OVERDUE
        remainingMs < 2 * 60 * 60 * 1000 -> TimerState.URGENT
        else -> TimerState.NORMAL
    }
}

// ── AssuranceState → AssuranceData ──────────────────────────────────────────────

fun AssuranceState.toAssuranceData(): AssuranceData {
    val slaState = when (slaStanding) {
        SlaStanding.COMPLIANT -> SlaState.COMPLIANT
        SlaStanding.AT_RISK -> SlaState.AT_RISK
        SlaStanding.NON_COMPLIANT -> SlaState.NON_COMPLIANT
    }

    return AssuranceData(
        connections = activeBase,
        earningsFormatted = formatCurrencyCompact(cycleEarned),
        isProvisional = false,
        slaState = slaState,
        exposure = activeBase,
    )
}

// ── Banner builders ─────────────────────────────────────────────────────────────

fun buildBanners(isOffline: Boolean, capabilityResetActive: Boolean): List<BannerData> {
    val banners = mutableListOf<BannerData>()

    if (isOffline) {
        banners += BannerData(
            id = "offline",
            severity = BannerSeverity.INFO,
            textKey = "इंटरनेट से जुड़ नहीं पा रहे। कनेक्शन चेक करें।",
            dismissible = false,
        )
    }

    if (capabilityResetActive) {
        banners += BannerData(
            id = "capability",
            severity = BannerSeverity.WARNING,
            textKey = "सेवा गुणवत्ता की समीक्षा चल रही है। जल्द अपडेट मिलेगा।",
            dismissible = false,
        )
    }

    return banners
}
