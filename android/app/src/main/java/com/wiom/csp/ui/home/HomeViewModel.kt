package com.wiom.csp.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wiom.csp.data.preferences.UserPreferences
import com.wiom.csp.data.remote.dto.AssuranceUpdateRequest
import com.wiom.csp.data.remote.dto.NotificationPostRequest
import com.wiom.csp.data.repository.*
import com.wiom.csp.domain.model.*
import com.wiom.csp.domain.usecase.GetBucketUseCase
import com.wiom.csp.domain.usecase.SortTasksUseCase
import android.content.Context
import com.wiom.csp.feedback.AudioFeedback
import com.wiom.csp.feedback.HapticFeedback
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.serialization.json.*
import java.time.Instant
import javax.inject.Inject

data class HomeUiState(
    val tasks: List<Task> = emptyList(),
    val assurance: AssuranceState? = null,
    val wallet: WalletState? = null,
    val technicians: List<Technician> = emptyList(),
    val activeNotification: AppNotification? = null,
    val confirmMessage: String? = null,
    val selectedTaskId: String? = null,
    val menuOpen: Boolean = false,
    val assignPickerOpen: Boolean = false,
    val assignTaskId: String? = null,
    val activeSection: String? = null,
    val offersEnabled: Boolean = true,
    val currentTheme: AppTheme = AppTheme.DARK,
    val isLoading: Boolean = true,
    val fadingTasks: Map<String, Task> = emptyMap(),
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val taskRepo: TaskRepository,
    private val assuranceRepo: AssuranceRepository,
    private val walletRepo: WalletRepository,
    private val notificationRepo: NotificationRepository,
    private val themeRepo: ThemeRepository,
    private val sortTasks: SortTasksUseCase,
    val getBucket: GetBucketUseCase,
    private val prefs: UserPreferences,
    @ApplicationContext private val appContext: Context,
) : ViewModel() {

    private val _state = MutableStateFlow(HomeUiState())
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    init {
        loadInitialData()
        startPolling()
        observePreferences()
    }

    private fun loadInitialData() {
        viewModelScope.launch {
            val tasksResult = taskRepo.getTasks()
            val assuranceResult = assuranceRepo.getAssurance()
            val walletResult = walletRepo.getWallet()

            _state.update { s ->
                s.copy(
                    tasks = tasksResult.getOrNull()?.let { sortTasks(it) } ?: emptyList(),
                    assurance = assuranceResult.getOrNull(),
                    wallet = walletResult.getOrNull(),
                    isLoading = false
                )
            }
        }
    }

    private fun startPolling() {
        // Assurance polling -- 2s
        viewModelScope.launch {
            while (true) {
                delay(2000)
                assuranceRepo.getAssurance().onSuccess { data ->
                    _state.update { it.copy(assurance = data) }
                }
            }
        }

        // Notification polling -- 2s
        viewModelScope.launch {
            while (true) {
                delay(2000)
                notificationRepo.getNotifications().onSuccess { notifications ->
                    val current = _state.value
                    if (current.activeNotification == null) {
                        val offersOn = current.offersEnabled
                        val undismissed = notifications.firstOrNull { n ->
                            !n.dismissed && (offersOn || n.type != NotificationType.NEW_OFFER)
                        }
                        if (undismissed != null) {
                            _state.update { it.copy(activeNotification = undismissed) }
                            // Trigger audio + haptic feedback
                            when (undismissed.type) {
                                NotificationType.HIGH_RESTORE_ALERT -> {
                                    AudioFeedback.playUrgentSound()
                                    HapticFeedback.notifyUrgentAlert(appContext)
                                }
                                else -> {
                                    AudioFeedback.playNotificationSound()
                                    HapticFeedback.notifyNewConnection(appContext)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Theme polling -- 2s
        viewModelScope.launch {
            while (true) {
                delay(2000)
                themeRepo.getTheme().onSuccess { theme ->
                    _state.update { it.copy(currentTheme = theme) }
                    prefs.setTheme(theme)
                }
            }
        }

        // Wallet polling -- 5s
        viewModelScope.launch {
            while (true) {
                delay(5000)
                walletRepo.getWallet().onSuccess { data ->
                    _state.update { it.copy(wallet = data) }
                }
            }
        }
    }

    private fun observePreferences() {
        viewModelScope.launch {
            prefs.offersEnabled.collect { enabled ->
                _state.update { it.copy(offersEnabled = enabled) }
            }
        }
        viewModelScope.launch {
            prefs.theme.collect { theme ->
                _state.update { it.copy(currentTheme = theme) }
            }
        }
    }

    fun retryLoad() {
        _state.update { it.copy(isLoading = true) }
        loadInitialData()
    }

    fun refreshTasks() {
        viewModelScope.launch {
            taskRepo.getTasks().onSuccess { data ->
                _state.update { it.copy(tasks = sortTasks(data)) }
            }
        }
    }

    val lifetimeEarnings: Int?
        get() {
            val wallet = _state.value.wallet ?: return null
            return wallet.transactions
                .filter { (it.type == WalletTransactionType.SETTLEMENT || it.type == WalletTransactionType.BONUS) && it.status == TransactionStatus.COMPLETED }
                .sumOf { it.amount }
        }

    // ---- UI Actions ----

    fun selectTask(taskId: String) {
        _state.update { it.copy(selectedTaskId = taskId) }
    }

    fun clearSelectedTask() {
        _state.update { it.copy(selectedTaskId = null) }
        refreshTasks()
    }

    fun openMenu() {
        _state.update { it.copy(menuOpen = true) }
    }

    fun closeMenu() {
        _state.update { it.copy(menuOpen = false) }
    }

    fun navigate(section: String) {
        _state.update { it.copy(activeSection = section) }
    }

    fun backToHome() {
        _state.update { it.copy(activeSection = null) }
        refreshTasks()
    }

    fun openAssignPicker(taskId: String) {
        _state.update { it.copy(assignPickerOpen = true, assignTaskId = taskId) }
    }

    fun closeAssignPicker() {
        _state.update { it.copy(assignPickerOpen = false, assignTaskId = null) }
    }

    fun dismissNotification() {
        val notification = _state.value.activeNotification ?: return
        viewModelScope.launch {
            notificationRepo.dismiss(notification.id)
            _state.update { it.copy(activeNotification = null) }
        }
    }

    fun showConfirmation(msg: String) {
        _state.update { it.copy(confirmMessage = msg) }
        viewModelScope.launch {
            delay(3000)
            _state.update { it.copy(confirmMessage = null) }
        }
    }

    fun setOffersEnabled(enabled: Boolean) {
        viewModelScope.launch { prefs.setOffersEnabled(enabled) }
    }

    // ---- Task actions (port from page.tsx handleAction) ----

    fun handleAction(taskId: String, action: String, extra: Map<String, String> = emptyMap()) {
        val task = _state.value.tasks.find { it.taskId == taskId } ?: return
        val now = Instant.now().toString()

        fun newEvent(type: String, detail: String) = TimelineEvent(
            timestamp = now,
            eventType = type,
            actor = "CSP-MH-1001",
            actorType = ActorType.CSP,
            detail = detail
        )

        viewModelScope.launch {
            when (action) {
                "CLAIM" -> {
                    val acceptExpires = Instant.now().plusSeconds(900).toString()
                    postUpdate(taskId, task, mapOf(
                        "state" to JsonPrimitive("CLAIMED"),
                        "offer_expires_at" to JsonNull,
                        "queue_escalation_flag" to JsonNull,
                        "accept_expires_at" to JsonPrimitive(acceptExpires),
                    ), newEvent("CLAIMED", "CSP claimed this task. Accept deadline: 15 min."))
                    AudioFeedback.playNotificationSound()
                    HapticFeedback.notifyNewConnection(appContext)
                    showConfirmation("Claimed $taskId. Accept within 15 min.")
                }
                "CLAIM_AND_ASSIGN" -> {
                    val slot = extra["preferred_slot"] ?: "Today"
                    postUpdate(taskId, task, mapOf(
                        "state" to JsonPrimitive("ACCEPTED"),
                        "offer_expires_at" to JsonNull,
                        "accept_expires_at" to JsonNull,
                        "queue_escalation_flag" to JsonNull,
                    ), newEvent("CLAIMED", "CSP claimed this task. Preferred slot: $slot."),
                        newEvent("ACCEPTED", "CSP accepted. Scheduled for: $slot.")
                    )
                    AudioFeedback.playNotificationSound()
                    HapticFeedback.notifyNewConnection(appContext)
                    showConfirmation("Claimed $taskId. Slot: $slot. Now assign a technician.")
                    _state.update { it.copy(selectedTaskId = null) }
                    refreshTasks()
                    openAssignPicker(taskId)
                    return@launch
                }
                "DECLINE" -> {
                    val reason = extra["reason"] ?: "No reason provided"
                    postUpdate(taskId, task, mapOf(
                        "state" to JsonPrimitive("FAILED"),
                        "queue_escalation_flag" to JsonNull,
                    ), newEvent("DECLINED", "CSP declined this offer. Reason: $reason"))
                    showConfirmation("$taskId declined.")
                    _state.update { it.copy(selectedTaskId = null) }
                }
                "ACCEPT" -> {
                    postUpdate(taskId, task, mapOf(
                        "state" to JsonPrimitive("ACCEPTED"),
                        "accept_expires_at" to JsonNull,
                        "queue_escalation_flag" to JsonNull,
                    ), newEvent("ACCEPTED", "CSP accepted this task. Ready to schedule."))
                    showConfirmation("Accepted $taskId. Schedule or assign a technician.")
                }
                "SCHEDULE", "ASSIGN" -> {
                    openAssignPicker(taskId)
                    return@launch
                }
                "START_WORK" -> {
                    postUpdate(taskId, task, mapOf(
                        "state" to JsonPrimitive("IN_PROGRESS"),
                        "delegation_state" to JsonPrimitive("IN_PROGRESS"),
                    ), newEvent("IN_PROGRESS", "CSP started work on this task (self-assigned)."))
                    showConfirmation("$taskId -- Work started.")
                }
                "RESOLVE" -> {
                    addFadingTask(taskId)
                    postUpdate(taskId, task, mapOf(
                        "state" to JsonPrimitive("RESOLVED"),
                        "queue_escalation_flag" to JsonNull,
                        "delegation_state" to JsonPrimitive("DONE"),
                    ), newEvent("RESOLVED", "Task marked as resolved by CSP."))
                    showConfirmation("$taskId marked as resolved.")
                }
                "RESOLVE_BLOCKED" -> {
                    postUpdate(taskId, task, mapOf(
                        "state" to JsonPrimitive("IN_PROGRESS"),
                        "queue_escalation_flag" to JsonNull,
                        "blocked_reason" to JsonNull,
                    ), newEvent("UNBLOCKED", "Block resolved. Task resumed."))
                    showConfirmation("$taskId unblocked and resumed.")
                }
                "COLLECTED" -> {
                    postUpdate(taskId, task, mapOf(
                        "state" to JsonPrimitive("COLLECTED"),
                    ), newEvent("COLLECTED", "NetBox collected from customer premises."))
                    showConfirmation("$taskId -- NetBox marked as collected.")
                }
                "CONFIRM_RETURN" -> {
                    addFadingTask(taskId)
                    postUpdate(taskId, task, mapOf(
                        "state" to JsonPrimitive("RETURN_CONFIRMED"),
                        "queue_escalation_flag" to JsonNull,
                        "delegation_state" to JsonPrimitive("DONE"),
                    ), newEvent("RETURN_CONFIRMED", "NetBox return confirmed and recorded."))
                    showConfirmation("$taskId -- Return confirmed.")
                }
                "VERIFY" -> {
                    addFadingTask(taskId)
                    postUpdate(taskId, task, mapOf(
                        "state" to JsonPrimitive("ACTIVATION_VERIFIED"),
                        "queue_escalation_flag" to JsonNull,
                    ), newEvent("ACTIVATION_VERIFIED", "Activation manually verified by CSP."))
                    AudioFeedback.playNotificationSound()
                    HapticFeedback.notifyNewConnection(appContext)
                    showConfirmation("$taskId -- Activation verified. \u20B9300 earned.")
                    // Credit earnings
                    assuranceRepo.updateAssurance(
                        AssuranceUpdateRequest(incrementCycleEarned = 300, incrementNextSettlement = 300)
                    )
                    notificationRepo.post(NotificationPostRequest(
                        id = "NOTIF-${System.currentTimeMillis()}",
                        type = "SETTLEMENT_CREDIT",
                        title = "Install Earning Credited",
                        message = "\u20B9300 earned \u2014 Install activation for ${task.connectionId ?: taskId}",
                        timestamp = now,
                    ))
                }
                "INSTALL" -> {
                    postUpdate(taskId, task, mapOf(
                        "state" to JsonPrimitive("INSTALLED"),
                        "queue_escalation_flag" to JsonPrimitive("VERIFICATION_PENDING"),
                    ), newEvent("INSTALLED", "Hardware installation completed. Pending activation verification."))
                    AudioFeedback.playNotificationSound()
                    HapticFeedback.notifyNewConnection(appContext)
                    showConfirmation("$taskId -- Installation completed. Verification pending.")
                }
                "VIEW" -> {
                    selectTask(taskId)
                    return@launch
                }
            }

            // Check terminal state
            val updated = _state.value.tasks.find { it.taskId == taskId }
            if (updated != null && updated.isTerminal) {
                _state.update { it.copy(selectedTaskId = null) }
            }
            refreshTasks()
        }
    }

    fun doAssign(taskId: String, tech: Technician) {
        val task = _state.value.tasks.find { it.taskId == taskId } ?: return
        val now = Instant.now().toString()

        val nextState = when (task.taskType) {
            TaskType.RESTORE -> if (task.state == "ALERTED") "ASSIGNED" else "IN_PROGRESS"
            TaskType.NETBOX -> if (task.state == "PICKUP_REQUIRED") "ASSIGNED" else "IN_PROGRESS"
            TaskType.INSTALL -> if (task.state == "ACCEPTED") "SCHEDULED" else task.state
        }

        val event = TimelineEvent(
            timestamp = now,
            eventType = "ASSIGNED",
            actor = "CSP-MH-1001",
            actorType = ActorType.CSP,
            detail = "Task assigned to ${tech.name} (${tech.id}). Delegation state: ASSIGNED."
        )

        viewModelScope.launch {
            postUpdate(taskId, task, mapOf(
                "state" to JsonPrimitive(nextState),
                "delegation_state" to JsonPrimitive("ASSIGNED"),
                "assigned_to" to JsonPrimitive(tech.name),
            ), event)
            showConfirmation("$taskId assigned to ${tech.name}.")
            _state.update { it.copy(selectedTaskId = null) }
            closeAssignPicker()
            refreshTasks()
        }
    }

    private suspend fun postUpdate(
        taskId: String,
        task: Task,
        fields: Map<String, JsonElement>,
        vararg newEvents: TimelineEvent
    ) {
        val eventLog = task.eventLog + newEvents.toList()
        val eventLogJson = Json.encodeToJsonElement(eventLog)
        val updates = fields.toMutableMap()
        updates["event_log"] = eventLogJson

        taskRepo.updateTask(taskId, updates)
    }

    private fun addFadingTask(taskId: String) {
        val task = _state.value.tasks.find { it.taskId == taskId } ?: return
        _state.update { it.copy(fadingTasks = it.fadingTasks + (taskId to task)) }
        viewModelScope.launch {
            delay(1500)
            _state.update { it.copy(fadingTasks = it.fadingTasks - taskId) }
        }
    }
}
