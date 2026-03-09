package com.wiom.csp.ui.language

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.R
import com.wiom.csp.ui.theme.WiomCspTheme

@Composable
fun LanguageScreen(
    onLanguageSelected: (String) -> Unit
) {
    val colors = WiomCspTheme.colors
    var selected by remember { mutableStateOf("en") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgPrimary)
            .statusBarsPadding()
            .navigationBarsPadding(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 380.dp)
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Logo
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(colors.brandPrimary),
                contentAlignment = Alignment.Center
            ) {
                Text("W", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
            }

            Spacer(Modifier.height(24.dp))

            // Title — hardcoded bilingual (shown before locale is set)
            Text(
                "Welcome to Wiom CSP",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary
            )
            Text(
                "Wiom CSP में आपका स्वागत है",
                fontSize = 16.sp,
                color = colors.textSecondary
            )

            Spacer(Modifier.height(8.dp))

            // Subtitle
            Text(
                "Choose your preferred language\nअपनी पसंदीदा भाषा चुनें",
                fontSize = 13.sp,
                color = colors.textMuted,
                textAlign = TextAlign.Center,
                lineHeight = 20.sp
            )

            Spacer(Modifier.height(40.dp))

            // Language cards
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                LanguageCard(
                    code = "en",
                    label = "English",
                    nativeLabel = "English",
                    isSelected = selected == "en",
                    onSelect = { selected = "en" },
                    colors = colors,
                    modifier = Modifier.weight(1f)
                )
                LanguageCard(
                    code = "hi",
                    label = "Hindi",
                    nativeLabel = "हिन्दी",
                    isSelected = selected == "hi",
                    onSelect = { selected = "hi" },
                    colors = colors,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(Modifier.height(40.dp))

            // Continue button
            Button(
                onClick = { onLanguageSelected(selected) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colors.brandPrimary
                )
            ) {
                Text(
                    if (selected == "hi") "आगे बढ़ें" else "Continue",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(Modifier.height(32.dp))

            Text(
                "Wiom CSP Partner Portal",
                fontSize = 12.sp,
                color = colors.textMuted
            )
        }
    }
}

@Composable
private fun LanguageCard(
    code: String,
    label: String,
    nativeLabel: String,
    isSelected: Boolean,
    onSelect: () -> Unit,
    colors: com.wiom.csp.ui.theme.WiomColors,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(if (isSelected) colors.brandSubtle else colors.bgCard)
            .border(
                width = 2.dp,
                color = if (isSelected) colors.brandPrimary else Color.Transparent,
                shape = RoundedCornerShape(14.dp)
            )
            .clickable { onSelect() }
            .padding(vertical = 24.dp, horizontal = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = if (code == "hi") "अ" else "A",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = if (isSelected) colors.brandPrimary else colors.textPrimary
            )
            Spacer(Modifier.height(8.dp))
            Text(
                nativeLabel,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (isSelected) colors.brandPrimary else colors.textPrimary
            )
            Text(
                label,
                fontSize = 12.sp,
                color = colors.textMuted
            )
        }
    }
}
