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
    val infoExchanges: List<InfoExchangeDto> = emptyList(),
    val paymentInfo: PaymentInfoDto? = null,
    val securityDepositAmount: Int = 20000,
    val securityDepositPaid: Boolean = false,
    val deviceBatchSize: Int = 5,
    val securityDepositInfo: PaymentInfoDto? = null
)

@Serializable
data class PaymentInfoDto(
    val transactionId: String? = null,
    val status: String? = null,
    val paymentLink: String? = null
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

@Serializable
data class InitiatePaymentRequest(
    val registrationId: Int
)

@Serializable
data class InitiatePaymentResponse(
    val status: Int = 0,
    val msg: String? = null,
    val data: PaymentInitData? = null
)

@Serializable
data class PaymentInitData(
    val transactionId: String? = null,
    val orderId: String? = null,
    val amount: Int? = null,
    val paymentLink: String? = null,
    val status: String? = null
)

@Serializable
data class PaymentStatusCheckResponse(
    val status: Int = 0,
    val msg: String? = null,
    val data: PaymentStatusData? = null
)

@Serializable
data class PaymentStatusData(
    val transactionId: String? = null,
    val status: String? = null,
    val amount: Int? = null,
    val paymentLink: String? = null,
    val feePaid: Boolean = false,
    val securityDepositPaid: Boolean = false
)
