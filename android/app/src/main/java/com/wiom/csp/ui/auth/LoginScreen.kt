package com.wiom.csp.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wiom.csp.ui.theme.WiomCspTheme
import kotlinx.coroutines.delay

@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onLoginSuccess: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val colors = WiomCspTheme.colors

    var mobile by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var resendTimer by remember { mutableIntStateOf(0) }

    // Navigate on success
    LaunchedEffect(state) {
        if (state is LoginState.Success) {
            onLoginSuccess()
        }
    }

    // Resend timer countdown
    LaunchedEffect(resendTimer) {
        if (resendTimer > 0) {
            delay(1000)
            resendTimer--
        }
    }

    // Start timer when OTP is sent
    LaunchedEffect(state) {
        if (state is LoginState.OtpSent) {
            resendTimer = 30
        }
    }

    val isOtpStep = state is LoginState.OtpSent || state is LoginState.Verifying ||
            (state is LoginState.Error && (state as LoginState.Error).step == "otp")

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgPrimary)
            .statusBarsPadding()
            .navigationBarsPadding(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 380.dp)
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Logo
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(colors.brandPrimary),
                contentAlignment = Alignment.Center
            ) {
                Text("W", fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
            }

            Spacer(Modifier.height(16.dp))

            Text("Wiom CSP", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)

            Spacer(Modifier.height(6.dp))

            Text(
                text = if (isOtpStep) "OTP sent to +91 $mobile" else "Enter your mobile number to login",
                fontSize = 13.sp,
                color = colors.textMuted
            )

            Spacer(Modifier.height(40.dp))

            // Error message
            if (state is LoginState.Error) {
                val errorMsg = (state as LoginState.Error).message
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(colors.negative.copy(alpha = 0.1f))
                        .padding(12.dp)
                ) {
                    Text(
                        text = errorMsg,
                        fontSize = 13.sp,
                        color = colors.negative,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                Spacer(Modifier.height(20.dp))
            }

            if (!isOtpStep) {
                // Step 1: Mobile Number
                Text(
                    "MOBILE NUMBER",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.textSecondary,
                    letterSpacing = 0.3.sp,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(colors.bgCard),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .background(colors.bgSecondary)
                            .padding(horizontal = 12.dp, vertical = 14.dp)
                    ) {
                        Text("+91", fontSize = 16.sp, color = colors.textSecondary, fontWeight = FontWeight.Medium)
                    }

                    OutlinedTextField(
                        value = mobile,
                        onValueChange = { v ->
                            val filtered = v.filter { it.isDigit() }.take(10)
                            mobile = filtered
                            if (state is LoginState.Error) viewModel.clearError()
                        },
                        placeholder = { Text("9876543210", color = colors.textMuted) },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = { if (mobile.length == 10) viewModel.sendOtp(mobile) }
                        ),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color.Transparent,
                            unfocusedBorderColor = Color.Transparent,
                            focusedTextColor = colors.textPrimary,
                            unfocusedTextColor = colors.textPrimary,
                            cursorColor = colors.brandPrimary
                        ),
                        textStyle = LocalTextStyle.current.copy(
                            fontSize = 16.sp,
                            letterSpacing = 1.sp
                        ),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(Modifier.height(20.dp))

                Button(
                    onClick = { viewModel.sendOtp(mobile) },
                    enabled = mobile.length == 10 && state !is LoginState.SendingOtp,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.brandPrimary,
                        disabledContainerColor = colors.bgSecondary
                    )
                ) {
                    if (state is LoginState.SendingOtp) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            "Send OTP",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            } else {
                // Step 2: OTP Verification
                Text(
                    "ENTER OTP",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.textSecondary,
                    letterSpacing = 0.3.sp,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                )

                OutlinedTextField(
                    value = otp,
                    onValueChange = { v ->
                        val filtered = v.filter { it.isDigit() }.take(4)
                        otp = filtered
                        if (state is LoginState.Error) viewModel.clearError()
                    },
                    placeholder = { Text("----", color = colors.textMuted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()) },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Number,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = { if (otp.length == 4) viewModel.verifyOtp(otp) }
                    ),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = colors.brandPrimary,
                        unfocusedBorderColor = colors.bgCard,
                        focusedTextColor = colors.textPrimary,
                        unfocusedTextColor = colors.textPrimary,
                        cursorColor = colors.brandPrimary,
                        focusedContainerColor = colors.bgCard,
                        unfocusedContainerColor = colors.bgCard
                    ),
                    textStyle = LocalTextStyle.current.copy(
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        letterSpacing = 12.sp
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(Modifier.height(20.dp))

                Button(
                    onClick = { viewModel.verifyOtp(otp) },
                    enabled = otp.length == 4 && state !is LoginState.Verifying,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.brandPrimary,
                        disabledContainerColor = colors.bgSecondary
                    )
                ) {
                    if (state is LoginState.Verifying) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            "Verify OTP",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    TextButton(onClick = {
                        otp = ""
                        viewModel.goBackToMobile()
                    }) {
                        Text(
                            "\u2190 Change Number",
                            fontSize = 13.sp,
                            color = colors.textSecondary,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    TextButton(
                        onClick = { viewModel.resendOtp() },
                        enabled = resendTimer == 0 && state !is LoginState.SendingOtp
                    ) {
                        Text(
                            text = if (resendTimer > 0) "Resend in ${resendTimer}s" else "Resend OTP",
                            fontSize = 13.sp,
                            color = if (resendTimer > 0) colors.textMuted else colors.brandPrimary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            Spacer(Modifier.height(32.dp))

            Text(
                "Wiom CSP Partner Portal",
                fontSize = 12.sp,
                color = colors.textMuted
            )
        }
    }
}
