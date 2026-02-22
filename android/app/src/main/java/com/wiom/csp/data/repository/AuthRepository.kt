package com.wiom.csp.data.repository

import com.wiom.csp.data.remote.AuthApiService
import com.wiom.csp.data.remote.dto.SendOtpRequest
import kotlinx.serialization.json.JsonObject
import javax.inject.Inject
import javax.inject.Singleton

data class AuthResult(
    val token: String,
    val userData: JsonObject
)

@Singleton
class AuthRepository @Inject constructor(
    private val authApi: AuthApiService
) {

    suspend fun sendOtp(mobile: String): Result<String> = runCatching {
        val response = authApi.sendOtp(SendOtpRequest(username = mobile))
        if (response.status != 0 || response.data == null) {
            error(response.msg ?: "Failed to send OTP. Please check the mobile number.")
        }
        response.data
    }

    suspend fun verifyOtp(otp: String, mobile: String, tmpToken: String): Result<AuthResult> = runCatching {
        val response = authApi.verifyOtp(
            otp = otp,
            username = mobile,
            guid = tmpToken
        )
        if (response.status != 0 || response.token == null) {
            error(response.msg ?: "Invalid OTP. Please check and try again.")
        }
        AuthResult(
            token = response.token,
            userData = response.data ?: JsonObject(emptyMap())
        )
    }
}
