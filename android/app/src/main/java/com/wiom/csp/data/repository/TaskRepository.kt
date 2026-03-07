package com.wiom.csp.data.repository

import com.wiom.csp.data.db.TaskDao
import com.wiom.csp.data.db.toDomain
import com.wiom.csp.data.db.toEntity
import com.wiom.csp.data.remote.ApiService
import com.wiom.csp.data.remote.dto.TaskCreateBody
import com.wiom.csp.data.remote.dto.TaskCreateRequest
import com.wiom.csp.data.remote.dto.TaskUpdateRequest
import com.wiom.csp.domain.model.Task
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TaskRepository @Inject constructor(
    private val api: ApiService,
    private val taskDao: TaskDao
) {
    suspend fun getTasks(): Result<List<Task>> {
        // Try API first, cache to Room on success
        val apiResult = runCatching { api.getTasks() }
        if (apiResult.isSuccess) {
            val tasks = apiResult.getOrThrow()
            // Cache to Room in background
            runCatching { taskDao.insertAll(tasks.map { it.toEntity() }) }
            return Result.success(tasks)
        }
        // API failed — try Room cache
        val cached = runCatching { taskDao.getAll().map { it.toDomain() } }
        if (cached.isSuccess && cached.getOrThrow().isNotEmpty()) {
            return cached
        }
        // Both failed — propagate API error
        return apiResult
    }

    suspend fun updateTask(taskId: String, updates: Map<String, JsonElement>): Result<Task?> = runCatching {
        val response = api.updateTask(TaskUpdateRequest(taskId, updates))
        // Cache updated task if returned
        response.task?.let { task ->
            runCatching { taskDao.insertAll(listOf(task.toEntity())) }
        }
        response.task
    }

    suspend fun createTask(body: TaskCreateBody): Result<Task?> = runCatching {
        val response = api.createTask(TaskCreateRequest(task = body))
        response.task?.let { task ->
            runCatching { taskDao.insertAll(listOf(task.toEntity())) }
        }
        response.task
    }

    /** Convenience: update task with simple string fields */
    suspend fun updateTaskFields(taskId: String, fields: Map<String, String?>): Result<Task?> {
        val jsonMap = fields.mapValues { (_, v) ->
            if (v == null) JsonPrimitive(null as String?) else JsonPrimitive(v)
        }
        return updateTask(taskId, jsonMap)
    }
}
