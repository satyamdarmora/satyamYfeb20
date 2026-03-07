package com.wiom.csp.data.repository

import com.wiom.csp.data.db.CacheDao
import com.wiom.csp.data.db.CacheEntity
import com.wiom.csp.data.remote.ApiService
import com.wiom.csp.data.remote.dto.AssuranceUpdateRequest
import com.wiom.csp.domain.model.AssuranceState
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

private val cacheJson = Json { ignoreUnknownKeys = true; coerceInputValues = true; isLenient = true }

@Singleton
class AssuranceRepository @Inject constructor(
    private val api: ApiService,
    private val cacheDao: CacheDao
) {
    suspend fun getAssurance(): Result<AssuranceState> {
        val apiResult = runCatching { api.getAssurance() }
        if (apiResult.isSuccess) {
            val state = apiResult.getOrThrow()
            runCatching { cacheDao.put(CacheEntity("assurance", cacheJson.encodeToString(state))) }
            return Result.success(state)
        }
        val cached = runCatching {
            cacheDao.get("assurance")?.let { cacheJson.decodeFromString<AssuranceState>(it.json) }
        }.getOrNull()
        if (cached != null) return Result.success(cached)
        return apiResult
    }

    suspend fun updateAssurance(request: AssuranceUpdateRequest): Result<AssuranceState?> = runCatching {
        api.updateAssurance(request).state
    }
}
