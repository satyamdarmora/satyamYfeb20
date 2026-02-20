package com.wiom.csp.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class BaseEvent(
    val date: String,
    val change: Int,
    @SerialName("connection_id") val connectionId: String,
    val reason: String
)

@Serializable
data class EarningsEvent(
    val date: String,
    val amount: Int,
    val type: String,
    val reference: String
)

@Serializable
data class AssuranceState(
    @SerialName("active_base") val activeBase: Int = 0,
    @SerialName("cycle_earned") val cycleEarned: Int = 0,
    @SerialName("next_settlement_amount") val nextSettlementAmount: Int = 0,
    @SerialName("next_settlement_date") val nextSettlementDate: String = "",
    @SerialName("sla_standing") val slaStanding: SlaStanding = SlaStanding.COMPLIANT,
    @SerialName("exposure_state") val exposureState: ExposureState = ExposureState.ELIGIBLE,
    @SerialName("exposure_reason") val exposureReason: String = "",
    @SerialName("exposure_since") val exposureSince: String = "",
    @SerialName("active_base_events") val activeBaseEvents: List<BaseEvent> = emptyList(),
    @SerialName("earnings_events") val earningsEvents: List<EarningsEvent> = emptyList(),
    @SerialName("active_restores") val activeRestores: Int = 0,
    @SerialName("unresolved_count") val unresolvedCount: Int = 0,
    @SerialName("capability_reset_active") val capabilityResetActive: Boolean = false,
    @SerialName("capability_reset_reason") val capabilityResetReason: String? = null
)
