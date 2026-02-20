package com.wiom.csp.domain.usecase

import com.wiom.csp.domain.model.Task
import java.time.Instant
import javax.inject.Inject

/**
 * Sorts tasks in queue display order:
 *   1. By bucket (ascending -- 0 is most urgent)
 *   2. By nearest urgency deadline (ascending -- soonest first)
 *   3. By created_at (ascending -- oldest first)
 */
class SortTasksUseCase @Inject constructor(
    private val getBucket: GetBucketUseCase
) {
    operator fun invoke(tasks: List<Task>): List<Task> {
        return tasks.sortedWith(
            compareBy<Task> { getBucket(it) }
                .thenBy { getUrgencyDeadline(it) }
                .thenBy { parseTimestamp(it.createdAt) }
        )
    }

    /**
     * Returns the most relevant urgency deadline for a task depending on its type
     * and state. Used as a secondary sort key within each bucket.
     */
    private fun getUrgencyDeadline(task: Task): Long {
        val candidates = listOfNotNull(
            task.slaDeadlineAt,
            task.offerExpiresAt,
            task.acceptExpiresAt,
            task.returnDueAt,
            task.pickupDueAt,
            task.dueAt
        )

        if (candidates.isEmpty()) return Long.MAX_VALUE

        return candidates.minOf { parseTimestamp(it) }
    }

    private fun parseTimestamp(iso: String): Long {
        return try {
            Instant.parse(iso).toEpochMilli()
        } catch (_: Exception) {
            Long.MAX_VALUE
        }
    }
}
