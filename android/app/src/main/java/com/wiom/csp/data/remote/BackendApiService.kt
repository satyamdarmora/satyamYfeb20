package com.wiom.csp.data.remote

import com.wiom.csp.data.remote.dto.RegisterPartnerRequest
import com.wiom.csp.data.remote.dto.RegisterPartnerResponse
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface BackendApiService {

    @POST("v1/partner/register")
    suspend fun registerPartner(
        @Header("Authorization") authorization: String,
        @Body request: RegisterPartnerRequest
    ): RegisterPartnerResponse
}
