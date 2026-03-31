package com.wiom.csp.ui.install

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.wiom.csp.domain.model.TaskType
import com.wiom.csp.ui.home.IndividualTaskCardV2
import com.wiom.csp.ui.home.TaskCardData
import com.wiom.csp.ui.home.TimerState
import com.wiom.csp.ui.theme.WiomTokens

// ════════════════════════════════════════════════════════════════════════════════
// Combined Install + Restore Test Portal
// ════════════════════════════════════════════════════════════════════════════════

// Navigation is a simple stack: each screen is a sealed class.
// Sheets are SCREENS (not overlays) so touch always works.
private sealed class Screen {
    data object Menu : Screen()
    data object InstallFeed : Screen()
    data object RestoreFeed : Screen()
    data object MixedFeed : Screen()
    data object TypeIcons : Screen()
    data object Notifications : Screen()
    data class InstallDrill(val taskId: String) : Screen()
    data class RestoreDrill(val taskId: String) : Screen()
    data class Sheet(val type: SheetKind, val targetTaskId: String, val returnTo: Screen) : Screen()
}

private enum class SheetKind {
    INSTALL_SLOTS, INSTALL_EXIT, INSTALL_EXECUTOR,
    RESTORE_EXECUTOR, RESTORE_DIAGNOSE
}

