package com.wiom.csp.ui.onboarding

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.location.Geocoder
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.wiom.csp.R
import com.wiom.csp.ui.theme.WiomCspTheme
import kotlinx.coroutines.launch
import java.util.Locale

private val INDIAN_STATES = listOf(
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnboardingScreen(
    viewModel: OnboardingViewModel,
    onRegistrationComplete: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val form by viewModel.form.collectAsState()
    val colors = WiomCspTheme.colors
    val focusManager = LocalFocusManager.current
    val scrollState = rememberScrollState()

    LaunchedEffect(state) {
        if (state is OnboardingState.Success) {
            onRegistrationComplete()
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 20.dp, vertical = 24.dp)
                .widthIn(max = 420.dp),
        ) {
            // Header
            Text(
                stringResource(R.string.onboarding_title),
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary
            )
            Spacer(Modifier.height(6.dp))
            Text(
                stringResource(R.string.onboarding_subtitle),
                fontSize = 13.sp,
                color = colors.textMuted
            )
            Spacer(Modifier.height(12.dp))

            // Fill test data button (for testing)
            OutlinedButton(
                onClick = { viewModel.fillTestData() },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.warning),
                border = androidx.compose.foundation.BorderStroke(1.dp, colors.warning.copy(alpha = 0.5f))
            ) {
                Text(stringResource(R.string.onboarding_fill_sample), fontSize = 13.sp, fontWeight = FontWeight.Medium)
            }

            Spacer(Modifier.height(16.dp))

            // Error banner
            if (state is OnboardingState.Error) {
                val errorMsg = (state as OnboardingState.Error).message
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

            // Section 1: Business Information
            SectionHeader(stringResource(R.string.onboarding_section_business), colors)
            FormField(
                label = stringResource(R.string.onboarding_business_name),
                value = form.businessName,
                onValueChange = { viewModel.updateForm { copy(businessName = it) }; viewModel.clearError() },
                placeholder = stringResource(R.string.onboarding_business_name_hint),
                colors = colors,
                imeAction = ImeAction.Next,
                onImeAction = { focusManager.moveFocus(FocusDirection.Down) }
            )
            Spacer(Modifier.height(12.dp))
            FieldLabel(stringResource(R.string.onboarding_entity_type), colors)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val entityTypes = listOf(
                    "INDIVIDUAL" to stringResource(R.string.onboarding_individual),
                    "FIRM" to stringResource(R.string.onboarding_firm),
                    "COMPANY" to stringResource(R.string.onboarding_company)
                )
                entityTypes.forEach { (type, label) ->
                    val selected = form.entityType == type
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (selected) colors.brandPrimary else colors.bgCard)
                            .border(
                                1.dp,
                                if (selected) colors.brandPrimary else colors.borderSubtle,
                                RoundedCornerShape(10.dp)
                            )
                            .clickable {
                                viewModel.updateForm { copy(entityType = type) }
                                viewModel.clearError()
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            label,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (selected) Color.White else colors.textSecondary
                        )
                    }
                }
            }
            Spacer(Modifier.height(24.dp))

            // Section 2: Service Location
            SectionHeader(stringResource(R.string.onboarding_section_location), colors)

            // State dropdown
            StateDropdown(
                selectedState = form.state,
                onStateSelected = { viewModel.updateForm { copy(state = it) }; viewModel.clearError() },
                colors = colors
            )
            Spacer(Modifier.height(4.dp))

            FormField(
                label = stringResource(R.string.onboarding_city),
                value = form.city,
                onValueChange = { viewModel.updateForm { copy(city = it) }; viewModel.clearError() },
                placeholder = stringResource(R.string.onboarding_city_hint),
                colors = colors,
                imeAction = ImeAction.Next,
                onImeAction = { focusManager.moveFocus(FocusDirection.Down) }
            )
            Spacer(Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(Modifier.weight(1f)) {
                    FormField(
                        label = stringResource(R.string.onboarding_area),
                        value = form.area,
                        onValueChange = { viewModel.updateForm { copy(area = it) }; viewModel.clearError() },
                        placeholder = stringResource(R.string.onboarding_area_hint),
                        colors = colors,
                        imeAction = ImeAction.Next,
                        onImeAction = { focusManager.moveFocus(FocusDirection.Next) }
                    )
                }
                Box(Modifier.weight(1f)) {
                    FormField(
                        label = stringResource(R.string.onboarding_pincode),
                        value = form.pincode,
                        onValueChange = {
                            val filtered = it.filter { c -> c.isDigit() }.take(6)
                            viewModel.updateForm { copy(pincode = filtered) }
                            viewModel.clearError()
                        },
                        placeholder = stringResource(R.string.onboarding_pincode_hint),
                        colors = colors,
                        keyboardType = KeyboardType.Number,
                        imeAction = ImeAction.Next,
                        onImeAction = { focusManager.moveFocus(FocusDirection.Down) }
                    )
                }
            }
            Spacer(Modifier.height(16.dp))

            // GPS Location
            LocationPicker(
                latitude = form.latitude,
                longitude = form.longitude,
                address = form.address,
                onLocationObtained = { lat, lng, addr ->
                    viewModel.updateForm { copy(latitude = lat, longitude = lng, address = addr) }
                    viewModel.clearError()
                },
                onAddressChange = { viewModel.updateForm { copy(address = it) }; viewModel.clearError() },
                colors = colors
            )

            Spacer(Modifier.height(24.dp))

            // Section 3: Identity Verification
            SectionHeader(stringResource(R.string.onboarding_section_identity), colors)
            FormField(
                label = stringResource(R.string.onboarding_aadhaar),
                value = form.aadhaarNumber,
                onValueChange = {
                    val filtered = it.filter { c -> c.isDigit() }.take(12)
                    viewModel.updateForm { copy(aadhaarNumber = filtered) }
                    viewModel.clearError()
                },
                placeholder = stringResource(R.string.onboarding_aadhaar_hint),
                colors = colors,
                keyboardType = KeyboardType.Number,
                imeAction = ImeAction.Next,
                onImeAction = { focusManager.moveFocus(FocusDirection.Down) }
            )
            Spacer(Modifier.height(4.dp))
            FormField(
                label = stringResource(R.string.onboarding_pan),
                value = form.panNumber,
                onValueChange = {
                    val filtered = it.filter { c -> c.isLetterOrDigit() }.take(10)
                    viewModel.updateForm { copy(panNumber = filtered) }
                    viewModel.clearError()
                },
                placeholder = stringResource(R.string.onboarding_pan_hint),
                colors = colors,
                capitalization = KeyboardCapitalization.Characters,
                imeAction = ImeAction.Next,
                onImeAction = { focusManager.moveFocus(FocusDirection.Down) }
            )
            Spacer(Modifier.height(24.dp))

            // Section 4: Bank Details
            SectionHeader(stringResource(R.string.onboarding_section_bank), colors)
            FormField(
                label = stringResource(R.string.onboarding_account_name),
                value = form.bankAccountName,
                onValueChange = { viewModel.updateForm { copy(bankAccountName = it) }; viewModel.clearError() },
                placeholder = stringResource(R.string.onboarding_account_name_hint),
                colors = colors,
                imeAction = ImeAction.Next,
                onImeAction = { focusManager.moveFocus(FocusDirection.Down) }
            )
            Spacer(Modifier.height(4.dp))
            FormField(
                label = stringResource(R.string.onboarding_account_number),
                value = form.bankAccountNumber,
                onValueChange = {
                    val filtered = it.filter { c -> c.isDigit() }.take(18)
                    viewModel.updateForm { copy(bankAccountNumber = filtered) }
                    viewModel.clearError()
                },
                placeholder = stringResource(R.string.onboarding_account_number_hint),
                colors = colors,
                keyboardType = KeyboardType.Number,
                imeAction = ImeAction.Next,
                onImeAction = { focusManager.moveFocus(FocusDirection.Next) }
            )
            Spacer(Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(Modifier.weight(1f)) {
                    FormField(
                        label = stringResource(R.string.onboarding_ifsc),
                        value = form.bankIfsc,
                        onValueChange = {
                            val filtered = it.filter { c -> c.isLetterOrDigit() }.take(11)
                            viewModel.updateForm { copy(bankIfsc = filtered) }
                            viewModel.clearError()
                        },
                        placeholder = stringResource(R.string.onboarding_ifsc_hint),
                        colors = colors,
                        capitalization = KeyboardCapitalization.Characters,
                        imeAction = ImeAction.Next,
                        onImeAction = { focusManager.moveFocus(FocusDirection.Next) }
                    )
                }
                Box(Modifier.weight(1f)) {
                    FormField(
                        label = stringResource(R.string.onboarding_bank_name),
                        value = form.bankName,
                        onValueChange = { viewModel.updateForm { copy(bankName = it) }; viewModel.clearError() },
                        placeholder = stringResource(R.string.onboarding_bank_name_hint),
                        colors = colors,
                        imeAction = ImeAction.Done,
                        onImeAction = { focusManager.clearFocus() }
                    )
                }
            }
            Spacer(Modifier.height(24.dp))

            // Section 5: Agreement
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.bgCard)
                    .border(1.dp, colors.borderSubtle, RoundedCornerShape(12.dp))
                    .clickable {
                        viewModel.updateForm { copy(termsAccepted = !termsAccepted) }
                        viewModel.clearError()
                    }
                    .padding(16.dp),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Checkbox(
                    checked = form.termsAccepted,
                    onCheckedChange = {
                        viewModel.updateForm { copy(termsAccepted = it) }
                        viewModel.clearError()
                    },
                    colors = CheckboxDefaults.colors(
                        checkedColor = colors.brandPrimary,
                        uncheckedColor = colors.borderSubtle,
                        checkmarkColor = Color.White
                    ),
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    stringResource(R.string.onboarding_terms),
                    fontSize = 14.sp,
                    color = colors.textPrimary,
                    lineHeight = 20.sp
                )
            }

            Spacer(Modifier.height(32.dp))

            // Submit button
            Button(
                onClick = { viewModel.submitRegistration() },
                enabled = state !is OnboardingState.Submitting,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colors.brandPrimary,
                    disabledContainerColor = colors.brandPrimary.copy(alpha = 0.7f)
                )
            ) {
                if (state is OnboardingState.Submitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(
                        stringResource(R.string.onboarding_submit),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Spacer(Modifier.height(24.dp))

            Text(
                stringResource(R.string.onboarding_footer),
                fontSize = 12.sp,
                color = colors.textMuted,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(16.dp))
        }
    }
}

