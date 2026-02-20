package com.wiom.csp.ui.policies

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.ui.theme.WiomCspTheme

private data class Policy(
    val id: String,
    val title: String,
    val version: String,
    val updatedAt: String,
    val summary: String,
    val changeLog: List<String>
)

private val samplePolicies = listOf(
    Policy("POL-001", "SLA Compliance Guidelines", "v2.3", "2026-02-01",
        "Defines the SLA compliance framework for CSP partners. Covers restore deadlines, verification requirements, and escalation procedures.",
        listOf("v2.3 -- Added restore retry chain SLA caps", "v2.2 -- Updated verification deadline from 48h to 24h", "v2.1 -- Added netbox return SLA requirements")),
    Policy("POL-002", "Settlement & Earning Policy", "v1.5", "2026-01-15",
        "Details how earnings are calculated, settlement cycles, bonus structures, and deduction policies.",
        listOf("v1.5 -- Added netbox recovery deduction rules", "v1.4 -- Increased activation bonus from 200 to 300", "v1.3 -- Added capability reset earning impact")),
    Policy("POL-003", "NetBox Custody & Return Policy", "v1.2", "2025-12-20",
        "Outlines responsibilities for NetBox custody, return timelines, and deduction rules for lost/damaged equipment.",
        listOf("v1.2 -- Reduced return deadline from 7 to 5 days", "v1.1 -- Added custody chain documentation")),
    Policy("POL-004", "Partner Code of Conduct", "v3.0", "2025-11-01",
        "Behavioral and ethical guidelines for CSP partners and their technician teams.",
        listOf("v3.0 -- Major revision incorporating feedback from partner council")),
)

@Composable
fun PoliciesScreen(onBack: () -> Unit) {
    val colors = WiomCspTheme.colors
    var selectedPolicy by remember { mutableStateOf<Policy?>(null) }

    if (selectedPolicy != null) {
        PolicyDetailScreen(policy = selectedPolicy!!, onBack = { selectedPolicy = null })
        return
    }

    Box(modifier = Modifier.fillMaxSize().background(colors.bgPrimary).statusBarsPadding()) {
        Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp)) {
                Text(
                    "\u2190 Back",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.textSecondary,
                    modifier = Modifier.clickable { onBack() }.padding(vertical = 4.dp)
                )
                Spacer(Modifier.height(12.dp))
                Text("Policies & Updates", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
            }

            samplePolicies.forEach { policy ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(colors.bgCard)
                        .clickable { selectedPolicy = policy }
                        .padding(14.dp)
                ) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(policy.title, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary, modifier = Modifier.weight(1f))
                        Text(policy.version, fontSize = 11.sp, color = colors.textMuted)
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(policy.summary, fontSize = 12.sp, color = colors.textSecondary, maxLines = 2, lineHeight = 16.sp)
                    Spacer(Modifier.height(4.dp))
                    Text("Updated: ${policy.updatedAt}", fontSize = 11.sp, color = colors.textMuted)
                }
            }

            Spacer(Modifier.height(80.dp))
        }
    }
}

@Composable
private fun PolicyDetailScreen(policy: Policy, onBack: () -> Unit) {
    val colors = WiomCspTheme.colors
    Box(modifier = Modifier.fillMaxSize().background(colors.bgPrimary)) {
        Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp)) {
                Text(
                    "\u2190 Back",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.textSecondary,
                    modifier = Modifier.clickable { onBack() }.padding(vertical = 4.dp)
                )
                Spacer(Modifier.height(12.dp))
                Text(policy.id, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
            }

            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).clip(RoundedCornerShape(12.dp)).background(colors.bgCard).padding(16.dp)) {
                Text(policy.title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                Spacer(Modifier.height(4.dp))
                Text("${policy.version} \u2022 Updated ${policy.updatedAt}", fontSize = 12.sp, color = colors.textMuted)
                Spacer(Modifier.height(12.dp))
                Text(policy.summary, fontSize = 14.sp, color = colors.textSecondary, lineHeight = 20.sp)
            }

            Spacer(Modifier.height(16.dp))
            Text("Changelog", modifier = Modifier.padding(horizontal = 16.dp), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
            Spacer(Modifier.height(8.dp))

            policy.changeLog.forEach { entry ->
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("\u2022", color = colors.textMuted)
                    Text(entry, fontSize = 13.sp, color = colors.textSecondary, lineHeight = 18.sp)
                }
            }

            Spacer(Modifier.height(80.dp))
        }
    }
}
