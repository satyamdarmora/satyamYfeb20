package com.wiom.csp.ui.technician

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.domain.model.Technician
import com.wiom.csp.domain.model.TechnicianBand
import com.wiom.csp.ui.theme.WiomCspTheme
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

// Hard-coded technicians (same as seed data) -- in production these come from API
private val seedTechnicians = listOf(
    Technician("TECH-001", "Ajay Patil", TechnicianBand.A, true, "CSP-MH-1001", "+91 98765 43210", "2025-06-15", 47),
    Technician("TECH-002", "Suresh Kamble", TechnicianBand.B, true, "CSP-MH-1001", "+91 98765 43211", "2025-08-01", 31),
    Technician("TECH-003", "Ramesh Jadhav", TechnicianBand.B, false, "CSP-MH-1001", "+91 98765 43212", "2025-09-10", 22),
    Technician("TECH-004", "Vikram Shinde", TechnicianBand.C, true, "CSP-MH-1001", "+91 98765 43213", "2025-11-20", 8),
)

@Composable
fun TechnicianPickerSheet(
    taskId: String,
    onAssign: (String, Technician) -> Unit,
    onDismiss: () -> Unit
) {
    val colors = WiomCspTheme.colors

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.overlayBg)
            .clickable(
                indication = null,
                interactionSource = remember { MutableInteractionSource() }
            ) { onDismiss() },
        contentAlignment = Alignment.BottomCenter
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                .background(colors.bgSecondary)
                .clickable(
                    indication = null,
                    interactionSource = remember { MutableInteractionSource() }
                ) { /* consume */ }
        ) {
            // Drag handle
            Box(
                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .width(36.dp)
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(colors.textMuted)
                )
            }

            // Title
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
            ) {
                Text("Assign to Technician", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                Text("Task: $taskId", fontSize = 12.sp, color = colors.textSecondary)
            }

            Divider(colors.bgCard)

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 400.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Self-assign
                TechnicianRow(
                    name = "Myself (CSP)",
                    subtitle = "I will handle this task",
                    badge = "Self",
                    badgeColor = colors.brandPrimary,
                    avatarChar = 'C',
                    avatarBg = colors.brandPrimary,
                    enabled = true,
                    onClick = {
                        onAssign(taskId, Technician(
                            id = "CSP-MH-1001",
                            name = "Self (CSP-MH-1001)",
                            band = TechnicianBand.A,
                            available = true,
                            cspId = "CSP-MH-1001",
                            phone = "",
                            joinDate = "2025-01-01",
                            completedCount = 0
                        ))
                    }
                )

                seedTechnicians.forEach { tech ->
                    TechnicianRow(
                        name = tech.name,
                        subtitle = "Band ${tech.band.name}${if (!tech.available) " -- Unavailable" else ""}",
                        badge = if (tech.available) "Available" else null,
                        badgeColor = colors.positive,
                        avatarChar = tech.name.first(),
                        avatarBg = if (tech.available) colors.bgCard else colors.bgSecondary,
                        enabled = tech.available,
                        onClick = { onAssign(taskId, tech) }
                    )
                }
            }

            // Cancel
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color.Transparent)
                    .clickable { onDismiss() }
                    .padding(12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Cancel", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = colors.textSecondary)
            }
        }
    }
}

@Composable
private fun TechnicianRow(
    name: String,
    subtitle: String,
    badge: String?,
    badgeColor: Color,
    avatarChar: Char,
    avatarBg: Color,
    enabled: Boolean,
    onClick: () -> Unit
) {
    val colors = WiomCspTheme.colors
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = enabled) { onClick() }
            .semantics {
                contentDescription = "$name, $subtitle${if (!enabled) ", unavailable" else ""}"
            }
            .padding(horizontal = 20.dp, vertical = 12.dp)
            .then(if (!enabled) Modifier else Modifier),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(avatarBg),
            contentAlignment = Alignment.Center
        ) {
            Text(
                avatarChar.toString(),
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = if (enabled) colors.brandPrimary else colors.textMuted
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(name, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = if (enabled) colors.textPrimary else colors.textMuted)
            Text(subtitle, fontSize = 12.sp, color = colors.textSecondary)
        }
        if (badge != null) {
            Text(badge, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = badgeColor)
        }
    }
}

@Composable
private fun Divider(color: Color) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(color)
    )
}
