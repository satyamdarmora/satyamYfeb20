package com.wiom.csp.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CurrencyRupee
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.wiom.csp.domain.model.TaskType
import com.wiom.csp.ui.theme.WiomTokens

// ── Data ────────────────────────────────────────────────────────────────────────

enum class TimerState { NORMAL, URGENT, OVERDUE }

data class TaskCardData(
    val taskId: String,
    val taskType: TaskType = TaskType.RESTORE,
    val typeLabel: String,
    val objectId: String,
    val locality: String,
    val reasonTimerText: String,
    val timerState: TimerState,
    val primaryCtaLabel: String? = null,
    val primaryCtaEnabled: Boolean = true,
    val secondaryCtaLabel: String? = null,
    val secondaryCtaIcon: ImageVector? = null,
    val onPrimaryClick: () -> Unit = {},
    val onSecondaryClick: (() -> Unit)? = null,
    val onCardClick: () -> Unit = {},
    val showDekhein: Boolean = true  // Addendum §6: false for terminal/departing cards
)

// ── Addendum §5: Type Icon mapping ──────────────────────────────────────────────

private fun typeIcon(type: TaskType): ImageVector = when (type) {
    TaskType.INSTALL -> Icons.Filled.Home
    TaskType.RESTORE -> Icons.Filled.Build
    TaskType.NETBOX -> Icons.Filled.Inventory2
}

// ── Composable ──────────────────────────────────────────────────────────────────

@Composable
fun IndividualTaskCardV2(data: TaskCardData, modifier: Modifier = Modifier) {
    val accentColor = if (data.taskType == TaskType.RESTORE) {
        WiomTokens.Accent.restore
    } else {
        WiomTokens.Accent.default
    }
    val cardShape = RoundedCornerShape(WiomTokens.Radius.card)
    val accentWidth = WiomTokens.Size.accentBorderWidth

    // Resolve display values with fallbacks — card must ALWAYS render
    val displayId = data.objectId.ifEmpty { data.taskId }
    val hasLocality = data.locality.isNotEmpty()
    val identityText = if (hasLocality) {
        "${data.typeLabel} \u00B7 $displayId \u00B7 ${data.locality}"
    } else {
        "${data.typeLabel} \u00B7 $displayId"
    }

    val displayReasonTimer = data.reasonTimerText.ifEmpty { data.typeLabel }

    Box(
        modifier = modifier
            .padding(horizontal = WiomTokens.Space.lg)
            .fillMaxWidth()
            .clip(cardShape)
            .background(WiomTokens.Bg.surface, cardShape)
            .border(
                width = WiomTokens.Space.xxs / 2, // 1dp
                color = WiomTokens.Stroke.primary,
                shape = cardShape
            )
            .drawBehind {
                drawRect(
                    color = accentColor,
                    topLeft = Offset.Zero,
                    size = Size(accentWidth.toPx(), size.height)
                )
            }
            .clickable(
                onClickLabel = "विवरण खोलें"
            ) { data.onCardClick() }
    ) {
        Column(
            modifier = Modifier.padding(
                start = WiomTokens.Space.md + accentWidth,
                end = WiomTokens.Space.md,
                top = WiomTokens.Space.md,
                bottom = WiomTokens.Space.md
            )
        ) {
            // ── Field A — Identity + "देखें ›" ──────────────────────────────
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics(mergeDescendants = true) {
                        contentDescription = identityText
                    }
            ) {
                // Addendum §5: Type icon (18dp, filled, text.secondary)
                Icon(
                    imageVector = typeIcon(data.taskType),
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = WiomTokens.Text.secondary
                )

                Spacer(Modifier.width(4.dp)) // §5: 4dp gap

                Text(
                    text = identityText,
                    style = WiomTokens.Type.cardIdentity,
                    color = WiomTokens.Text.primary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )

                Spacer(Modifier.width(WiomTokens.Space.sm))

                // Addendum §6: "देखें ›" drilldown affordance
                // 12sp/400, text.secondary, trailing edge, 8dp from right
                // Not shown on terminal/departing cards (Restore RESOLVED, RECLASSIFIED, PLATFORM_TAKEOVER)
                if (data.showDekhein) {
                    Text(
                        text = "देखें ›",
                        style = WiomTokens.Type.bodySmall,
                        color = WiomTokens.Text.secondary,
                        modifier = Modifier.padding(end = WiomTokens.Space.sm)
                    )
                }
            }

            Spacer(Modifier.height(WiomTokens.Space.sm))

            // ── Field B+C — Merged reason+timer ─────────────────────────────
            val timerStateForDisplay = if (data.reasonTimerText.isEmpty()) {
                TimerState.NORMAL
            } else {
                data.timerState
            }

            val (timerTextColor, timerBgColor, timerTextStyle) = when (timerStateForDisplay) {
                TimerState.NORMAL -> Triple(
                    WiomTokens.Text.primary,
                    Color.Transparent,
                    WiomTokens.Type.reasonTimer
                )
                TimerState.URGENT -> Triple(
                    WiomTokens.State.warning,
                    WiomTokens.Bg.urgent,
                    WiomTokens.Type.reasonTimer
                )
                TimerState.OVERDUE -> Triple(
                    WiomTokens.State.negative,
                    WiomTokens.Bg.overdue,
                    WiomTokens.Type.reasonTimerOverdue
                )
            }

            val stripModifier = if (timerStateForDisplay != TimerState.NORMAL) {
                Modifier
                    .fillMaxWidth()
                    .offset(x = -(WiomTokens.Space.md + accentWidth))
                    .padding(start = WiomTokens.Space.md + accentWidth)
                    .background(timerBgColor)
                    .padding(vertical = WiomTokens.Space.xs)
            } else {
                Modifier.fillMaxWidth()
            }

            Box(
                modifier = stripModifier
                    .semantics {
                        liveRegion = LiveRegionMode.Polite
                        contentDescription = displayReasonTimer
                    }
            ) {
                Text(
                    text = displayReasonTimer,
                    style = timerTextStyle,
                    color = timerTextColor,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // ── Field D + E — CTAs (collapse if passive — Addendum §4) ──────
            if (data.primaryCtaLabel != null) {
                Spacer(Modifier.height(WiomTokens.Space.md))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Secondary CTA (optional — e.g., Call Customer)
                    if (data.secondaryCtaLabel != null && data.onSecondaryClick != null) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(WiomTokens.Radius.cta))
                                .background(WiomTokens.Cta.secondaryBg)
                                .border(
                                    width = WiomTokens.Space.xxs / 2,
                                    color = WiomTokens.Cta.secondaryBorder,
                                    shape = RoundedCornerShape(WiomTokens.Radius.cta)
                                )
                                .clickable { data.onSecondaryClick.invoke() }
                                .padding(
                                    horizontal = WiomTokens.Space.lg,
                                    vertical = WiomTokens.Space.md
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                if (data.secondaryCtaIcon != null) {
                                    Icon(
                                        imageVector = data.secondaryCtaIcon,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp),
                                        tint = WiomTokens.Cta.secondaryText
                                    )
                                }
                                Text(
                                    text = data.secondaryCtaLabel,
                                    style = WiomTokens.Type.ctaSecondary,
                                    color = WiomTokens.Cta.secondaryText
                                )
                            }
                        }

                        Spacer(Modifier.width(WiomTokens.Space.sm))
                    }

                    // Primary CTA
                    val primaryBg = if (data.primaryCtaEnabled) {
                        WiomTokens.Cta.primaryBg
                    } else {
                        WiomTokens.Cta.primaryDisabledBg
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(WiomTokens.Radius.cta))
                            .background(primaryBg)
                            .then(
                                if (data.primaryCtaEnabled) {
                                    Modifier.clickable { data.onPrimaryClick() }
                                } else {
                                    Modifier
                                }
                            )
                            .padding(
                                horizontal = WiomTokens.Space.lg,
                                vertical = WiomTokens.Space.md
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = data.primaryCtaLabel,
                            style = WiomTokens.Type.cta,
                            color = WiomTokens.Text.onBrand
                        )
                    }
                }
            }
            // If primaryCtaLabel == null → passive card: no CTA row, height collapses
        }
    }
}

