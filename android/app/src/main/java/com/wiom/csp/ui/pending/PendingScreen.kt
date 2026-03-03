package com.wiom.csp.ui.pending

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import com.wiom.csp.R
import com.wiom.csp.data.remote.dto.InfoExchangeDto
import com.wiom.csp.data.remote.dto.StatusData
import com.wiom.csp.ui.theme.WiomCspTheme

@Composable
fun PendingScreen(viewModel: PendingViewModel, onLogout: (() -> Unit)? = null) {
    val statusData by viewModel.statusData.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val submitting by viewModel.submitting.collectAsState()
    val error by viewModel.error.collectAsState()
    val submitSuccess by viewModel.submitSuccess.collectAsState()
    val selectedFiles by viewModel.selectedFiles.collectAsState()
    val responseText by viewModel.responseText.collectAsState()
    val paymentState by viewModel.paymentState.collectAsState()
    val paymentLink by viewModel.paymentLink.collectAsState()
    val paymentError by viewModel.paymentError.collectAsState()
    val isSecurityDeposit by viewModel.isSecurityDeposit.collectAsState()
    val shouldLaunchBrowser by viewModel.shouldLaunchBrowser.collectAsState()
    val browserContext = LocalContext.current
    val colors = WiomCspTheme.colors

    // Auto-open browser only when user explicitly clicked Pay
    LaunchedEffect(shouldLaunchBrowser, paymentLink) {
        if (shouldLaunchBrowser && paymentLink != null) {
            viewModel.clearBrowserLaunch()
            try {
                val customTabsIntent = androidx.browser.customtabs.CustomTabsIntent.Builder()
                    .setShowTitle(true)
                    .build()
                customTabsIntent.launchUrl(browserContext, Uri.parse(paymentLink))
            } catch (_: Exception) {
                val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(paymentLink))
                browserContext.startActivity(intent)
            }
        }
    }
    val scrollState = rememberScrollState()

    // Clear success message after showing
    LaunchedEffect(submitSuccess) {
        if (submitSuccess) {
            kotlinx.coroutines.delay(3000)
            viewModel.clearSubmitSuccess()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgPrimary)
            .statusBarsPadding()
            .navigationBarsPadding()
            .imePadding()
    ) {
        if (loading && statusData == null) {
            // Loading state
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = colors.brandPrimary)
                    Spacer(Modifier.height(16.dp))
                    Text(stringResource(R.string.pending_checking), color = colors.textMuted, fontSize = 14.sp)
                }
            }
        } else if (statusData != null) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .padding(horizontal = 20.dp, vertical = 24.dp)
            ) {
                val data = statusData!!
                val partnerStatus = data.partnerStatus ?: data.status ?: "PENDING"

                when {
                    // Show payment screen if fee not paid (regardless of status)
                    !data.feePaid && (partnerStatus == "PENDING" || partnerStatus == "PAYMENT_PENDING") -> {
                        PaymentScreen(
                            data = data,
                            paymentState = paymentState,
                            paymentLink = paymentLink,
                            paymentError = paymentError,
                            onInitiatePayment = viewModel::initiatePayment,
                            onRetry = viewModel::retryPayment,
                            colors = colors
                        )
                    }
                    partnerStatus == "PENDING" -> PendingState(colors)
                    partnerStatus == "PAYMENT_PENDING" -> PaymentPendingState(data, colors)
                    partnerStatus == "INFO_REQUIRED" -> InfoRequiredState(
                        data = data,
                        colors = colors,
                        selectedFiles = selectedFiles,
                        responseText = responseText,
                        submitting = submitting,
                        error = error,
                        submitSuccess = submitSuccess,
                        onSelectFile = viewModel::selectFile,
                        onRemoveFile = viewModel::removeFile,
                        onResponseTextChange = viewModel::setResponseText,
                        onSubmit = viewModel::submitResponse,
                        onClearError = viewModel::clearError
                    )
                    partnerStatus == "UNDER_REVIEW" -> UnderReviewState(colors)
                    partnerStatus == "APPROVED" || partnerStatus == "TRAINING" -> TrainingState(data, colors)
                    partnerStatus == "TRAINING_FAILED" -> TrainingFailedState(colors)
                    partnerStatus == "REJECTED" -> RejectedState(data, colors)
                    partnerStatus == "ACTIVE" && !data.securityDepositPaid -> {
                        SecurityDepositScreen(
                            data = data,
                            paymentState = paymentState,
                            paymentLink = paymentLink,
                            paymentError = paymentError,
                            onInitiatePayment = viewModel::initiateSecurityDeposit,
                            onRetry = viewModel::retryPayment,
                            colors = colors
                        )
                    }
                    partnerStatus == "ACTIVE" -> ActiveState(
                        colors = colors,
                        onContinue = viewModel::goToDashboard,
                        onLogout = onLogout
                    )
                    else -> PendingState(colors)
                }

                // Logout button (hide for ActiveState since it has its own)
                val isActiveWithDeposit = partnerStatus == "ACTIVE" && data.securityDepositPaid
                if (onLogout != null && !isActiveWithDeposit) {
                    Spacer(Modifier.height(24.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .clickable { onLogout() }
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Logout,
                            contentDescription = "Logout",
                            tint = colors.negative,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            stringResource(R.string.pending_logout),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.negative
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))
                Text(
                    stringResource(R.string.pending_footer),
                    fontSize = 12.sp,
                    color = colors.textMuted,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(16.dp))
            }
        } else {
            // Error state
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(32.dp)
                ) {
                    Icon(
                        Icons.Filled.ErrorOutline,
                        contentDescription = null,
                        tint = colors.negative,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(Modifier.height(16.dp))
                    Text(
                        error ?: stringResource(R.string.pending_failed_load),
                        color = colors.textSecondary,
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = { viewModel.startPolling() },
                        colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(stringResource(R.string.pending_retry))
                    }
                }
            }
        }
    }
}

