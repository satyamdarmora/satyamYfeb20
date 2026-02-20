package com.wiom.csp.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class WalletTransaction(
    val id: String,
    val date: String,
    val type: WalletTransactionType,
    val amount: Int,
    val description: String,
    val status: TransactionStatus
)

@Serializable
data class WalletState(
    val balance: Int = 0,
    @SerialName("pending_settlement") val pendingSettlement: Int = 0,
    val transactions: List<WalletTransaction> = emptyList(),
    val frozen: Boolean = false,
    @SerialName("frozen_reason") val frozenReason: String? = null
)
