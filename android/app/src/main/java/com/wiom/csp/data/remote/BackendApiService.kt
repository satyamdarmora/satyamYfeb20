package com.wiom.csp.data.remote

import com.wiom.csp.data.remote.dto.InitiatePaymentRequest
import com.wiom.csp.data.remote.dto.InitiatePaymentResponse
import com.wiom.csp.data.remote.dto.PartnerStatusResponse
import com.wiom.csp.data.remote.dto.PaymentStatusCheckResponse
import com.wiom.csp.data.remote.dto.RegisterPartnerRequest
import com.wiom.csp.data.remote.dto.RegisterPartnerResponse
import com.wiom.csp.data.remote.dto.RespondResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path

interface BackendApiService {

    @POST("v1/partner/register")
    suspend fun registerPartner(
        @Header("Authorization") authorization: String,
        @Body request: RegisterPartnerRequest
    ): RegisterPartnerResponse

    @GET("v1/partner/status")
    suspend fun getPartnerStatus(
        @Header("Authorization") authorization: String
    ): PartnerStatusResponse

    @Multipart
    @POST("v1/partner/respond")
    suspend fun respondToInfoRequest(
        @Header("Authorization") authorization: String,
        @Part("response") response: RequestBody?,
        @Part("documentTypes") documentTypes: RequestBody,
        @Part documents: List<MultipartBody.Part>
    ): RespondResponse

    @POST("v1/payment/initiate")
    suspend fun initiatePayment(
        @Header("Authorization") authorization: String,
        @Body request: InitiatePaymentRequest
    ): InitiatePaymentResponse

    @GET("v1/payment/status/{transactionId}")
    suspend fun checkPaymentStatus(
        @Header("Authorization") authorization: String,
        @Path("transactionId") transactionId: String
    ): PaymentStatusCheckResponse

    @POST("v1/payment/security-deposit/initiate")
    suspend fun initiateSecurityDeposit(
        @Header("Authorization") authorization: String,
        @Body request: Map<String, String>
    ): InitiatePaymentResponse

    @GET("v1/payment/security-deposit/status/{transactionId}")
    suspend fun checkSecurityDepositStatus(
        @Header("Authorization") authorization: String,
        @Path("transactionId") transactionId: String
    ): PaymentStatusCheckResponse
}
