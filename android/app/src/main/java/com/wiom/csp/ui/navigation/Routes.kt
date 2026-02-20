package com.wiom.csp.ui.navigation

sealed class Routes(val route: String) {
    data object Home : Routes("home")
    data object TaskDetail : Routes("task_detail/{taskId}") {
        fun createRoute(taskId: String) = "task_detail/$taskId"
    }
    data object Wallet : Routes("wallet")
    data object Team : Routes("team")
    data object Support : Routes("support")
    data object NetBox : Routes("netbox")
    data object Profile : Routes("profile")
    data object Policies : Routes("policies")
}
