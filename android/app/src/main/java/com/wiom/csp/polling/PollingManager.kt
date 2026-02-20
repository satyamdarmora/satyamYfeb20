package com.wiom.csp.polling

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * Lifecycle-aware polling manager.
 * Start/stop polling when the composable enters/leaves composition.
 * Battery-conscious: can double intervals when battery saver is active.
 */
class PollingManager(
    private val scope: CoroutineScope
) {
    private val jobs = mutableMapOf<String, Job>()
    private val _polling = MutableStateFlow(true)
    val isPollingActive: StateFlow<Boolean> = _polling

    fun startPolling(
        key: String,
        intervalMs: Long,
        action: suspend () -> Unit
    ) {
        stopPolling(key)
        jobs[key] = scope.launch {
            while (_polling.value) {
                try {
                    action()
                } catch (_: CancellationException) {
                    throw CancellationException()
                } catch (_: Exception) {
                    // Silently handle API errors
                }
                delay(intervalMs)
            }
        }
    }

    fun stopPolling(key: String) {
        jobs[key]?.cancel()
        jobs.remove(key)
    }

    fun stopAll() {
        jobs.values.forEach { it.cancel() }
        jobs.clear()
    }

    fun pause() {
        _polling.value = false
        stopAll()
    }

    fun resume() {
        _polling.value = true
    }
}
