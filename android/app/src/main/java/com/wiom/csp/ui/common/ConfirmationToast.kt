package com.wiom.csp.ui.common

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.wiom.csp.ui.theme.WiomCspTheme
import kotlinx.coroutines.delay

@Composable
fun ConfirmationToast(
    message: String?,
    modifier: Modifier = Modifier,
    onDismiss: () -> Unit = {}
) {
    var visible by remember { mutableStateOf(false) }

    LaunchedEffect(message) {
        if (message != null) {
            visible = true
            delay(3000)
            visible = false
            onDismiss()
        }
    }

    AnimatedVisibility(
        visible = visible && message != null,
        enter = fadeIn() + slideInVertically { -it },
        exit = fadeOut() + slideOutVertically { -it },
        modifier = modifier
            .fillMaxWidth()
            .zIndex(100f)
    ) {
        Box(
            modifier = Modifier.fillMaxWidth(),
            contentAlignment = Alignment.TopCenter
        ) {
            Text(
                text = message ?: "",
                modifier = Modifier
                    .padding(horizontal = 24.dp, vertical = 16.dp)
                    .shadow(8.dp, RoundedCornerShape(10.dp))
                    .background(
                        WiomCspTheme.colors.brandPrimary,
                        RoundedCornerShape(10.dp)
                    )
                    .padding(horizontal = 24.dp, vertical = 14.dp),
                color = Color.White,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
                maxLines = 3
            )
        }
    }
}
