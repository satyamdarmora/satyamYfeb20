package com.wiom.csp.ui.navigation

import androidx.activity.compose.BackHandler
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import com.wiom.csp.ui.home.HomeScreen
import com.wiom.csp.ui.home.HomeViewModel
import com.wiom.csp.ui.theme.WiomCspTheme
import com.wiom.csp.ui.theme.WiomCspTheme as Theme

/**
 * Single-screen navigation architecture (matching the web SPA pattern).
 * The HomeScreen manages all overlays/sections internally via state.
 * BackHandler is wired in HomeScreen's ViewModel state management.
 */
@Composable
fun WiomNavGraph() {
    val viewModel: HomeViewModel = hiltViewModel()
    val state by viewModel.state.collectAsState()

    // Back handler chain: task detail → section → menu → stay
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
