package com.wiom.csp.data.remote

import com.wiom.csp.data.remote.dto.PartnerStatusResponse
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
}
