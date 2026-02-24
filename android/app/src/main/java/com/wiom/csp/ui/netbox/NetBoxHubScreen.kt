package com.wiom.csp.ui.netbox

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wiom.csp.data.repository.SLARepository
import com.wiom.csp.data.repository.TaskRepository
import com.wiom.csp.data.repository.WalletRepository
import com.wiom.csp.domain.model.*
import com.wiom.csp.ui.common.formatCurrency
import com.wiom.csp.ui.common.formatDate
import com.wiom.csp.ui.theme.WiomCspTheme
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NetBoxOrder(
    val id: String,
    val quantity: Int,
    val deliveryArea: String,
    val status: String, // ORDERED, DISPATCHED, DELIVERED
    val createdAt: String
)

private val AREAS = listOf(
    "Andheri West", "Bandra East", "Powai", "Malad West",
    "Goregaon East", "Borivali West", "Jogeshwari West", "Kandivali West"
)

private val MOCK_ORDERS = listOf(
    NetBoxOrder("ORD-0001", 5, "Andheri West", "DELIVERED",
        java.time.Instant.now().minusSeconds(7 * 86400).toString()),
    NetBoxOrder("ORD-0002", 3, "Bandra East", "DISPATCHED",
        java.time.Instant.now().minusSeconds(2 * 86400).toString())
)

private const val DEPOSIT_PER_UNIT = 1500

@HiltViewModel
class NetBoxViewModel @Inject constructor(
    private val taskRepo: TaskRepository,
    private val walletRepo: WalletRepository,
    private val slaRepo: SLARepository
) : ViewModel() {
    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks

    private val _walletBalance = MutableStateFlow(0)
    val walletBalance: StateFlow<Int> = _walletBalance

    private val _processing = MutableStateFlow(false)
    val processing: StateFlow<Boolean> = _processing

    init { load() }

    fun load() {
        viewModelScope.launch {
            taskRepo.getTasks().onSuccess { all ->
                _tasks.value = all.filter { it.taskType == TaskType.NETBOX && !it.isTerminal }
            }
            walletRepo.getWallet().onSuccess { _walletBalance.value = it.balance }
        }
    }

    fun placeOrderWithWallet(qty: Int, area: String, onDone: (NetBoxOrder) -> Unit) {
        if (_processing.value) return
        _processing.value = true
        val depositTotal = qty * DEPOSIT_PER_UNIT
        viewModelScope.launch {
            // Deduct from wallet
            val txn = WalletTransaction(
                id = "DEP-W-${System.currentTimeMillis()}",
                date = java.time.Instant.now().toString(),
                type = WalletTransactionType.DEDUCTION,
                amount = -depositTotal,
                description = "NetBox deposit ($qty unit${if (qty > 1) "s" else ""})",
                status = TransactionStatus.COMPLETED
            )
            walletRepo.updateWallet(
                balance = _walletBalance.value - depositTotal,
                newTransaction = txn
            )
            // Record deposit transactions
            repeat(qty) {
                slaRepo.collectDeposit(DEPOSIT_PER_UNIT, "Deposit for NetBox order")
            }
            _walletBalance.value -= depositTotal
            val order = NetBoxOrder(
                id = "ORD-${System.currentTimeMillis().toString().takeLast(4)}",
                quantity = qty,
                deliveryArea = area,
                status = "ORDERED",
                createdAt = java.time.Instant.now().toString()
            )
            _processing.value = false
            onDone(order)
        }
    }

    fun placeOrderExternal(qty: Int, area: String, onDone: (NetBoxOrder) -> Unit) {
        if (_processing.value) return
        _processing.value = true
        viewModelScope.launch {
            repeat(qty) {
                slaRepo.collectDeposit(DEPOSIT_PER_UNIT, "Deposit for NetBox order")
            }
            val order = NetBoxOrder(
                id = "ORD-${System.currentTimeMillis().toString().takeLast(4)}",
                quantity = qty,
                deliveryArea = area,
                status = "ORDERED",
                createdAt = java.time.Instant.now().toString()
            )
            _processing.value = false
            onDone(order)
        }
    }
}

