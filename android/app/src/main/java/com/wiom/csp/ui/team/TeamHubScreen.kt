package com.wiom.csp.ui.team

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
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

// Seed data matching web app
private val initialTechnicians = listOf(
    Technician("TECH-001", "Ajay Patil", TechnicianBand.A, true, "CSP-MH-1001", "+91 98765 43210", "2025-06-15", 47),
    Technician("TECH-002", "Suresh Kamble", TechnicianBand.B, true, "CSP-MH-1001", "+91 98765 43211", "2025-08-01", 31),
    Technician("TECH-003", "Ramesh Jadhav", TechnicianBand.B, false, "CSP-MH-1001", "+91 98765 43212", "2025-09-10", 22),
    Technician("TECH-004", "Vikram Shinde", TechnicianBand.C, true, "CSP-MH-1001", "+91 98765 43213", "2025-11-20", 8),
)

@Composable
fun TeamHubScreen(onBack: () -> Unit) {
    val colors = WiomCspTheme.colors
    var technicians by remember { mutableStateOf(initialTechnicians) }
    var showAddForm by remember { mutableStateOf(false) }
    var selectedTech by remember { mutableStateOf<Technician?>(null) }

    if (showAddForm) {
        AddTechnicianForm(
            onAdd = { tech ->
                technicians = technicians + tech
                showAddForm = false
            },
            onCancel = { showAddForm = false }
        )
        return
    }

    if (selectedTech != null) {
        TechnicianDetailScreen(
            technician = selectedTech!!,
            onBack = { selectedTech = null }
        )
        return
    }

    Box(modifier = Modifier.fillMaxSize().background(colors.bgPrimary).statusBarsPadding()) {
        Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "\u2190 Back",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = colors.textSecondary,
                        modifier = Modifier.clickable { onBack() }.padding(vertical = 4.dp)
                    )
                    IconButton(onClick = { showAddForm = true }) {
                        Icon(Icons.Default.Add, "Add", tint = colors.brandPrimary)
                    }
                }
                Spacer(Modifier.height(12.dp))
                Text("Team", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
            }

            technicians.forEach { tech ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { selectedTech = tech }
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier.size(40.dp).clip(CircleShape).background(colors.bgCard),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(tech.name.first().toString(), fontWeight = FontWeight.Bold, color = colors.brandPrimary)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(tech.name, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                        Text("Band ${tech.band.name} \u2022 ${tech.completedCount} completed", fontSize = 12.sp, color = colors.textSecondary)
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(if (tech.available) colors.positiveSubtle else colors.negativeSubtle)
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            if (tech.available) "Available" else "Unavailable",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (tech.available) colors.positive else colors.negative
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AddTechnicianForm(onAdd: (Technician) -> Unit, onCancel: () -> Unit) {
    val colors = WiomCspTheme.colors
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var band by remember { mutableStateOf("B") }

    Box(modifier = Modifier.fillMaxSize().background(colors.bgPrimary)) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text(
                "\u2190 Back",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = colors.textSecondary,
                modifier = Modifier.clickable { onCancel() }.padding(vertical = 4.dp)
            )
            Spacer(Modifier.height(12.dp))
            Text("Add Technician", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
            Spacer(Modifier.height(16.dp))

            OutlinedTextField(
                value = name, onValueChange = { name = it },
                label = { Text("Name") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = colors.brandPrimary, unfocusedBorderColor = colors.borderSubtle, focusedTextColor = colors.textPrimary, unfocusedTextColor = colors.textPrimary, cursorColor = colors.brandPrimary, focusedLabelColor = colors.brandPrimary, unfocusedLabelColor = colors.textMuted)
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = phone, onValueChange = { phone = it },
                label = { Text("Phone") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = colors.brandPrimary, unfocusedBorderColor = colors.borderSubtle, focusedTextColor = colors.textPrimary, unfocusedTextColor = colors.textPrimary, cursorColor = colors.brandPrimary, focusedLabelColor = colors.brandPrimary, unfocusedLabelColor = colors.textMuted)
            )
            Spacer(Modifier.height(12.dp))
            Text("Band", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
                listOf("A", "B", "C").forEach { b ->
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (band == b) colors.brandPrimary else colors.chipBg)
                            .clickable { band = b }
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Text(b, color = if (band == b) Color.White else colors.textSecondary, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            Spacer(Modifier.weight(1f))

            Box(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp))
                    .background(if (name.isNotBlank()) colors.brandPrimary else colors.bgCardHover)
                    .clickable(enabled = name.isNotBlank()) {
                        onAdd(Technician(
                            id = "TECH-${System.currentTimeMillis().toString().takeLast(4)}",
                            name = name.trim(),
                            band = TechnicianBand.valueOf(band),
                            available = true,
                            cspId = "CSP-MH-1001",
                            phone = phone.trim(),
                            joinDate = java.time.LocalDate.now().toString(),
                            completedCount = 0
                        ))
                    }
                    .padding(vertical = 14.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Add Member", fontWeight = FontWeight.SemiBold, color = if (name.isNotBlank()) Color.White else colors.textMuted)
            }
        }
    }
}

@Composable
private fun TechnicianDetailScreen(technician: Technician, onBack: () -> Unit) {
    val colors = WiomCspTheme.colors
    Box(modifier = Modifier.fillMaxSize().background(colors.bgPrimary)) {
        Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
            Text(
                "\u2190 Back",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = colors.textSecondary,
                modifier = Modifier.clickable { onBack() }.padding(vertical = 4.dp)
            )
            Spacer(Modifier.height(12.dp))
            Box(
                modifier = Modifier.size(60.dp).clip(CircleShape).background(colors.bgCard).align(Alignment.CenterHorizontally),
                contentAlignment = Alignment.Center
            ) {
                Text(technician.name.first().toString(), fontSize = 24.sp, fontWeight = FontWeight.Bold, color = colors.brandPrimary)
            }
            Spacer(Modifier.height(12.dp))
            Text(technician.name, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary, modifier = Modifier.align(Alignment.CenterHorizontally))
            Text("Band ${technician.band.name}", fontSize = 14.sp, color = colors.textSecondary, modifier = Modifier.align(Alignment.CenterHorizontally))
            Spacer(Modifier.height(20.dp))

            Column(modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(colors.bgCard).padding(16.dp).fillMaxWidth()) {
                DetailRow("ID", technician.id)
                DetailRow("Phone", technician.phone)
                DetailRow("Join Date", technician.joinDate)
                DetailRow("Completed Tasks", "${technician.completedCount}")
                DetailRow("Status", if (technician.available) "Available" else "Unavailable")
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    val colors = WiomCspTheme.colors
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontSize = 13.sp, color = colors.textMuted)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
    }
}
