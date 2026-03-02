package com.wiom.csp.ui.pending

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wiom.csp.data.preferences.UserPreferences
import com.wiom.csp.data.remote.BackendApiService
import com.wiom.csp.data.remote.dto.InitiatePaymentRequest
import com.wiom.csp.data.remote.dto.StatusData
import com.wiom.csp.data.repository.PendingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class PaymentUiState { IDLE, PROCESSING, VERIFYING, SUCCESS, FAILED }

@HiltViewModel
class PendingViewModel @Inject constructor(
    private val pendingRepository: PendingRepository,
    private val backendApi: BackendApiService,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _statusData = MutableStateFlow<StatusData?>(null)
    val statusData: StateFlow<StatusData?> = _statusData.asStateFlow()

    private val _loading = MutableStateFlow(true)
    val loading: StateFlow<Boolean> = _loading.asStateFlow()

    private val _submitting = MutableStateFlow(false)
    val submitting: StateFlow<Boolean> = _submitting.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _submitSuccess = MutableStateFlow(false)
    val submitSuccess: StateFlow<Boolean> = _submitSuccess.asStateFlow()

    private val _selectedFiles = MutableStateFlow<Map<String, Uri>>(emptyMap())
    val selectedFiles: StateFlow<Map<String, Uri>> = _selectedFiles.asStateFlow()

    private val _responseText = MutableStateFlow("")
    val responseText: StateFlow<String> = _responseText.asStateFlow()

    // Payment state
    private val _paymentState = MutableStateFlow(PaymentUiState.IDLE)
    val paymentState: StateFlow<PaymentUiState> = _paymentState.asStateFlow()

    private val _paymentLink = MutableStateFlow<String?>(null)
    val paymentLink: StateFlow<String?> = _paymentLink.asStateFlow()

    private val _paymentError = MutableStateFlow<String?>(null)
    val paymentError: StateFlow<String?> = _paymentError.asStateFlow()

    // Track whether current payment is security deposit
    private val _isSecurityDeposit = MutableStateFlow(false)
    val isSecurityDeposit: StateFlow<Boolean> = _isSecurityDeposit.asStateFlow()

    private var pollingJob: Job? = null
    private var paymentPollJob: Job? = null
    private var currentTransactionId: String? = null

    // Set to true when user explicitly clicks Pay, so UI knows to auto-open browser
    private val _shouldLaunchBrowser = MutableStateFlow(false)
    val shouldLaunchBrowser: StateFlow<Boolean> = _shouldLaunchBrowser.asStateFlow()

    fun clearBrowserLaunch() {
        _shouldLaunchBrowser.value = false
    }

    init {
        startPolling()
    }

    fun startPolling() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                fetchStatus()
                delay(5000)
            }
        }
    }

    fun stopPolling() {
        pollingJob?.cancel()
        pollingJob = null
    }

    private suspend fun fetchStatus() {
        val token = userPreferences.jwtToken.first() ?: return
        pendingRepository.getStatus(token)
            .onSuccess { data ->
                _statusData.value = data
                _loading.value = false
                _error.value = null

                // If partner is ACTIVE and security deposit paid, stop polling
                // but DON'T auto-navigate — let user tap "Continue" on the "All Set" screen
                if (data.partnerStatus == "ACTIVE" && data.securityDepositPaid) {
                    stopPolling()
                }

                // Reset payment state when transitioning to security deposit phase
                // (prevents registration fee SUCCESS from showing as security deposit SUCCESS)
                if (data.partnerStatus == "ACTIVE" && !data.securityDepositPaid
                    && !_isSecurityDeposit.value
                    && _paymentState.value != PaymentUiState.IDLE
                ) {
                    _paymentState.value = PaymentUiState.IDLE
                    _paymentLink.value = null
                    _paymentError.value = null
                    currentTransactionId = null
                    paymentPollJob?.cancel()
                }

                // If there's an existing pending registration fee payment, keep link ready
                // but stay on IDLE so user sees the payment screen first
                if (!data.feePaid && data.paymentInfo?.transactionId != null
                    && data.paymentInfo.status != "SUCCESS"
                    && _paymentState.value == PaymentUiState.IDLE
                ) {
                    currentTransactionId = data.paymentInfo.transactionId
                    _paymentLink.value = data.paymentInfo.paymentLink
                    _isSecurityDeposit.value = false
                    // Poll in background to catch if previous payment completes
                    startPaymentPolling()
                }

                // If registration fee paid but security deposit pending, same approach
                if (data.feePaid && !data.securityDepositPaid
                    && data.securityDepositInfo?.transactionId != null
                    && data.securityDepositInfo.status != "SUCCESS"
                    && _paymentState.value == PaymentUiState.IDLE
                ) {
                    currentTransactionId = data.securityDepositInfo.transactionId
                    _paymentLink.value = data.securityDepositInfo.paymentLink
                    _isSecurityDeposit.value = true
                    startPaymentPolling()
                }
            }
            .onFailure { e ->
                _loading.value = false
                if (_statusData.value == null) {
                    _error.value = e.message
                }
            }
    }

    fun initiatePayment() {
        val regId = _statusData.value?.registrationId ?: return
        _paymentState.value = PaymentUiState.PROCESSING
        _paymentError.value = null

        viewModelScope.launch {
            val token = userPreferences.jwtToken.first()
            if (token == null) {
                _paymentError.value = "Session expired. Please login again."
                _paymentState.value = PaymentUiState.IDLE
                return@launch
            }

            try {
                val response = backendApi.initiatePayment(
                    authorization = "Bearer $token",
                    request = InitiatePaymentRequest(registrationId = regId)
                )
                val data = response.data
                if (data?.paymentLink != null) {
                    currentTransactionId = data.transactionId
                    _paymentLink.value = data.paymentLink
                    _paymentState.value = PaymentUiState.VERIFYING
                    _shouldLaunchBrowser.value = true
                    startPaymentPolling()
                } else {
                    _paymentError.value = response.msg ?: "No payment link received"
                    _paymentState.value = PaymentUiState.IDLE
                }
            } catch (e: Exception) {
                _paymentError.value = e.message ?: "Payment initiation failed"
                _paymentState.value = PaymentUiState.IDLE
            }
        }
    }

    fun initiateSecurityDeposit() {
        _paymentState.value = PaymentUiState.PROCESSING
        _paymentError.value = null
        _isSecurityDeposit.value = true

        viewModelScope.launch {
            val token = userPreferences.jwtToken.first()
            if (token == null) {
                _paymentError.value = "Session expired. Please login again."
                _paymentState.value = PaymentUiState.IDLE
                return@launch
            }

            try {
                val response = backendApi.initiateSecurityDeposit(
                    authorization = "Bearer $token",
                    request = emptyMap()
                )
                val data = response.data
                if (data?.paymentLink != null) {
                    currentTransactionId = data.transactionId
                    _paymentLink.value = data.paymentLink
                    _paymentState.value = PaymentUiState.VERIFYING
                    _shouldLaunchBrowser.value = true
                    startPaymentPolling()
                } else {
                    _paymentError.value = response.msg ?: "No payment link received"
                    _paymentState.value = PaymentUiState.IDLE
                }
            } catch (e: Exception) {
                _paymentError.value = e.message ?: "Payment initiation failed"
                _paymentState.value = PaymentUiState.IDLE
            }
        }
    }

    private fun startPaymentPolling() {
        paymentPollJob?.cancel()
        paymentPollJob = viewModelScope.launch {
            var attempts = 0
            while (isActive && attempts < 60) {
                delay(5000)
                attempts++
                val token = userPreferences.jwtToken.first() ?: break
                val txnId = currentTransactionId ?: break

                try {
                    val response = if (_isSecurityDeposit.value) {
                        backendApi.checkSecurityDepositStatus(
                            authorization = "Bearer $token",
                            transactionId = txnId
                        )
                    } else {
                        backendApi.checkPaymentStatus(
                            authorization = "Bearer $token",
                            transactionId = txnId
                        )
                    }
                    val data = response.data
                    if (data?.feePaid == true || data?.securityDepositPaid == true || data?.status == "SUCCESS") {
                        _paymentState.value = PaymentUiState.SUCCESS
                        // Give time for user to return from Chrome tab
                        delay(3000)
                        fetchStatus()
                        // Don't reset to IDLE — let fetchStatus handle the navigation
                        return@launch
                    }
                } catch (_: Exception) {
                    // Keep polling on errors
                }
            }
            // Timed out
            if (_paymentState.value == PaymentUiState.VERIFYING) {
                _paymentState.value = PaymentUiState.FAILED
                _paymentError.value = "Payment verification timed out. If you completed the payment, it will be updated shortly."
            }
        }
    }

    fun retryPayment() {
        _paymentState.value = PaymentUiState.IDLE
        _paymentError.value = null
    }

    fun goToDashboard() {
        viewModelScope.launch {
            userPreferences.setPartnerActive(true)
        }
    }

    fun selectFile(docType: String, uri: Uri) {
        _selectedFiles.value = _selectedFiles.value + (docType to uri)
    }

    fun removeFile(docType: String) {
        _selectedFiles.value = _selectedFiles.value - docType
    }

    fun setResponseText(text: String) {
        _responseText.value = text
    }

    fun clearError() {
        _error.value = null
    }

    fun submitResponse() {
        val files = _selectedFiles.value.toList()
        val text = _responseText.value

        if (files.isEmpty() && text.isBlank()) {
            _error.value = "Please add a response or upload documents"
            return
        }

        _submitting.value = true
        _error.value = null
        _submitSuccess.value = false

        viewModelScope.launch {
            val token = userPreferences.jwtToken.first()
            if (token == null) {
                _error.value = "Session expired. Please login again."
                _submitting.value = false
                return@launch
            }

            pendingRepository.respond(token, text, files)
                .onSuccess {
                    _submitting.value = false
                    _submitSuccess.value = true
                    _selectedFiles.value = emptyMap()
                    _responseText.value = ""
                    fetchStatus()
                }
                .onFailure { e ->
                    _submitting.value = false
                    _error.value = e.message ?: "Failed to submit response"
                }
        }
    }

    fun clearSubmitSuccess() {
        _submitSuccess.value = false
    }

    override fun onCleared() {
        super.onCleared()
        stopPolling()
        paymentPollJob?.cancel()
    }
}
