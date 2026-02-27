package com.wiom.csp.ui.navigation

import androidx.activity.compose.BackHandler
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import com.wiom.csp.data.preferences.UserPreferences
import com.wiom.csp.ui.auth.LoginScreen
import com.wiom.csp.ui.auth.LoginViewModel
import com.wiom.csp.ui.home.HomeScreen
import com.wiom.csp.ui.home.HomeViewModel
import com.wiom.csp.ui.onboarding.OnboardingScreen
import com.wiom.csp.ui.onboarding.OnboardingViewModel
import com.wiom.csp.ui.pending.PendingScreen
import com.wiom.csp.ui.pending.PendingViewModel

/**
 * Single-screen navigation architecture (matching the web SPA pattern).
 * Auth-gated: if not logged in, show LoginScreen.
 * Profile-gated: if logged in but profile incomplete, show OnboardingScreen.
 * Pending-gated: if profile complete but not yet active, show PendingScreen.
 * Otherwise, HomeScreen manages all overlays/sections internally via state.
 */
@Composable
fun WiomNavGraph(userPreferences: UserPreferences) {
    val isLoggedIn by userPreferences.isLoggedIn.collectAsState(initial = false)
    val isProfileComplete by userPreferences.isProfileComplete.collectAsState(initial = false)
    val isPartnerActive by userPreferences.isPartnerActive.collectAsState(initial = false)

    if (!isLoggedIn) {
        val loginViewModel: LoginViewModel = hiltViewModel()
        LoginScreen(
            viewModel = loginViewModel,
            onLoginSuccess = { /* State will recompose via isLoggedIn flow */ }
        )
    } else if (!isProfileComplete) {
        val onboardingViewModel: OnboardingViewModel = hiltViewModel()
        com.wiom.csp.ui.theme.WiomCspTheme {
            OnboardingScreen(
                viewModel = onboardingViewModel,
                onRegistrationComplete = { /* State will recompose via isProfileComplete flow */ }
            )
        }
    } else if (!isPartnerActive) {
        val pendingViewModel: PendingViewModel = hiltViewModel()
        com.wiom.csp.ui.theme.WiomCspTheme {
            PendingScreen(viewModel = pendingViewModel)
        }
    } else {
        val viewModel: HomeViewModel = hiltViewModel()
        val state by viewModel.state.collectAsState()

        // Back handler chain: task detail -> section -> menu -> stay
        BackHandler(enabled = true) {
            when {
                state.selectedTaskId != null -> viewModel.clearSelectedTask()
                state.activeSection != null -> viewModel.backToHome()
                state.menuOpen -> viewModel.closeMenu()
                state.assignPickerOpen -> viewModel.closeAssignPicker()
                // else: at root -- system handles back
            }
        }

        // Theme wraps everything, responds to server-synced theme changes
        com.wiom.csp.ui.theme.WiomCspTheme(appTheme = state.currentTheme) {
            HomeScreen(viewModel = viewModel)
        }
    }
}
