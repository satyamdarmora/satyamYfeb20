package com.wiom.csp.ui.profile

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.ui.common.WiomToggle
import com.wiom.csp.ui.theme.WiomCspTheme

@Composable
fun ProfileScreen(
    onBack: () -> Unit,
    offersEnabled: Boolean,
    onOffersToggle: (Boolean) -> Unit,
    onLogout: () -> Unit = {}
) {
    val colors = WiomCspTheme.colors
    var taskAlerts by remember { mutableStateOf(true) }
    var slaWarnings by remember { mutableStateOf(true) }
    var settlementUpdates by remember { mutableStateOf(true) }
    var showOfferWarning by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize().background(colors.bgPrimary).statusBarsPadding()) {
        Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            // Header
            Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                Text(
                    text = "\u2190 Back",
                    modifier = Modifier.clickable { onBack() }.padding(vertical = 4.dp),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.textSecondary
                )
                Spacer(Modifier.height(12.dp))
                Text("Profile", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
            }

            // Avatar + CSP info
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier.size(52.dp).clip(CircleShape).background(colors.brandPrimary),
                    contentAlignment = Alignment.Center
                ) {
                    Text("C", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
                Spacer(Modifier.height(8.dp))
                Text("CSP-MH-1001", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                Text("Band A Partner", fontSize = 14.sp, color = colors.brandPrimary)
            }

            Spacer(Modifier.height(20.dp))

            // Language section
            SectionTitle("Language")
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("EN" to "English", "HI" to "Hindi").forEach { (code, label) ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (code == "EN") colors.brandSubtle else colors.bgCard)
                            .border(
                                1.dp,
                                if (code == "EN") colors.brandPrimary else Color.Transparent,
                                RoundedCornerShape(10.dp)
                            )
                            .clickable { /* TODO: language switch */ }
                            .padding(12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(label, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Notification Settings
            SectionTitle("Notification Settings")
            ToggleRow("Task Alerts", taskAlerts) { taskAlerts = it }
            ToggleRow("SLA Warnings", slaWarnings) { slaWarnings = it }
            ToggleRow("Settlement Updates", settlementUpdates) { settlementUpdates = it }

            Spacer(Modifier.height(16.dp))

            // Offer Notifications (with confirmation)
            SectionTitle("Offer Notifications")
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Offer Notifications", fontSize = 14.sp, color = colors.textPrimary)
                WiomToggle(
                    checked = offersEnabled,
                    onCheckedChange = { newValue ->
                        if (!newValue) showOfferWarning = true
                        else onOffersToggle(true)
                    }
                )
            }
            if (!offersEnabled) {
                Text(
                    "You will not receive new connection offers. Your active base will not grow until you turn this back on.",
                    modifier = Modifier.padding(horizontal = 16.dp),
                    fontSize = 12.sp,
                    color = colors.warning,
                    lineHeight = 16.sp
                )
            }

            Spacer(Modifier.height(16.dp))

            // Account Info
            SectionTitle("Account Information")
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.bgCard)
                    .padding(16.dp)
            ) {
                InfoRow("CSP ID", "CSP-MH-1001")
                InfoRow("Zone", "Mumbai West")
                InfoRow("Partner Since", "2025-01-15")
                InfoRow("Email", "csp.mh1001@wiom.in")
                InfoRow("Phone", "+91 98765 00001")
            }

            // Logout
            Spacer(Modifier.height(32.dp))
            Button(
                onClick = onLogout,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colors.negative.copy(alpha = 0.1f)
                )
            ) {
                Text(
                    "Logout",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.negative
                )
            }

            Spacer(Modifier.height(80.dp))
        }

        // Offer warning dialog
        if (showOfferWarning) {
            AlertDialog(
                onDismissRequest = { showOfferWarning = false },
                title = { Text("Turn off offer notifications?", color = colors.textPrimary) },
                text = {
                    Text(
                        "You will not receive new connection offers. Your active base will not grow until you turn this back on.",
                        color = colors.textSecondary
                    )
                },
                confirmButton = {
                    TextButton(onClick = {
                        onOffersToggle(false)
                        showOfferWarning = false
                    }) { Text("Turn Off", color = colors.negative) }
                },
                dismissButton = {
                    TextButton(onClick = { showOfferWarning = false }) {
                        Text("Cancel", color = colors.textSecondary)
                    }
                },
                containerColor = colors.bgCard
            )
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    val colors = WiomCspTheme.colors
    Text(
        title.uppercase(),
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        color = colors.textSecondary,
        letterSpacing = 0.5.sp
    )
}

@Composable
private fun ToggleRow(label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    val colors = WiomCspTheme.colors
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 14.sp, color = colors.textPrimary)
        WiomToggle(checked = checked, onCheckedChange = onCheckedChange)
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    val colors = WiomCspTheme.colors
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontSize = 13.sp, color = colors.textMuted)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
    }
}
