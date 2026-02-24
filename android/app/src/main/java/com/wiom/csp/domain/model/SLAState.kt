package com.wiom.csp.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SLASubMetric(
    val id: String,
    val name: String,
    val value: Double,
    val unit: String, // "%", "ratio", "rating"
    val threshold: Double,
    @SerialName("severe_threshold") val severeThreshold: Double,
    @SerialName("threshold_direction") val thresholdDirection: String, // "above" or "below"
    val trend: SLATrend,
    @SerialName("window_days") val windowDays: Int,
    @SerialName("sample_count") val sampleCount: Int,
    @SerialName("min_sample") val minSample: Int
)

@Serializable
data class SLADomain(
    val id: SLADomainId,
    val name: String,
    val purpose: String,
    val state: SlaStanding,
    @SerialName("control_level") val controlLevel: String,
    @SerialName("consequence_type") val consequenceType: String,
    @SerialName("sub_metrics") val subMetrics: List<SLASubMetric>
)

@Serializable
data class SLAConsequence(
    val routing: String, // "Full", "Graduated taper", "Significant taper"
    @SerialName("bonus_eligibility") val bonusEligibility: String, // "Eligible", "Bonus pause", "Bonus removal"
    val enablement: String // "None", "Available", "Mandatory"
)

@Serializable
data class SLAStateTransition(
    val from: SlaStanding,
    val to: SlaStanding,
    val date: String,
    val reason: String
)

@Serializable
data class SLAHysteresis(
    @SerialName("upgrade_requirement") val upgradeRequirement: String,
    @SerialName("current_clean_windows") val currentCleanWindows: Int,
    @SerialName("required_clean_windows") val requiredCleanWindows: Int
)

@Serializable
data class SLAOverallState(
    @SerialName("overall_standing") val overallStanding: SlaStanding,
    val domains: List<SLADomain>,
    val consequence: SLAConsequence,
    @SerialName("state_since") val stateSince: String,
    @SerialName("windows_in_current_state") val windowsInCurrentState: Int,
    @SerialName("evaluation_window_days") val evaluationWindowDays: Int,
    @SerialName("next_evaluation") val nextEvaluation: String,
    @SerialName("state_history") val stateHistory: List<SLAStateTransition>,
    val hysteresis: SLAHysteresis
)
