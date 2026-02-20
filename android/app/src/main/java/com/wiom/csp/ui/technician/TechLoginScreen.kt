package com.wiom.csp.ui.technician

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.domain.model.Technician
import com.wiom.csp.ui.theme.WiomCspTheme

@Composable
fun TechLoginScreen(
    technicians: List<Technician>,
    isLoading: Boolean,
    onLogin: (String) -> Unit
) {
    val colors = WiomCspTheme.colors

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgPrimary),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 380.dp)
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Logo / Brand
            Spacer(Modifier.height(40.dp))

            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(colors.brandPrimary),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "W",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )
            }

            Spacer(Modifier.height(16.dp))

            Text(
                "Wiom Technician",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary
            )

            Spacer(Modifier.height(6.dp))

            Text(
                "Select your profile to continue",
                fontSize = 13.sp,
                color = colors.textMuted
            )

            Spacer(Modifier.height(40.dp))

            // Technician list
            if (isLoading) {
                Text(
                    "Loading...",
                    fontSize = 14.sp,
                    color = colors.textMuted,
                    textAlign = TextAlign.Center
                )
            } else {
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    technicians.forEach { tech ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(colors.bgCard)
                                .border(1.dp, colors.borderSubtle, RoundedCornerShape(12.dp))
                                .clickable { onLogin(tech.id) }
                                .padding(horizontal = 18.dp, vertical = 16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            // Avatar
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(CircleShape)
                                    .background(colors.brandPrimary),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    tech.name.first().toString(),
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }

                            // Name + details
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    tech.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = colors.textPrimary
                                )
                                Text(
                                    "Band ${tech.band.name} \u00B7 ${tech.id}",
                                    fontSize = 12.sp,
                                    color = colors.textMuted
                                )
                            }

                            // Availability dot
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .clip(CircleShape)
                                    .background(
                                        if (tech.available) colors.positive
                                        else colors.textMuted
                                    )
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            Text(
                "Only technicians added by your CSP can log in.",
                fontSize = 12.sp,
                color = colors.textMuted,
                textAlign = TextAlign.Center
            )

            Spacer(Modifier.height(40.dp))
        }
    }
}
