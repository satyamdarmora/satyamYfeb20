package com.wiom.csp.domain.usecase

import com.wiom.csp.domain.model.EscalationFlag
import com.wiom.csp.domain.model.QueueBucket
import com.wiom.csp.domain.model.Task
import com.wiom.csp.domain.model.TaskPriority
import com.wiom.csp.domain.model.TaskType
import javax.inject.Inject

/**
 * Determines the queue bucket for a task.
 *
 * Bucket 0 -- HIGH-priority RESTORE in ALERTED (active connectivity loss)
 * Bucket 1 -- Retry chains / escalations (retry_count > 0 OR chain escalation flag)
 * Bucket 2 -- Active installs (CLAIMED/ACCEPTED/SCHEDULED/INSTALLED) with
 *             expiring TTLs or VERIFICATION_PENDING
 * Bucket 3 -- Netbox returns that are COLLECTED (return pending to Wiom)
 * Bucket 4 -- Netbox pickups still PICKUP_REQUIRED
 * Bucket 5 -- OFFERED installs with expiring offer TTL
 * Bucket 6 -- Everything else (normal in-progress work)
 */
class GetBucketUseCase @Inject constructor() {

    operator fun invoke(task: Task): QueueBucket {
        // Bucket 0 -- HIGH RESTORE that is still ALERTED
        if (task.taskType == TaskType.RESTORE &&
            task.priority == TaskPriority.HIGH &&
            task.state == "ALERTED"
        ) {
            return 0
        }

        // Bucket 1 -- Retry chains / chain escalation
        if (task.retryCount > 0 ||
            task.queueEscalationFlag == EscalationFlag.CHAIN_ESCALATION_PENDING ||
            task.queueEscalationFlag == EscalationFlag.RESTORE_RETRY
        ) {
            return 1
        }

        // Bucket 2 -- Active installs with urgency signals
        if (task.taskType == TaskType.INSTALL) {
            val activeInstallStates = setOf("CLAIMED", "ACCEPTED", "SCHEDULED", "INSTALLED")
            if (task.state in activeInstallStates) {
                if (task.queueEscalationFlag == EscalationFlag.CLAIM_TTL_EXPIRING ||
                    task.queueEscalationFlag == EscalationFlag.VERIFICATION_PENDING ||
                    (task.state == "SCHEDULED" && task.dueAt != null)
                ) {
                    return 2
                }
            }
        }

        // Bucket 3 -- Netbox collected, return pending
        if (task.taskType == TaskType.NETBOX && task.state == "COLLECTED") {
            return 3
        }

        // Bucket 4 -- Netbox pickup required
        if (task.taskType == TaskType.NETBOX && task.state == "PICKUP_REQUIRED") {
            return 4
        }

        // Bucket 5 -- Offered installs with TTL expiring
        if (task.taskType == TaskType.INSTALL &&
            task.state == "OFFERED" &&
            task.queueEscalationFlag == EscalationFlag.OFFER_TTL_EXPIRING
        ) {
            return 5
        }

        // Bucket 6 -- everything else
        return 6
    }
}
