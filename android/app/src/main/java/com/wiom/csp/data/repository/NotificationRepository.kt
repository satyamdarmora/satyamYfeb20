package com.wiom.csp.data.repository

import com.wiom.csp.data.remote.ApiService
import com.wiom.csp.data.remote.dto.NotificationDismissRequest
import com.wiom.csp.data.remote.dto.NotificationPostRequest
import com.wiom.csp.domain.model.AppNotification
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepository @Inject constructor(
    private val api: ApiService
) {
    suspend fun getNotifications(): Result<List<AppNotification>> = runCatching {
        api.getNotifications()
    }

    suspend fun dismiss(id: String): Result<Unit> = runCatching {
        api.dismissNotification(NotificationDismissRequest(id))
    }

    suspend fun post(request: NotificationPostRequest): Result<Unit> = runCatching {
        api.postNotification(request)
        Unit
    }
}
