package com.wiom.csp.ui.pending

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wiom.csp.data.preferences.UserPreferences
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

@HiltViewModel
class PendingViewModel @Inject constructor(
    private val pendingRepository: PendingRepository,
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

    private var pollingJob: Job? = null

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

                // If partner is ACTIVE, update preference and stop polling
                if (data.partnerStatus == "ACTIVE") {
                    userPreferences.setPartnerActive(true)
                    stopPolling()
                }
            }
            .onFailure { e ->
                _loading.value = false
                // Don't overwrite status data on poll failure
                if (_statusData.value == null) {
                    _error.value = e.message
                }
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
                    // Refresh status immediately
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
    }
}
