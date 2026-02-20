package com.wiom.csp.ui.notification

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.domain.model.AppNotification
import com.wiom.csp.domain.model.NotificationType
import com.wiom.csp.ui.theme.WiomCspTheme
import java.text.NumberFormat
import java.util.Locale

@Composable
fun EventModal(
    notification: AppNotification?,
    onDismiss: () -> Unit,
    onView: (String) -> Unit
) {
    val colors = WiomCspTheme.colors

    AnimatedVisibility(
        visible = notification != null,
        enter = fadeIn(),
        exit = fadeOut()
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(colors.overlayBg)
                .clickable(
                    indication = null,
                    interactionSource = remember { MutableInteractionSource() }
                ) { onDismiss() },
            contentAlignment = Alignment.Center
        ) {
            if (notification != null) {
                val accentColor = getAccent(notification.type, colors)
                val accentAlpha22 = accentColor.copy(alpha = 0.133f)
                val accentAlpha15 = accentColor.copy(alpha = 0.082f)
                val accentAlpha35 = accentColor.copy(alpha = 0.21f)
                val accentAlpha44 = accentColor.copy(alpha = 0.267f)
                val hasTask = notification.taskId != null
                val amountFormatted = notification.amount?.let { formatIndian(it) }

                // Dynamic headline
                val headline = getHeadline(notification, amountFormatted)

                Column(
                    modifier = Modifier
                        .fillMaxWidth(0.9f)
                        .widthIn(max = 380.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(colors.bgSecondary)
                        .border(1.dp, accentAlpha44, RoundedCornerShape(16.dp))
                        .clickable(
                            indication = null,
                            interactionSource = remember { MutableInteractionSource() }
                        ) { /* consume */ }
                ) {
                    // Accent bar (4dp)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .background(accentColor)
                    )

                    // Body
                    Column(
                        modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 24.dp, bottom = 20.dp)
                    ) {
                        // Icon area (48x48 rounded square, not emoji)
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(accentAlpha22),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = getIconSymbol(notification.type),
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = accentColor
                            )
                        }

                        Spacer(Modifier.height(16.dp))

                        // Headline
                        Text(
                            text = headline,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary,
                            lineHeight = 22.sp
                        )

                        // Amount callout (payment/settlement only)
                        if (notification.amount != null &&
                            (notification.type == NotificationType.PAYMENT_RECEIVED ||
                             notification.type == NotificationType.SETTLEMENT_CREDIT)) {
                            Spacer(Modifier.height(12.dp))
                            Text(
                                text = "\u20B9${amountFormatted}",
                                fontSize = 28.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = accentColor
                            )
                        }

                        // Negative amount callout (deduction)
                        if (notification.amount != null &&
                            notification.type == NotificationType.NETBOX_RECOVERY_DEDUCTION) {
                            Spacer(Modifier.height(12.dp))
                            Text(
                                text = "-\u20B9${amountFormatted}",
                                fontSize = 28.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = colors.negative
                            )
                        }

                        // Consequence callout (for alert types)
                        if (notification.type == NotificationType.CAPABILITY_RESET ||
                            notification.type == NotificationType.WALLET_FROZEN ||
                            notification.type == NotificationType.NETBOX_RECOVERY_DEDUCTION) {
                            Spacer(Modifier.height(14.dp))
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(accentAlpha15)
                                    .border(1.dp, accentAlpha35, RoundedCornerShape(10.dp))
                                    .padding(horizontal = 14.dp, vertical = 12.dp)
                            ) {
                                Text(
                                    text = "WHAT THIS MEANS:",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = accentColor,
                                    letterSpacing = 0.3.sp
                                )
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    text = getConsequenceText(notification),
                                    fontSize = 13.sp,
                                    color = colors.textPrimary,
                                    lineHeight = 20.sp
                                )
                            }
                        }

                        // Subtext
                        Spacer(Modifier.height(10.dp))
                        Text(
                            text = notification.message,
                            fontSize = 13.sp,
                            color = colors.textSecondary,
                            lineHeight = 20.sp
                        )
                    }

                    // Actions
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 20.dp, end = 20.dp, bottom = 20.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Dismiss button (outline)
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .border(1.dp, colors.borderSubtle, RoundedCornerShape(10.dp))
                                .clickable { onDismiss() }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Dismiss", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = colors.textSecondary)
                        }

                        // View button
                        if (hasTask || notification.type == NotificationType.NEW_OFFER) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(accentColor)
                                    .clickable {
                                        val taskId = notification.taskId
                                        onDismiss()
                                        if (taskId != null) onView(taskId)
                                    }
                                    .padding(vertical = 12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("View", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun getAccent(type: NotificationType, colors: com.wiom.csp.ui.theme.WiomColors): Color {
    return when (type) {
        NotificationType.PAYMENT_RECEIVED, NotificationType.SETTLEMENT_CREDIT -> colors.positive
        NotificationType.NEW_OFFER -> colors.brandPrimary
        NotificationType.HIGH_RESTORE_ALERT -> colors.negative
        NotificationType.SLA_WARNING -> colors.warning
        NotificationType.CAPABILITY_RESET -> colors.warning
        NotificationType.WALLET_FROZEN -> colors.negative
        NotificationType.NETBOX_RECOVERY_DEDUCTION -> colors.negative
        NotificationType.GENERAL -> colors.textSecondary
    }
}

private fun getIconSymbol(type: NotificationType): String {
    return when (type) {
        NotificationType.PAYMENT_RECEIVED, NotificationType.SETTLEMENT_CREDIT -> "\u20B9"
        NotificationType.NEW_OFFER -> "+"
        NotificationType.HIGH_RESTORE_ALERT -> "!"
        NotificationType.SLA_WARNING, NotificationType.CAPABILITY_RESET -> "\u26A0"
        NotificationType.WALLET_FROZEN -> "\u2744"
        NotificationType.NETBOX_RECOVERY_DEDUCTION -> "\u2212"
        NotificationType.GENERAL -> "\u2139"
    }
}

private fun getHeadline(notification: AppNotification, amountFormatted: String?): String {
    return when (notification.type) {
        NotificationType.PAYMENT_RECEIVED ->
            if (amountFormatted != null) "Payment of \u20B9$amountFormatted received"
            else "Payment received"
        NotificationType.SETTLEMENT_CREDIT ->
            if (amountFormatted != null) "Settlement of \u20B9$amountFormatted credited"
            else "Settlement credited"
        NotificationType.NEW_OFFER -> "New install offer available"
        NotificationType.HIGH_RESTORE_ALERT -> "HIGH priority restore alert"
        NotificationType.SLA_WARNING -> notification.title.ifEmpty { "SLA Warning" }
        NotificationType.CAPABILITY_RESET -> "Capability Reset Program"
        NotificationType.WALLET_FROZEN -> "Wallet Frozen"
        NotificationType.NETBOX_RECOVERY_DEDUCTION ->
            if (amountFormatted != null) "Deduction of \u20B9$amountFormatted"
            else "NetBox Recovery Deduction"
        NotificationType.GENERAL -> notification.title
    }
}

private fun getConsequenceText(notification: AppNotification): String {
    return when (notification.type) {
        NotificationType.CAPABILITY_RESET ->
            "New task assignments may be paused. Your earning potential is reduced until retraining is completed and compliance is restored."
        NotificationType.WALLET_FROZEN ->
            "You cannot withdraw any funds. Settlements will continue to accumulate but remain locked until the investigation is resolved."
        NotificationType.NETBOX_RECOVERY_DEDUCTION -> {
            val amt = notification.amount?.let { formatIndian(it) } ?: "0"
            "\u20B9$amt has been deducted from your available balance. You have 7 days to raise a support ticket to dispute this deduction."
        }
        else -> ""
    }
}

private fun formatIndian(amount: Int): String {
    val formatter = NumberFormat.getNumberInstance(Locale("en", "IN"))
    return formatter.format(amount)
}
