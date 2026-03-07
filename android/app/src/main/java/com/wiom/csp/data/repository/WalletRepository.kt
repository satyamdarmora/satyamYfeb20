package com.wiom.csp.data.repository

import com.wiom.csp.data.db.CacheDao
import com.wiom.csp.data.db.CacheEntity
import com.wiom.csp.data.remote.ApiService
import com.wiom.csp.data.remote.dto.WalletUpdateRequest
import com.wiom.csp.domain.model.WalletState
import com.wiom.csp.domain.model.WalletTransaction
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

private val cacheJson = Json { ignoreUnknownKeys = true; coerceInputValues = true; isLenient = true }

@Singleton
class WalletRepository @Inject constructor(
    private val api: ApiService,
    private val cacheDao: CacheDao
) {
    suspend fun getWallet(): Result<WalletState> {
        val apiResult = runCatching { api.getWallet() }
        if (apiResult.isSuccess) {
            val state = apiResult.getOrThrow()
            runCatching { cacheDao.put(CacheEntity("wallet", cacheJson.encodeToString(state))) }
            return Result.success(state)
        }
        val cached = runCatching {
            cacheDao.get("wallet")?.let { cacheJson.decodeFromString<WalletState>(it.json) }
        }.getOrNull()
        if (cached != null) return Result.success(cached)
        return apiResult
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
