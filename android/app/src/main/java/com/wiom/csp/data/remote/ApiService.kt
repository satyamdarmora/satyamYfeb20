package com.wiom.csp.data.remote

import com.wiom.csp.data.remote.dto.*
import com.wiom.csp.domain.model.AppNotification
import com.wiom.csp.domain.model.AssuranceState
import com.wiom.csp.domain.model.SupportCase
import com.wiom.csp.domain.model.Task
import com.wiom.csp.domain.model.Technician
import com.wiom.csp.domain.model.WalletState
import com.wiom.csp.domain.model.SLAOverallState
import retrofit2.http.*

interface ApiService {

    // ---- Tasks ----
    @GET("/api/tasks")
    suspend fun getTasks(): List<Task>

    @POST("/api/tasks")
    suspend fun updateTask(@Body request: TaskUpdateRequest): TaskUpdateResponse

    // ---- Assurance ----
    @GET("/api/assurance")
    suspend fun getAssurance(): AssuranceState

    @POST("/api/assurance")
    suspend fun updateAssurance(@Body request: AssuranceUpdateRequest): AssuranceUpdateResponse

    // ---- Wallet ----
    @GET("/api/wallet")
    suspend fun getWallet(): WalletState

    @POST("/api/wallet")
    suspend fun updateWallet(@Body request: WalletUpdateRequest): WalletUpdateResponse

    // ---- Theme ----
    @GET("/api/theme")
    suspend fun getTheme(): ThemeResponse

    @POST("/api/theme")
    suspend fun updateTheme(@Body request: ThemeUpdateRequest): ThemeUpdateResponse

    // ---- Notifications ----
    @GET("/api/notifications")
    suspend fun getNotifications(): List<AppNotification>

    @POST("/api/notifications")
    suspend fun postNotification(@Body request: NotificationPostRequest): NotificationPostResponse

    @POST("/api/notifications/dismiss")
    suspend fun dismissNotification(@Body request: NotificationDismissRequest)

    // ---- Technicians ----
    @GET("/api/technician/register")
    suspend fun getTechnicians(): List<Technician>

    @GET("/api/technician/tasks")
    suspend fun getTechnicianTasks(@Query("tech_id") techId: String): TechTasksResponse

    @POST("/api/technician/register")
    suspend fun registerTechnician(@Body request: TechnicianRegisterRequest)

    @POST("/api/technician/action")
    suspend fun technicianAction(@Body body: Map<String, String>): TechActionResponse

    // ---- SLA ----
    @GET("/api/sla")
    suspend fun getSLA(): SLAOverallState

    // ---- Deposit ----
    @POST("/api/deposit")
    suspend fun postDeposit(@Body request: DepositActionRequest): DepositActionResponse

    // ---- Support ----
    @GET("/api/support")
    suspend fun getSupportCases(): List<SupportCase>

    @POST("/api/support")
    suspend fun createSupportCase(@Body request: SupportCaseCreateRequest)
}
