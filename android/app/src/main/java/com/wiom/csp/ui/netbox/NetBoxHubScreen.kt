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
import com.wiom.csp.data.repository.TaskRepository
import com.wiom.csp.domain.model.Task
import com.wiom.csp.domain.model.TaskType
import com.wiom.csp.ui.common.formatCountdown
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

@HiltViewModel
class NetBoxViewModel @Inject constructor(
    private val taskRepo: TaskRepository
) : ViewModel() {
    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks

    init { load() }

    fun load() {
        viewModelScope.launch {
            taskRepo.getTasks().onSuccess { all ->
                _tasks.value = all.filter { it.taskType == TaskType.NETBOX && !it.isTerminal }
            }
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
    var step by remember { mutableStateOf("hub") } // hub, create_order, order_detail
    var orders by remember { mutableStateOf(MOCK_ORDERS) }
    var selectedOrder by remember { mutableStateOf<NetBoxOrder?>(null) }
    var quantity by remember { mutableStateOf("") }
    var deliveryArea by remember { mutableStateOf(AREAS[0]) }

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
                val canSubmit = (quantity.toIntOrNull() ?: 0) > 0
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
                        Text("Request New NetBox", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                    ) {
                        // Quantity
                        Text("Quantity", fontSize = 12.sp, color = colors.textSecondary)
                        Spacer(Modifier.height(6.dp))
                        OutlinedTextField(
                            value = quantity,
                            onValueChange = { quantity = it },
                            placeholder = { Text("Number of NetBox units", fontSize = 14.sp) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = colors.bgSecondary,
                                unfocusedContainerColor = colors.bgSecondary,
                                focusedBorderColor = colors.brandPrimary,
                                unfocusedBorderColor = colors.borderSubtle,
                                focusedTextColor = colors.textPrimary,
                                unfocusedTextColor = colors.textPrimary,
                                cursorColor = colors.brandPrimary
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(Modifier.height(16.dp))

                        // Delivery Area
                        Text("Delivery Area", fontSize = 12.sp, color = colors.textSecondary)
                        Spacer(Modifier.height(6.dp))

                        // Area chips
                        val chunkedAreas = AREAS.chunked(2)
                        chunkedAreas.forEach { row ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                row.forEach { area ->
                                    val selected = area == deliveryArea
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(if (selected) colors.brandPrimary.copy(alpha = 0.15f) else colors.bgSecondary)
                                            .border(
                                                1.dp,
                                                if (selected) colors.brandPrimary else colors.borderSubtle,
                                                RoundedCornerShape(8.dp)
                                            )
                                            .clickable { deliveryArea = area }
                                            .padding(horizontal = 12.dp, vertical = 10.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            area,
                                            fontSize = 13.sp,
                                            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                                            color = if (selected) colors.brandPrimary else colors.textPrimary
                                        )
                                    }
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                        }

                        Spacer(Modifier.height(24.dp))

                        // Submit
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(colors.brandPrimary.copy(alpha = if (canSubmit) 1f else 0.4f))
                                .clickable(enabled = canSubmit) {
                                    val newOrder = NetBoxOrder(
                                        id = "ORD-${System.currentTimeMillis().toString().takeLast(4)}",
                                        quantity = quantity.toInt(),
                                        deliveryArea = deliveryArea,
                                        status = "ORDERED",
                                        createdAt = java.time.Instant.now().toString()
                                    )
                                    orders = orders + newOrder
                                    selectedOrder = newOrder
                                    step = "order_detail"
                                }
                                .padding(vertical = 14.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Submit Order", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        }
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
