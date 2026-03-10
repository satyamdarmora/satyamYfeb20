package com.wiom.csp.ui.wallet

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wiom.csp.data.repository.WalletRepository
import com.wiom.csp.domain.model.WalletState
import com.wiom.csp.domain.model.WalletTransaction
import com.wiom.csp.domain.model.WalletTransactionType
import com.wiom.csp.ui.common.formatCurrency
import com.wiom.csp.ui.common.formatTimeAgo
import com.wiom.csp.ui.theme.WiomCspTheme
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class WalletViewModel @Inject constructor(
    private val walletRepo: WalletRepository
) : ViewModel() {
    private val _wallet = MutableStateFlow<WalletState?>(null)
    val wallet: StateFlow<WalletState?> = _wallet

    init { load() }

    fun load() {
        viewModelScope.launch {
            walletRepo.getWallet().onSuccess { _wallet.value = it }
        }
    }

    fun withdraw(amount: Int) {
        viewModelScope.launch {
            val txn = WalletTransaction(
                id = "TXN-${System.currentTimeMillis()}",
                date = java.time.Instant.now().toString(),
                type = WalletTransactionType.WITHDRAWAL,
                amount = -amount,
                description = "Bank transfer withdrawal",
                status = com.wiom.csp.domain.model.TransactionStatus.COMPLETED
            )
            walletRepo.updateWallet(
                balance = (_wallet.value?.balance ?: 0) - amount,
                newTransaction = txn
            )
            load()
        }
    }
}

