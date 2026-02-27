package com.wiom.csp.data.preferences

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.wiom.csp.domain.model.AppTheme
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserPreferences @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        private val KEY_LANGUAGE = stringPreferencesKey("language")
        private val KEY_THEME = stringPreferencesKey("theme")
        private val KEY_OFFERS_ENABLED = booleanPreferencesKey("offers_enabled")
        private val KEY_TASK_ALERTS = booleanPreferencesKey("task_alerts")
        private val KEY_SLA_WARNINGS = booleanPreferencesKey("sla_warnings")
        private val KEY_SETTLEMENT_UPDATES = booleanPreferencesKey("settlement_updates")
        private val KEY_OFFER_NOTIFICATIONS = booleanPreferencesKey("offer_notifications")
        private val KEY_TECH_ID = stringPreferencesKey("tech_id")
        private val KEY_JWT_TOKEN = stringPreferencesKey("jwt_token")
        private val KEY_USER_NAME = stringPreferencesKey("user_name")
        private val KEY_USER_MOBILE = stringPreferencesKey("user_mobile")
        private val KEY_IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
        private val KEY_IS_PROFILE_COMPLETE = booleanPreferencesKey("is_profile_complete")
        private val KEY_IS_PARTNER_ACTIVE = booleanPreferencesKey("is_partner_active")
    }

    // ---- Language ----
    val language: Flow<String> = dataStore.data.map { prefs ->
        prefs[KEY_LANGUAGE] ?: "en"
    }

    suspend fun setLanguage(lang: String) {
        dataStore.edit { prefs -> prefs[KEY_LANGUAGE] = lang }
    }

    // ---- Theme ----
    val theme: Flow<AppTheme> = dataStore.data.map { prefs ->
        when (prefs[KEY_THEME]) {
            "state-color-check" -> AppTheme.STATE_COLOR_CHECK
            else -> AppTheme.DARK
        }
    }

    suspend fun setTheme(theme: AppTheme) {
        val value = when (theme) {
            AppTheme.DARK -> "dark"
            AppTheme.STATE_COLOR_CHECK -> "state-color-check"
        }
        dataStore.edit { prefs -> prefs[KEY_THEME] = value }
    }

    // ---- Offers enabled ----
    val offersEnabled: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[KEY_OFFERS_ENABLED] ?: true
    }

    suspend fun setOffersEnabled(enabled: Boolean) {
        dataStore.edit { prefs -> prefs[KEY_OFFERS_ENABLED] = enabled }
    }

    // ---- Notification toggles ----
    val taskAlerts: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[KEY_TASK_ALERTS] ?: true
    }
    suspend fun setTaskAlerts(enabled: Boolean) {
        dataStore.edit { prefs -> prefs[KEY_TASK_ALERTS] = enabled }
    }

    val slaWarnings: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[KEY_SLA_WARNINGS] ?: true
    }
    suspend fun setSlaWarnings(enabled: Boolean) {
        dataStore.edit { prefs -> prefs[KEY_SLA_WARNINGS] = enabled }
    }

    val settlementUpdates: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[KEY_SETTLEMENT_UPDATES] ?: true
    }
    suspend fun setSettlementUpdates(enabled: Boolean) {
        dataStore.edit { prefs -> prefs[KEY_SETTLEMENT_UPDATES] = enabled }
    }

    val offerNotifications: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[KEY_OFFER_NOTIFICATIONS] ?: true
    }
    suspend fun setOfferNotifications(enabled: Boolean) {
        dataStore.edit { prefs -> prefs[KEY_OFFER_NOTIFICATIONS] = enabled }
    }

    // ---- Technician ID (persisted login) ----
    val techId: Flow<String?> = dataStore.data.map { prefs ->
        prefs[KEY_TECH_ID]
    }
    suspend fun setTechId(id: String?) {
        dataStore.edit { prefs ->
            if (id != null) prefs[KEY_TECH_ID] = id
            else prefs.remove(KEY_TECH_ID)
        }
    }

    // ---- Auth (JWT login) ----
    val jwtToken: Flow<String?> = dataStore.data.map { prefs ->
        prefs[KEY_JWT_TOKEN]
    }

    val isLoggedIn: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[KEY_IS_LOGGED_IN] ?: false
    }

    val isProfileComplete: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[KEY_IS_PROFILE_COMPLETE] ?: false
    }

    suspend fun setProfileComplete(complete: Boolean) {
        dataStore.edit { prefs -> prefs[KEY_IS_PROFILE_COMPLETE] = complete }
    }

    val isPartnerActive: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[KEY_IS_PARTNER_ACTIVE] ?: false
    }

    suspend fun setPartnerActive(active: Boolean) {
        dataStore.edit { prefs -> prefs[KEY_IS_PARTNER_ACTIVE] = active }
    }

    val userName: Flow<String?> = dataStore.data.map { prefs ->
        prefs[KEY_USER_NAME]
    }

    val userMobile: Flow<String?> = dataStore.data.map { prefs ->
        prefs[KEY_USER_MOBILE]
    }

    suspend fun setAuth(token: String, name: String, mobile: String) {
        dataStore.edit { prefs ->
            prefs[KEY_JWT_TOKEN] = token
            prefs[KEY_USER_NAME] = name
            prefs[KEY_USER_MOBILE] = mobile
            prefs[KEY_IS_LOGGED_IN] = true
        }
    }

    suspend fun clearAuth() {
        dataStore.edit { prefs ->
            prefs.remove(KEY_JWT_TOKEN)
            prefs.remove(KEY_USER_NAME)
            prefs.remove(KEY_USER_MOBILE)
            prefs[KEY_IS_LOGGED_IN] = false
            prefs[KEY_IS_PROFILE_COMPLETE] = false
            prefs[KEY_IS_PARTNER_ACTIVE] = false
        }
    }
}
