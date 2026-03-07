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
import com.wiom.csp.data.repository.NotificationRepository
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
    private val slaRepo: SLARepository,
    private val notifRepo: NotificationRepository
) : ViewModel() {
    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks

    private val _walletBalance = MutableStateFlow(0)
    val walletBalance: StateFlow<Int> = _walletBalance

    private val _processing = MutableStateFlow(false)
    val processing: StateFlow<Boolean> = _processing

    private val _deposit = MutableStateFlow<DepositResponse?>(null)
    val deposit: StateFlow<DepositResponse?> = _deposit

    private val _depositLoading = MutableStateFlow(false)
    val depositLoading: StateFlow<Boolean> = _depositLoading

    init { load() }

    fun load() {
        viewModelScope.launch {
            taskRepo.getTasks().onSuccess { all ->
                _tasks.value = all.filter { it.taskType == TaskType.NETBOX && !it.isTerminal }
            }
            walletRepo.getWallet().onSuccess { _walletBalance.value = it.balance }
            _depositLoading.value = true
            slaRepo.getDeposit().onSuccess { _deposit.value = it }
            _depositLoading.value = false
        }
    }

    private val _returnRequested = MutableStateFlow<Set<String>>(emptySet())
    val returnRequested: StateFlow<Set<String>> = _returnRequested

    fun requestReturn(netboxId: String, customerArea: String?, connectionId: String?) {
        viewModelScope.launch {
            // Post notification to admin/system for collection — not a CSP task
            notifRepo.post(
                com.wiom.csp.data.remote.dto.NotificationPostRequest(
                    id = "RET-${System.currentTimeMillis()}",
                    type = "NETBOX_RETURN",
                    title = "NetBox Return Request",
                    message = "CSP requests pickup of $netboxId${customerArea?.let { " ($it)" } ?: ""}",
                    taskId = null,
                    timestamp = java.time.Instant.now().toString()
                )
            )
            _returnRequested.value = _returnRequested.value + netboxId
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
    val depositData by viewModel.deposit.collectAsState()
    val depositLoading by viewModel.depositLoading.collectAsState()
    val returnRequested by viewModel.returnRequested.collectAsState()
    var step by remember { mutableStateOf("hub") } // hub, create_order, pay_deposit, confirm_order, order_receipt, order_detail
    var unitFilter by remember { mutableStateOf<String?>(null) } // null=hidden, "active","returned","lost","all"
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
                        val dep = depositData
                        if (dep != null) {
                            val ledger = dep.ledger
                            val rateCard = dep.rateCard
                            val allUnits = dep.units
                            val carryFeeUnits = allUnits.filter { it.carryFeeEligible }
                            val warningUnits = allUnits.filter {
                                it.daysPastExpiry > 0 && !it.carryFeeEligible &&
                                it.status != NetBoxUnitStatus.IN_WAREHOUSE && it.status != NetBoxUnitStatus.LOST
                            }

                            // ── Count tiles (tappable to show unit details) ──
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                data class Tile(val label: String, val value: String, val color: Color, val filter: String)
                                listOf(
                                    Tile("Active", "${ledger.totalActive}", colors.positive, "active"),
                                    Tile("Returned", "${ledger.totalReturned}", colors.textPrimary, "returned"),
                                    Tile("Lost", "${ledger.totalLost}", colors.negative, "lost"),
                                    Tile("Total", "${ledger.totalIssued}", colors.textSecondary, "all"),
                                ).forEach { tile ->
                                    val selected = unitFilter == tile.filter
                                    Column(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(if (selected) colors.brandPrimary.copy(alpha = 0.12f) else colors.bgCard)
                                            .then(if (selected) Modifier.border(1.dp, colors.brandPrimary, RoundedCornerShape(10.dp)) else Modifier)
                                            .clickable { unitFilter = if (selected) null else tile.filter }
                                            .padding(horizontal = 10.dp, vertical = 12.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Text(tile.value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = tile.color)
                                        Text(tile.label, fontSize = 11.sp, color = colors.textMuted)
                                    }
                                }
                            }

                            // ── Expanded unit list when tile tapped ──
                            if (unitFilter != null) {
                                val filtered = when (unitFilter) {
                                    "active" -> allUnits.filter { it.status == NetBoxUnitStatus.WITH_CUSTOMER || it.status == NetBoxUnitStatus.EXPIRED_WITH_CUSTOMER }
                                    "returned" -> allUnits.filter { it.status == NetBoxUnitStatus.IN_WAREHOUSE }
                                    "lost" -> allUnits.filter { it.status == NetBoxUnitStatus.LOST || it.status == NetBoxUnitStatus.DAMAGED }
                                    else -> allUnits
                                }
                                Spacer(Modifier.height(8.dp))
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(colors.bgCard)
                                        .padding(12.dp)
                                ) {
                                    if (filtered.isEmpty()) {
                                        Text("No units", fontSize = 12.sp, color = colors.textMuted, modifier = Modifier.padding(8.dp))
                                    }
                                    filtered.forEachIndexed { i, unit ->
                                        val statusColor = when (unit.status) {
                                            NetBoxUnitStatus.WITH_CUSTOMER -> colors.positive
                                            NetBoxUnitStatus.EXPIRED_WITH_CUSTOMER -> colors.warning
                                            NetBoxUnitStatus.COLLECTED_IN_TRANSIT -> colors.brandPrimary
                                            NetBoxUnitStatus.IN_WAREHOUSE -> colors.textSecondary
                                            NetBoxUnitStatus.LOST -> colors.negative
                                            NetBoxUnitStatus.DAMAGED -> colors.negative
                                        }
                                        val statusLabel = when (unit.status) {
                                            NetBoxUnitStatus.WITH_CUSTOMER -> "Active"
                                            NetBoxUnitStatus.EXPIRED_WITH_CUSTOMER -> "Expired"
                                            NetBoxUnitStatus.COLLECTED_IN_TRANSIT -> "In Transit"
                                            NetBoxUnitStatus.IN_WAREHOUSE -> "Returned"
                                            NetBoxUnitStatus.LOST -> "Lost"
                                            NetBoxUnitStatus.DAMAGED -> "Damaged"
                                        }
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(Modifier.weight(1f)) {
                                                Text(unit.netboxId, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
                                                Text(
                                                    listOfNotNull(unit.connectionId, unit.customerArea).joinToString(" · "),
                                                    fontSize = 11.sp, color = colors.textMuted
                                                )
                                            }
                                            Box(
                                                modifier = Modifier.clip(RoundedCornerShape(4.dp))
                                                    .background(statusColor.copy(alpha = 0.12f))
                                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                                            ) {
                                                Text(statusLabel, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = statusColor)
                                            }
                                        }
                                        if (i < filtered.size - 1) {
                                            Box(Modifier.fillMaxWidth().height(1.dp).background(colors.borderSubtle))
                                        }
                                    }
                                }
                            }

                            // ── Carry fee alert with return action ──
                            if (carryFeeUnits.isNotEmpty() && rateCard != null) {
                                Spacer(Modifier.height(10.dp))
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(colors.warningSubtle)
                                        .border(1.dp, colors.warning.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                                        .padding(14.dp)
                                ) {
                                    Text("Carry Fee Active", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = colors.warning)
                                    Text(
                                        "${formatCurrency(rateCard.carryFeePerDay)}/day per unit · deducted from wallet",
                                        fontSize = 11.sp, color = colors.textSecondary
                                    )
                                    Spacer(Modifier.height(8.dp))
                                    carryFeeUnits.forEach { unit ->
                                        val requested = unit.netboxId in returnRequested
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(Modifier.weight(1f)) {
                                                Text("${unit.netboxId} · ${unit.customerArea ?: ""}", fontSize = 12.sp, color = colors.textPrimary)
                                                Text("${unit.daysPastExpiry}d overdue · ${formatCurrency(unit.carryFeeAccrued)} accrued", fontSize = 11.sp, color = colors.textMuted)
                                            }
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(if (requested) colors.positive.copy(alpha = 0.15f) else colors.brandPrimary)
                                                    .then(if (!requested) Modifier.clickable { viewModel.requestReturn(unit.netboxId, unit.customerArea, unit.connectionId) } else Modifier)
                                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                                            ) {
                                                Text(
                                                    if (requested) "Requested" else "Return",
                                                    fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                                                    color = if (requested) colors.positive else Color.White
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            // ── Expiry warning with return action ──
                            if (warningUnits.isNotEmpty() && rateCard != null) {
                                Spacer(Modifier.height(8.dp))
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(colors.bgCard)
                                        .border(1.dp, colors.borderSubtle, RoundedCornerShape(10.dp))
                                        .padding(14.dp)
                                ) {
                                    warningUnits.forEach { unit ->
                                        val requested = unit.netboxId in returnRequested
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(Modifier.weight(1f)) {
                                                Text("${unit.netboxId} · ${unit.customerArea ?: ""}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                                                Text(
                                                    "${unit.daysPastExpiry}d past expiry · fee in ${rateCard.carryFeeGraceDays - unit.daysPastExpiry}d",
                                                    fontSize = 11.sp, color = colors.warning
                                                )
                                            }
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(if (requested) colors.positive.copy(alpha = 0.15f) else colors.brandPrimary)
                                                    .then(if (!requested) Modifier.clickable { viewModel.requestReturn(unit.netboxId, unit.customerArea, unit.connectionId) } else Modifier)
                                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                                            ) {
                                                Text(
                                                    if (requested) "Requested" else "Return",
                                                    fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                                                    color = if (requested) colors.positive else Color.White
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            Spacer(Modifier.height(20.dp))
                        } else if (depositLoading) {
                            Box(Modifier.fillMaxWidth().padding(vertical = 20.dp), contentAlignment = Alignment.Center) {
                                Text("Loading...", fontSize = 13.sp, color = colors.textMuted)
                            }
                        }

                        // ── Orders (CSP wants to track dispatched devices) ──
                        if (orders.isNotEmpty()) {
                            Text("ORDERS", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = colors.textSecondary, letterSpacing = 0.5.sp)
                            Spacer(Modifier.height(8.dp))
                            orders.forEach { order ->
                                val statusColor = when (order.status) {
                                    "DELIVERED" -> colors.positive
                                    "DISPATCHED" -> colors.brandPrimary
                                    else -> colors.warning
                                }
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 6.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(colors.bgCard)
                                        .border(1.dp, colors.borderSubtle, RoundedCornerShape(10.dp))
                                        .clickable { selectedOrder = order; step = "order_detail" }
                                        .padding(horizontal = 14.dp, vertical = 12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(Modifier.weight(1f)) {
                                        Text(order.id, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
                                        Text("Qty: ${order.quantity} · ${order.deliveryArea} · ${formatDate(order.createdAt)}", fontSize = 11.sp, color = colors.textMuted)
                                    }
                                    Box(
                                        modifier = Modifier.clip(RoundedCornerShape(4.dp))
                                            .background(statusColor.copy(alpha = 0.1f))
                                            .padding(horizontal = 8.dp, vertical = 3.dp)
                                    ) {
                                        Text(order.status, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = statusColor)
                                    }
                                }
                            }
                            Spacer(Modifier.height(20.dp))
                        }

                        // ── Pending tasks ──
                        if (tasksByState.isNotEmpty()) {
                            Text("PENDING TASKS", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = colors.textSecondary, letterSpacing = 0.5.sp)
                            Spacer(Modifier.height(8.dp))
                            tasksByState.forEach { (state, stateTasks) ->
                                val stateColor = getStateColor(state, colors)
                                stateTasks.forEach { task ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(bottom = 6.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(colors.bgCard)
                                            .drawBehind { drawLine(stateColor, Offset(0f, 0f), Offset(0f, size.height), 3.dp.toPx()) }
                                            .padding(horizontal = 14.dp, vertical = 10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(Modifier.weight(1f)) {
                                            Text(task.taskId, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
                                            Text(listOfNotNull(task.customerArea, task.assignedTo).joinToString(" · "), fontSize = 11.sp, color = colors.textMuted)
                                        }
                                        Box(
                                            modifier = Modifier.clip(RoundedCornerShape(4.dp))
                                                .background(stateColor.copy(alpha = 0.12f))
                                                .padding(horizontal = 8.dp, vertical = 3.dp)
                                        ) {
                                            Text(state.replace("_", " "), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = stateColor)
                                        }
                                    }
                                }
                            }
                            Spacer(Modifier.height(20.dp))
                        }

                        // ── Deposit Balance & History (combined at bottom) ──
                        if (dep != null) {
                            Text("DEPOSIT", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = colors.textSecondary, letterSpacing = 0.5.sp)
                            Spacer(Modifier.height(8.dp))
                            Column(
                                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(colors.bgCard)
                                    .padding(horizontal = 14.dp, vertical = 14.dp)
                            ) {
                                // Balance summary
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text("Deposit Balance", fontSize = 12.sp, color = colors.textSecondary)
                                        Spacer(Modifier.height(4.dp))
                                        Text(formatCurrency(dep.ledger.depositBalance), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("Exit Refund", fontSize = 12.sp, color = colors.textSecondary)
                                        Spacer(Modifier.height(4.dp))
                                        Text(formatCurrency(dep.ledger.exitRefundEstimate), fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = colors.money)
                                    }
                                }

                                // Transaction history
                                if (dep.ledger.transactions.isNotEmpty()) {
                                    Spacer(Modifier.height(14.dp))
                                    Box(Modifier.fillMaxWidth().height(1.dp).background(colors.borderSubtle))
                                    Spacer(Modifier.height(10.dp))
                                    Text("TRANSACTIONS", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = colors.textMuted, letterSpacing = 0.3.sp)
                                    Spacer(Modifier.height(6.dp))
                                    dep.ledger.transactions.forEachIndexed { i, txn ->
                                        val isCredit = txn.amount > 0
                                        val txnColor = if (isCredit) colors.positive else colors.negative
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(Modifier.weight(1f)) {
                                                Text(txn.description, fontSize = 12.sp, color = colors.textPrimary)
                                                Text(formatDate(txn.date), fontSize = 11.sp, color = colors.textMuted)
                                            }
                                            Text(
                                                "${if (isCredit) "+" else ""}${formatCurrency(kotlin.math.abs(txn.amount))}",
                                                fontSize = 14.sp, fontWeight = FontWeight.Bold, color = txnColor
                                            )
                                        }
                                        if (i < dep.ledger.transactions.size - 1) {
                                            Box(Modifier.fillMaxWidth().height(1.dp).background(colors.borderSubtle))
                                        }
                                    }
                                }
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