@Composable
fun WalletHubScreen(
    onBack: () -> Unit,
    viewModel: WalletViewModel = hiltViewModel()
) {
    val colors = WiomCspTheme.colors
    val wallet by viewModel.wallet.collectAsState()
    val data = wallet ?: return

    // Weekly withdrawal cycle check
    val lastWithdrawal = data.transactions.firstOrNull { it.type == WalletTransactionType.WITHDRAWAL && it.status == com.wiom.csp.domain.model.TransactionStatus.COMPLETED }
    val daysSinceLastWithdrawal = if (lastWithdrawal != null) {
        try {
            val lastDate = java.time.Instant.parse(lastWithdrawal.date).toEpochMilli()
            ((System.currentTimeMillis() - lastDate) / 86400000).toInt()
        } catch (_: Exception) { Int.MAX_VALUE }
    } else Int.MAX_VALUE
    val withdrawalCooldown = daysSinceLastWithdrawal < 7

    var showWithdraw by remember { mutableStateOf(false) }

    // Separate transactions into ledger categories per design spec
    // Earnings credits: SETTLEMENT, BONUS, INSTALL_HANDLING, COLLECTION_HANDLING
    val earningsCredits = data.transactions.filter {
        it.type in listOf(
            WalletTransactionType.SETTLEMENT,
            WalletTransactionType.BONUS,
            WalletTransactionType.INSTALL_HANDLING,
            WalletTransactionType.COLLECTION_HANDLING
        )
    }
    // Deposit-related: CARRY_FEE, LOSS_RECOVERY, DEDUCTION
    val depositEntries = data.transactions.filter {
        it.type in listOf(
            WalletTransactionType.CARRY_FEE,
            WalletTransactionType.LOSS_RECOVERY,
            WalletTransactionType.DEDUCTION
        )
    }
    // Other: WITHDRAWAL, TOP_UP
    val otherTransactions = data.transactions.filter {
        it.type in listOf(
            WalletTransactionType.WITHDRAWAL,
            WalletTransactionType.TOP_UP
        )
    }

    Box(
        modifier = Modifier.fillMaxSize().background(colors.bgPrimary).statusBarsPadding()
    ) {
        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())
        ) {
            // Header
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text(
                    text = "\u2190 Back",
                    modifier = Modifier.clickable { onBack() }.padding(vertical = 4.dp),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.textSecondary
                )
                Spacer(Modifier.height(12.dp))
                Text("Wallet", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
            }

            // Frozen banner
            if (data.frozen) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(colors.negativeSubtle)
                        .padding(14.dp)
                ) {
                    Column {
                        Text("Wallet Frozen", fontWeight = FontWeight.Bold, color = colors.negative, fontSize = 14.sp)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            data.frozenReason ?: "Withdrawals are disabled until the investigation is resolved.",
                            fontSize = 12.sp, color = colors.textSecondary, lineHeight = 16.sp
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
            }

            // Balance card
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.bgCard)
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Available Balance", fontSize = 12.sp, color = colors.textMuted)
                Spacer(Modifier.height(4.dp))
                Text(
                    formatCurrency(data.balance),
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.money
                )
                if (data.pendingSettlement > 0) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Pending: ${formatCurrency(data.pendingSettlement)}",
                        fontSize = 12.sp,
                        color = colors.textSecondary
                    )
                }
                Spacer(Modifier.height(16.dp))

                if (!data.frozen) {
                    val canWithdraw = !withdrawalCooldown
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (canWithdraw) colors.brandPrimary else colors.bgSecondary)
                                .clickable(enabled = canWithdraw) { showWithdraw = true }
                                .padding(horizontal = 20.dp, vertical = 10.dp)
                        ) {
                            Text("Withdraw", fontWeight = FontWeight.SemiBold, fontSize = 13.sp,
                                color = if (canWithdraw) Color.White else colors.textMuted)
                        }
                    }
                    if (withdrawalCooldown) {
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "Next withdrawal in ${7 - daysSinceLastWithdrawal} day${if (7 - daysSinceLastWithdrawal != 1) "s" else ""}",
                            fontSize = 12.sp, color = colors.warning
                        )
                    }
                }
            }

            // === EARNINGS CREDIT LEDGER (Design Spec — separate from deposit) ===
            if (earningsCredits.isNotEmpty()) {
                Spacer(Modifier.height(20.dp))
                SectionHeader("EARNINGS CREDITS")
                Spacer(Modifier.height(8.dp))

                earningsCredits.forEach { txn ->
                    EarningsCreditRow(txn)
                }
            }

            // === DEPOSIT POOL LEDGER (Design Spec — separate from earnings) ===
            if (depositEntries.isNotEmpty()) {
                Spacer(Modifier.height(20.dp))
                SectionHeader("DEPOSIT & FEES")
                Spacer(Modifier.height(8.dp))

                depositEntries.forEach { txn ->
                    DepositEntryRow(txn)
                }
            }

            // === OTHER TRANSACTIONS (withdrawals, top-ups) ===
            if (otherTransactions.isNotEmpty()) {
                Spacer(Modifier.height(20.dp))
                SectionHeader("TRANSACTIONS")
                Spacer(Modifier.height(8.dp))

                otherTransactions.forEach { txn ->
                    TransactionRow(txn)
                }
            }

            // Fallback: show all if no categorized entries
            if (earningsCredits.isEmpty() && depositEntries.isEmpty() && otherTransactions.isEmpty() && data.transactions.isNotEmpty()) {
                Spacer(Modifier.height(20.dp))
                SectionHeader("TRANSACTIONS")
                Spacer(Modifier.height(8.dp))

                data.transactions.forEach { txn ->
                    TransactionRow(txn)
                }
            }

            Spacer(Modifier.height(80.dp))
        }

        // Withdraw flow overlay
        if (showWithdraw) {
            WithdrawFlow(
                maxAmount = data.balance,
                onConfirm = { amount ->
                    viewModel.withdraw(amount)
                    showWithdraw = false
                },
                onCancel = { showWithdraw = false }
            )
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    val colors = WiomCspTheme.colors
    Text(
        title,
        modifier = Modifier.padding(horizontal = 16.dp),
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        color = colors.textSecondary,
        letterSpacing = 0.5.sp
    )
}

