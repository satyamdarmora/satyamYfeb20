package com.wiom.csp

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import io.sentry.android.core.SentryAndroid

@HiltAndroidApp
class WiomCspApp : Application() {

    override fun onCreate() {
        super.onCreate()
        initSentry()
    }

    private fun initSentry() {
        val dsn = BuildConfig.SENTRY_DSN
        if (dsn.isNotBlank()) {
            SentryAndroid.init(this) { options ->
                options.dsn = dsn
                options.isDebug = BuildConfig.DEBUG
                options.environment = when {
                    BuildConfig.APPLICATION_ID.endsWith(".dev") -> "development"
                    BuildConfig.APPLICATION_ID.endsWith(".staging") -> "staging"
                    else -> "production"
                }
                options.release = "${BuildConfig.APPLICATION_ID}@${BuildConfig.VERSION_NAME}"
            }
        }
    }
}
