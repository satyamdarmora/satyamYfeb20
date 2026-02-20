package com.wiom.csp.ui.theme

import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
import com.wiom.csp.domain.model.AppTheme

/** Custom color scheme matching the web CSS variables exactly. */
@Stable
data class WiomColors(
    val brandPrimary: Color,
    val brandLight: Color,
    val brandLighter: Color,
    val brandLightest: Color,
    val brandSecondary: Color,
    val goldStart: Color,
    val goldMid: Color,
    val goldEnd: Color,
    val bgPrimary: Color,
    val bgSecondary: Color,
    val bgCard: Color,
    val bgCardHover: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color,
    val positive: Color,
    val positiveLight: Color,
    val positiveBg: Color,
    val negative: Color,
    val negativeLight: Color,
    val negativeBg: Color,
    val warning: Color,
    val warningDark: Color,
    val warningLight: Color,
    val warningBg: Color,
    val borderSubtle: Color,
    val cardBorder: Color,
    val chipBg: Color,
    val money: Color,
    val moneyLight: Color,
    val moneyBg: Color,
    val accentRestore: Color,
    val accentGold: Color,
    val stripBg: Color,
    val positiveSubtle: Color,
    val negativeSubtle: Color,
    val warningSubtle: Color,
    val brandSubtle: Color,
    val moneySubtle: Color,
    val restoreSubtle: Color,
    val goldSubtle: Color,
    val cardGradientStart: Color,
    val cardGradientEnd: Color,
    val overlayBg: Color,
    val isDark: Boolean,
)

private val DarkWiomColors = WiomColors(
    brandPrimary = DarkColors.brandPrimary,
    brandLight = DarkColors.brandLight,
    brandLighter = DarkColors.brandLighter,
    brandLightest = DarkColors.brandLightest,
    brandSecondary = DarkColors.brandSecondary,
    goldStart = DarkColors.goldStart,
    goldMid = DarkColors.goldMid,
    goldEnd = DarkColors.goldEnd,
    bgPrimary = DarkColors.bgPrimary,
    bgSecondary = DarkColors.bgSecondary,
    bgCard = DarkColors.bgCard,
    bgCardHover = DarkColors.bgCardHover,
    textPrimary = DarkColors.textPrimary,
    textSecondary = DarkColors.textSecondary,
    textMuted = DarkColors.textMuted,
    positive = DarkColors.positive,
    positiveLight = DarkColors.positiveLight,
    positiveBg = DarkColors.positiveBg,
    negative = DarkColors.negative,
    negativeLight = DarkColors.negativeLight,
    negativeBg = DarkColors.negativeBg,
    warning = DarkColors.warning,
    warningDark = DarkColors.warningDark,
    warningLight = DarkColors.warningLight,
    warningBg = DarkColors.warningBg,
    borderSubtle = DarkColors.borderSubtle,
    cardBorder = DarkColors.cardBorder,
    chipBg = DarkColors.chipBg,
    money = DarkColors.money,
    moneyLight = DarkColors.moneyLight,
    moneyBg = DarkColors.moneyBg,
    accentRestore = DarkColors.accentRestore,
    accentGold = DarkColors.accentGold,
    stripBg = DarkColors.stripBg,
    positiveSubtle = DarkColors.positiveSubtle,
    negativeSubtle = DarkColors.negativeSubtle,
    warningSubtle = DarkColors.warningSubtle,
    brandSubtle = DarkColors.brandSubtle,
    moneySubtle = DarkColors.moneySubtle,
    restoreSubtle = DarkColors.restoreSubtle,
    goldSubtle = DarkColors.goldSubtle,
    cardGradientStart = DarkColors.cardGradientStart,
    cardGradientEnd = DarkColors.cardGradientEnd,
    overlayBg = DarkColors.overlayBg,
    isDark = true,
)

private val LightWiomColors = WiomColors(
    brandPrimary = LightColors.brandPrimary,
    brandLight = LightColors.brandLight,
    brandLighter = LightColors.brandLighter,
    brandLightest = LightColors.brandLightest,
    brandSecondary = LightColors.brandSecondary,
    goldStart = LightColors.goldStart,
    goldMid = LightColors.goldMid,
    goldEnd = LightColors.goldEnd,
    bgPrimary = LightColors.bgPrimary,
    bgSecondary = LightColors.bgSecondary,
    bgCard = LightColors.bgCard,
    bgCardHover = LightColors.bgCardHover,
    textPrimary = LightColors.textPrimary,
    textSecondary = LightColors.textSecondary,
    textMuted = LightColors.textMuted,
    positive = LightColors.positive,
    positiveLight = LightColors.positiveLight,
    positiveBg = LightColors.positiveBg,
    negative = LightColors.negative,
    negativeLight = LightColors.negativeLight,
    negativeBg = LightColors.negativeBg,
    warning = LightColors.warning,
    warningDark = LightColors.warningDark,
    warningLight = LightColors.warningLight,
    warningBg = LightColors.warningBg,
    borderSubtle = LightColors.borderSubtle,
    cardBorder = LightColors.cardBorder,
    chipBg = LightColors.chipBg,
    money = LightColors.money,
    moneyLight = LightColors.moneyLight,
    moneyBg = LightColors.moneyBg,
    accentRestore = LightColors.accentRestore,
    accentGold = LightColors.accentGold,
    stripBg = LightColors.stripBg,
    positiveSubtle = LightColors.positiveSubtle,
    negativeSubtle = LightColors.negativeSubtle,
    warningSubtle = LightColors.warningSubtle,
    brandSubtle = LightColors.brandSubtle,
    moneySubtle = LightColors.moneySubtle,
    restoreSubtle = LightColors.restoreSubtle,
    goldSubtle = LightColors.goldSubtle,
    cardGradientStart = LightColors.cardGradientStart,
    cardGradientEnd = LightColors.cardGradientEnd,
    overlayBg = LightColors.overlayBg,
    isDark = false,
)

val LocalWiomColors = staticCompositionLocalOf { DarkWiomColors }

@Composable
fun WiomCspTheme(
    appTheme: AppTheme = AppTheme.DARK,
    content: @Composable () -> Unit
) {
    val colors = when (appTheme) {
        AppTheme.DARK -> DarkWiomColors
        AppTheme.STATE_COLOR_CHECK -> LightWiomColors
    }

    CompositionLocalProvider(LocalWiomColors provides colors) {
        content()
    }
}

/** Convenience accessor for WiomColors from composables. */
object WiomCspTheme {
    val colors: WiomColors
        @Composable
        @ReadOnlyComposable
        get() = LocalWiomColors.current
}
