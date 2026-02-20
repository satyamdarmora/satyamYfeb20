package com.wiom.csp.feedback

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.sin

/**
 * Programmatic audio feedback -- no external sound files needed.
 * Ports the Web Audio API oscillator patterns from feedback.ts.
 */
object AudioFeedback {

    private const val SAMPLE_RATE = 44100
    private val audioScope = CoroutineScope(Dispatchers.IO)

    /**
     * Pleasant three-tone chime for new connections/offers.
     * C5 (523 Hz) → E5 (659 Hz) → G5 (784 Hz) sine waves.
     */
    fun playNotificationSound() {
        audioScope.launch {
            try {
                val durationMs = 700
                val samples = generateChime(durationMs)
                playPcm(samples, durationMs)
            } catch (_: Exception) {
                // Audio not available
            }
        }
    }

    /**
     * Urgent alert: two quick descending tones (880→440 Hz square wave).
     */
    fun playUrgentSound() {
        audioScope.launch {
            try {
                val durationMs = 500
                val samples = generateUrgent(durationMs)
                playPcm(samples, durationMs)
            } catch (_: Exception) {
                // Audio not available
            }
        }
    }

    private fun generateChime(durationMs: Int): ShortArray {
        val totalSamples = SAMPLE_RATE * durationMs / 1000
        val samples = ShortArray(totalSamples)

        // Tone 1: C5 523Hz, 0-300ms, volume 0.7→0
        addTone(samples, 523.0, 0.0, 0.3, 0.7, 0.0, "sine")
        // Tone 2: E5 659Hz, 150-500ms, volume 0.6→0
        addTone(samples, 659.0, 0.15, 0.35, 0.6, 0.0, "sine")
        // Tone 3: G5 784Hz, 300-700ms, volume 0.5→0
        addTone(samples, 784.0, 0.3, 0.4, 0.5, 0.0, "sine")

        return samples
    }

    private fun generateUrgent(durationMs: Int): ShortArray {
        val totalSamples = SAMPLE_RATE * durationMs / 1000
        val samples = ShortArray(totalSamples)

        // Two descending tones
        for (i in 0..1) {
            val offsetSec = i * 0.25
            addSweepTone(samples, 880.0, 440.0, offsetSec, 0.2, 0.5, "square")
        }

        return samples
    }

    private fun addTone(
        samples: ShortArray,
        freq: Double,
        startSec: Double,
        durationSec: Double,
        startVol: Double,
        endVol: Double,
        waveform: String
    ) {
        val startSample = (startSec * SAMPLE_RATE).toInt()
        val numSamples = (durationSec * SAMPLE_RATE).toInt()

        for (i in 0 until numSamples) {
            val idx = startSample + i
            if (idx >= samples.size) break

            val t = i.toDouble() / SAMPLE_RATE
            val vol = startVol + (endVol - startVol) * (i.toDouble() / numSamples)
            val wave = when (waveform) {
                "square" -> if (sin(2 * PI * freq * t) >= 0) 1.0 else -1.0
                else -> sin(2 * PI * freq * t) // sine
            }
            samples[idx] = (samples[idx] + (wave * vol * Short.MAX_VALUE).toInt().toShort().toInt())
                .coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
    }

    private fun addSweepTone(
        samples: ShortArray,
        startFreq: Double,
        endFreq: Double,
        startSec: Double,
        durationSec: Double,
        vol: Double,
        waveform: String
    ) {
        val startSample = (startSec * SAMPLE_RATE).toInt()
        val numSamples = (durationSec * SAMPLE_RATE).toInt()

        for (i in 0 until numSamples) {
            val idx = startSample + i
            if (idx >= samples.size) break

            val progress = i.toDouble() / numSamples
            val freq = startFreq + (endFreq - startFreq) * progress
            val t = i.toDouble() / SAMPLE_RATE
            val envelope = vol * (1.0 - progress) // fade out
            val wave = when (waveform) {
                "square" -> if (sin(2 * PI * freq * t) >= 0) 1.0 else -1.0
                else -> sin(2 * PI * freq * t)
            }
            samples[idx] = (samples[idx] + (wave * envelope * Short.MAX_VALUE).toInt().toShort().toInt())
                .coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
    }

    private fun playPcm(samples: ShortArray, durationMs: Int) {
        val bufferSize = AudioTrack.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        ).coerceAtLeast(samples.size * 2)

        val track = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(bufferSize)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()

        track.play()
        track.write(samples, 0, samples.size)

        // Wait for playback to finish, then release
        Thread.sleep(durationMs.toLong() + 200)
        try {
            track.stop()
            track.release()
        } catch (_: Exception) {}
    }
}
