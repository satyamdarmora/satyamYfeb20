package com.wiom.csp.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Technician(
    val id: String,
    val name: String,
    val band: TechnicianBand,
    val available: Boolean,
    @SerialName("csp_id") val cspId: String,
    val phone: String,
    @SerialName("join_date") val joinDate: String,
    @SerialName("completed_count") val completedCount: Int
)
