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
        val httpResponse = authApi.verifyOtp(
            otp = otp,
            username = mobile,
            guid = tmpToken
        )
        val body = httpResponse.body()
        if (body == null || body.status != 0) {
            error(body?.msg ?: "Invalid OTP. Please check and try again.")
        }

        // JWT token is in the response header, not the JSON body
        val jwtToken = httpResponse.headers()["JWT_TOKEN"]
            ?: body.token
            ?: error("Authentication failed. No token received.")

        AuthResult(
            token = jwtToken,
            userData = body.data ?: JsonObject(emptyMap())
        )
    }
}
