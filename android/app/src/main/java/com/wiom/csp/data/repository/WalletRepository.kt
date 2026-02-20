package com.wiom.csp.data.repository

import com.wiom.csp.data.remote.ApiService
import com.wiom.csp.data.remote.dto.WalletUpdateRequest
import com.wiom.csp.domain.model.WalletState
import com.wiom.csp.domain.model.WalletTransaction
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WalletRepository @Inject constructor(
    private val api: ApiService
) {
    suspend fun getWallet(): Result<WalletState> = runCatching {
        api.getWallet()
    }

    suspend fun updateWallet(
        balance: Int? = null,
        frozen: Boolean? = null,
        frozenReason: String? = null,
        newTransaction: WalletTransaction? = null
    ): Result<WalletState?> = runCatching {
        api.updateWallet(
            WalletUpdateRequest(
                balance = balance,
                frozen = frozen,
                frozenReason = frozenReason,
                newTransaction = newTransaction
            )
        ).state
    }
}
