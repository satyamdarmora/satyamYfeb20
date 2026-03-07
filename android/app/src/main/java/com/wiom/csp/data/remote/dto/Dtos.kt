package com.wiom.csp.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// ---- Task update request/response ----

@Serializable
data class TaskUpdateRequest(
    @SerialName("task_id") val taskId: String,
    val updates: Map<String, kotlinx.serialization.json.JsonElement>
)

@Serializable
data class TaskUpdateResponse(
    val ok: Boolean = false,
    val task: com.wiom.csp.domain.model.Task? = null
)

@Serializable
data class TaskCreateRequest(
    val task: TaskCreateBody
)

@Serializable
data class TaskCreateBody(
    @SerialName("task_type") val taskType: String,
    val priority: String = "NORMAL",
    @SerialName("created_by") val createdBy: String = "MANUAL_EXCEPTION",
    @SerialName("netbox_id") val netboxId: String? = null,
    @SerialName("customer_area") val customerArea: String? = null,
    @SerialName("connection_id") val connectionId: String? = null,
)

// ---- Assurance update request ----

@Serializable
data class AssuranceUpdateRequest(
    @SerialName("increment_cycle_earned") val incrementCycleEarned: Int? = null,
    @SerialName("increment_next_settlement") val incrementNextSettlement: Int? = null,
    @SerialName("sla_standing") val slaStanding: String? = null,
    @SerialName("exposure_state") val exposureState: String? = null,
    @SerialName("capability_reset_active") val capabilityResetActive: Boolean? = null,
    @SerialName("capability_reset_reason") val capabilityResetReason: String? = null
)

@Serializable
data class AssuranceUpdateResponse(
    val ok: Boolean = false,
    val state: com.wiom.csp.domain.model.AssuranceState? = null
)

// ---- Wallet update request ----

@Serializable
data class WalletUpdateRequest(
    val balance: Int? = null,
    val frozen: Boolean? = null,
    @SerialName("frozen_reason") val frozenReason: String? = null,
    @SerialName("new_transaction") val newTransaction: com.wiom.csp.domain.model.WalletTransaction? = null
)

@Serializable
data class WalletUpdateResponse(
    val ok: Boolean = false,
    val state: com.wiom.csp.domain.model.WalletState? = null
)

// ---- Theme ----

@Serializable
data class ThemeResponse(
    val theme: String = "dark"
)

@Serializable
data class ThemeUpdateRequest(
    val theme: String
)

@Serializable
data class ThemeUpdateResponse(
    val ok: Boolean = false,
    val theme: String = "dark"
)

// ---- Notification ----

@Serializable
data class NotificationDismissRequest(
    val id: String
)

@Serializable
data class NotificationPostRequest(
    val id: String,
    val type: String,
    val title: String,
    val message: String,
    val amount: Int? = null,
    @SerialName("task_id") val taskId: String? = null,
    val timestamp: String,
    val dismissed: Boolean = false
)

@Serializable
data class NotificationPostResponse(
    val ok: Boolean = false,
    val id: String? = null
)

// ---- Support case creation ----

@Serializable
data class SupportCaseCreateRequest(
    @SerialName("case_id") val caseId: String,
    val subject: String,
    val status: String = "OPEN",
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
    val messages: List<com.wiom.csp.domain.model.SupportMessage> = emptyList()
)

// ---- Technician ----

@Serializable
data class TechnicianRegisterRequest(
    val id: String,
    val name: String,
    val band: String,
    val available: Boolean = true,
    @SerialName("csp_id") val cspId: String,
    val phone: String,
    @SerialName("join_date") val joinDate: String,
    @SerialName("completed_count") val completedCount: Int = 0
)

@Serializable
data class TechTasksResponse(
    val tech: com.wiom.csp.domain.model.Technician,
    val tasks: List<com.wiom.csp.domain.model.Task>
)

@Serializable
data class TechActionResponse(
    val ok: Boolean = false
)

// ---- Deposit ----

@Serializable
data class DepositActionRequest(
    val action: String,
    val amount: Int? = null,
    val description: String? = null,
    @SerialName("netbox_id") val netboxId: String? = null
)

@Serializable
data class DepositActionResponse(
    val ok: Boolean = false
)