// ── Previews ────────────────────────────────────────────────────────────────────

@Preview(showBackground = true, backgroundColor = 0xFFF5F6F7)
@Composable
private fun PreviewInstallCard() {
    IndividualTaskCardV2(
        data = TaskCardData(
            taskId = "T-001",
            taskType = TaskType.INSTALL,
            typeLabel = "इंस्टॉल",
            objectId = "CN-4021",
            locality = "सेक्टर 15",
            reasonTimerText = "समय भेजें — ग्राहक को बताना है · 5 दिन बाकी",
            timerState = TimerState.NORMAL,
            primaryCtaLabel = "समय भेजें",
            primaryCtaEnabled = true
        )
    )
}

@Preview(showBackground = true, backgroundColor = 0xFFF5F6F7)
@Composable
private fun PreviewRestoreCard() {
    IndividualTaskCardV2(
        data = TaskCardData(
            taskId = "T-002",
            taskType = TaskType.RESTORE,
            typeLabel = "सेवा बहाली",
            objectId = "CN-3102",
            locality = "DLF Phase 3",
            reasonTimerText = "45 मिनट बाकी",
            timerState = TimerState.URGENT,
            primaryCtaLabel = "काम शुरू करें",
            primaryCtaEnabled = true
        )
    )
}

@Preview(showBackground = true, backgroundColor = 0xFFF5F6F7)
@Composable
private fun PreviewNetBoxCard() {
    IndividualTaskCardV2(
        data = TaskCardData(
            taskId = "T-003",
            taskType = TaskType.NETBOX,
            typeLabel = "नेटबॉक्स",
            objectId = "NB-0091",
            locality = "Sector 56",
            reasonTimerText = "वापसी बाकी · 2 दिन",
            timerState = TimerState.NORMAL,
            primaryCtaLabel = "वापसी पक्की करें",
            primaryCtaEnabled = true
        )
    )
}

@Preview(showBackground = true, backgroundColor = 0xFFF5F6F7)
@Composable
private fun PreviewPassiveCard() {
    IndividualTaskCardV2(
        data = TaskCardData(
            taskId = "T-004",
            taskType = TaskType.INSTALL,
            typeLabel = "इंस्टॉल",
            objectId = "CN-4022",
            locality = "सेक्टर 22",
            reasonTimerText = "ग्राहक चुन रहा है",
            timerState = TimerState.NORMAL,
            primaryCtaLabel = null  // passive — no CTA
        )
    )
}

@Preview(showBackground = true, backgroundColor = 0xFFF5F6F7)
@Composable
private fun PreviewOverdueCard() {
    IndividualTaskCardV2(
        data = TaskCardData(
            taskId = "T-005",
            taskType = TaskType.RESTORE,
            typeLabel = "सेवा बहाली",
            objectId = "CN-1455",
            locality = "Palam Vihar",
            reasonTimerText = "2 घंटे से ज़्यादा",
            timerState = TimerState.OVERDUE,
            primaryCtaLabel = "हल करें",
            primaryCtaEnabled = true
        )
    )
}
