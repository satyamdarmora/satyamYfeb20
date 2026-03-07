package com.wiom.csp.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val taskId: String,
    val taskType: String,
    val state: String,
    val priority: String,
    val createdBy: String,
    val createdAt: String,
    val dueAt: String? = null,
    val slaDeadlineAt: String? = null,
    val offerExpiresAt: String? = null,
    val acceptExpiresAt: String? = null,
    val returnDueAt: String? = null,
    val pickupDueAt: String? = null,
    val blockedDueAt: String? = null,
    val delegationState: String,
    val delegationAcceptDeadlineAt: String? = null,
    val assignedTo: String? = null,
    val ownerEntity: String,
    val queueEscalationFlag: String? = null,
    val retryCount: Int = 0,
    val chainId: String? = null,
    val connectionId: String? = null,
    val netboxId: String? = null,
    val customerArea: String? = null,
    val blockedReason: String? = null,
    val proofBundleJson: String = "{}",
    val eventLogJson: String = "[]",
)