@Composable
fun InstallTestPortal(onBack: () -> Unit) {
    var installTasks by remember { mutableStateOf(buildInitialInstallTasks()) }
    var restoreTasks by remember { mutableStateOf(buildInitialRestoreTasks()) }
    var toastMessage by remember { mutableStateOf<String?>(null) }
    var screen by remember { mutableStateOf<Screen>(Screen.Menu) }

    LaunchedEffect(toastMessage) {
        if (toastMessage != null) {
            kotlinx.coroutines.delay(2000)
            toastMessage = null
        }
    }

    // Auto-dismiss terminal restore tasks
    val terminalIds = restoreTasks
        .filter { it.state in listOf(RestoreCardState.RESOLVED, RestoreCardState.RECLASSIFIED) }
        .map { it.taskId }
    LaunchedEffect(terminalIds) {
        if (terminalIds.isNotEmpty()) {
            kotlinx.coroutines.delay(4000)
            restoreTasks = restoreTasks.filter { it.taskId !in terminalIds }
        }
    }

    // ── Helper lambdas ──────────────────────────────────────────────────
    val handleInstallCta: (String) -> Unit = { taskId ->
        val task = installTasks.find { it.taskId == taskId }
        if (task != null) when (task.state) {
            InstallCardState.AWAITING_SLOT_PROPOSAL,
            InstallCardState.NEEDS_RESCHEDULING ->
                screen = Screen.Sheet(SheetKind.INSTALL_SLOTS, taskId, screen)
            InstallCardState.SLOT_CONFIRMED ->
                screen = Screen.Sheet(SheetKind.INSTALL_EXECUTOR, taskId, screen)
            InstallCardState.SCHEDULED, InstallCardState.SCHEDULED_TODAY -> {
                installTasks = installTasks.map {
                    if (it.taskId == taskId) it.copy(
                        state = InstallCardState.IN_PROGRESS,
                        reasonText = "इंस्टॉल चल रहा है", maskedCallAvailable = true
                    ) else it
                }
                toastMessage = "भेजा गया — इंस्टॉल शुरू"
            }
            InstallCardState.IN_PROGRESS -> {
                installTasks = installTasks.map {
                    if (it.taskId == taskId) it.copy(
                        state = InstallCardState.INSTALL_SUBMITTED,
                        reasonText = "सिस्टम जाँच रहा है", maskedCallAvailable = false
                    ) else it
                }
                toastMessage = "इंस्टॉल सबमिट"
            }
            else -> {}
        }
    }

    val handleRestoreCta: (String) -> Unit = { taskId ->
        val task = restoreTasks.find { it.taskId == taskId }
        if (task != null) when (task.state) {
            RestoreCardState.RESPOND_NOW -> {
                restoreTasks = restoreTasks.map {
                    if (it.taskId == taskId) it.copy(
                        state = RestoreCardState.WORKING,
                        reasonText = "ठीक कर रहे हैं · 3 घंटे 50 मिनट बाकी",
                        maskedCallAvailable = true, canDiagnose = true,
                        proofState = ProofState(deviceEvent = ProofResult.PENDING)
                    ) else it
                }
                toastMessage = "शुरू — WORKING"
            }
            // DRILLDOWN_REQUIRED → open drilldown
            RestoreCardState.WORKING,
            RestoreCardState.ESCALATED_CSP_ACTIVE,
            RestoreCardState.CUSTOMER_DENIED ->
                screen = Screen.RestoreDrill(taskId)
            else -> {}
        }
    }

    // ── Render current screen ───────────────────────────────────────────
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(WiomTokens.Bg.screen)
            .systemBarsPadding()
    ) {
        when (val s = screen) {
            Screen.Menu -> MainMenu(
                installCount = installTasks.size, restoreCount = restoreTasks.size,
                onBack = onBack,
                onNav = { screen = it },
                onReset = {
                    installTasks = buildInitialInstallTasks()
                    restoreTasks = buildInitialRestoreTasks()
                    toastMessage = "Reset done"
                }
            )

            Screen.InstallFeed -> CardFeed(
                title = "Install Card Feed",
                subtitle = "${installTasks.size} tasks",
                cards = installTasks.map { t ->
                    t.state.name to t.toCardData(
                        onPrimaryClick = { handleInstallCta(t.taskId) },
                        // No secondary CTA on install cards. Call in drilldown only.
                        onCardClick = { screen = Screen.InstallDrill(t.taskId) }
                    )
                },
                onBack = { screen = Screen.Menu }
            )

            Screen.RestoreFeed -> CardFeed(
                title = "Restore Card Feed",
                subtitle = "${restoreTasks.size} tasks · Red accent · ONE CTA",
                cards = restoreTasks.map { t ->
                    t.state.name to t.toCardData(
                        onPrimaryClick = { handleRestoreCta(t.taskId) },
                        onCardClick = { screen = Screen.RestoreDrill(t.taskId) }
                    )
                },
                onBack = { screen = Screen.Menu }
            )

            Screen.MixedFeed -> MixedFeedScreen(
                installTasks = installTasks, restoreTasks = restoreTasks,
                onInstallCard = { screen = Screen.InstallDrill(it) },
                onRestoreCard = { screen = Screen.RestoreDrill(it) },
                onBack = { screen = Screen.Menu }
            )

            Screen.TypeIcons -> TypeIconsScreen(onBack = { screen = Screen.Menu })
            Screen.Notifications -> NotificationsScreen(onBack = { screen = Screen.Menu })

            is Screen.InstallDrill -> {
                val task = installTasks.find { it.taskId == s.taskId }
                if (task == null) { screen = Screen.InstallFeed; return@Box }
                InstallDrilldown(
                    task = task,
                    onBack = { screen = Screen.InstallFeed },
                    onPrimaryAction = { handleInstallCta(task.taskId) },
                    onCallCustomer = { toastMessage = "कॉल शुरू... (masked)" },
                    onExit = { screen = Screen.Sheet(SheetKind.INSTALL_EXIT, task.taskId, Screen.InstallFeed) }
                )
            }

            is Screen.RestoreDrill -> {
                val task = restoreTasks.find { it.taskId == s.taskId }
                if (task == null) { screen = Screen.RestoreFeed; return@Box }
                RestoreDrilldown(
                    task = task,
                    onBack = { screen = Screen.RestoreFeed },
                    onStartWork = {
                        restoreTasks = restoreTasks.map {
                            if (it.taskId == task.taskId) it.copy(
                                state = RestoreCardState.WORKING,
                                reasonText = "ठीक कर रहे हैं · 3 घंटे 50 मिनट बाकी",
                                maskedCallAvailable = true, canDiagnose = true,
                                proofState = ProofState(deviceEvent = ProofResult.PENDING)
                            ) else it
                        }
                        toastMessage = "शुरू — WORKING"
                        screen = Screen.RestoreFeed
                    },
                    onResolve = {
                        restoreTasks = restoreTasks.map {
                            if (it.taskId == task.taskId) it.copy(
                                state = RestoreCardState.VERIFICATION_PENDING,
                                reasonText = "जाँच हो रही है",
                                maskedCallAvailable = false, canDiagnose = false
                            ) else it
                        }
                        toastMessage = "सबमिट — VERIFICATION_PENDING"
                        screen = Screen.RestoreFeed
                    },
                    onRunSystemCheck = {
                        restoreTasks = restoreTasks.map {
                            if (it.taskId == task.taskId) it.copy(
                                proofState = it.proofState.copy(systemCheck = ProofResult.PASS)
                            ) else it
                        }
                        toastMessage = "System check ✅ Pass"
                    },
                    onRequestCustomerConfirm = {
                        restoreTasks = restoreTasks.map {
                            if (it.taskId == task.taskId) it.copy(
                                proofState = it.proofState.copy(customerConfirm = ProofResult.PENDING)
                            ) else it
                        }
                        toastMessage = "Customer से पुष्टि माँगी..."
                    },
                    onCallCustomer = { toastMessage = "कॉल शुरू... (masked)" },
                    onAssignExecutor = {
                        screen = Screen.Sheet(SheetKind.RESTORE_EXECUTOR, task.taskId, Screen.RestoreDrill(task.taskId))
                    },
                    onDiagnose = {
                        screen = Screen.Sheet(SheetKind.RESTORE_DIAGNOSE, task.taskId, Screen.RestoreDrill(task.taskId))
                    }
                )
            }

            // ── Sheets (full-screen, not overlay) ───────────────────────
            is Screen.Sheet -> when (s.type) {
                SheetKind.INSTALL_SLOTS -> SlotProposalSheet(
                    onSubmit = { d1, s1, e1, d2, s2, e2 ->
                        installTasks = installTasks.map {
                            if (it.taskId == s.targetTaskId) it.copy(
                                state = InstallCardState.AWAITING_CUSTOMER_SELECTION,
                                reasonText = "ग्राहक चुन रहा है", timerState = TimerState.NORMAL,
                                slot1 = SlotInfo("$d1", "$s1-$e1", SlotStatus.ACTIVE),
                                slot2 = SlotInfo("$d2", "$s2-$e2", SlotStatus.ACTIVE)
                            ) else it
                        }
                        toastMessage = "समय भेजा — ग्राहक चुन रहा है"
                        screen = Screen.InstallFeed
                    },
                    onDismiss = { screen = s.returnTo }
                )
                SheetKind.INSTALL_EXIT -> ExitReasonSheet(
                    onConfirm = { reason ->
                        installTasks = installTasks.filter { it.taskId != s.targetTaskId }
                        toastMessage = "Exit: $reason — card removed"
                        screen = Screen.InstallFeed
                    },
                    onDismiss = { screen = s.returnTo }
                )
                SheetKind.INSTALL_EXECUTOR -> ExecutorAssignmentSheet(
                    options = listOf(
                        ExecutorOption("self", "अन्नू", isSelf = true),
                        ExecutorOption("tech1", "राजेश"), ExecutorOption("tech2", "सुनील")
                    ),
                    onAssign = { id ->
                        val name = when (id) { "self" -> "अन्नू (स्वयं)"; "tech1" -> "राजेश"; else -> "सुनील" }
                        installTasks = installTasks.map {
                            if (it.taskId == s.targetTaskId) it.copy(
                                state = InstallCardState.SCHEDULED,
                                reasonText = "तैयार — ${it.slotDay ?: "शुक्रवार"} ${it.slotTime ?: "10-12"}",
                                executorName = name
                            ) else it
                        }
                        toastMessage = "$name → SCHEDULED"
                        screen = Screen.InstallFeed
                    },
                    onDismiss = { screen = s.returnTo }
                )
                SheetKind.RESTORE_EXECUTOR -> ExecutorAssignmentSheet(
                    options = listOf(
                        ExecutorOption("self", "अन्नू", isSelf = true),
                        ExecutorOption("tech1", "राजेश")
                    ),
                    onAssign = { id ->
                        val name = if (id == "self") "अन्नू (स्वयं)" else "राजेश"
                        restoreTasks = restoreTasks.map {
                            if (it.taskId == s.targetTaskId) it.copy(executorName = name) else it
                        }
                        toastMessage = "$name assigned"
                        screen = s.returnTo
                    },
                    onDismiss = { screen = s.returnTo }
                )
                SheetKind.RESTORE_DIAGNOSE -> DiagnoseFaultSheet(
                    onSubmit = { fault ->
                        restoreTasks = restoreTasks.map {
                            if (it.taskId == s.targetTaskId) it.copy(
                                state = RestoreCardState.RECLASSIFIED,
                                reasonText = "Device issue — प्लेटफ़ॉर्म देखेगा",
                                autoDismissSeconds = 4
                            ) else it
                        }
                        toastMessage = "Diagnosis: $fault → RECLASSIFIED"
                        screen = Screen.RestoreFeed
                    },
                    onDismiss = { screen = s.returnTo }
                )
            }
        }

        // Toast (always on top)
        RollbackToast(
            message = toastMessage,
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 32.dp)
        )
    }
}

