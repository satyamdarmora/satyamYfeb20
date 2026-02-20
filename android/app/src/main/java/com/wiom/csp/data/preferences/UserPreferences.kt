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
}