private fun getStateColor(state: String, colors: com.wiom.csp.ui.theme.WiomColors): Color {
    return when {
        state in listOf("IN_PROGRESS", "ASSIGNED") -> colors.brandPrimary
        state == "PICKUP_REQUIRED" -> colors.warning
        state in listOf("RETURN_CONFIRMED", "COLLECTED") -> colors.positive
        state == "LOST_DECLARED" -> colors.negative
        else -> colors.textSecondary
    }
}

@Composable
fun NetBoxHubScreen(
    onBack: () -> Unit,
    viewModel: NetBoxViewModel = hiltViewModel()
) {
    val colors = WiomCspTheme.colors
    val tasks by viewModel.tasks.collectAsState()
    val walletBalance by viewModel.walletBalance.collectAsState()
    val isProcessing by viewModel.processing.collectAsState()
    var step by remember { mutableStateOf("hub") } // hub, create_order, pay_deposit, confirm_order, order_receipt, order_detail
    var orders by remember { mutableStateOf(MOCK_ORDERS) }
    var selectedOrder by remember { mutableStateOf<NetBoxOrder?>(null) }
    var quantity by remember { mutableStateOf("") }
    var deliveryArea by remember { mutableStateOf(AREAS[0]) }
    var payMethod by remember { mutableStateOf("wallet") } // wallet, upi, netbanking, debit_card

    // Group tasks by state
    val tasksByState = remember(tasks) {
        tasks.groupBy { it.state }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgPrimary)
            .statusBarsPadding()
    ) {
        when (step) {
            "hub" -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    // Header
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .drawBehind {
                                drawLine(colors.borderSubtle, Offset(0f, size.height), Offset(size.width, size.height), 1f)
                            }
                            .padding(16.dp)
                    ) {
                        Text(
                            "\u2190 Back",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = colors.textSecondary,
                            modifier = Modifier.clickable { onBack() }.padding(vertical = 4.dp)
                        )
                        Spacer(Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("NetBox Management", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(colors.brandPrimary)
                                    .clickable {
                                        quantity = ""
                                        deliveryArea = AREAS[0]
                                        step = "create_order"
                                    }
                                    .padding(horizontal = 16.dp, vertical = 8.dp)
                            ) {
                                Text("+ Request NetBox", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                            }
                        }
                    }

                    // Scrollable content
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                    ) {
                        // Active Tasks section
                        Text(
                            "ACTIVE TASKS",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textSecondary,
                            letterSpacing = 0.5.sp
                        )
                        Spacer(Modifier.height(12.dp))

                        if (tasksByState.isEmpty()) {
                            Box(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("No active NetBox tasks", fontSize = 13.sp, color = colors.textMuted)
                            }
                        }

                        tasksByState.forEach { (state, stateTasks) ->
                            val stateColor = getStateColor(state, colors)
                            // State header with dot
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.padding(bottom = 6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(stateColor)
                                )
                                Text(
                                    "${state.replace("_", " ")} (${stateTasks.size})",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = stateColor
                                )
                            }

                            // Task cards for this state
                            stateTasks.forEach { task ->
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 6.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(colors.bgCard)
                                        .drawBehind {
                                            drawLine(stateColor, Offset(0f, 0f), Offset(0f, size.height), 3.dp.toPx())
                                        }
                                        .padding(horizontal = 14.dp, vertical = 12.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(task.taskId, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                                        Text(task.netboxId ?: "", fontSize = 12.sp, color = colors.textSecondary)
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    Text(
                                        buildString {
                                            append(task.customerArea ?: "")
                                            if (task.assignedTo != null) append(" -- ${task.assignedTo}")
                                        },
                                        fontSize = 12.sp,
                                        color = colors.textSecondary
                                    )
                                }
                            }
                            Spacer(Modifier.height(10.dp))
                        }

                        // Orders section
                        Spacer(Modifier.height(8.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .background(colors.borderSubtle)
                        )
                        Spacer(Modifier.height(16.dp))

                        Text(
                            "NETBOX ORDERS",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textSecondary,
                            letterSpacing = 0.5.sp
                        )
                        Spacer(Modifier.height(12.dp))

                        orders.forEach { order ->
                            val statusColor = when (order.status) {
                                "DELIVERED" -> colors.positive
                                "DISPATCHED" -> colors.brandPrimary
                                else -> colors.warning
                            }
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 8.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(colors.bgCard)
                                    .border(1.dp, colors.borderSubtle, RoundedCornerShape(10.dp))
                                    .clickable {
                                        selectedOrder = order
                                        step = "order_detail"
                                    }
                                    .padding(horizontal = 16.dp, vertical = 14.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(order.id, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(statusColor.copy(alpha = 0.1f))
                                            .padding(horizontal = 8.dp, vertical = 2.dp)
                                    ) {
                                        Text(order.status, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = statusColor)
                                    }
                                }
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "Qty: ${order.quantity} \u00B7 ${order.deliveryArea} \u00B7 ${formatDate(order.createdAt)}",
                                    fontSize = 12.sp,
                                    color = colors.textSecondary
                                )
                            }
                        }

                        Spacer(Modifier.height(80.dp))
                    }
                }
            }

            "create_order" -> {
                val qty = quantity.toIntOrNull() ?: 0
                val canSubmit = qty > 0
                val depositTotal = qty * DEPOSIT_PER_UNIT
                Column(modifier = Modifier.fillMaxSize()) {
                    Column(
                        modifier = Modifier.fillMaxWidth()
                            .drawBehind { drawLine(colors.borderSubtle, Offset(0f, size.height), Offset(size.width, size.height), 1f) }
                            .padding(16.dp)
                    ) {
                        Text("\u2190 Back", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = colors.textSecondary,
                            modifier = Modifier.clickable { step = "hub" }.padding(vertical = 4.dp))
                        Spacer(Modifier.height(12.dp))
                        Text("Request NetBox", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                    }
                    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
                        Text("Quantity", fontSize = 12.sp, color = colors.textSecondary)
                        Spacer(Modifier.height(6.dp))
                        OutlinedTextField(
                            value = quantity, onValueChange = { quantity = it },
                            placeholder = { Text("Number of units", fontSize = 14.sp) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = colors.bgSecondary, unfocusedContainerColor = colors.bgSecondary,
                                focusedBorderColor = colors.brandPrimary, unfocusedBorderColor = colors.borderSubtle,
                                focusedTextColor = colors.textPrimary, unfocusedTextColor = colors.textPrimary, cursorColor = colors.brandPrimary
                            ),
                            shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(Modifier.height(16.dp))
                        Text("Delivery Area", fontSize = 12.sp, color = colors.textSecondary)
                        Spacer(Modifier.height(6.dp))
                        AREAS.chunked(2).forEach { row ->
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                row.forEach { area ->
                                    val selected = area == deliveryArea
                                    Box(
                                        modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp))
                                            .background(if (selected) colors.brandPrimary.copy(alpha = 0.15f) else colors.bgSecondary)
                                            .border(1.dp, if (selected) colors.brandPrimary else colors.borderSubtle, RoundedCornerShape(8.dp))
                                            .clickable { deliveryArea = area }.padding(horizontal = 12.dp, vertical = 10.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(area, fontSize = 13.sp,
                                            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                                            color = if (selected) colors.brandPrimary else colors.textPrimary)
                                    }
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                        }
                        Spacer(Modifier.height(16.dp))
                        // Deposit summary
                        if (canSubmit) {
                            Column(
                                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp))
                                    .background(Color(0x0FFF8000)).border(1.dp, Color(0x26FF8000), RoundedCornerShape(8.dp)).padding(14.dp)
                            ) {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Deposit per unit", fontSize = 13.sp, color = colors.textSecondary)
                                    Text(formatCurrency(DEPOSIT_PER_UNIT), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                                }
                                Spacer(Modifier.height(6.dp))
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Total deposit", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                                    Text(formatCurrency(depositTotal), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = colors.accentGold)
                                }
                                Spacer(Modifier.height(4.dp))
                                Text("Refundable on unit return", fontSize = 11.sp, color = colors.textMuted)
                            }
                        }
                        Spacer(Modifier.height(24.dp))
                        Box(
                            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp))
                                .background(colors.brandPrimary.copy(alpha = if (canSubmit) 1f else 0.4f))
                                .clickable(enabled = canSubmit) { step = "pay_deposit" }.padding(vertical = 14.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Continue to Payment", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        }
                    }
                }
            }

            "pay_deposit" -> {
                val qty = quantity.toIntOrNull() ?: 1
                val depositTotal = qty * DEPOSIT_PER_UNIT
                val canPayWallet = walletBalance >= depositTotal
                data class PayOption(val id: String, val label: String, val sub: String, val disabled: Boolean = false)
                val options = listOf(
                    PayOption("wallet", "Pay from Wallet", if (canPayWallet) "Balance: ${formatCurrency(walletBalance)}" else "Insufficient (${formatCurrency(walletBalance)})", !canPayWallet),
                    PayOption("upi", "UPI", "GPay, PhonePe, Paytm"),
                    PayOption("netbanking", "Net Banking", "All major banks"),
                    PayOption("debit_card", "Debit Card", "Visa, Mastercard, RuPay"),
                )
                Column(modifier = Modifier.fillMaxSize()) {
                    Column(
                        modifier = Modifier.fillMaxWidth()
                            .drawBehind { drawLine(colors.borderSubtle, Offset(0f, size.height), Offset(size.width, size.height), 1f) }
                            .padding(16.dp)
                    ) {
                        Text("\u2190 Back", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = colors.textSecondary,
                            modifier = Modifier.clickable { step = "create_order" }.padding(vertical = 4.dp))
                        Spacer(Modifier.height(12.dp))
                        Text("Pay Deposit", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                    }
                    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
                        Text("$qty unit${if (qty > 1) "s" else ""} \u00B7 $deliveryArea", fontSize = 13.sp, color = colors.textSecondary)
                        Spacer(Modifier.height(4.dp))
                        Text(formatCurrency(depositTotal), fontSize = 24.sp, fontWeight = FontWeight.Bold, color = colors.accentGold)
                        Spacer(Modifier.height(20.dp))
                        options.forEach { opt ->
                            Box(
                                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp).clip(RoundedCornerShape(10.dp))
                                    .background(colors.bgCard).border(1.dp, colors.borderSubtle, RoundedCornerShape(10.dp))
                                    .clickable(enabled = !opt.disabled) { payMethod = opt.id; step = "confirm_order" }
                                    .padding(16.dp).then(if (opt.disabled) Modifier.background(Color.Transparent) else Modifier),
                            ) {
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Column(modifier = Modifier.weight(1f).then(if (opt.disabled) Modifier else Modifier)) {
                                        Text(opt.label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
                                            color = if (opt.disabled) colors.textMuted else colors.textPrimary)
                                        Text(opt.sub, fontSize = 12.sp,
                                            color = if (opt.disabled) colors.negative else colors.textMuted)
                                    }
                                    if (!opt.disabled) Text("\u203A", fontSize = 14.sp, color = colors.textMuted)
                                }
                            }
                        }
                    }
                }
            }

            "confirm_order" -> {
                val qty = quantity.toIntOrNull() ?: 1
                val depositTotal = qty * DEPOSIT_PER_UNIT
                val methodLabel = when (payMethod) { "wallet" -> "Wallet Balance"; "upi" -> "UPI"; "netbanking" -> "Net Banking"; else -> "Debit Card" }
                Column(modifier = Modifier.fillMaxSize()) {
                    Column(
                        modifier = Modifier.fillMaxWidth()
                            .drawBehind { drawLine(colors.borderSubtle, Offset(0f, size.height), Offset(size.width, size.height), 1f) }
                            .padding(16.dp)
                    ) {
                        Text("\u2190 Back", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = colors.textSecondary,
                            modifier = Modifier.clickable { step = "pay_deposit" }.padding(vertical = 4.dp))
                        Spacer(Modifier.height(12.dp))
                        Text("Confirm Order", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                    }
                    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
                        Column(
                            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(colors.bgCard).padding(20.dp)
                        ) {
                            listOf("Quantity" to "$qty unit${if (qty > 1) "s" else ""}", "Delivery Area" to deliveryArea, "Payment" to methodLabel).forEach { (label, value) ->
                                Row(
                                    modifier = Modifier.fillMaxWidth()
                                        .drawBehind { drawLine(colors.borderSubtle, Offset(0f, size.height), Offset(size.width, size.height), 1f) }
                                        .padding(vertical = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(label, fontSize = 13.sp, color = colors.textSecondary)
                                    Text(value, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                                }
                            }
                            Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Deposit Amount", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                                Text(formatCurrency(depositTotal), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.accentGold)
                            }
                        }
                        if (payMethod == "wallet") {
                            Spacer(Modifier.height(8.dp))
                            Text("${formatCurrency(depositTotal)} will be deducted from your wallet.", fontSize = 12.sp, color = colors.textMuted)
                        }
                        Spacer(Modifier.height(24.dp))
                        Box(
                            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp))
                                .background(colors.brandPrimary.copy(alpha = if (isProcessing) 0.5f else 1f))
                                .clickable(enabled = !isProcessing) {
                                    val cb: (NetBoxOrder) -> Unit = { order ->
                                        orders = listOf(order) + orders
                                        selectedOrder = order
                                        step = "order_receipt"
                                    }
                                    if (payMethod == "wallet") viewModel.placeOrderWithWallet(qty, deliveryArea, cb)
                                    else viewModel.placeOrderExternal(qty, deliveryArea, cb)
                                }
                                .padding(vertical = 14.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                if (isProcessing) "Processing..." else "Pay ${formatCurrency(depositTotal)} & Place Order",
                                fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        }
                    }
                }
            }

            "order_receipt" -> {
                val qty = quantity.toIntOrNull() ?: 1
                val depositTotal = qty * DEPOSIT_PER_UNIT
                val methodLabel = when (payMethod) { "wallet" -> "Wallet"; "upi" -> "UPI"; "netbanking" -> "Net Banking"; else -> "Debit Card" }
                Column(modifier = Modifier.fillMaxSize()) {
                    Column(
                        modifier = Modifier.fillMaxWidth()
                            .drawBehind { drawLine(colors.borderSubtle, Offset(0f, size.height), Offset(size.width, size.height), 1f) }
                            .padding(16.dp)
                    ) {
                        Text("Order Placed", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                    }
                    Column(
                        modifier = Modifier.fillMaxSize().padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier.size(60.dp).clip(CircleShape).background(Color(0x1F008043)),
                            contentAlignment = Alignment.Center
                        ) { Text("\u2713", fontSize = 28.sp, color = colors.positive) }
                        Spacer(Modifier.height(16.dp))
                        Text("Deposit paid", fontSize = 14.sp, color = colors.textSecondary)
                        Text(formatCurrency(depositTotal), fontSize = 28.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                        Text("via $methodLabel", fontSize = 13.sp, color = colors.textMuted)
                        Spacer(Modifier.height(4.dp))
                        Text("$qty unit${if (qty > 1) "s" else ""} \u00B7 $deliveryArea", fontSize = 12.sp, color = colors.textSecondary)
                        Spacer(Modifier.height(4.dp))
                        Text("Refundable when units are returned", fontSize = 11.sp, color = colors.textMuted)
                        Spacer(Modifier.height(32.dp))
                        Box(
                            modifier = Modifier.fillMaxWidth(0.7f).clip(RoundedCornerShape(10.dp)).background(colors.brandPrimary)
                                .clickable {
                                    if (selectedOrder != null) step = "order_detail"
                                    else { step = "hub"; quantity = ""; deliveryArea = AREAS[0] }
                                }.padding(vertical = 14.dp),
                            contentAlignment = Alignment.Center
                        ) { Text("View Order", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White) }
                    }
                }
            }

            "order_detail" -> {
                val order = selectedOrder ?: return@Box
                val statusColor = when (order.status) {
                    "DELIVERED" -> colors.positive
                    "DISPATCHED" -> colors.brandPrimary
                    else -> colors.warning
                }

                val timelineSteps = listOf(
                    "Order Placed" to true,
                    "Processing" to (order.status != "ORDERED"),
                    "Dispatched" to (order.status in listOf("DISPATCHED", "DELIVERED")),
                    "Delivered" to (order.status == "DELIVERED")
                )

                Column(modifier = Modifier.fillMaxSize()) {
                    // Header
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .drawBehind {
                                drawLine(colors.borderSubtle, Offset(0f, size.height), Offset(size.width, size.height), 1f)
                            }
                            .padding(16.dp)
                    ) {
                        Text(
                            "\u2190 Back",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = colors.textSecondary,
                            modifier = Modifier.clickable { step = "hub" }.padding(vertical = 4.dp)
                        )
                        Spacer(Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(order.id, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(statusColor.copy(alpha = 0.1f))
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(order.status, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = statusColor)
                            }
                        }
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                    ) {
                        // Order info card
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(colors.bgCard)
                                .padding(20.dp)
                        ) {
                            // Quantity row
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .drawBehind {
                                        drawLine(colors.borderSubtle, Offset(0f, size.height), Offset(size.width, size.height), 1f)
                                    }
                                    .padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Quantity", fontSize = 13.sp, color = colors.textSecondary)
                                Text("${order.quantity} units", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                            }
                            // Delivery Area row
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .drawBehind {
                                        drawLine(colors.borderSubtle, Offset(0f, size.height), Offset(size.width, size.height), 1f)
                                    }
                                    .padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Delivery Area", fontSize = 13.sp, color = colors.textSecondary)
                                Text(order.deliveryArea, fontSize = 13.sp, color = colors.textPrimary)
                            }
                            // Ordered On row
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Ordered On", fontSize = 13.sp, color = colors.textSecondary)
                                Text(formatDate(order.createdAt), fontSize = 13.sp, color = colors.textPrimary)
                            }
                        }

                        Spacer(Modifier.height(20.dp))

                        // Status Timeline
                        Text(
                            "STATUS TIMELINE",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textSecondary,
                            letterSpacing = 0.5.sp
                        )
                        Spacer(Modifier.height(16.dp))

                        Column(modifier = Modifier.padding(start = 24.dp)) {
                            timelineSteps.forEachIndexed { i, (label, done) ->
                                Row(modifier = Modifier.padding(bottom = if (i < timelineSteps.size - 1) 24.dp else 0.dp)) {
                                    // Timeline dot + line
                                    Box(modifier = Modifier.width(24.dp)) {
                                        // Vertical line
                                        if (i < timelineSteps.size - 1) {
                                            Box(
                                                modifier = Modifier
                                                    .offset(x = 5.dp, y = 14.dp)
                                                    .width(2.dp)
                                                    .height(34.dp)
                                                    .background(colors.bgSecondary)
                                            )
                                        }
                                        // Dot
                                        Box(
                                            modifier = Modifier
                                                .size(12.dp)
                                                .clip(CircleShape)
                                                .background(if (done) colors.brandPrimary else colors.bgSecondary)
                                                .border(2.dp, colors.bgPrimary, CircleShape)
                                        )
                                    }
                                    Column {
                                        Text(
                                            label,
                                            fontSize = 14.sp,
                                            fontWeight = if (done) FontWeight.SemiBold else FontWeight.Normal,
                                            color = if (done) colors.textPrimary else colors.textMuted
                                        )
                                        if (done) {
                                            Text(
                                                formatDate(order.createdAt),
                                                fontSize = 11.sp,
                                                color = colors.textMuted
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        Spacer(Modifier.height(80.dp))
                    }
                }
            }
        }
    }
}