// ── Card Feed (generic for both Install and Restore) ────────────────────────────

@Composable
private fun CardFeed(
    title: String, subtitle: String,
    cards: List<Pair<String, TaskCardData>>,
    onBack: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().background(WiomTokens.Bg.screen),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        item {
            BackHeader(onBack)
            Spacer(Modifier.height(12.dp))
            Text(title, style = WiomTokens.Type.headerTitle, color = WiomTokens.Text.primary,
                modifier = Modifier.padding(horizontal = 20.dp))
            Text(subtitle, style = WiomTokens.Type.bodySmall, color = WiomTokens.Text.secondary,
                modifier = Modifier.padding(horizontal = 20.dp))
            Spacer(Modifier.height(16.dp))
        }
        if (cards.isEmpty()) {
            item { Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                Text("सभी काम पूरे या exit हो गए", style = WiomTokens.Type.body, color = WiomTokens.Text.hint)
            }}
        }
        items(cards, key = { it.second.taskId }) { (label, data) ->
            Text(label, style = WiomTokens.Type.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                color = WiomTokens.Text.hint, modifier = Modifier.padding(horizontal = 20.dp, vertical = 2.dp))
            IndividualTaskCardV2(data = data)
            Spacer(Modifier.height(12.dp))
        }
    }
}

