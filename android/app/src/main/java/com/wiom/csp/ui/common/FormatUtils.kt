package com.wiom.csp.ui.common

import java.text.NumberFormat
import java.time.Duration
import java.time.Instant
import java.util.Locale

/** Format amount as Indian Rupee with symbol (e.g., "₹14,200") */
fun formatCurrency(amount: Int): String {
    val formatter = NumberFormat.getNumberInstance(Locale("en", "IN"))
    formatter.maximumFractionDigits = 0
    return "\u20B9${formatter.format(amount)}"
}

/** Format amount as compact with symbol (e.g., "₹14.2K") */
fun formatCurrencyCompact(amount: Int): String {
    return when {
        amount >= 100000 -> "\u20B9${String.format("%.1f", amount / 100000.0)}L"
        amount >= 1000 -> "\u20B9${String.format("%.1f", amount / 1000.0)}K"
        else -> "\u20B9$amount"
    }
}

/** Parse ISO-8601 timestamp to epoch millis, returning null on failure */
fun parseIso(iso: String?): Long? {
    if (iso == null) return null
    return try {
        Instant.parse(iso).toEpochMilli()
    } catch (_: Exception) {
        null
    }
}

/** Format a countdown from now to a deadline (e.g., "45 min", "2h 30m", "Overdue") */
fun formatCountdown(deadlineIso: String?): String? {
    val deadline = parseIso(deadlineIso) ?: return null
    val now = System.currentTimeMillis()
    val diff = deadline - now

    if (diff <= 0) return "Overdue"

    val duration = Duration.ofMillis(diff)
    val hours = duration.toHours()
    val minutes = duration.toMinutes() % 60

    return when {
        hours > 24 -> "${hours / 24}d ${hours % 24}h"
        hours > 0 -> "${hours}h ${minutes}m"
        minutes > 0 -> "${minutes} min"
        else -> "< 1 min"
    }
}

/** Returns true if deadline has passed */
fun isOverdue(deadlineIso: String?): Boolean {
    val deadline = parseIso(deadlineIso) ?: return false
    return System.currentTimeMillis() > deadline
}

/** Format date as "15 Feb 2026" (Indian locale) */
fun formatDate(iso: String?): String {
    val time = parseIso(iso) ?: return ""
    val instant = Instant.ofEpochMilli(time)
    val date = instant.atZone(java.time.ZoneId.systemDefault()).toLocalDate()
    val formatter = java.time.format.DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH)
    return date.format(formatter)
}

/** Format relative date (e.g., "Today", "Yesterday", "3d ago", or date) */
fun formatRelativeDate(iso: String?): String {
    val time = parseIso(iso) ?: return ""
    val diff = System.currentTimeMillis() - time
    val days = diff / (1000 * 60 * 60 * 24)
    return when {
        days == 0L -> "Today"
        days == 1L -> "Yesterday"
        days < 7 -> "${days}d ago"
        else -> formatDate(iso)
    }
}

/** Format relative time ago (e.g., "2h ago", "3d ago") */
fun formatTimeAgo(iso: String?): String {
    val time = parseIso(iso) ?: return ""
    val diff = System.currentTimeMillis() - time
    if (diff < 0) return "just now"

    val minutes = diff / 60000
    val hours = minutes / 60
    val days = hours / 24

    return when {
        days > 0 -> "${days}d ago"
        hours > 0 -> "${hours}h ago"
        minutes > 0 -> "${minutes}m ago"
        else -> "just now"
    }
}
