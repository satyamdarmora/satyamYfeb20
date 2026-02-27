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
import com.wiom.csp.data.remote.dto.InfoExchangeDto
import com.wiom.csp.data.remote.dto.StatusData
import com.wiom.csp.ui.theme.WiomCspTheme

@Composable
fun PendingScreen(viewModel: PendingViewModel) {
    val statusData by viewModel.statusData.collectAsState()
    val loading by viewModel.loading.collectAsState()
    val submitting by viewModel.submitting.collectAsState()
    val error by viewModel.error.collectAsState()
    val submitSuccess by viewModel.submitSuccess.collectAsState()
    val selectedFiles by viewModel.selectedFiles.collectAsState()
    val responseText by viewModel.responseText.collectAsState()
    val colors = WiomCspTheme.colors
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
    ) {
        if (loading && statusData == null) {
            // Loading state
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = colors.brandPrimary)
                    Spacer(Modifier.height(16.dp))
                    Text("Checking registration status...", color = colors.textMuted, fontSize = 14.sp)
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

                when (partnerStatus) {
                    "PENDING" -> PendingState(colors)
                    "PAYMENT_PENDING" -> PaymentPendingState(data, colors)
                    "INFO_REQUIRED" -> InfoRequiredState(
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
                    "UNDER_REVIEW" -> UnderReviewState(colors)
                    "APPROVED", "TRAINING" -> TrainingState(data, colors)
                    "TRAINING_FAILED" -> TrainingFailedState(colors)
                    "REJECTED" -> RejectedState(data, colors)
                    "ACTIVE" -> ActiveState(colors)
                    else -> PendingState(colors) // fallback
                }

                Spacer(Modifier.height(32.dp))
                Text(
                    "Wiom CSP Partner Portal",
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
                        error ?: "Failed to load status",
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
                        Text("Retry")
                    }
                }
            }
        }
    }
}

// ─── PENDING ───
@Composable
private fun PendingState(colors: com.wiom.csp.ui.theme.WiomColors) {
    StatusHeader(
        icon = Icons.Outlined.HourglassTop,
        iconBg = colors.warningBg,
        iconTint = colors.warning,
        title = "Registration Under Review",
        subtitle = "Your application has been submitted and is being reviewed by our team.",
        colors = colors
    )

    Spacer(Modifier.height(24.dp))
    ProgressSteps(
        steps = listOf(
            StepItem("Registration Submitted", true),
            StepItem("Document Verification", false),
            StepItem("Admin Approval", false),
            StepItem("Training", false),
            StepItem("Account Active", false)
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
        title = "Payment Pending",
        subtitle = "Please complete the registration fee payment to proceed.",
        colors = colors
    )

    if (data.registrationFee != null) {
        Spacer(Modifier.height(16.dp))
        InfoCard(
            label = "Registration Fee",
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
        title = "Additional Information Required",
        subtitle = "The admin has requested more information. Please review and respond below.",
        colors = colors
    )

    // Conversation history
    if (data.infoExchanges.isNotEmpty()) {
        Spacer(Modifier.height(24.dp))
        Text(
            "CONVERSATION",
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
        .lastOrNull { it.sender == "admin" && it.requestedDocs.isNotEmpty() }

    val requestedDocs = latestAdminExchange?.requestedDocs ?: emptyList()

    if (requestedDocs.isNotEmpty()) {
        Spacer(Modifier.height(24.dp))
        Text(
            "UPLOAD DOCUMENTS",
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
        "YOUR RESPONSE",
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
        placeholder = { Text("Type your response here...", color = colors.textMuted, fontSize = 14.sp) },
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
            Text("Response submitted successfully!", fontSize = 13.sp, color = colors.positive, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
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
            Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Submit Response", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
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
        title = "Under Review",
        subtitle = "Your response has been received. The admin team is reviewing your information.",
        colors = colors
    )
    Spacer(Modifier.height(24.dp))
    ProgressSteps(
        steps = listOf(
            StepItem("Registration Submitted", true),
            StepItem("Document Verification", true),
            StepItem("Admin Review", false),
            StepItem("Training", false),
            StepItem("Account Active", false)
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
        title = "Training In Progress",
        subtitle = "Your registration has been approved! Complete the training to activate your account.",
        colors = colors
    )
    Spacer(Modifier.height(24.dp))
    ProgressSteps(
        steps = listOf(
            StepItem("Registration Submitted", true),
            StepItem("Document Verification", true),
            StepItem("Admin Approval", true),
            StepItem("Training", false),
            StepItem("Account Active", false)
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
        title = "Training Failed",
        subtitle = "Unfortunately, the training could not be completed. Please contact support for assistance.",
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
        title = "Registration Rejected",
        subtitle = "Your registration application has been rejected.",
        colors = colors
    )

    if (data.rejectionReason != null) {
        Spacer(Modifier.height(16.dp))
        InfoCard(label = "Reason", value = data.rejectionReason, colors = colors)
    }

    if (data.feeRefunded) {
        Spacer(Modifier.height(12.dp))
        InfoCard(label = "Fee Status", value = "Registration fee has been refunded", colors = colors)
    }
}

// ─── ACTIVE ───
@Composable
private fun ActiveState(colors: com.wiom.csp.ui.theme.WiomColors) {
    StatusHeader(
        icon = Icons.Outlined.CheckCircle,
        iconBg = colors.positiveBg,
        iconTint = colors.positive,
        title = "Account Active!",
        subtitle = "Your partner account is now active. Redirecting to dashboard...",
        colors = colors
    )
    Spacer(Modifier.height(24.dp))
    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = colors.brandPrimary, modifier = Modifier.size(24.dp))
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
    val isAdmin = exchange.sender == "admin"
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