// ─── PAYMENT SCREEN ───
@Composable
private fun PaymentScreen(
    data: StatusData,
    paymentState: PaymentUiState,
    paymentLink: String?,
    paymentError: String?,
    onInitiatePayment: () -> Unit,
    onRetry: () -> Unit,
    colors: com.wiom.csp.ui.theme.WiomColors
) {
    val fee = data.registrationFee?.toInt() ?: 2000
    val regLabel = data.registrationId?.let { "REG-${it.toString().padStart(6, '0')}" } ?: "CSP Registration"

    val context = LocalContext.current

    fun openPaymentInBrowser(url: String) {
        try {
            val customTabsIntent = androidx.browser.customtabs.CustomTabsIntent.Builder()
                .setShowTitle(true)
                .build()
            customTabsIntent.launchUrl(context, Uri.parse(url))
        } catch (_: Exception) {
            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(url))
            context.startActivity(intent)
        }
    }

    when (paymentState) {
        PaymentUiState.SUCCESS -> {
            StatusHeader(
                icon = Icons.Outlined.CheckCircle,
                iconBg = colors.positiveBg,
                iconTint = colors.positive,
                title = stringResource(R.string.pending_payment_success_title),
                subtitle = stringResource(R.string.pending_payment_success_desc),
                colors = colors
            )
            Spacer(Modifier.height(16.dp))
            Text(stringResource(R.string.pending_refreshing), fontSize = 13.sp, color = colors.textMuted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
        }

        PaymentUiState.VERIFYING -> {
            StatusHeader(
                icon = Icons.Outlined.Sync,
                iconBg = colors.brandPrimary.copy(alpha = 0.08f),
                iconTint = colors.brandPrimary,
                title = stringResource(R.string.pending_verifying_title),
                subtitle = stringResource(R.string.pending_verifying_desc),
                colors = colors
            )

            Spacer(Modifier.height(24.dp))

            // Amount card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(colors.bgCard)
                    .padding(20.dp)
            ) {
                Column {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(stringResource(R.string.pending_amount), fontSize = 13.sp, color = colors.textMuted, fontWeight = FontWeight.Medium)
                        Text("\u20B9${"%,d".format(fee)}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(stringResource(R.string.pending_for), fontSize = 13.sp, color = colors.textMuted, fontWeight = FontWeight.Medium)
                        Text(regLabel, fontSize = 13.sp, color = colors.textSecondary, fontWeight = FontWeight.Medium)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Info
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(colors.brandPrimary.copy(alpha = 0.06f))
                    .border(1.dp, colors.brandPrimary.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                    .padding(12.dp, 14.dp)
            ) {
                Text(stringResource(R.string.pending_browser_info), fontSize = 13.sp, color = colors.textSecondary, lineHeight = 20.sp)
            }

            if (paymentLink != null) {
                Spacer(Modifier.height(20.dp))
                Button(
                    onClick = { openPaymentInBrowser(paymentLink) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary)
                ) {
                    Text(stringResource(R.string.pending_open_payment_page), fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        PaymentUiState.FAILED -> {
            StatusHeader(
                icon = Icons.Outlined.ErrorOutline,
                iconBg = colors.negativeBg,
                iconTint = colors.negative,
                title = stringResource(R.string.pending_payment_issue),
                subtitle = paymentError ?: stringResource(R.string.pending_payment_timeout),
                colors = colors
            )
            Spacer(Modifier.height(24.dp))
            Button(
                onClick = onRetry,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary)
            ) {
                Text(stringResource(R.string.pending_try_again), fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        else -> {
            // IDLE / PROCESSING — main payment screen
            StatusHeader(
                icon = Icons.Outlined.CreditCard,
                iconBg = colors.brandPrimary.copy(alpha = 0.08f),
                iconTint = colors.brandPrimary,
                title = stringResource(R.string.pending_registration_fee),
                subtitle = stringResource(R.string.pending_registration_fee_desc),
                colors = colors
            )

            Spacer(Modifier.height(24.dp))

            // Fee breakdown card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(colors.bgCard)
                    .padding(20.dp, 24.dp)
            ) {
                Column {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text(stringResource(R.string.pending_csp_reg_fee), fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                            Spacer(Modifier.height(2.dp))
                            Text(regLabel, fontSize = 13.sp, color = colors.textMuted)
                        }
                        Text("\u20B9${"%,d".format(fee)}", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                    }

                    Spacer(Modifier.height(16.dp))
                    HorizontalDivider(color = colors.borderSubtle, thickness = 1.dp)
                    Spacer(Modifier.height(14.dp))

                    listOf(stringResource(R.string.pending_onboarding_training) to stringResource(R.string.pending_included), stringResource(R.string.pending_dashboard_access) to stringResource(R.string.pending_included), stringResource(R.string.pending_business_support) to stringResource(R.string.pending_included)).forEach { (label, value) ->
                        Row(Modifier.fillMaxWidth().padding(vertical = 3.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(label, fontSize = 13.sp, color = colors.textMuted)
                            Text(value, fontSize = 13.sp, color = colors.textMuted)
                        }
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            // Trust signals
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.positive.copy(alpha = 0.06f))
                    .border(1.dp, colors.positive.copy(alpha = 0.12f), RoundedCornerShape(12.dp))
                    .padding(14.dp, 18.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Top) {
                        Icon(Icons.Outlined.Shield, contentDescription = null, tint = colors.positive, modifier = Modifier.size(16.dp))
                        Text(stringResource(R.string.pending_secure_juspay), fontSize = 13.sp, color = colors.textSecondary, lineHeight = 18.sp)
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Top) {
                        Icon(Icons.Outlined.Schedule, contentDescription = null, tint = colors.positive, modifier = Modifier.size(16.dp))
                        Text(stringResource(R.string.pending_full_refund), fontSize = 13.sp, color = colors.textSecondary, lineHeight = 18.sp)
                    }
                }
            }

            // Error
            if (paymentError != null) {
                Spacer(Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(colors.negative.copy(alpha = 0.08f))
                        .border(1.dp, colors.negative.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                        .padding(12.dp, 16.dp)
                ) {
                    Text(paymentError, fontSize = 13.sp, color = colors.negative, lineHeight = 18.sp)
                }
            }

            Spacer(Modifier.height(24.dp))

            // Pay button
            Button(
                onClick = {
                    onInitiatePayment()
                },
                enabled = paymentState != PaymentUiState.PROCESSING,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colors.brandPrimary,
                    disabledContainerColor = colors.brandPrimary.copy(alpha = 0.7f)
                )
            ) {
                if (paymentState == PaymentUiState.PROCESSING) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                    Spacer(Modifier.width(8.dp))
                    Text(stringResource(R.string.pending_setting_up), fontSize = 16.sp)
                } else {
                    Text(stringResource(R.string.pending_pay_amount, "%,d".format(fee)), fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(Modifier.height(12.dp))
            Text(
                stringResource(R.string.pending_redirect_note),
                fontSize = 12.sp,
                color = colors.textMuted,
                textAlign = TextAlign.Center,
                lineHeight = 18.sp,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

// ─── SECURITY DEPOSIT ───
@Composable
private fun SecurityDepositScreen(
    data: StatusData,
    paymentState: PaymentUiState,
    paymentLink: String?,
    paymentError: String?,
    onInitiatePayment: () -> Unit,
    onRetry: () -> Unit,
    colors: com.wiom.csp.ui.theme.WiomColors
) {
    val amount = data.securityDepositAmount
    val batchSize = data.deviceBatchSize

    StatusHeader(
        icon = Icons.Outlined.Verified,
        iconBg = Color(0xFF1A3A2A),
        iconTint = colors.positive,
        title = stringResource(R.string.pending_reg_approved),
        subtitle = stringResource(R.string.pending_complete_deposit),
        colors = colors
    )

    Spacer(Modifier.height(24.dp))

    // Success state
    if (paymentState == PaymentUiState.SUCCESS) {
        Box(
            modifier = Modifier.fillMaxWidth().padding(32.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Filled.CheckCircle, null, tint = colors.positive, modifier = Modifier.size(64.dp))
                Spacer(Modifier.height(16.dp))
                Text(stringResource(R.string.pending_deposit_paid), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                Spacer(Modifier.height(8.dp))
                Text(stringResource(R.string.pending_devices_allocated, batchSize.toString()), fontSize = 14.sp, color = colors.textSecondary, textAlign = TextAlign.Center)
            }
        }
        return
    }

    // Deposit card
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = colors.bgCard)
    ) {
        Column(Modifier.padding(20.dp)) {
            Text(stringResource(R.string.pending_netbox_deposit), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
            Spacer(Modifier.height(16.dp))

            // Info rows
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(stringResource(R.string.pending_security_deposit), fontSize = 14.sp, color = colors.textSecondary)
                Text("\u20B9${"%,d".format(amount)}", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
            }
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(stringResource(R.string.pending_devices_covered), fontSize = 14.sp, color = colors.textSecondary)
                Text(stringResource(R.string.pending_up_to_netboxes), fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
            }
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(stringResource(R.string.pending_first_batch), fontSize = 14.sp, color = colors.textSecondary)
                Text(stringResource(R.string.pending_n_devices, batchSize.toString()), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = colors.brandPrimary)
            }

            Spacer(Modifier.height(20.dp))
            Divider(color = colors.borderSubtle)
            Spacer(Modifier.height(16.dp))

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(stringResource(R.string.pending_total_payable), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                Text("\u20B9${"%,d".format(amount)}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = colors.positive)
            }
        }
    }

    Spacer(Modifier.height(16.dp))

    // Trust signals
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = colors.bgCard.copy(alpha = 0.5f))
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Shield, null, tint = colors.positive, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text(stringResource(R.string.pending_refundable_note), fontSize = 12.sp, color = colors.textSecondary)
            }
            Spacer(Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Inventory2, null, tint = colors.brandPrimary, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text(stringResource(R.string.pending_batch_shipped, batchSize.toString()), fontSize = 12.sp, color = colors.textSecondary)
            }
        }
    }

    Spacer(Modifier.height(24.dp))

    // Error
    if (paymentError != null) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = colors.negativeBg)
        ) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Warning, null, tint = colors.negative, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(12.dp))
                Text(paymentError, fontSize = 13.sp, color = colors.negative)
            }
        }
        Spacer(Modifier.height(16.dp))
    }

    // Button
    when (paymentState) {
        PaymentUiState.IDLE -> {
            Button(
                onClick = onInitiatePayment,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = colors.positive)
            ) {
                Icon(Icons.Outlined.Payment, null, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Text(stringResource(R.string.pending_pay_deposit, "%,d".format(amount)), fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
        PaymentUiState.PROCESSING -> {
            Button(
                onClick = {},
                enabled = false,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = colors.positive.copy(alpha = 0.7f))
            ) {
                CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(12.dp))
                Text(stringResource(R.string.pending_initiating), fontSize = 14.sp)
            }
        }
        PaymentUiState.VERIFYING -> {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = colors.brandPrimary.copy(alpha = 0.08f))
            ) {
                Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = colors.brandPrimary, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
                    Spacer(Modifier.height(12.dp))
                    Text(stringResource(R.string.pending_checking_status), fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                    Text(stringResource(R.string.pending_dont_close), fontSize = 12.sp, color = colors.textMuted)
                }
            }
            Spacer(Modifier.height(12.dp))
            OutlinedButton(
                onClick = onRetry,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            ) { Text(stringResource(R.string.pending_retry_payment), color = colors.textSecondary) }
        }
        PaymentUiState.FAILED -> {
            Button(
                onClick = onRetry,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary)
            ) {
                Icon(Icons.Filled.Refresh, null, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Text(stringResource(R.string.pending_try_again), fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
        PaymentUiState.SUCCESS -> { /* handled above */ }
    }
}

// ─── PENDING ───
@Composable
private fun PendingState(colors: com.wiom.csp.ui.theme.WiomColors) {
    StatusHeader(
        icon = Icons.Outlined.HourglassTop,
        iconBg = colors.warningBg,
        iconTint = colors.warning,
        title = stringResource(R.string.pending_under_review_title),
        subtitle = stringResource(R.string.pending_under_review_desc),
        colors = colors
    )

    Spacer(Modifier.height(24.dp))
    ProgressSteps(
        steps = listOf(
            StepItem(stringResource(R.string.pending_step_submitted), true),
            StepItem(stringResource(R.string.pending_step_doc_verify), false),
            StepItem(stringResource(R.string.pending_step_admin_approval), false),
            StepItem(stringResource(R.string.pending_step_training), false),
            StepItem(stringResource(R.string.pending_step_active), false)
        ),
        colors = colors
    )
}

// ─── PAYMENT PENDING ───
@Composable
private fun PaymentPendingState(data: StatusData, colors: com.wiom.csp.ui.theme.WiomColors) {
    StatusHeader(
        icon = Icons.Outlined.Payment,
        iconBg = colors.warningBg,
        iconTint = colors.warning,
        title = stringResource(R.string.pending_payment_pending_title),
        subtitle = stringResource(R.string.pending_payment_pending_desc),
        colors = colors
    )

    if (data.registrationFee != null) {
        Spacer(Modifier.height(16.dp))
        InfoCard(
            label = stringResource(R.string.pending_payment_pending_fee),
            value = "₹${data.registrationFee.toInt()}",
            colors = colors
        )
    }
}

// ─── INFO REQUIRED ───
@Composable
private fun InfoRequiredState(
    data: StatusData,
    colors: com.wiom.csp.ui.theme.WiomColors,
    selectedFiles: Map<String, Uri>,
    responseText: String,
    submitting: Boolean,
    error: String?,
    submitSuccess: Boolean,
    onSelectFile: (String, Uri) -> Unit,
    onRemoveFile: (String) -> Unit,
    onResponseTextChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onClearError: () -> Unit
) {
    StatusHeader(
        icon = Icons.Outlined.Info,
        iconBg = colors.warningBg,
        iconTint = colors.warning,
        title = stringResource(R.string.pending_info_required_title),
        subtitle = stringResource(R.string.pending_info_required_desc),
        colors = colors
    )

    // Conversation history
    if (data.infoExchanges.isNotEmpty()) {
        Spacer(Modifier.height(24.dp))
        Text(
            stringResource(R.string.pending_conversation),
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = colors.textMuted,
            letterSpacing = 1.sp
        )
        Spacer(Modifier.height(12.dp))

        data.infoExchanges.forEach { exchange ->
            ConversationBubble(exchange, colors)
            Spacer(Modifier.height(8.dp))
        }
    }

    // Find latest admin message with requestedDocs
    val latestAdminExchange = data.infoExchanges
        .lastOrNull { it.sender.equals("ADMIN", ignoreCase = true) && it.requestedDocs.isNotEmpty() }

    val requestedDocs = latestAdminExchange?.requestedDocs ?: emptyList()

    if (requestedDocs.isNotEmpty()) {
        Spacer(Modifier.height(24.dp))
        Text(
            stringResource(R.string.pending_upload_docs),
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = colors.textMuted,
            letterSpacing = 1.sp
        )
        Spacer(Modifier.height(12.dp))

        requestedDocs.forEach { docType ->
            DocumentUploadRow(
                docType = docType,
                selectedUri = selectedFiles[docType],
                onFileSelected = { uri -> onSelectFile(docType, uri) },
                onRemove = { onRemoveFile(docType) },
                colors = colors
            )
            Spacer(Modifier.height(8.dp))
        }
    }

    // Text response
    Spacer(Modifier.height(16.dp))
    Text(
        stringResource(R.string.pending_your_response),
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        color = colors.textMuted,
        letterSpacing = 1.sp
    )
    Spacer(Modifier.height(8.dp))
    OutlinedTextField(
        value = responseText,
        onValueChange = {
            onResponseTextChange(it)
            onClearError()
        },
        placeholder = { Text(stringResource(R.string.pending_response_hint), color = colors.textMuted, fontSize = 14.sp) },
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 100.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = colors.brandPrimary,
            unfocusedBorderColor = colors.borderSubtle,
            focusedTextColor = colors.textPrimary,
            unfocusedTextColor = colors.textPrimary,
            cursorColor = colors.brandPrimary,
            focusedContainerColor = colors.bgCard,
            unfocusedContainerColor = colors.bgCard
        ),
        textStyle = LocalTextStyle.current.copy(fontSize = 14.sp),
        shape = RoundedCornerShape(12.dp)
    )

    // Error
    if (error != null) {
        Spacer(Modifier.height(12.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(colors.negative.copy(alpha = 0.1f))
                .padding(12.dp)
        ) {
            Text(error, fontSize = 13.sp, color = colors.negative, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
        }
    }

    // Success
    if (submitSuccess) {
        Spacer(Modifier.height(12.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(colors.positive.copy(alpha = 0.1f))
                .padding(12.dp)
        ) {
            Text(stringResource(R.string.pending_response_success), fontSize = 13.sp, color = colors.positive, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
        }
    }

    // Submit
    Spacer(Modifier.height(20.dp))
    Button(
        onClick = onSubmit,
        enabled = !submitting,
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = colors.brandPrimary,
            disabledContainerColor = colors.brandPrimary.copy(alpha = 0.7f)
        )
    ) {
        if (submitting) {
            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
        } else {
            @Suppress("DEPRECATION")
            Icon(Icons.Filled.Send, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text(stringResource(R.string.pending_submit_response), fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

// ─── UNDER REVIEW ───
@Composable
private fun UnderReviewState(colors: com.wiom.csp.ui.theme.WiomColors) {
    StatusHeader(
        icon = Icons.Outlined.Search,
        iconBg = colors.brandSubtle,
        iconTint = colors.brandPrimary,
        title = stringResource(R.string.pending_review2_title),
        subtitle = stringResource(R.string.pending_review2_desc),
        colors = colors
    )
    Spacer(Modifier.height(24.dp))
    ProgressSteps(
        steps = listOf(
            StepItem(stringResource(R.string.pending_step_submitted), true),
            StepItem(stringResource(R.string.pending_step_doc_verify), true),
            StepItem(stringResource(R.string.pending_step_admin_review), false),
            StepItem(stringResource(R.string.pending_step_training), false),
            StepItem(stringResource(R.string.pending_step_active), false)
        ),
        colors = colors
    )
}

// ─── TRAINING ───
@Composable
private fun TrainingState(data: StatusData, colors: com.wiom.csp.ui.theme.WiomColors) {
    StatusHeader(
        icon = Icons.Outlined.School,
        iconBg = colors.positiveBg,
        iconTint = colors.positive,
        title = stringResource(R.string.pending_training_progress),
        subtitle = stringResource(R.string.pending_training_progress_desc),
        colors = colors
    )
    Spacer(Modifier.height(24.dp))
    ProgressSteps(
        steps = listOf(
            StepItem(stringResource(R.string.pending_step_submitted), true),
            StepItem(stringResource(R.string.pending_step_doc_verify), true),
            StepItem(stringResource(R.string.pending_step_admin_approval), true),
            StepItem(stringResource(R.string.pending_step_training), false),
            StepItem(stringResource(R.string.pending_step_active), false)
        ),
        colors = colors
    )
}

// ─── TRAINING FAILED ───
@Composable
private fun TrainingFailedState(colors: com.wiom.csp.ui.theme.WiomColors) {
    StatusHeader(
        icon = Icons.Outlined.Cancel,
        iconBg = colors.negativeBg,
        iconTint = colors.negative,
        title = stringResource(R.string.pending_training_failed_title),
        subtitle = stringResource(R.string.pending_training_failed_desc),
        colors = colors
    )
}

// ─── REJECTED ───
@Composable
private fun RejectedState(data: StatusData, colors: com.wiom.csp.ui.theme.WiomColors) {
    StatusHeader(
        icon = Icons.Outlined.Block,
        iconBg = colors.negativeBg,
        iconTint = colors.negative,
        title = stringResource(R.string.pending_rejected_title),
        subtitle = stringResource(R.string.pending_rejected_desc),
        colors = colors
    )

    if (data.rejectionReason != null) {
        Spacer(Modifier.height(16.dp))
        InfoCard(label = stringResource(R.string.pending_reason), value = data.rejectionReason, colors = colors)
    }

    if (data.feeRefunded) {
        Spacer(Modifier.height(12.dp))
        InfoCard(label = stringResource(R.string.pending_fee_status), value = stringResource(R.string.pending_fee_refunded), colors = colors)
    }
}

// ─── ACTIVE ───
@Composable
private fun ActiveState(
    colors: com.wiom.csp.ui.theme.WiomColors,
    onContinue: () -> Unit,
    onLogout: (() -> Unit)?
) {
    StatusHeader(
        icon = Icons.Outlined.CheckCircle,
        iconBg = colors.positiveBg,
        iconTint = colors.positive,
        title = stringResource(R.string.pending_active_title),
        subtitle = stringResource(R.string.pending_active_desc),
        colors = colors
    )
    Spacer(Modifier.height(32.dp))
    Button(
        onClick = onContinue,
        modifier = Modifier
            .fillMaxWidth()
            .height(50.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary)
    ) {
        Icon(Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(8.dp))
        Text(stringResource(R.string.pending_go_dashboard), fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
    }
    if (onLogout != null) {
        Spacer(Modifier.height(12.dp))
        OutlinedButton(
            onClick = onLogout,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.negative)
        ) {
            Icon(Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(8.dp))
            Text(stringResource(R.string.pending_logout), fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

// ─── SHARED COMPONENTS ───

@Composable
private fun StatusHeader(
    icon: ImageVector,
    iconBg: Color,
    iconTint: Color,
    title: String,
    subtitle: String,
    colors: com.wiom.csp.ui.theme.WiomColors
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(24.dp))
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(iconBg),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(36.dp))
        }
        Spacer(Modifier.height(20.dp))
        Text(
            title,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = colors.textPrimary,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(8.dp))
        Text(
            subtitle,
            fontSize = 14.sp,
            color = colors.textSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 20.sp
        )
    }
}

private data class StepItem(val label: String, val completed: Boolean)

@Composable
private fun ProgressSteps(steps: List<StepItem>, colors: com.wiom.csp.ui.theme.WiomColors) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(colors.bgCard)
            .border(1.dp, colors.borderSubtle, RoundedCornerShape(16.dp))
            .padding(20.dp)
    ) {
        steps.forEachIndexed { index, step ->
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Step indicator
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(if (step.completed) colors.positive else colors.bgSecondary)
                        .then(
                            if (!step.completed) Modifier.border(1.dp, colors.borderSubtle, CircleShape)
                            else Modifier
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    if (step.completed) {
                        Icon(
                            Icons.Filled.Check,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    } else {
                        Text(
                            "${index + 1}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textMuted
                        )
                    }
                }
                Spacer(Modifier.width(12.dp))
                Text(
                    step.label,
                    fontSize = 14.sp,
                    fontWeight = if (step.completed) FontWeight.SemiBold else FontWeight.Normal,
                    color = if (step.completed) colors.textPrimary else colors.textMuted
                )
            }
            // Connector line
            if (index < steps.size - 1) {
                Box(
                    modifier = Modifier
                        .padding(start = 13.dp)
                        .width(2.dp)
                        .height(20.dp)
                        .background(if (step.completed) colors.positive.copy(alpha = 0.4f) else colors.borderSubtle)
                )
            }
        }
    }
}

@Composable
private fun InfoCard(label: String, value: String, colors: com.wiom.csp.ui.theme.WiomColors) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(colors.bgCard)
            .border(1.dp, colors.borderSubtle, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Text(label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = colors.textMuted, letterSpacing = 0.5.sp)
        Spacer(Modifier.height(4.dp))
        Text(value, fontSize = 14.sp, color = colors.textPrimary, lineHeight = 20.sp)
    }
}

@Composable
private fun ConversationBubble(exchange: InfoExchangeDto, colors: com.wiom.csp.ui.theme.WiomColors) {
    val isAdmin = exchange.sender.equals("ADMIN", ignoreCase = true)
    val bgColor = if (isAdmin) colors.brandSubtle else colors.bgCard
    val borderColor = if (isAdmin) colors.brandPrimary.copy(alpha = 0.3f) else colors.borderSubtle

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .border(1.dp, borderColor, RoundedCornerShape(12.dp))
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    if (isAdmin) Icons.Outlined.AdminPanelSettings else Icons.Outlined.Person,
                    contentDescription = null,
                    tint = if (isAdmin) colors.brandPrimary else colors.textSecondary,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    if (isAdmin) "Admin" else "You",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isAdmin) colors.brandPrimary else colors.textSecondary
                )
            }
            if (exchange.createdAt != null) {
                Text(
                    formatDate(exchange.createdAt),
                    fontSize = 11.sp,
                    color = colors.textMuted
                )
            }
        }

        if (exchange.message != null) {
            Spacer(Modifier.height(8.dp))
            Text(exchange.message, fontSize = 14.sp, color = colors.textPrimary, lineHeight = 20.sp)
        }

        if (exchange.requestedDocs.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text("Requested documents:", fontSize = 12.sp, color = colors.textMuted, fontWeight = FontWeight.Medium)
            Spacer(Modifier.height(4.dp))
            exchange.requestedDocs.forEach { doc ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Filled.Description,
                        contentDescription = null,
                        tint = colors.warning,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        formatDocType(doc),
                        fontSize = 13.sp,
                        color = colors.textSecondary
                    )
                }
            }
        }

        if (exchange.documents.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text("Attached files:", fontSize = 12.sp, color = colors.textMuted, fontWeight = FontWeight.Medium)
            Spacer(Modifier.height(4.dp))
            exchange.documents.forEach { doc ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Filled.AttachFile,
                        contentDescription = null,
                        tint = colors.positive,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        doc.originalName ?: doc.documentType ?: "File",
                        fontSize = 13.sp,
                        color = colors.textSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

@Composable
private fun DocumentUploadRow(
    docType: String,
    selectedUri: Uri?,
    onFileSelected: (Uri) -> Unit,
    onRemove: () -> Unit,
    colors: com.wiom.csp.ui.theme.WiomColors
) {
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) onFileSelected(uri)
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(colors.bgCard)
            .border(1.dp, colors.borderSubtle, RoundedCornerShape(12.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            if (selectedUri != null) Icons.Filled.CheckCircle else Icons.Outlined.UploadFile,
            contentDescription = null,
            tint = if (selectedUri != null) colors.positive else colors.textMuted,
            modifier = Modifier.size(24.dp)
        )
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                formatDocType(docType),
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = colors.textPrimary
            )
            if (selectedUri != null) {
                Text(
                    "File selected",
                    fontSize = 12.sp,
                    color = colors.positive
                )
            }
        }
        if (selectedUri != null) {
            IconButton(onClick = onRemove, modifier = Modifier.size(32.dp)) {
                Icon(Icons.Filled.Close, contentDescription = "Remove", tint = colors.negative, modifier = Modifier.size(18.dp))
            }
        } else {
            Button(
                onClick = { launcher.launch("*/*") },
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = colors.brandPrimary)
            ) {
                Text("Choose", fontSize = 13.sp)
            }
        }
    }
}


// ─── UTILS ───

private fun formatDocType(docType: String): String {
    return docType
        .replace("_", " ")
        .split(" ")
        .joinToString(" ") { word ->
            word.lowercase().replaceFirstChar { it.uppercase() }
        }
}

private fun formatDate(isoDate: String): String {
    return try {
        // Simple date extraction from ISO string: "2026-02-27T10:30:00.000Z" → "Feb 27"
        val parts = isoDate.split("T")[0].split("-")
        if (parts.size == 3) {
            val months = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
            val month = parts[1].toIntOrNull()?.let { months.getOrNull(it - 1) } ?: parts[1]
            val day = parts[2].toIntOrNull() ?: parts[2]
            "$month $day"
        } else {
            isoDate
        }
    } catch (e: Exception) {
        isoDate
    }
}