@SuppressLint("MissingPermission")
@Composable
private fun LocationPicker(
    latitude: Double?,
    longitude: Double?,
    address: String,
    onLocationObtained: (Double, Double, String) -> Unit,
    onAddressChange: (String) -> Unit,
    colors: com.wiom.csp.ui.theme.WiomColors
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var fetching by remember { mutableStateOf(false) }
    var permissionDenied by remember { mutableStateOf(false) }
    var gpsFetched by remember { mutableStateOf(false) }
    val hasLocation = latitude != null && longitude != null

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
                || permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (granted) {
            fetching = true
            val client = LocationServices.getFusedLocationProviderClient(context)
            client.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, CancellationTokenSource().token)
                .addOnSuccessListener { loc ->
                    fetching = false
                    if (loc != null) {
                        gpsFetched = true
                        val addr = try {
                            @Suppress("DEPRECATION")
                            val geocoder = Geocoder(context, Locale("en"))
                            val results = geocoder.getFromLocation(loc.latitude, loc.longitude, 1)
                            results?.firstOrNull()?.getAddressLine(0) ?: ""
                        } catch (_: Exception) { "" }
                        onLocationObtained(loc.latitude, loc.longitude, addr)
                    }
                }
                .addOnFailureListener {
                    fetching = false
                }
        } else {
            permissionDenied = true
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        FieldLabel(stringResource(R.string.onboarding_location_label), colors)

        // Get Location button
        Button(
            onClick = {
                val fineGranted = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
                if (fineGranted) {
                    fetching = true
                    val client = LocationServices.getFusedLocationProviderClient(context)
                    client.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, CancellationTokenSource().token)
                        .addOnSuccessListener { loc ->
                            fetching = false
                            if (loc != null) {
                                gpsFetched = true
                                val addr = try {
                                    @Suppress("DEPRECATION")
                                    val geocoder = Geocoder(context, Locale("en"))
                                    val results = geocoder.getFromLocation(loc.latitude, loc.longitude, 1)
                                    results?.firstOrNull()?.getAddressLine(0) ?: ""
                                } catch (_: Exception) { "" }
                                onLocationObtained(loc.latitude, loc.longitude, addr)
                            }
                        }
                        .addOnFailureListener { fetching = false }
                } else {
                    permissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                }
            },
            enabled = !fetching,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (gpsFetched) colors.positive else colors.brandPrimary,
                disabledContainerColor = colors.brandPrimary.copy(alpha = 0.7f)
            )
        ) {
            if (fetching) {
                CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                Spacer(Modifier.width(8.dp))
                Text(stringResource(R.string.onboarding_getting_location), fontSize = 14.sp)
            } else if (gpsFetched) {
                Icon(Icons.Outlined.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(stringResource(R.string.onboarding_location_captured), fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            } else {
                Icon(Icons.Filled.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(stringResource(R.string.onboarding_get_location), fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        if (hasLocation) {
            Spacer(Modifier.height(6.dp))
            Text(
                "%.6f, %.6f".format(latitude, longitude),
                fontSize = 12.sp,
                color = colors.textMuted
            )
        }

        if (permissionDenied) {
            Spacer(Modifier.height(6.dp))
            Text(
                stringResource(R.string.onboarding_location_denied),
                fontSize = 12.sp,
                color = colors.negative
            )
        }

        Spacer(Modifier.height(12.dp))

        // Address field
        FieldLabel(stringResource(R.string.onboarding_address), colors)
        OutlinedTextField(
            value = address,
            onValueChange = onAddressChange,
            placeholder = { Text(stringResource(R.string.onboarding_address_hint), color = colors.textMuted, fontSize = 15.sp) },
            minLines = 2,
            maxLines = 3,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = colors.brandPrimary,
                unfocusedBorderColor = colors.borderSubtle,
                focusedTextColor = colors.textPrimary,
                unfocusedTextColor = colors.textPrimary,
                cursorColor = colors.brandPrimary,
                focusedContainerColor = colors.bgCard,
                unfocusedContainerColor = colors.bgCard
            ),
            textStyle = LocalTextStyle.current.copy(fontSize = 15.sp),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(12.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun StateDropdown(
    selectedState: String,
    onStateSelected: (String) -> Unit,
    colors: com.wiom.csp.ui.theme.WiomColors
) {
    var expanded by remember { mutableStateOf(false) }
    var searchText by remember { mutableStateOf("") }

    val filteredStates = remember(searchText) {
        if (searchText.isBlank()) INDIAN_STATES
        else INDIAN_STATES.filter { it.contains(searchText, ignoreCase = true) }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        FieldLabel(stringResource(R.string.onboarding_state), colors)
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = it }
        ) {
            OutlinedTextField(
                value = if (expanded) searchText else selectedState,
                onValueChange = { searchText = it },
                placeholder = {
                    Text(
                        if (selectedState.isNotBlank()) selectedState else stringResource(R.string.onboarding_select_state),
                        color = colors.textMuted,
                        fontSize = 15.sp
                    )
                },
                singleLine = true,
                readOnly = false,
                trailingIcon = {
                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = colors.brandPrimary,
                    unfocusedBorderColor = colors.borderSubtle,
                    focusedTextColor = colors.textPrimary,
                    unfocusedTextColor = colors.textPrimary,
                    cursorColor = colors.brandPrimary,
                    focusedContainerColor = colors.bgCard,
                    unfocusedContainerColor = colors.bgCard
                ),
                textStyle = LocalTextStyle.current.copy(fontSize = 15.sp),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor()
                    .onFocusChanged { focus ->
                        if (focus.isFocused) {
                            searchText = ""
                            expanded = true
                        }
                    }
            )

            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = {
                    expanded = false
                    searchText = ""
                },
                modifier = Modifier
                    .heightIn(max = 250.dp)
                    .background(colors.bgCard)
            ) {
                filteredStates.forEach { stateName ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                stateName,
                                fontSize = 14.sp,
                                color = if (stateName == selectedState) colors.brandPrimary else colors.textPrimary
                            )
                        },
                        onClick = {
                            onStateSelected(stateName)
                            expanded = false
                            searchText = ""
                        },
                        contentPadding = ExposedDropdownMenuDefaults.ItemContentPadding
                    )
                }
                if (filteredStates.isEmpty()) {
                    DropdownMenuItem(
                        text = { Text(stringResource(R.string.onboarding_no_matching), fontSize = 14.sp, color = colors.textMuted) },
                        onClick = {},
                        enabled = false,
                        contentPadding = ExposedDropdownMenuDefaults.ItemContentPadding
                    )
                }
            }
        }
        Spacer(Modifier.height(12.dp))
    }
}

@Composable
private fun SectionHeader(title: String, colors: com.wiom.csp.ui.theme.WiomColors) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            title,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = colors.textPrimary
        )
        Spacer(Modifier.height(8.dp))
        HorizontalDivider(color = colors.borderSubtle, thickness = 1.dp)
        Spacer(Modifier.height(16.dp))
    }
}

