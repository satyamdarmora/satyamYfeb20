package com.wiom.csp.data.repository

import com.wiom.csp.data.remote.ApiService
import com.wiom.csp.data.remote.dto.TaskUpdateRequest
import com.wiom.csp.domain.model.Task
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TaskRepository @Inject constructor(
    private val api: ApiService
) {
    suspend fun getTasks(): Result<List<Task>> = runCatching {
        api.getTasks()
    }

    suspend fun updateTask(taskId: String, updates: Map<String, JsonElement>): Result<Task?> = runCatching {
        api.updateTask(TaskUpdateRequest(taskId, updates)).task
    }

    /** Convenience: update task with simple string fields */
    suspend fun updateTaskFields(taskId: String, fields: Map<String, String?>): Result<Task?> {
        val jsonMap = fields.mapValues { (_, v) ->
            if (v == null) JsonPrimitive(null as String?) else JsonPrimitive(v)
        }
        return updateTask(taskId, jsonMap)
    }
}