// ── Mixed Feed ──────────────────────────────────────────────────────────────────

@Composable
private fun MixedFeedScreen(
    installTasks: List<InstallTask>, restoreTasks: List<RestoreTask>,
    onInstallCard: (String) -> Unit, onRestoreCard: (String) -> Unit,
    onBack: () -> Unit
) {
    val mixed = remember(installTasks, restoreTasks) {
        val all = mutableListOf<Pair<String, TaskCardData>>()
        restoreTasks.filter { it.state == RestoreCardState.RESPOND_NOW }.forEach {
            all.add("R:${it.state.name}" to it.toCardData(onCardClick = { onRestoreCard(it.taskId) }))
        }
        restoreTasks.filter { it.state in listOf(RestoreCardState.WORKING, RestoreCardState.ESCALATED_CSP_ACTIVE) }.forEach {
            all.add("R:${it.state.name}" to it.toCardData(onCardClick = { onRestoreCard(it.taskId) }))
        }
        installTasks.take(3).forEach {
            all.add("I:${it.state.name}" to it.toCardData(onCardClick = { onInstallCard(it.taskId) }))
        }
        restoreTasks.filter { it.state !in listOf(RestoreCardState.RESPOND_NOW, RestoreCardState.WORKING, RestoreCardState.ESCALATED_CSP_ACTIVE) }.forEach {
            all.add("R:${it.state.name}" to it.toCardData(onCardClick = { onRestoreCard(it.taskId) }))
        }
        installTasks.drop(3).forEach {
            all.add("I:${it.state.name}" to it.toCardData(onCardClick = { onInstallCard(it.taskId) }))
        }
        all
    }
    CardFeed(title = "Mixed Home Feed", subtitle = "Install (🏠 grey) + Restore (🔧 red)", cards = mixed, onBack = onBack)
}

// ── Main Menu ───────────────────────────────────────────────────────────────────

