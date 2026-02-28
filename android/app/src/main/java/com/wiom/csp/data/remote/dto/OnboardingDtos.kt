package com.wiom.csp.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class RegisterPartnerRequest(
    val businessName: String,
    val entityType: String, // INDIVIDUAL, FIRM, COMPANY
    val state: String,
    val city: String,
    val area: String,
    val pincode: String,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val address: String? = null,
    val aadhaarNumber: String,
    val panNumber: String,
    val bankAccountName: String,
    val bankAccountNumber: String,
    val bankIfsc: String,
    val bankName: String,
    val termsAccepted: Boolean = true
)

@Serializable
data class RegisterPartnerResponse(
    val status: Int,
    val msg: String? = null,
    val data: JsonObject? = null
)
