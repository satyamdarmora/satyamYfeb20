package com.wiom.csp.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.SubcomposeAsyncImage
import com.wiom.csp.ui.theme.WiomCspTheme

/**
 * Coil-based async image with loading placeholder and error fallback.
 */
@Composable
fun WiomAsyncImage(
    model: Any?,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop,
) {
    val colors = WiomCspTheme.colors

    SubcomposeAsyncImage(
        model = model,
        contentDescription = contentDescription,
        modifier = modifier.clip(RoundedCornerShape(8.dp)),
        contentScale = contentScale,
        loading = {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(colors.bgCard),
                contentAlignment = Alignment.Center
            ) {
                ShimmerBox(Modifier.matchParentSize())
            }
        },
        error = {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(colors.bgCard),
                contentAlignment = Alignment.Center
            ) {
                Text("!", fontSize = 14.sp, color = colors.textMuted)
            }
        }
    )
}
