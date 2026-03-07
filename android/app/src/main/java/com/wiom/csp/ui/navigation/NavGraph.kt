package com.wiom.csp.ui.navigation

import android.content.Intent
import androidx.activity.compose.BackHandler
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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

/**
 * Single-screen navigation architecture (matching the web SPA pattern).
 * Auth-gated: if not logged in, show LoginScreen.
 * Profile-gated: if logged in but profile incomplete, show OnboardingScreen.
 * Otherwise, HomeScreen manages all overlays/sections internally via state.
 */
@Composable
fun WiomNavGraph(userPreferences: UserPreferences, deepLinkIntent: Intent? = null) {
    val isLoggedIn by userPreferences.isLoggedIn.collectAsState(initial = false)
    val isProfileComplete by userPreferences.isProfileComplete.collectAsState(initial = false)

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

        // Handle deep links: wiomcsp://open/task/{id} or wiomcsp://open/section/{name}
        LaunchedEffect(deepLinkIntent) {
            val uri = deepLinkIntent?.data ?: return@LaunchedEffect
            if (uri.scheme == "wiomcsp" && uri.host == "open") {
                val segments = uri.pathSegments
                if (segments.size >= 2) {
                    when (segments[0]) {
                        "task" -> viewModel.selectTask(segments[1])
                        "section" -> viewModel.navigate(segments[1])
                    }
                }
            }
        }

        // Theme wraps everything, responds to server-synced theme changes
        com.wiom.csp.ui.theme.WiomCspTheme(appTheme = state.currentTheme) {
            HomeScreen(viewModel = viewModel)
        }
    }
}
