package com.wiom.csp.data.repository

import com.wiom.csp.data.remote.ApiService
import com.wiom.csp.data.remote.dto.AssuranceUpdateRequest
import com.wiom.csp.domain.model.AssuranceState
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AssuranceRepository @Inject constructor(
    private val api: ApiService
) {
    suspend fun getAssurance(): Result<AssuranceState> = runCatching {
        api.getAssurance()
    }

    suspend fun updateAssurance(request: AssuranceUpdateRequest): Result<AssuranceState?> = runCatching {
        api.updateAssurance(request).state
    }
}
