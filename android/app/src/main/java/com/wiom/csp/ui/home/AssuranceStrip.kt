package com.wiom.csp.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.domain.model.AssuranceState
import com.wiom.csp.domain.model.ExposureState
import com.wiom.csp.domain.model.SlaStanding
import com.wiom.csp.ui.common.DrillDownSheet
import com.wiom.csp.ui.common.formatCurrency
import com.wiom.csp.ui.common.formatCurrencyCompact
import com.wiom.csp.ui.theme.WiomCspTheme

@Composable
fun AssuranceStrip(
    assuranceState: AssuranceState,
    lifetimeEarnings: Int?,
    activeDrillDown: String?,
    onDrillDown: (String?) -> Unit,
    onOpenSLA: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val colors = WiomCspTheme.colors

    val slaColor = when (assuranceState.slaStanding) {
        SlaStanding.COMPLIANT -> colors.positive
        SlaStanding.AT_RISK -> colors.warning
        SlaStanding.NON_COMPLIANT -> colors.negative
    }

    val exposureColor = when (assuranceState.exposureState) {
        ExposureState.ELIGIBLE -> colors.positive
        ExposureState.LIMITED -> colors.warning
        ExposureState.INELIGIBLE -> colors.negative
    }

    // Layout: 3 columns matching web gridTemplateColumns: '1fr 1fr auto'
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(colors.stripBg)
            .padding(horizontal = 20.dp, vertical = 16.dp)
            .height(IntrinsicSize.Min),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Column 1: Active Base card
        Column(
            modifier = Modifier
                .weight(1f)
                .clip(RoundedCornerShape(12.dp))
                .background(colors.bgCard)
                .border(1.dp, colors.borderSubtle, RoundedCornerShape(12.dp))
                .clickable { onDrillDown("activeBase") }
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            Text(
                text = "ACTIVE BASE",
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = colors.textMuted,
                letterSpacing = 0.3.sp
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "${assuranceState.activeBase}",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary,
                lineHeight = 26.sp
            )
        }

        // Column 2: Cycle Earnings card
        Column(
            modifier = Modifier
                .weight(1f)
                .clip(RoundedCornerShape(12.dp))
                .background(colors.bgCard)
                .border(1.dp, colors.borderSubtle, RoundedCornerShape(12.dp))
                .clickable { onDrillDown("earnings") }
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            Text(
                text = "CYCLE EARNINGS",
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = colors.textMuted,
                letterSpacing = 0.3.sp
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = formatCurrencyCompact(assuranceState.cycleEarned),
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary, // white, NOT blue — matches web var(--text-primary)
                lineHeight = 22.sp
            )
        }

        // Column 3: SLA + Exposure stacked with colored dots
        Column(
            modifier = Modifier.fillMaxHeight(),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // SLA indicator
            Row(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .background(colors.bgCard)
                    .border(1.dp, colors.borderSubtle, RoundedCornerShape(10.dp))
                    .clickable { if (onOpenSLA != null) onOpenSLA() else onDrillDown("sla") }
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .shadow(6.dp, CircleShape, ambientColor = slaColor, spotColor = slaColor)
                        .clip(CircleShape)
                        .background(slaColor)
                )
                Text(
                    text = "SLA",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textSecondary,
                    letterSpacing = 0.3.sp
                )
            }

            // Exposure indicator
            Row(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .background(colors.bgCard)
                    .border(1.dp, colors.borderSubtle, RoundedCornerShape(10.dp))
                    .clickable { onDrillDown("exposure") }
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .shadow(6.dp, CircleShape, ambientColor = exposureColor, spotColor = exposureColor)
                        .clip(CircleShape)
                        .background(exposureColor)
                )
                Text(
                    text = "Exposure",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textSecondary,
                    letterSpacing = 0.3.sp
                )
            }
        }
    }

}

