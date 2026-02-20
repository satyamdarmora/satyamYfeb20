package com.wiom.csp.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TimelineEvent(
    val timestamp: String,
    @SerialName("event_type") val eventType: String,
    val actor: String,
    @SerialName("actor_type") val actorType: ActorType,
    val detail: String,
    val proof: String? = null
)

@Serializable
data class Task(
    @SerialName("task_id") val taskId: String,
    @SerialName("task_type") val taskType: TaskType,
    val state: String,
    val priority: TaskPriority,
    @SerialName("created_by") val createdBy: CreatedBy,
    @SerialName("created_at") val createdAt: String,
    @SerialName("due_at") val dueAt: String? = null,
    @SerialName("sla_deadline_at") val slaDeadlineAt: String? = null,
    @SerialName("offer_expires_at") val offerExpiresAt: String? = null,
    @SerialName("accept_expires_at") val acceptExpiresAt: String? = null,
    @SerialName("return_due_at") val returnDueAt: String? = null,
    @SerialName("pickup_due_at") val pickupDueAt: String? = null,
    @SerialName("blocked_due_at") val blockedDueAt: String? = null,
    @SerialName("delegation_state") val delegationState: DelegationState,
    @SerialName("delegation_accept_deadline_at") val delegationAcceptDeadlineAt: String? = null,
    @SerialName("assigned_to") val assignedTo: String? = null,
    @SerialName("owner_entity") val ownerEntity: String,
    @SerialName("queue_escalation_flag") val queueEscalationFlag: EscalationFlag? = null,
    @SerialName("retry_count") val retryCount: Int = 0,
    @SerialName("chain_id") val chainId: String? = null,
    @SerialName("connection_id") val connectionId: String? = null,
    @SerialName("netbox_id") val netboxId: String? = null,
    @SerialName("customer_area") val customerArea: String? = null,
    @SerialName("blocked_reason") val blockedReason: String? = null,
    @SerialName("proof_bundle") val proofBundle: Map<String, String> = emptyMap(),
    @SerialName("event_log") val eventLog: List<TimelineEvent> = emptyList()
) {
    companion object {
        val TERMINAL_STATES = setOf(
            "ACTIVATION_VERIFIED", "VERIFIED", "RETURN_CONFIRMED",
            "LOST_DECLARED", "FAILED", "RESOLVED", "UNRESOLVED"
        )
    }

    val isTerminal: Boolean get() = state in TERMINAL_STATES
}
