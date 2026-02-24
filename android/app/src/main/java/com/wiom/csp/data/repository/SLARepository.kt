package com.wiom.csp.data.repository

import com.wiom.csp.data.remote.ApiService
import com.wiom.csp.data.remote.dto.DepositActionRequest
import com.wiom.csp.domain.model.SLAOverallState
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SLARepository @Inject constructor(
    private val api: ApiService
) {
    suspend fun getSLA(): Result<SLAOverallState> = runCatching {
        api.getSLA()
    }

    suspend fun collectDeposit(amount: Int, description: String): Result<Unit> = runCatching {
        api.postDeposit(
            DepositActionRequest(
                action = "collect_deposit",
                amount = amount,
                description = description
            )
        )
    }
}
