package com.wiom.csp.ui.technician

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wiom.csp.data.preferences.UserPreferences
import com.wiom.csp.data.repository.TechnicianRepository
import com.wiom.csp.domain.model.Task
import com.wiom.csp.domain.model.Technician
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TechUiState(
    val view: TechView = TechView.LOGIN,
    val techId: String? = null,
    val tech: Technician? = null,
    val technicians: List<Technician> = emptyList(),
    val tasks: List<Task> = emptyList(),
    val selectedTaskId: String? = null,
    val confirmMessage: String? = null,
    val isLoading: Boolean = true,
)

enum class TechView {
    LOGIN, DASHBOARD, TASK_DETAIL, PROFILE
}

@HiltViewModel
class TechViewModel @Inject constructor(
    private val techRepo: TechnicianRepository,
    private val prefs: UserPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(TechUiState())
    val state: StateFlow<TechUiState> = _state.asStateFlow()

    private var pollJob: Job? = null

    init {
        // Check stored tech ID
        viewModelScope.launch {
            prefs.techId.collect { storedId ->
                if (storedId != null && _state.value.techId == null) {
                    _state.update { it.copy(techId = storedId, view = TechView.DASHBOARD) }
                    startPolling()
                }
            }
        }
        loadTechnicians()
    }

    private fun loadTechnicians() {
        viewModelScope.launch {
            techRepo.getTechnicians().onSuccess { list ->
                _state.update { it.copy(technicians = list, isLoading = false) }
            }.onFailure {
                _state.update { it.copy(isLoading = false) }
            }
        }
    }

    fun login(techId: String) {
        viewModelScope.launch {
            prefs.setTechId(techId)
        }
        _state.update { it.copy(techId = techId, view = TechView.DASHBOARD) }
        startPolling()
    }

    fun logout() {
        pollJob?.cancel()
        viewModelScope.launch {
            prefs.setTechId(null)
        }
        _state.update {
            TechUiState(
                technicians = it.technicians,
                isLoading = false
            )
        }
    }

    private fun startPolling() {
        pollJob?.cancel()
        pollJob = viewModelScope.launch {
            while (true) {
                fetchTasks()
                delay(2000)
            }
        }
    }

    private suspend fun fetchTasks() {
        val id = _state.value.techId ?: return
        techRepo.getTechnicianTasks(id).onSuccess { response ->
            _state.update { it.copy(tech = response.tech, tasks = response.tasks, isLoading = false) }
        }
    }

    fun selectTask(taskId: String) {
        _state.update { it.copy(selectedTaskId = taskId, view = TechView.TASK_DETAIL) }
    }

    fun openProfile() {
        _state.update { it.copy(view = TechView.PROFILE) }
    }

    fun backToDashboard() {
        _state.update { it.copy(view = TechView.DASHBOARD, selectedTaskId = null) }
    }

    fun toggleAvailability() {
        val tech = _state.value.tech ?: return
        _state.update { it.copy(tech = tech.copy(available = !tech.available)) }
    }

    fun handleAction(taskId: String, action: String) {
        val id = _state.value.techId ?: return
        viewModelScope.launch {
            techRepo.technicianAction(id, taskId, action).onSuccess {
                val msg = action.replace("_", " ") + " completed"
                showConfirmation(msg)
                fetchTasks()
                _state.update { it.copy(view = TechView.DASHBOARD, selectedTaskId = null) }
            }
        }
    }

    private fun showConfirmation(msg: String) {
        _state.update { it.copy(confirmMessage = msg) }
        viewModelScope.launch {
            delay(2500)
            _state.update { it.copy(confirmMessage = null) }
        }
    }
}
