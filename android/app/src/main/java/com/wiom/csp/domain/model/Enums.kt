package com.wiom.csp.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class TaskType {
    INSTALL, RESTORE, NETBOX
}

@Serializable
enum class TaskPriority {
    HIGH, NORMAL
}

@Serializable
enum class CreatedBy {
    SYSTEM, MANUAL_EXCEPTION
}

@Serializable
enum class InstallState {
    OFFERED, CLAIMED, ACCEPTED, SCHEDULED, INSTALLED, ACTIVATION_VERIFIED, FAILED
}

@Serializable
enum class RestoreState {
    ALERTED, ASSIGNED, IN_PROGRESS, RESOLVED, VERIFIED, UNRESOLVED
}

@Serializable
enum class NetboxState {
    PICKUP_REQUIRED, ASSIGNED, IN_PROGRESS, COLLECTED, RETURN_CONFIRMED, LOST_DECLARED
}

@Serializable
enum class DelegationState {
    UNASSIGNED, ASSIGNED, ACCEPTED, IN_PROGRESS, BLOCKED, DONE
}

@Serializable
enum class EscalationFlag {
    BLOCKED_STALE,
    RETURN_OVERDUE,
    VERIFICATION_PENDING,
    CHAIN_ESCALATION_PENDING,
    CLAIM_TTL_EXPIRING,
    OFFER_TTL_EXPIRING,
    RESTORE_RETRY,
    INSTALL_OVERDUE,
    PICKUP_OVERDUE,
    MANUAL_EXCEPTION,
    ASSIGNMENT_UNACCEPTED,
    ACTIVATION_TIMEOUT,
    SLA_BREACH
}

@Serializable
enum class ActorType {
    SYSTEM, CSP, ADMIN, TECHNICIAN
}

@Serializable
enum class SlaStanding {
    @SerialName("Compliant") COMPLIANT,
    @SerialName("At Risk") AT_RISK,
    @SerialName("Non-Compliant") NON_COMPLIANT
}

@Serializable
enum class ExposureState {
    ELIGIBLE, LIMITED, INELIGIBLE
}

@Serializable
enum class WalletTransactionType {
    SETTLEMENT, BONUS, WITHDRAWAL, TOP_UP, DEDUCTION, CARRY_FEE, LOSS_RECOVERY, INSTALL_HANDLING, COLLECTION_HANDLING
}

@Serializable
enum class SLADomainId {
    @SerialName("installation") INSTALLATION,
    @SerialName("resolution") RESOLUTION,
    @SerialName("stability") STABILITY,
    @SerialName("experience") EXPERIENCE
}

@Serializable
enum class SLATrend {
    @SerialName("improving") IMPROVING,
    @SerialName("stable") STABLE,
    @SerialName("declining") DECLINING
}

@Serializable
enum class TransactionStatus {
    COMPLETED, PENDING, FAILED
}

@Serializable
enum class SupportCaseStatus {
    OPEN, IN_PROGRESS, RESOLVED, CLOSED
}

@Serializable
enum class NotificationType {
    PAYMENT_RECEIVED,
    SETTLEMENT_CREDIT,
    NEW_OFFER,
    HIGH_RESTORE_ALERT,
    SLA_WARNING,
    GENERAL,
    CAPABILITY_RESET,
    WALLET_FROZEN,
    NETBOX_RECOVERY_DEDUCTION
}

@Serializable
enum class NetBoxUnitStatus {
    WITH_CUSTOMER, EXPIRED_WITH_CUSTOMER, COLLECTED_IN_TRANSIT, IN_WAREHOUSE, LOST, DAMAGED
}

@Serializable
enum class DepositTransactionType {
    DEPOSIT_COLLECTED, LOSS_DEDUCTION, DAMAGE_DEDUCTION, DEPOSIT_REFUND
}

typealias QueueBucket = Int // 0..6

@Serializable
enum class TechnicianBand {
    A, B, C
}

@Serializable
enum class AppTheme {
    @SerialName("dark") DARK,
    @SerialName("state-color-check") STATE_COLOR_CHECK
}
