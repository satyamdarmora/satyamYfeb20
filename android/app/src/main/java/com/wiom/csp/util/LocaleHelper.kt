package com.wiom.csp.util

import android.app.Activity
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import java.util.Locale

object LocaleHelper {

    private const val PREFS_NAME = "wiom_locale"
    private const val KEY_LANGUAGE = "language"

    /**
     * Apply locale change. On API 33+ uses LocaleManager (no restart).
     * On older APIs, persists to SharedPreferences and recreates the activity.
     */
    fun setLocale(context: Context, lang: String) {
        // Always persist to SharedPreferences (used by attachBaseContext on pre-33)
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString(KEY_LANGUAGE, lang).apply()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val localeManager = context.getSystemService(android.app.LocaleManager::class.java)
            localeManager.applicationLocales = android.os.LocaleList.forLanguageTags(lang)
        } else {
            val locale = Locale(lang)
            Locale.setDefault(locale)
            val config = Configuration(context.resources.configuration)
            config.setLocale(locale)
            @Suppress("DEPRECATION")
            context.resources.updateConfiguration(config, context.resources.displayMetrics)
            (context as? Activity)?.recreate()
        }
    }

    /**
     * Clear saved locale (used on logout so language screen shows again).
     */
    fun clearLocale(context: Context) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().remove(KEY_LANGUAGE).apply()
    }

    /**
     * Wrap context with saved locale. Called from attachBaseContext.
     */
    fun applyLocale(context: Context): Context {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val lang = prefs.getString(KEY_LANGUAGE, "") ?: ""
        if (lang.isEmpty()) return context
        val locale = Locale(lang)
        Locale.setDefault(locale)
        val config = Configuration(context.resources.configuration)
        config.setLocale(locale)
        return context.createConfigurationContext(config)
    }
}
