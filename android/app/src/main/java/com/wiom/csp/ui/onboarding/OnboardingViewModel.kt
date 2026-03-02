package com.wiom.csp.ui.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wiom.csp.data.preferences.UserPreferences
import com.wiom.csp.data.remote.dto.RegisterPartnerRequest
import com.wiom.csp.data.repository.OnboardingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class OnboardingState {
    data object Idle : OnboardingState()
    data object Submitting : OnboardingState()
    data object Success : OnboardingState()
    data class Error(val message: String) : OnboardingState()
}

data class OnboardingForm(
    val businessName: String = "",
    val entityType: String = "INDIVIDUAL",
    val state: String = "",
    val city: String = "",
    val area: String = "",
    val pincode: String = "",
    val latitude: Double? = null,
    val longitude: Double? = null,
    val address: String = "",
    val aadhaarNumber: String = "",
    val panNumber: String = "",
    val bankAccountName: String = "",
    val bankAccountNumber: String = "",
    val bankIfsc: String = "",
    val bankName: String = "",
    val termsAccepted: Boolean = false
)

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val onboardingRepository: OnboardingRepository,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _state = MutableStateFlow<OnboardingState>(OnboardingState.Idle)
    val state: StateFlow<OnboardingState> = _state.asStateFlow()

    private val _form = MutableStateFlow(OnboardingForm())
    val form: StateFlow<OnboardingForm> = _form.asStateFlow()

    fun updateForm(update: OnboardingForm.() -> OnboardingForm) {
        _form.value = _form.value.update()
    }

    fun clearError() {
        if (_state.value is OnboardingState.Error) {
            _state.value = OnboardingState.Idle
        }
    }

    fun fillTestData() {
        _form.value = OnboardingForm(
            businessName = "Sharma Telecom Services",
            entityType = "FIRM",
            state = "Maharashtra",
            city = "Mumbai",
            area = "Andheri West",
            pincode = "400058",
            latitude = 19.1364,
            longitude = 72.8296,
            address = "Shop 12, Andheri West, Mumbai 400058",
            aadhaarNumber = "234567890123",
            panNumber = "ABCDE1234F",
            bankAccountName = "Rajesh Sharma",
            bankAccountNumber = "1234567890123",
            bankIfsc = "SBIN0001234",
            bankName = "State Bank of India",
            termsAccepted = true
        )
        _state.value = OnboardingState.Idle
    }

    fun submitRegistration() {
        val f = _form.value

        // Validate
        val validationError = validateForm(f)
        if (validationError != null) {
            _state.value = OnboardingState.Error(validationError)
            return
        }

        _state.value = OnboardingState.Submitting
        viewModelScope.launch {
            val token = userPreferences.jwtToken.first()
            if (token == null) {
                _state.value = OnboardingState.Error("Session expired. Please login again.")
                return@launch
            }

            val request = RegisterPartnerRequest(
                businessName = f.businessName.trim(),
                entityType = f.entityType,
                state = f.state.trim(),
                city = f.city.trim(),
                area = f.area.trim(),
                pincode = f.pincode.trim(),
                latitude = f.latitude,
                longitude = f.longitude,
                address = f.address.trim().takeIf { it.isNotBlank() },
                aadhaarNumber = f.aadhaarNumber.trim(),
                panNumber = f.panNumber.trim().uppercase(),
                bankAccountName = f.bankAccountName.trim(),
                bankAccountNumber = f.bankAccountNumber.trim(),
                bankIfsc = f.bankIfsc.trim().uppercase(),
                bankName = f.bankName.trim(),
                termsAccepted = true
            )

            onboardingRepository.registerPartner(request, token)
                .onSuccess {
                    userPreferences.setProfileComplete(true)
                    _state.value = OnboardingState.Success
                }
                .onFailure { e ->
                    _state.value = OnboardingState.Error(
                        e.message ?: "Registration failed. Please try again."
                    )
                }
        }
    }

    private fun validateForm(f: OnboardingForm): String? {
        if (f.businessName.isBlank()) return "Business name is required."
        if (f.state.isBlank()) return "State is required."
        if (f.city.isBlank()) return "City is required."
        if (f.area.isBlank()) return "Area is required."
        if (!isValidPincode(f.pincode)) return "Please enter a valid 6-digit pincode."
        if (f.latitude == null || f.longitude == null) return "Please capture your service location using GPS."
        if (!isValidAadhaar(f.aadhaarNumber)) return "Please enter a valid 12-digit Aadhaar number."
        if (!isValidPan(f.panNumber)) return "Please enter a valid PAN number (e.g. ABCDE1234F)."
        if (f.bankAccountName.isBlank()) return "Account holder name is required."
        if (!isValidAccountNumber(f.bankAccountNumber)) return "Please enter a valid account number (9-18 digits)."
        if (!isValidIfsc(f.bankIfsc)) return "Please enter a valid 11-character IFSC code."
        if (f.bankName.isBlank()) return "Bank name is required."
        if (!f.termsAccepted) return "Please accept the terms of partnership."
        return null
    }

    companion object {
        fun isValidAadhaar(value: String): Boolean = value.trim().matches(Regex("^\\d{12}$"))
        fun isValidPan(value: String): Boolean = value.trim().uppercase().matches(Regex("^[A-Z]{5}\\d{4}[A-Z]$"))
        fun isValidIfsc(value: String): Boolean = value.trim().uppercase().matches(Regex("^[A-Z]{4}0[A-Z0-9]{6}$"))
        fun isValidPincode(value: String): Boolean = value.trim().matches(Regex("^\\d{6}$"))
        fun isValidAccountNumber(value: String): Boolean = value.trim().matches(Regex("^\\d{9,18}$"))
    }
}