/** Earnings credit row — shows credit type badge + description + amount (always positive/green) */
@Composable
private fun EarningsCreditRow(txn: WalletTransaction) {
    val colors = WiomCspTheme.colors

    val creditTypeLabel = when (txn.type) {
        WalletTransactionType.SETTLEMENT -> "Settlement"
        WalletTransactionType.BONUS -> "Bonus"
        WalletTransactionType.INSTALL_HANDLING -> "Install"
        WalletTransactionType.COLLECTION_HANDLING -> "Collection"
        else -> txn.type.name
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Credit type badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(colors.positiveSubtle)
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(creditTypeLabel, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = colors.positive)
                }
                Text(txn.description, fontSize = 13.sp, color = colors.textPrimary, maxLines = 1)
            }
            Text(formatTimeAgo(txn.date), fontSize = 11.sp, color = colors.textMuted)
        }
        Text(
            text = "+${formatCurrency(kotlin.math.abs(txn.amount))}",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = colors.positive
        )
    }
}

/** Deposit entry row — shows entry type badge + description + amount (red for deductions) */
@Composable
private fun DepositEntryRow(txn: WalletTransaction) {
    val colors = WiomCspTheme.colors
    val isDeduction = txn.amount < 0

    val entryTypeLabel = when (txn.type) {
        WalletTransactionType.CARRY_FEE -> "Carry Fee"
        WalletTransactionType.LOSS_RECOVERY -> "Loss Recovery"
        WalletTransactionType.DEDUCTION -> "Deduction"
        else -> txn.type.name
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(if (isDeduction) colors.negativeSubtle else colors.warningSubtle)
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        entryTypeLabel, fontSize = 10.sp, fontWeight = FontWeight.SemiBold,
                        color = if (isDeduction) colors.negative else colors.warning
                    )
                }
                Text(txn.description, fontSize = 13.sp, color = colors.textPrimary, maxLines = 1)
            }
            Text(formatTimeAgo(txn.date), fontSize = 11.sp, color = colors.textMuted)
        }
        Text(
            text = "${if (isDeduction) "" else "+"}${formatCurrency(txn.amount)}",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (isDeduction) colors.negative else colors.positive
        )
    }
}

@Composable
private fun TransactionRow(txn: WalletTransaction) {
    val colors = WiomCspTheme.colors
    val isPositive = txn.amount >= 0

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(txn.description, fontSize = 13.sp, color = colors.textPrimary, maxLines = 1)
            Text(
                "${txn.type.name} \u2022 ${formatTimeAgo(txn.date)}",
                fontSize = 11.sp,
                color = colors.textMuted
            )
        }
        Text(
            text = "${if (isPositive) "+" else ""}${formatCurrency(txn.amount)}",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (isPositive) colors.positive else colors.negative
        )
    }
}

@Composable
private fun WithdrawFlow(
    maxAmount: Int,
    onConfirm: (Int) -> Unit,
    onCancel: () -> Unit
) {
    val colors = WiomCspTheme.colors
    var amountText by remember { mutableStateOf("") }

    Box(
        modifier = Modifier.fillMaxSize().background(colors.bgPrimary)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp)
        ) {
            IconButton(onClick = onCancel) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = colors.textPrimary)
            }
            Text("Withdraw Funds", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
            Spacer(Modifier.height(4.dp))
            Text("Max: ${formatCurrency(maxAmount)}", fontSize = 13.sp, color = colors.textSecondary)
            Spacer(Modifier.height(20.dp))

            OutlinedTextField(
                value = amountText,
                onValueChange = { amountText = it.filter { c -> c.isDigit() } },
                label = { Text("Amount (\u20B9)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = colors.brandPrimary,
                    unfocusedBorderColor = colors.borderSubtle,
                    focusedLabelColor = colors.brandPrimary,
                    unfocusedLabelColor = colors.textMuted,
                    cursorColor = colors.brandPrimary,
                    focusedTextColor = colors.textPrimary,
                    unfocusedTextColor = colors.textPrimary,
                )
            )

            Spacer(Modifier.weight(1f))

            val amount = amountText.toIntOrNull() ?: 0
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (amount in 1..maxAmount) colors.brandPrimary else colors.bgCardHover)
                    .clickable(enabled = amount in 1..maxAmount) { onConfirm(amount) }
                    .padding(vertical = 14.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "Confirm Withdrawal",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp,
                    color = if (amount in 1..maxAmount) Color.White else colors.textMuted
                )
            }
        }
    }
}
