package com.wiom.csp.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.wiom.csp.ui.common.ConfirmationToast
import com.wiom.csp.ui.menu.SecondaryMenuDrawer
import com.wiom.csp.ui.notification.EventModal
import com.wiom.csp.ui.taskdetail.TaskDetailScreen
import com.wiom.csp.ui.technician.TechnicianPickerSheet
import com.wiom.csp.ui.theme.WiomCspTheme
import com.wiom.csp.ui.wallet.WalletHubScreen
import com.wiom.csp.ui.team.TeamHubScreen
import com.wiom.csp.ui.support.SupportHubScreen
import com.wiom.csp.ui.netbox.NetBoxHubScreen
import com.wiom.csp.ui.profile.ProfileScreen
import com.wiom.csp.ui.policies.PoliciesScreen
import com.wiom.csp.ui.sla.SLAHubScreen
import com.wiom.csp.ui.technician.TechnicianAppScreen

@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val colors = WiomCspTheme.colors
    val assurance = state.assurance
    var activeDrillDown by remember { mutableStateOf<String?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgPrimary)
            .statusBarsPadding()
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Sticky header
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(colors.bgPrimary)
            ) {
                // Top header bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.clickable { viewModel.navigate("profile") },
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(colors.brandPrimary),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("C", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                        Text(
                            "CSP-MH-1001",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textPrimary
                        )
                    }

                    // Menu button
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { viewModel.openMenu() },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "\u2630",
                            fontSize = 20.sp,
                            color = colors.textSecondary
                        )
                    }
                }

                // Assurance strip (show only if data loaded)
                if (assurance != null) {
                    AssuranceStrip(
                        assuranceState = assurance,
                        lifetimeEarnings = viewModel.lifetimeEarnings,
                        activeDrillDown = activeDrillDown,
                        onDrillDown = { activeDrillDown = it },
                        onOpenSLA = { viewModel.navigate("sla") }
                    )
                } else if (state.isLoading) {
                    // Loading placeholder
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(80.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Loading...", color = colors.textMuted, fontSize = 13.sp)
                    }
                } else {
                    // Error / no backend
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(colors.bgCard)
                            .padding(20.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                "Cannot reach server",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = colors.textPrimary
                            )
                            Spacer(Modifier.height(6.dp))
                            Text(
                                "Make sure the backend is running and your device is on the same network.",
                                fontSize = 12.sp,
                                color = colors.textMuted,
                                lineHeight = 16.sp
                            )
                            Spacer(Modifier.height(12.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(colors.brandPrimary)
                                    .clickable { viewModel.retryLoad() }
                                    .padding(horizontal = 24.dp, vertical = 10.dp)
                            ) {
                                Text("Retry", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }

            // Capability Reset Banner
            if (assurance?.capabilityResetActive == true) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(colors.warningSubtle)
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text("\u26A0", fontSize = 18.sp)
                    Column {
                        Text(
                            "Capability Reset Active",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.warning
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            assurance?.capabilityResetReason
                                ?: "Task assignments may be paused. Complete retraining to restore full partner status.",
                            fontSize = 12.sp,
                            color = colors.textSecondary,
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            // Task Feed
            TaskFeed(
                tasks = state.tasks,
                fadingTasks = state.fadingTasks,
                getBucket = { viewModel.getBucket(it) },
                onAction = { taskId, action -> viewModel.handleAction(taskId, action) },
                onCardClick = { viewModel.selectTask(it) }
            )
        }

        // Confirmation toast
        ConfirmationToast(
            message = state.confirmMessage,
            modifier = Modifier.align(Alignment.TopCenter).padding(top = 16.dp)
        )

        // Task Detail overlay
        val selectedTask = state.tasks.find { it.taskId == state.selectedTaskId }
        if (selectedTask != null) {
            TaskDetailScreen(
                task = selectedTask,
                onBack = { viewModel.clearSelectedTask() },
                onAction = { taskId, action, extra -> viewModel.handleAction(taskId, action, extra) }
            )
        }

        // Technician Picker
        if (state.assignPickerOpen && state.assignTaskId != null) {
            TechnicianPickerSheet(
                taskId = state.assignTaskId!!,
                onAssign = { taskId, tech -> viewModel.doAssign(taskId, tech) },
                onDismiss = { viewModel.closeAssignPicker() }
            )
        }

        // Secondary Menu
        SecondaryMenuDrawer(
            isOpen = state.menuOpen,
            onClose = { viewModel.closeMenu() },
            onNavigate = { section ->
                viewModel.closeMenu()
                viewModel.navigate(section)
            }
        )

        // Event Modal
        EventModal(
            notification = state.activeNotification,
            onDismiss = { viewModel.dismissNotification() },
            onView = { taskId ->
                viewModel.dismissNotification()
                viewModel.selectTask(taskId)
            }
        )

        // Assurance drill-down sheets (at root level so overlay covers full screen)
        if (assurance != null && activeDrillDown != null) {
            AssuranceDrillDowns(
                assuranceState = assurance,
                lifetimeEarnings = viewModel.lifetimeEarnings,
                activeDrillDown = activeDrillDown,
                onDismiss = { activeDrillDown = null }
            )
        }

        // Section overlays
        when (state.activeSection) {
            "wallet" -> WalletHubScreen(onBack = { viewModel.backToHome() })
            "team" -> TeamHubScreen(onBack = { viewModel.backToHome() })
            "support" -> SupportHubScreen(onBack = { viewModel.backToHome() })
            "netbox" -> NetBoxHubScreen(onBack = { viewModel.backToHome() })
            "sla" -> SLAHubScreen(onBack = { viewModel.backToHome() })
            "profile" -> ProfileScreen(
                onBack = { viewModel.backToHome() },
                offersEnabled = state.offersEnabled,
                onOffersToggle = { viewModel.setOffersEnabled(it) },
                onLogout = { viewModel.logout() }
            )
            "policies" -> PoliciesScreen(onBack = { viewModel.backToHome() })
            "technician" -> TechnicianAppScreen(onBack = { viewModel.backToHome() })
        }
    }
}
