package com.wiom.csp.ui.menu

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.ui.theme.WiomCspTheme

data class MenuItem(
    val key: String,
    val label: String,
    val description: String,
    val icon: ImageVector
)

private val menuItems = listOf(
    MenuItem("wallet", "Wallet", "Balance & transactions", Icons.Default.AccountBalanceWallet),
    MenuItem("team", "Team", "Manage technicians", Icons.Default.Groups),
    MenuItem("netbox", "NetBox", "Orders & inventory", Icons.Default.Inventory2),
    MenuItem("support", "Support", "Cases & escalation", Icons.Default.SupportAgent),
    MenuItem("policies", "Policies & Updates", "Documents & changelog", Icons.Default.Description),
    MenuItem("profile", "Profile & Settings", "Account & preferences", Icons.Default.Person),
    MenuItem("technician", "Technician App", "Switch to tech view", Icons.Default.Engineering),
)

@Composable
fun SecondaryMenuDrawer(
    isOpen: Boolean,
    onClose: () -> Unit,
    onNavigate: (String) -> Unit,
    onLogout: (() -> Unit)? = null
) {
    val colors = WiomCspTheme.colors

    AnimatedVisibility(
        visible = isOpen,
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
                ) { onClose() },
            contentAlignment = Alignment.CenterEnd
        ) {
            AnimatedVisibility(
                visible = isOpen,
                enter = slideInHorizontally { it },
                exit = slideOutHorizontally { it }
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth(0.8f)
                        .widthIn(max = 320.dp)
                        .fillMaxHeight()
                        .background(colors.bgSecondary)
                        .clickable(
                            indication = null,
                            interactionSource = remember { MutableInteractionSource() }
                        ) { /* consume */ }
                ) {
                    // Header with close button
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Menu",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textPrimary
                        )
                        Text(
                            "\u2715",
                            modifier = Modifier
                                .clickable { onClose() }
                                .padding(4.dp),
                            fontSize = 20.sp,
                            color = colors.textMuted
                        )
                    }

                    // Menu items
                    Spacer(Modifier.height(8.dp))

                    menuItems.forEach { item ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onNavigate(item.key) }
                                .padding(horizontal = 20.dp, vertical = 14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            // Icon in a 40x40 box with bgCard background
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(colors.bgCard),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    item.icon,
                                    contentDescription = item.label,
                                    tint = colors.textSecondary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    item.label,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = colors.textPrimary
                                )
                                Text(
                                    item.description,
                                    fontSize = 12.sp,
                                    color = colors.textMuted
                                )
                            }

                            // Chevron
                            Text(
                                "\u203A",
                                fontSize = 16.sp,
                                color = colors.textMuted
                            )
                        }
                    }

                    // Logout button
                    if (onLogout != null) {
                        Spacer(Modifier.weight(1f))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onLogout() }
                                .padding(horizontal = 20.dp, vertical = 16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(colors.negative.copy(alpha = 0.1f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.Logout,
                                    contentDescription = "Logout",
                                    tint = colors.negative,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Text(
                                "Logout",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = colors.negative
                            )
                        }
                        Spacer(Modifier.height(20.dp))
                    }
                }
            }
        }
    }
}
