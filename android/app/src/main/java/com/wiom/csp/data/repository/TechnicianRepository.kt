package com.wiom.csp.data.repository

import com.wiom.csp.data.remote.ApiService
import com.wiom.csp.data.remote.dto.TechTasksResponse
import com.wiom.csp.domain.model.Technician
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TechnicianRepository @Inject constructor(
    private val api: ApiService
) {
    suspend fun getTechnicians(): Result<List<Technician>> = runCatching {
        api.getTechnicians()
    }

    suspend fun getTechnicianTasks(techId: String): Result<TechTasksResponse> = runCatching {
        api.getTechnicianTasks(techId)
    }

    suspend fun technicianAction(techId: String, taskId: String, action: String): Result<Unit> = runCatching {
        api.technicianAction(mapOf(
            "tech_id" to techId,
            "task_id" to taskId,
            "action" to action
        ))
    }
}
