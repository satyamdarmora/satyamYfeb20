package com.wiom.csp.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SupportMessage(
    val sender: String,
    val text: String,
    val timestamp: String
)

@Serializable
data class SupportCase(
    @SerialName("case_id") val caseId: String,
    val subject: String,
    val status: SupportCaseStatus,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("linked_task_id") val linkedTaskId: String? = null,
    val messages: List<SupportMessage> = emptyList()
)
