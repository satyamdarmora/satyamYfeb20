package com.wiom.csp.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class NetBoxUnit(
    @SerialName("netbox_id") val netboxId: String,
    @SerialName("connection_id") val connectionId: String? = null,
    @SerialName("customer_area") val customerArea: String? = null,
    val status: NetBoxUnitStatus,
    @SerialName("issued_at") val issuedAt: String,
    @SerialName("subscription_expiry_at") val subscriptionExpiryAt: String? = null,
    @SerialName("collected_at") val collectedAt: String? = null,
    @SerialName("returned_at") val returnedAt: String? = null,
    @SerialName("lost_declared_at") val lostDeclaredAt: String? = null,
    @SerialName("carry_fee_eligible") val carryFeeEligible: Boolean = false,
    @SerialName("carry_fee_start_at") val carryFeeStartAt: String? = null,
    @SerialName("carry_fee_accrued") val carryFeeAccrued: Int = 0,
    @SerialName("days_past_expiry") val daysPastExpiry: Int = 0,
)

@Serializable
data class DepositTransaction(
    val id: String,
    val type: DepositTransactionType,
    val amount: Int,
    val date: String,
    val description: String,
    @SerialName("netbox_id") val netboxId: String? = null,
)

@Serializable
data class DepositLedger(
    @SerialName("deposit_balance") val depositBalance: Int = 0,
    @SerialName("total_active") val totalActive: Int = 0,
    @SerialName("total_issued") val totalIssued: Int = 0,
    @SerialName("total_returned") val totalReturned: Int = 0,
    @SerialName("total_lost") val totalLost: Int = 0,
    @SerialName("security_deposit_per_unit") val securityDepositPerUnit: Int = 0,
    @SerialName("total_loss_deductions") val totalLossDeductions: Int = 0,
    @SerialName("exit_refund_estimate") val exitRefundEstimate: Int = 0,
    val transactions: List<DepositTransaction> = emptyList(),
    val units: List<NetBoxUnit> = emptyList(),
)

@Serializable
data class DepositRateCard(
    @SerialName("carry_fee_per_day") val carryFeePerDay: Int = 0,
    @SerialName("carry_fee_grace_days") val carryFeeGraceDays: Int = 0,
    @SerialName("security_deposit_per_netbox") val securityDepositPerNetbox: Int = 0,
    @SerialName("replacement_cost") val replacementCost: Int = 0,
)

@Serializable
data class DepositResponse(
    val ledger: DepositLedger = DepositLedger(),
    val units: List<NetBoxUnit> = emptyList(),
    @SerialName("rate_card") val rateCard: DepositRateCard? = null,
)
