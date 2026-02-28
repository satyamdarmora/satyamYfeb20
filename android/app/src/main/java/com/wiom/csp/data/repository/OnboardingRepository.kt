package com.wiom.csp.data.repository

import com.wiom.csp.data.remote.BackendApiService
import com.wiom.csp.data.remote.dto.RegisterPartnerRequest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.HttpException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OnboardingRepository @Inject constructor(
    private val backendApi: BackendApiService
) {

    suspend fun registerPartner(
        request: RegisterPartnerRequest,
        token: String
    ): Result<Unit> = try {
        val response = backendApi.registerPartner(
            authorization = "Bearer $token",
            request = request
        )
        if (response.status != 0) {
            Result.failure(Exception(response.msg ?: "Registration failed. Please try again."))
        } else {
            Result.success(Unit)
        }
    } catch (e: HttpException) {
        // 409 Conflict = already registered, treat as success
        if (e.code() == 409) {
            Result.success(Unit)
        } else {
            val errorBody = e.response()?.errorBody()?.string()
            val message = parseErrorMessage(errorBody) ?: "HTTP ${e.code()}: ${e.message()}"
            Result.failure(Exception(message))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }

    private fun parseErrorMessage(errorBody: String?): String? {
        if (errorBody.isNullOrBlank()) return null
        return try {
            val jsonParser = Json { ignoreUnknownKeys = true }
            val obj = jsonParser.parseToJsonElement(errorBody).jsonObject
            obj["msg"]?.let { return it.jsonPrimitive.content }
            obj["message"]?.let { msgEl ->
                return when (msgEl) {
                    is JsonArray -> msgEl.joinToString("; ") { it.jsonPrimitive.content }
                    else -> msgEl.jsonPrimitive.content
                }
            }
            errorBody
        } catch (_: Exception) {
            errorBody.take(200)
        }
    }
}