@Composable
private fun MainMenu(
    installCount: Int, restoreCount: Int,
    onBack: () -> Unit, onNav: (Screen) -> Unit, onReset: () -> Unit
) {
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp)) {
        item {
            BackHeader(onBack)
            Spacer(Modifier.height(16.dp))
            Text("Install + Restore Portal", style = WiomTokens.Type.headerTitle, color = WiomTokens.Text.primary)
            Text("Install v1.4 ($installCount) + Restore v1.0 ($restoreCount)",
                style = WiomTokens.Type.bodySmall, color = WiomTokens.Text.secondary)
            Spacer(Modifier.height(24.dp))
        }
        items(listOf(
            Screen.MixedFeed to "Mixed Home Feed — Install + Restore",
            Screen.InstallFeed to "Install Cards — scheduling flow",
            Screen.RestoreFeed to "Restore Cards — guided proof, escalation",
            Screen.TypeIcons to "Type Icons (🏠 🔧 📦) + देखें ›",
            Screen.Notifications to "Notifications (Install + Restore)"
        )) { (s, label) -> MenuBtn(label) { onNav(s) }; Spacer(Modifier.height(8.dp)) }
        item { Spacer(Modifier.height(8.dp)); MenuBtn("Reset all tasks") { onReset() }; Spacer(Modifier.height(24.dp)) }
        item { Text("Install flow:", style = WiomTokens.Type.body.copy(fontWeight = FontWeight.SemiBold), color = WiomTokens.Text.primary) }
        items(listOf(
            "1. Tap AWAITING_SLOT card → drilldown → \"समय भेजें\" → Slot Sheet",
            "2. Submit slots → AWAITING_CUSTOMER (passive)",
            "3. Tap SLOT_CONFIRMED → drilldown → \"व्यक्ति चुनें\" → Executor Sheet",
            "4. Assign → SCHEDULED",
            "5. Tap SCHEDULED → drilldown → \"शुरू करें\" (1 tap) → IN_PROGRESS",
            "6. Exit: drilldown → \"नहीं कर पाएँगे\" → Exit Sheet → card gone",
        )) { Text(it, style = WiomTokens.Type.bodySmall, color = WiomTokens.Text.secondary, modifier = Modifier.padding(vertical = 2.dp)) }
        item { Spacer(Modifier.height(16.dp)); Text("Restore flow:", style = WiomTokens.Type.body.copy(fontWeight = FontWeight.SemiBold), color = WiomTokens.Text.primary) }
        items(listOf(
            "1. RESPOND_NOW → \"शुरू करें\" (1 tap DIRECT) → WORKING",
            "2. WORKING → \"ठीक करें\" → drilldown with guided proof",
            "3. Tap \"System check करें\" → ✅ Pass → Resolve enables",
            "4. Tap \"ठीक करें\" → VERIFICATION_PENDING",
            "5. ESCALATED → same flow, ⚠ on reason line",
            "6. Diagnose: drilldown → expand → fault sheet → RECLASSIFIED (4s exit)",
            "7. RESOLVED → brief display → auto-exit",
            "8. No exit/decline anywhere. Red accent always.",
        )) { Text(it, style = WiomTokens.Type.bodySmall, color = WiomTokens.Text.secondary, modifier = Modifier.padding(vertical = 2.dp)) }
    }
}

@Composable private fun BackHeader(onBack: () -> Unit) {
    Text("‹ वापस", style = WiomTokens.Type.body.copy(fontWeight = FontWeight.SemiBold),
        color = WiomTokens.Brand.primary, modifier = Modifier.clickable { onBack() }.padding(horizontal = 0.dp))
}
@Composable private fun MenuBtn(label: String, onClick: () -> Unit) {
    Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(WiomTokens.Bg.surface)
        .clickable { onClick() }.padding(16.dp)) {
        Text(label, style = WiomTokens.Type.body, color = WiomTokens.Text.primary)
    }
}

// ── Notifications ───────────────────────────────────────────────────────────────

