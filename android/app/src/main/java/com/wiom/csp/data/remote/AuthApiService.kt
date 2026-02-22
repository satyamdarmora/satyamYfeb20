package com.wiom.csp.data.remote

import com.wiom.csp.data.remote.dto.SendOtpRequest
import com.wiom.csp.data.remote.dto.SendOtpResponse
import com.wiom.csp.data.remote.dto.VerifyOtpResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface AuthApiService {

    @POST("v1/Authentication/SendOTP")
    suspend fun sendOtp(@Body request: SendOtpRequest): SendOtpResponse

    @GET("v1/Authentication/VerifyOTP")
    suspend fun verifyOtp(
        @Query("appName") appName: String = "WIOM_SALES",
        @Query("otp") otp: String,
        @Query("username") username: String,
        @Query("guid") guid: String,
        @Query("fcmToken") fcmToken: String = "null"
    ): VerifyOtpResponse
}
