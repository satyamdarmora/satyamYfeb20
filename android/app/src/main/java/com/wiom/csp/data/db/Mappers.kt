package com.wiom.csp.data.db

import com.wiom.csp.domain.model.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val json = Json {
    ignoreUnknownKeys = true
    coerceInputValues = true
    isLenient = true
}

fun Task.toEntity(): TaskEntity = TaskEntity(
    taskId = taskId,
    taskType = taskType.name,
    state = state,
    priority = priority.name,
    createdBy = createdBy.name,
    createdAt = createdAt,
    dueAt = dueAt,
    slaDeadlineAt = slaDeadlineAt,
    offerExpiresAt = offerExpiresAt,
    acceptExpiresAt = acceptExpiresAt,
    returnDueAt = returnDueAt,
    pickupDueAt = pickupDueAt,
    blockedDueAt = blockedDueAt,
    delegationState = delegationState.name,
    delegationAcceptDeadlineAt = delegationAcceptDeadlineAt,
    assignedTo = assignedTo,
    ownerEntity = ownerEntity,
    queueEscalationFlag = queueEscalationFlag?.name,
    retryCount = retryCount,
    chainId = chainId,
    connectionId = connectionId,
    netboxId = netboxId,
    customerArea = customerArea,
    blockedReason = blockedReason,
    proofBundleJson = json.encodeToString(proofBundle),
    eventLogJson = json.encodeToString(eventLog),
)

fun TaskEntity.toDomain(): Task = Task(
    taskId = taskId,
    taskType = TaskType.valueOf(taskType),
    state = state,
    priority = TaskPriority.valueOf(priority),
    createdBy = CreatedBy.valueOf(createdBy),
    createdAt = createdAt,
    dueAt = dueAt,
    slaDeadlineAt = slaDeadlineAt,
    offerExpiresAt = offerExpiresAt,
    acceptExpiresAt = acceptExpiresAt,
    returnDueAt = returnDueAt,
    pickupDueAt = pickupDueAt,
    blockedDueAt = blockedDueAt,
    delegationState = DelegationState.valueOf(delegationState),
    delegationAcceptDeadlineAt = delegationAcceptDeadlineAt,
    assignedTo = assignedTo,
    ownerEntity = ownerEntity,
    queueEscalationFlag = queueEscalationFlag?.let {
        try { EscalationFlag.valueOf(it) } catch (_: Exception) { null }
    },
    retryCount = retryCount,
    chainId = chainId,
    connectionId = connectionId,
    netboxId = netboxId,
    customerArea = customerArea,
    blockedReason = blockedReason,
    proofBundle = try { json.decodeFromString(proofBundleJson) } catch (_: Exception) { emptyMap() },
    eventLog = try { json.decodeFromString(eventLogJson) } catch (_: Exception) { emptyList() },
)