@Composable
private fun NotificationsScreen(onBack: () -> Unit) {
    val notifs = listOf(
        "नया इंस्टॉल — समय भेजें" to "CN-4021 — नया कनेक्शन",
        "ग्राहक ने समय चुना — व्यक्ति चुनें" to "CN-4021 — बुधवार 3-5 PM",
        "कनेक्शन खराब — अभी जाएं" to "CN-8842 — Service down",
        "जवाब का समय खत्म हो रहा" to "CN-8842 — 5 मिनट बाकी",
        "जवाब नहीं दिया — अभी ठीक करें" to "CN-8842 — Tier 0",
        "SLA टूट गया — supervisor को पता चला" to "CN-8842 — Tier 1",
        "ग्राहक ने कहा ठीक नहीं हुआ" to "CN-8842 — Re-resolve",
    )
    LazyColumn(Modifier.fillMaxSize().background(WiomTokens.Bg.screen), contentPadding = PaddingValues(20.dp)) {
        item { BackHeader(onBack); Spacer(Modifier.height(16.dp))
            Text("Notifications", style = WiomTokens.Type.headerTitle, color = WiomTokens.Text.primary); Spacer(Modifier.height(16.dp)) }
        items(notifs) { (t, b) -> NotificationPreview(title = t, body = b); Spacer(Modifier.height(12.dp)) }
    }
}

// ── Type Icons ──────────────────────────────────────────────────────────────────

@Composable
private fun TypeIconsScreen(onBack: () -> Unit) {
    val cards = listOf(
        "🏠 Install — grey accent" to TaskCardData(taskId = "TI", taskType = TaskType.INSTALL, typeLabel = "इंस्टॉल",
            objectId = "CN-4021", locality = "सेक्टर 15", reasonTimerText = "समय भेजें · 5 दिन बाकी",
            timerState = TimerState.NORMAL, primaryCtaLabel = "समय भेजें"),
        "🔧 Restore — RED accent" to TaskCardData(taskId = "TR", taskType = TaskType.RESTORE, typeLabel = "Restore",
            objectId = "CN-8842", locality = "सेक्टर 22", reasonTimerText = "कनेक्शन खराब · 18 मिनट बाकी",
            timerState = TimerState.URGENT, primaryCtaLabel = "शुरू करें"),
        "📦 NetBox — grey accent" to TaskCardData(taskId = "TN", taskType = TaskType.NETBOX, typeLabel = "नेटबॉक्स",
            objectId = "NB-0091", locality = "Sector 56", reasonTimerText = "वापसी बाकी · 2 दिन",
            timerState = TimerState.NORMAL, primaryCtaLabel = "वापसी पक्की करें"),
        "Passive — no CTA" to TaskCardData(taskId = "TP", taskType = TaskType.INSTALL, typeLabel = "इंस्टॉल",
            objectId = "CN-4022", locality = "सेक्टर 22", reasonTimerText = "ग्राहक चुन रहा है",
            timerState = TimerState.NORMAL, primaryCtaLabel = null),
        "⚠ Escalated Restore" to TaskCardData(taskId = "TE", taskType = TaskType.RESTORE, typeLabel = "Restore",
            objectId = "CN-8843", locality = "DLF Phase 3", reasonTimerText = "⚠ समय बढ़ रहा · 20 मिनट बाकी",
            timerState = TimerState.OVERDUE, primaryCtaLabel = "ठीक करें"),
        "✓ Resolved (no देखें)" to TaskCardData(taskId = "TD", taskType = TaskType.RESTORE, typeLabel = "Restore",
            objectId = "CN-8844", locality = "Sector 45", reasonTimerText = "✓ ठीक हो गया",
            timerState = TimerState.NORMAL, primaryCtaLabel = null, showDekhein = false),
        "Slot-day — no Call on card (drilldown only)" to TaskCardData(taskId = "TS", taskType = TaskType.INSTALL, typeLabel = "इंस्टॉल",
            objectId = "CN-4025", locality = "सेक्टर 15", reasonTimerText = "आज का काम — तैयार · आज 3-5 PM",
            timerState = TimerState.NORMAL, primaryCtaLabel = "शुरू करें"),
    )
    LazyColumn(Modifier.fillMaxSize().background(WiomTokens.Bg.screen), contentPadding = PaddingValues(vertical = 16.dp)) {
        item { BackHeader({ }); Spacer(Modifier.height(12.dp)) // onBack handled below
            Text("Type Icons + States", style = WiomTokens.Type.headerTitle, color = WiomTokens.Text.primary,
                modifier = Modifier.padding(horizontal = 20.dp)); Spacer(Modifier.height(16.dp)) }
        items(cards) { (label, data) ->
            Text(label, style = WiomTokens.Type.bodySmall, color = WiomTokens.Text.hint, modifier = Modifier.padding(horizontal = 20.dp))
            Spacer(Modifier.height(4.dp)); IndividualTaskCardV2(data = data); Spacer(Modifier.height(16.dp))
        }
    }
}

