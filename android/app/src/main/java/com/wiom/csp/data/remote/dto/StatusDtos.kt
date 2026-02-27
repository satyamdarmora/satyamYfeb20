package com.wiom.csp.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class PartnerStatusResponse(
    val status: Int,
    val msg: String? = null,
    val data: StatusData? = null
)

@Serializable
data class StatusData(
    val status: String? = null,
    val partnerStatus: String? = null,
    val feePaid: Boolean = false,
    val feeRefunded: Boolean = false,
    val adminNotes: String? = null,
    val partnerResponse: String? = null,
    val reviewReason: String? = null,
    val rejectionReason: String? = null,
    val registrationId: Int? = null,
    val registrationFee: Double? = null,
    val isRegistered: Boolean = false,
    val infoExchanges: List<InfoExchangeDto> = emptyList()
)

@Serializable
data class InfoExchangeDto(
    val id: Int,
    val sender: String,
    val message: String? = null,
    val requestedDocs: List<String> = emptyList(),
    val createdAt: String? = null,
    val documents: List<InfoDocumentDto> = emptyList()
)

@Serializable
data class InfoDocumentDto(
    val id: Int,
    val documentType: String? = null,
    val originalName: String? = null,
    val storedName: String? = null,
    val mimeType: String? = null,
    val sizeBytes: Long? = null
)

@Serializable
data class RespondResponse(
    val status: Int,
    val msg: String? = null
)