@Composable
private fun FieldLabel(label: String, colors: com.wiom.csp.ui.theme.WiomColors) {
    Text(
        label,
        fontSize = 12.sp,
        fontWeight = FontWeight.Medium,
        color = colors.textSecondary,
        letterSpacing = 0.3.sp,
        modifier = Modifier.padding(bottom = 8.dp)
    )
}

@Composable
private fun FormField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    colors: com.wiom.csp.ui.theme.WiomColors,
    keyboardType: KeyboardType = KeyboardType.Text,
    capitalization: KeyboardCapitalization = KeyboardCapitalization.None,
    imeAction: ImeAction = ImeAction.Next,
    onImeAction: () -> Unit = {}
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        FieldLabel(label, colors)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = {
                Text(placeholder, color = colors.textMuted, fontSize = 15.sp)
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = keyboardType,
                capitalization = capitalization,
                imeAction = imeAction
            ),
            keyboardActions = KeyboardActions(
                onNext = { onImeAction() },
                onDone = { onImeAction() }
            ),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = colors.brandPrimary,
                unfocusedBorderColor = colors.borderSubtle,
                focusedTextColor = colors.textPrimary,
                unfocusedTextColor = colors.textPrimary,
                cursorColor = colors.brandPrimary,
                focusedContainerColor = colors.bgCard,
                unfocusedContainerColor = colors.bgCard
            ),
            textStyle = LocalTextStyle.current.copy(fontSize = 15.sp),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(12.dp))
    }
}
