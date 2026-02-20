package com.wiom.csp.feedback

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * Haptic feedback patterns matching the web app's navigator.vibrate() patterns.
 */
object HapticFeedback {

    private fun getVibrator(context: Context): Vibrator? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vm?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    /**
     * Two strong pulses -- for new connection/offer notifications.
     * Pattern: [150ms vibrate, 80ms pause, 150ms vibrate]
     */
    fun notifyNewConnection(context: Context) {
        vibrate(context, longArrayOf(0, 150, 80, 150), 255)
    }

    /**
     * Three heavy pulses -- for HIGH priority alerts.
     * Pattern: [200ms vibrate, 100ms pause, 200ms vibrate, 100ms pause, 250ms vibrate]
     */
    fun notifyUrgentAlert(context: Context) {
        vibrate(context, longArrayOf(0, 200, 100, 200, 100, 250), 255)
    }

    /**
     * Single firm tap -- general feedback.
     */
    fun tap(context: Context) {
        vibrate(context, longArrayOf(0, 100), 255)
    }

    private fun vibrate(context: Context, pattern: LongArray, amplitude: Int = VibrationEffect.DEFAULT_AMPLITUDE) {
        try {
            val vibrator = getVibrator(context) ?: return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val amplitudes = IntArray(pattern.size) { if (it % 2 == 0) 0 else amplitude }
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, amplitudes, -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(pattern, -1)
            }
        } catch (_: Exception) {
            // Haptic not available
        }
    }
}
