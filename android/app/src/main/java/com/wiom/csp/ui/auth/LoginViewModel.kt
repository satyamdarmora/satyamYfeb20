package com.wiom.csp.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wiom.csp.data.preferences.UserPreferences
import com.wiom.csp.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import javax.inject.Inject

sealed class LoginState {
    data object Idle : LoginState()
    data object SendingOtp : LoginState()
    data class OtpSent(val tmpToken: String) : LoginState()
    data object Verifying : LoginState()
    data object Success : LoginState()
    data class Error(val message: String, val step: String) : LoginState()
}

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _state = MutableStateFlow<LoginState>(LoginState.Idle)
    val state: StateFlow<LoginState> = _state.asStateFlow()

    private var mobile: String = ""
    private var tmpToken: String = ""

    fun sendOtp(mobileNumber: String) {
        mobile = mobileNumber
        _state.value = LoginState.SendingOtp
        viewModelScope.launch {
            authRepository.sendOtp(mobile)
                .onSuccess { token ->
                    tmpToken = token
                    _state.value = LoginState.OtpSent(token)
                }
                .onFailure { e ->
                    _state.value = LoginState.Error(
                        message = e.message ?: "Failed to send OTP",
                        step = "mobile"
                    )
                }
        }
    }

    fun verifyOtp(otp: String) {
        _state.value = LoginState.Verifying
        viewModelScope.launch {
            authRepository.verifyOtp(otp, mobile, tmpToken)
                .onSuccess { result ->
                    // Extract name from nested user object: data.user.name
                    val userObj = try { result.userData["user"]?.jsonObject } catch (_: Exception) { null }
                    val name = userObj?.get("name")?.jsonPrimitive?.content
                        ?: result.userData["name"]?.jsonPrimitive?.content
                        ?: "CSP Partner"
                    val profileComplete = try {
                        result.userData["isProfileComplete"]?.jsonPrimitive?.boolean ?: false
                    } catch (_: Exception) { false }
                    userPreferences.setAuth(
                        token = result.token,
                        name = name,
                        mobile = mobile
                    )
                    userPreferences.setProfileComplete(profileComplete)
                    _state.value = LoginState.Success
                }
                .onFailure { e ->
                    _state.value = LoginState.Error(
                        message = e.message ?: "OTP verification failed",
                        step = "otp"
                    )
                }
        }
    }

    fun resendOtp() {
        sendOtp(mobile)
    }

    fun goBackToMobile() {
        _state.value = LoginState.Idle
        tmpToken = ""
    }

    fun clearError() {
        val currentState = _state.value
        if (currentState is LoginState.Error) {
            _state.value = when (currentState.step) {
                "otp" -> LoginState.OtpSent(tmpToken)
                else -> LoginState.Idle
            }
        }
    }
}
