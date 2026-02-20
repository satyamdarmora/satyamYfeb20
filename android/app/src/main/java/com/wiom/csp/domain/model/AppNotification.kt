package com.wiom.csp.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class AppNotification(
    val id: String,
    val type: NotificationType,
    val title: String,
    val message: String,
    val amount: Int? = null,
    @SerialName("task_id") val taskId: String? = null,
    val timestamp: String,
    val dismissed: Boolean = false
)
