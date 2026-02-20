package com.wiom.csp.data.repository

import com.wiom.csp.data.remote.ApiService
import com.wiom.csp.data.remote.dto.ThemeUpdateRequest
import com.wiom.csp.domain.model.AppTheme
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ThemeRepository @Inject constructor(
    private val api: ApiService
) {
    suspend fun getTheme(): Result<AppTheme> = runCatching {
        val response = api.getTheme()
        when (response.theme) {
            "state-color-check" -> AppTheme.STATE_COLOR_CHECK
            else -> AppTheme.DARK
        }
    }

    suspend fun setTheme(theme: AppTheme): Result<Unit> = runCatching {
        val name = when (theme) {
            AppTheme.DARK -> "dark"
            AppTheme.STATE_COLOR_CHECK -> "state-color-check"
        }
        api.updateTheme(ThemeUpdateRequest(name))
        Unit
    }
}
