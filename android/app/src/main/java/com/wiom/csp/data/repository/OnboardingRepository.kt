package com.wiom.csp.data.repository

import com.wiom.csp.data.remote.BackendApiService
import com.wiom.csp.data.remote.dto.RegisterPartnerRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OnboardingRepository @Inject constructor(
    private val backendApi: BackendApiService
) {

    suspend fun registerPartner(
        request: RegisterPartnerRequest,
        token: String
    ): Result<Unit> = runCatching {
        val response = backendApi.registerPartner(
            authorization = "Bearer $token",
            request = request
        )
        if (response.status != 0) {
            error(response.msg ?: "Registration failed. Please try again.")
        }
    }
}