/** Drill-down sheets for assurance metrics — rendered at screen-level so overlay covers full screen */
@Composable
fun AssuranceDrillDowns(
    assuranceState: AssuranceState,
    lifetimeEarnings: Int?,
    activeDrillDown: String?,
    onDismiss: () -> Unit
) {
    val colors = WiomCspTheme.colors

    val slaColor = when (assuranceState.slaStanding) {
        SlaStanding.COMPLIANT -> colors.positive
        SlaStanding.AT_RISK -> colors.warning
        SlaStanding.NON_COMPLIANT -> colors.negative
    }

    val exposureColor = when (assuranceState.exposureState) {
        ExposureState.ELIGIBLE -> colors.positive
        ExposureState.LIMITED -> colors.warning
        ExposureState.INELIGIBLE -> colors.negative
    }

    // Active Base
    DrillDownSheet(
        visible = activeDrillDown == "activeBase",
        onDismiss = onDismiss
    ) {
        Text("Active Base", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = colors.textPrimary)
        Spacer(Modifier.height(8.dp))
        Text("Current Count", fontSize = 12.sp, color = colors.textSecondary)
        Spacer(Modifier.height(4.dp))
        Text("${assuranceState.activeBase} connections", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
        Spacer(Modifier.height(16.dp))
        Text("RECENT CHANGES", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = colors.textSecondary, letterSpacing = 0.5.sp)
        Spacer(Modifier.height(8.dp))
        assuranceState.activeBaseEvents.take(5).forEach { evt ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .drawBehind {
                        drawLine(colors.borderSubtle, Offset(0f, size.height), Offset(size.width, size.height), 1f)
                    }
                    .padding(vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(evt.connectionId, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
                    Spacer(Modifier.height(2.dp))
                    Text(evt.reason, fontSize = 12.sp, color = colors.textMuted)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        if (evt.change > 0) "+1" else "-1",
                        fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                        color = if (evt.change > 0) colors.positive else colors.negative
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(evt.date, fontSize = 11.sp, color = colors.textMuted)
                }
            }
        }
    }

    // Earnings
    DrillDownSheet(
        visible = activeDrillDown == "earnings",
        onDismiss = onDismiss
    ) {
        Text("Cycle Earnings", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = colors.textPrimary)
        Spacer(Modifier.height(8.dp))
        Text("Cycle Earned", fontSize = 12.sp, color = colors.textSecondary)
        Spacer(Modifier.height(4.dp))
        Text(formatCurrency(assuranceState.cycleEarned), fontSize = 28.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
        Spacer(Modifier.height(20.dp))
        Text("Active Base", fontSize = 12.sp, color = colors.textSecondary)
        Spacer(Modifier.height(4.dp))
        Text("${assuranceState.activeBase} connections", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
        Spacer(Modifier.height(16.dp))
        Text("Next Settlement", fontSize = 12.sp, color = colors.textSecondary)
        Spacer(Modifier.height(4.dp))
        Text(
            "${formatCurrency(assuranceState.nextSettlementAmount)} on ${assuranceState.nextSettlementDate}",
            fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary
        )
        if (lifetimeEarnings != null) {
            Spacer(Modifier.height(8.dp))
            Box(Modifier.fillMaxWidth().height(1.dp).background(colors.borderSubtle))
            Spacer(Modifier.height(12.dp))
            Text("Lifetime Earned", fontSize = 12.sp, color = colors.textSecondary)
            Spacer(Modifier.height(4.dp))
            Text(formatCurrency(lifetimeEarnings), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = colors.money)
            Spacer(Modifier.height(16.dp))
        }
        Spacer(Modifier.height(12.dp))
        Box(
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(colors.bgPrimary).padding(14.dp)
        ) {
            Text(
                "This shows current cycle earnings only. For full financial details visit Wallet from the menu.",
                fontSize = 13.sp, color = colors.textSecondary, lineHeight = 20.sp
            )
        }
    }

    // SLA Standing
    DrillDownSheet(
        visible = activeDrillDown == "sla",
        onDismiss = onDismiss
    ) {
        Text("SLA Standing", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = colors.textPrimary)
        Spacer(Modifier.height(8.dp))
        Text("Current Status", fontSize = 12.sp, color = colors.textSecondary)
        Spacer(Modifier.height(4.dp))
        Text(
            when (assuranceState.slaStanding) {
                SlaStanding.COMPLIANT -> "Compliant"
                SlaStanding.AT_RISK -> "At Risk"
                SlaStanding.NON_COMPLIANT -> "Non-Compliant"
            },
            fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = slaColor
        )
        Spacer(Modifier.height(16.dp))
        Text("Active Restores", fontSize = 12.sp, color = colors.textSecondary)
        Spacer(Modifier.height(4.dp))
        Text("${assuranceState.activeRestores}", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
        Spacer(Modifier.height(16.dp))
        Text("Unresolved Count", fontSize = 12.sp, color = colors.textSecondary)
        Spacer(Modifier.height(4.dp))
        Text("${assuranceState.unresolvedCount}", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
        Spacer(Modifier.height(16.dp))
        Box(
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(colors.bgPrimary).padding(14.dp)
        ) {
            Text(
                "SLA compliance is determined by the ratio of restores resolved within the SLA deadline versus total restore tasks in the current settlement cycle.",
                fontSize = 13.sp, color = colors.textSecondary, lineHeight = 20.sp
            )
        }
    }

    // Exposure
    DrillDownSheet(
        visible = activeDrillDown == "exposure",
        onDismiss = onDismiss
    ) {
        Text("Exposure", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = colors.textPrimary)
        Spacer(Modifier.height(8.dp))
        Text("Current Status", fontSize = 12.sp, color = colors.textSecondary)
        Spacer(Modifier.height(4.dp))
        Text(
            when (assuranceState.exposureState) {
                ExposureState.ELIGIBLE -> "ELIGIBLE"
                ExposureState.LIMITED -> "LIMITED"
                ExposureState.INELIGIBLE -> "INELIGIBLE"
            },
            fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = exposureColor
        )
        Spacer(Modifier.height(16.dp))
        Text("Reason Code", fontSize = 12.sp, color = colors.textSecondary)
        Spacer(Modifier.height(4.dp))
        Text(assuranceState.exposureReason, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
        Spacer(Modifier.height(16.dp))
        Text("Effective Since", fontSize = 12.sp, color = colors.textSecondary)
        Spacer(Modifier.height(4.dp))
        Text(assuranceState.exposureSince, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
        Spacer(Modifier.height(16.dp))
        Box(
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(colors.bgPrimary).padding(14.dp)
        ) {
            Column {
                Text("Quality Signal", fontSize = 13.sp, color = colors.textSecondary)
                Spacer(Modifier.height(8.dp))
                Text(
                    when (assuranceState.exposureState) {
                        ExposureState.ELIGIBLE -> "All metrics are within acceptable thresholds. Continue maintaining current standards."
                        ExposureState.LIMITED -> "Some metrics are approaching threshold limits. Review active tasks and prioritize SLA compliance."
                        ExposureState.INELIGIBLE -> "Critical metrics have breached thresholds. Immediate corrective action required to restore eligibility."
                    },
                    fontSize = 13.sp, color = colors.textPrimary, lineHeight = 20.sp
                )
            }
        }
    }
}
