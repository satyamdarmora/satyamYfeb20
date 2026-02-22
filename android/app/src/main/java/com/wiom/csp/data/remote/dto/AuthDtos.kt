package com.wiom.csp.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class SendOtpRequest(
    val username: String,
    val hash: String = ""
)

@Serializable
data class SendOtpResponse(
    val status: Int,
    val msg: String? = null,
    val data: String? = null // tmpToken (guid)
)

@Serializable
data class VerifyOtpResponse(
    val status: Int,
    val msg: String? = null,
    val data: JsonObject? = null,
    val token: String? = null
)
