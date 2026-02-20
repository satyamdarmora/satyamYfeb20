package com.wiom.csp.ui.technician

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.wiom.csp.domain.model.Task
import com.wiom.csp.ui.common.ConfirmationToast
import com.wiom.csp.ui.theme.WiomCspTheme

private val TERMINAL_STATES = setOf(
    "RESOLVED", "VERIFIED", "ACTIVATION_VERIFIED",
    "RETURN_CONFIRMED", "FAILED", "UNRESOLVED", "LOST_DECLARED"
)

@Composable
fun TechnicianAppScreen(
    onBack: () -> Unit,
    viewModel: TechViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val colors = WiomCspTheme.colors

    // Handle back within tech app: task_detail/profile → dashboard, dashboard/login → exit to CSP
    BackHandler(enabled = true) {
        when (state.view) {
            TechView.TASK_DETAIL, TechView.PROFILE -> viewModel.backToDashboard()
            else -> onBack()
        }
    }

    Box(modifier = Modifier.fillMaxSize().statusBarsPadding()) {
        when (state.view) {
            TechView.LOGIN -> {
                TechLoginScreen(
                    technicians = state.technicians,
                    isLoading = state.isLoading,
                    onLogin = { viewModel.login(it) }
                )
            }

            TechView.DASHBOARD -> {
                val tech = state.tech
                if (tech != null) {
                    TechDashboardScreen(
                        tech = tech,
                        tasks = state.tasks,
                        onSelectTask = { viewModel.selectTask(it) },
                        onOpenProfile = { viewModel.openProfile() },
                        onToggleAvailability = { viewModel.toggleAvailability() }
                    )
                } else {
                    // Loading state
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(colors.bgPrimary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "Loading...",
                            fontSize = 14.sp,
                            color = colors.textMuted
                        )
                    }
                }
            }

            TechView.TASK_DETAIL -> {
                val task = state.tasks.find { it.taskId == state.selectedTaskId }
                val techId = state.techId
                if (task != null && techId != null) {
                    TechTaskDetailScreen(
                        task = task,
                        techId = techId,
                        onAction = { taskId, action -> viewModel.handleAction(taskId, action) },
                        onClose = { viewModel.backToDashboard() }
                    )
                }
            }

            TechView.PROFILE -> {
                val tech = state.tech
                if (tech != null) {
                    val activeCount = state.tasks.count { it.state !in TERMINAL_STATES }
                    TechProfileScreen(
                        tech = tech,
                        activeCount = activeCount,
                        onLogout = {
                            viewModel.logout()
                            onBack()
                        },
                        onClose = { viewModel.backToDashboard() }
                    )
                }
            }
        }

        // Confirmation toast
        ConfirmationToast(
            message = state.confirmMessage,
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 16.dp)
        )
    }
}