// ── Sample Data ─────────────────────────────────────────────────────────────────

private fun buildInitialInstallTasks() = listOf(
    InstallTask(taskId = "I-101", connectionId = "CN-4021", locality = "सेक्टर 15",
        state = InstallCardState.AWAITING_SLOT_PROPOSAL, reasonText = "समय भेजें · 5 दिन बाकी",
        assignmentSource = "new", serviceAddress = "H.No. 234, सेक्टर 15, गुरुग्राम 122001",
        nearestConnection = "सेक्टर 14, ~500m", p74DaysRemaining = 68,
        timeline = listOf(TimelineEntry("31 Mar 10:00", "असाइन हुआ", "System"))),
    InstallTask(taskId = "I-102", connectionId = "CN-4022", locality = "सेक्टर 22",
        state = InstallCardState.AWAITING_CUSTOMER_SELECTION, reasonText = "ग्राहक चुन रहा है",
        serviceAddress = "Plot 56, सेक्टर 22", nearestConnection = "सेक्टर 21, ~800m", p74DaysRemaining = 60,
        slot1 = SlotInfo("2 Apr", "10-12 PM", SlotStatus.ACTIVE), slot2 = SlotInfo("3 Apr", "2-4 PM", SlotStatus.ACTIVE)),
    InstallTask(taskId = "I-103", connectionId = "CN-4023", locality = "DLF Phase 2",
        state = InstallCardState.SLOT_CONFIRMED, reasonText = "समय पक्का · बुधवार 3-5 PM",
        serviceAddress = "A-12, DLF Phase 2", nearestConnection = "DLF Phase 1, ~1.2km", p74DaysRemaining = 55,
        slotDay = "2 Apr", slotTime = "3-5 PM",
        slot1 = SlotInfo("2 Apr", "3-5 PM", SlotStatus.CONFIRMED), slot2 = SlotInfo("3 Apr", "10-12", SlotStatus.EXPIRED)),
    InstallTask(taskId = "I-104", connectionId = "CN-4024", locality = "Sector 45",
        state = InstallCardState.SCHEDULED, reasonText = "तैयार — भेजने से पहले · शुक्रवार 10-12 PM",
        serviceAddress = "B-78, Sector 45", nearestConnection = "Sector 44, ~300m", p74DaysRemaining = 50,
        executorName = "अन्नू (स्वयं)", slotDay = "4 Apr", slotTime = "10-12 PM",
        slot1 = SlotInfo("4 Apr", "10-12 PM", SlotStatus.CONFIRMED)),
    InstallTask(taskId = "I-105", connectionId = "CN-4025", locality = "सेक्टर 15",
        state = InstallCardState.SCHEDULED_TODAY, reasonText = "आज का काम · आज 3-5 PM",
        maskedCallAvailable = true, serviceAddress = "H.No. 567, सेक्टर 15", nearestConnection = "सेक्टर 14, ~400m",
        p74DaysRemaining = 45, executorName = "अन्नू (स्वयं)", slotDay = "आज", slotTime = "3-5 PM",
        slot1 = SlotInfo("31 Mar", "3-5 PM", SlotStatus.CONFIRMED)),
    InstallTask(taskId = "I-106", connectionId = "CN-4026", locality = "Sector 10",
        state = InstallCardState.NEEDS_RESCHEDULING, reasonText = "फिर से समय भेजें · 3 दिन बाकी",
        timerState = TimerState.URGENT, serviceAddress = "C-34, Sector 10", nearestConnection = "Sector 9, ~600m",
        p74DaysRemaining = 30, slot1 = SlotInfo("28 Mar", "2-4 PM", SlotStatus.EXPIRED)),
    InstallTask(taskId = "I-107", connectionId = "CN-4027", locality = "DLF Phase 4",
        state = InstallCardState.SCHEDULING_FAILED, reasonText = "ग्राहक से पुष्टि हो रही है",
        serviceAddress = "E-90, DLF Phase 4", nearestConnection = "DLF Phase 3, ~900m", p74DaysRemaining = 40),
)

