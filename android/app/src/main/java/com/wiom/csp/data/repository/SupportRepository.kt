package com.wiom.csp.data.repository

import com.wiom.csp.data.remote.ApiService
import com.wiom.csp.data.remote.dto.SupportCaseCreateRequest
import com.wiom.csp.domain.model.SupportCase
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SupportRepository @Inject constructor(
    private val api: ApiService
) {
    suspend fun getCases(): Result<List<SupportCase>> = runCatching {
        api.getSupportCases()
    }

    suspend fun createCase(request: SupportCaseCreateRequest): Result<Unit> = runCatching {
        api.createSupportCase(request)
    }
}