private fun buildInitialRestoreTasks() = listOf(
    RestoreTask(taskId = "R-201", connectionId = "CN-8842", locality = "सेक्टर 22",
        state = RestoreCardState.RESPOND_NOW, reasonText = "कनेक्शन खराब · 18 मिनट बाकी",
        timerState = TimerState.URGENT, serviceAddress = "H.No. 45, सेक्टर 22, गुरुग्राम", issueType = "SERVICE_ISSUE",
        timeline = listOf(TimelineEntry("31 Mar 14:00", "Alert created", "System"))),
    RestoreTask(taskId = "R-202", connectionId = "CN-8843", locality = "DLF Phase 3",
        state = RestoreCardState.WORKING, reasonText = "ठीक कर रहे हैं · 3 घंटे 20 मिनट बाकी",
        maskedCallAvailable = true, canDiagnose = true,
        serviceAddress = "B-22, DLF Phase 3", issueType = "SERVICE_ISSUE",
        executorName = "अन्नू (स्वयं)", proofState = ProofState(deviceEvent = ProofResult.PENDING)),
    RestoreTask(taskId = "R-203", connectionId = "CN-8844", locality = "Sector 45",
        state = RestoreCardState.ESCALATED_CSP_ACTIVE, reasonText = "समय बढ़ रहा — अभी ठीक करें · 45 मिनट बाकी",
        timerState = TimerState.OVERDUE, isEscalated = true, escalationTier = 1,
        maskedCallAvailable = true, canDiagnose = true,
        serviceAddress = "C-90, Sector 45", issueType = "INSTALLATION_DEFECT",
        executorName = "अन्नू (स्वयं)", proofState = ProofState(deviceEvent = ProofResult.PENDING)),
    RestoreTask(taskId = "R-204", connectionId = "CN-8845", locality = "सेक्टर 30",
        state = RestoreCardState.ESCALATED_PLATFORM_TAKEOVER, reasonText = "प्लेटफ़ॉर्म संभाल रहा है",
        serviceAddress = "D-12, सेक्टर 30"),
    RestoreTask(taskId = "R-205", connectionId = "CN-8846", locality = "Sector 17",
        state = RestoreCardState.VERIFICATION_PENDING, reasonText = "जाँच हो रही है",
        serviceAddress = "F-45, Sector 17",
        proofState = ProofState(deviceEvent = ProofResult.PENDING, systemCheck = ProofResult.PASS)),
    RestoreTask(taskId = "R-206", connectionId = "CN-8847", locality = "DLF Phase 1",
        state = RestoreCardState.CUSTOMER_DENIED, reasonText = "ग्राहक ने कहा ठीक नहीं हुआ · P93",
        timerState = TimerState.URGENT, isEscalated = true, escalationTier = 2,
        maskedCallAvailable = true, canDiagnose = true,
        serviceAddress = "A-5, DLF Phase 1", issueType = "SERVICE_ISSUE",
        executorName = "अन्नू (स्वयं)", proofState = ProofState(deviceEvent = ProofResult.PENDING)),
    RestoreTask(taskId = "R-207", connectionId = "CN-8848", locality = "Sector 56",
        state = RestoreCardState.RESOLVED, reasonText = "ठीक हो गया",
        serviceAddress = "G-78, Sector 56", autoDismissSeconds = 4),
    RestoreTask(taskId = "R-208", connectionId = "CN-8849", locality = "Palam Vihar",
        state = RestoreCardState.RECLASSIFIED, reasonText = "Device issue — प्लेटफ़ॉर्म देखेगा",
        serviceAddress = "H-12, Palam Vihar", autoDismissSeconds = 4),
)
