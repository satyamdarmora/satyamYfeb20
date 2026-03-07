package com.wiom.csp.data.remote

import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody

/**
 * Returns realistic seed data for all API endpoints when USE_MOCK=true.
 * Exercises full JSON deserialization pipeline identical to real API responses.
 */
class MockInterceptor : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val path = request.url.encodedPath
        val method = request.method

        val json = when {
            path == "/api/tasks" && method == "GET" -> MOCK_TASKS
            path == "/api/tasks" && method == "POST" -> """{"ok":true,"task":null}"""
            path == "/api/assurance" && method == "GET" -> MOCK_ASSURANCE
            path == "/api/assurance" && method == "POST" -> """{"ok":true,"state":null}"""
            path == "/api/wallet" && method == "GET" -> MOCK_WALLET
            path == "/api/wallet" && method == "POST" -> """{"ok":true,"state":null}"""
            path == "/api/theme" && method == "GET" -> """{"theme":"dark"}"""
            path == "/api/theme" && method == "POST" -> """{"ok":true,"theme":"dark"}"""
            path == "/api/notifications" && method == "GET" -> "[]"
            path.startsWith("/api/notifications") && method == "POST" -> """{"ok":true}"""
            path == "/api/technician/register" && method == "GET" -> MOCK_TECHNICIANS
            path == "/api/sla" && method == "GET" -> MOCK_SLA
            path == "/api/support" && method == "GET" -> "[]"
            path == "/api/support" && method == "POST" -> """{"ok":true}"""
            path.startsWith("/api/deposit") -> """{"ok":true}"""
            path.startsWith("/api/technician") -> """{"ok":true}"""
            else -> """{"ok":true}"""
        }

        return Response.Builder()
            .request(request)
            .protocol(Protocol.HTTP_1_1)
            .code(200)
            .message("OK")
            .body(json.toResponseBody("application/json".toMediaType()))
            .build()
    }

    companion object {
        private val MOCK_TASKS = """
[
  {
    "task_id":"TSK-4001","task_type":"INSTALL","state":"OFFERED","priority":"NORMAL",
    "created_by":"SYSTEM","created_at":"2026-03-06T08:00:00Z",
    "offer_expires_at":"2026-03-07T20:00:00Z",
    "delegation_state":"UNASSIGNED","owner_entity":"CSP-MH-1001",
    "connection_id":"CONN-78432","customer_area":"Andheri West, Mumbai",
    "event_log":[{"timestamp":"2026-03-06T08:00:00Z","event_type":"OFFERED","actor":"SYSTEM","actor_type":"SYSTEM","detail":"New install offer generated."}]
  },
  {
    "task_id":"TSK-4002","task_type":"RESTORE","state":"ALERTED","priority":"HIGH",
    "created_by":"SYSTEM","created_at":"2026-03-06T06:30:00Z",
    "sla_deadline_at":"2026-03-07T18:30:00Z",
    "delegation_state":"UNASSIGNED","owner_entity":"CSP-MH-1001",
    "connection_id":"CONN-65210","customer_area":"Bandra East, Mumbai",
    "event_log":[{"timestamp":"2026-03-06T06:30:00Z","event_type":"ALERTED","actor":"SYSTEM","actor_type":"SYSTEM","detail":"Restore alert triggered. Customer offline."}]
  },
  {
    "task_id":"TSK-4003","task_type":"INSTALL","state":"SCHEDULED","priority":"NORMAL",
    "created_by":"SYSTEM","created_at":"2026-03-05T10:00:00Z",
    "sla_deadline_at":"2026-03-08T10:00:00Z",
    "delegation_state":"ASSIGNED","assigned_to":"Self (CSP-MH-1001)","owner_entity":"CSP-MH-1001",
    "connection_id":"CONN-90112","customer_area":"Powai, Mumbai",
    "event_log":[
      {"timestamp":"2026-03-05T10:00:00Z","event_type":"OFFERED","actor":"SYSTEM","actor_type":"SYSTEM","detail":"New install offer."},
      {"timestamp":"2026-03-05T10:05:00Z","event_type":"CLAIMED","actor":"CSP-MH-1001","actor_type":"CSP","detail":"CSP claimed this task."},
      {"timestamp":"2026-03-05T10:10:00Z","event_type":"SCHEDULED","actor":"CSP-MH-1001","actor_type":"CSP","detail":"Scheduled for Today."}
    ]
  },
  {
    "task_id":"TSK-4004","task_type":"NETBOX","state":"PICKUP_REQUIRED","priority":"NORMAL",
    "created_by":"SYSTEM","created_at":"2026-03-04T14:00:00Z",
    "pickup_due_at":"2026-03-09T14:00:00Z",
    "delegation_state":"UNASSIGNED","owner_entity":"CSP-MH-1001",
    "netbox_id":"NB-2234","customer_area":"Juhu, Mumbai",
    "event_log":[{"timestamp":"2026-03-04T14:00:00Z","event_type":"PICKUP_REQUIRED","actor":"SYSTEM","actor_type":"SYSTEM","detail":"NetBox recovery required."}]
  },
  {
    "task_id":"TSK-4005","task_type":"INSTALL","state":"INSTALLED","priority":"NORMAL",
    "created_by":"SYSTEM","created_at":"2026-03-03T09:00:00Z",
    "delegation_state":"DONE","owner_entity":"CSP-MH-1001",
    "queue_escalation_flag":"VERIFICATION_PENDING",
    "connection_id":"CONN-44123","customer_area":"Malad West, Mumbai",
    "event_log":[
      {"timestamp":"2026-03-03T09:00:00Z","event_type":"OFFERED","actor":"SYSTEM","actor_type":"SYSTEM","detail":"New install offer."},
      {"timestamp":"2026-03-03T12:00:00Z","event_type":"INSTALLED","actor":"TECH-001","actor_type":"TECHNICIAN","detail":"Hardware installation completed."}
    ]
  }
]
""".trimIndent()

        private val MOCK_ASSURANCE = """
{
  "active_base":42,"cycle_earned":12600,"next_settlement_amount":4200,
  "next_settlement_date":"2026-03-15","sla_standing":"Compliant",
  "exposure_state":"ELIGIBLE","exposure_reason":"ALL_METRICS_NORMAL",
  "exposure_since":"2026-01-01","active_restores":2,"unresolved_count":0,
  "capability_reset_active":false,
  "active_base_events":[
    {"connection_id":"CONN-78432","change":1,"reason":"New install verified","date":"2026-03-06"},
    {"connection_id":"CONN-44123","change":1,"reason":"Install verified","date":"2026-03-05"},
    {"connection_id":"CONN-11002","change":-1,"reason":"Churn - customer cancelled","date":"2026-03-04"}
  ],
  "earnings_events":[
    {"label":"Install CONN-78432","amount":300,"date":"2026-03-06"},
    {"label":"Settlement cycle 14","amount":4200,"date":"2026-03-01"}
  ]
}
""".trimIndent()

        private val MOCK_WALLET = """
{
  "balance":8400,"pending_settlement":4200,"frozen":false,
  "transactions":[
    {"id":"TXN-001","date":"2026-03-06","type":"SETTLEMENT","amount":4200,"description":"Cycle 14 settlement","status":"COMPLETED"},
    {"id":"TXN-002","date":"2026-03-05","type":"BONUS","amount":500,"description":"Performance bonus","status":"COMPLETED"},
    {"id":"TXN-003","date":"2026-03-03","type":"WITHDRAWAL","amount":-2000,"description":"Bank withdrawal","status":"COMPLETED"},
    {"id":"TXN-004","date":"2026-03-01","type":"SETTLEMENT","amount":4200,"description":"Cycle 13 settlement","status":"COMPLETED"}
  ]
}
""".trimIndent()

        private val MOCK_TECHNICIANS = """
[
  {"id":"TECH-001","name":"Ajay Patil","band":"A","available":true,"csp_id":"CSP-MH-1001","phone":"+91 98765 43210","join_date":"2025-06-15","completed_count":47},
  {"id":"TECH-002","name":"Suresh Kamble","band":"B","available":true,"csp_id":"CSP-MH-1001","phone":"+91 98765 43211","join_date":"2025-08-01","completed_count":31},
  {"id":"TECH-003","name":"Ramesh Jadhav","band":"B","available":false,"csp_id":"CSP-MH-1001","phone":"+91 98765 43212","join_date":"2025-09-10","completed_count":22},
  {"id":"TECH-004","name":"Vikram Shinde","band":"C","available":true,"csp_id":"CSP-MH-1001","phone":"+91 98765 43213","join_date":"2025-11-20","completed_count":8}
]
""".trimIndent()

        private val MOCK_SLA = """
{
  "standing":"COMPLIANT",
  "restore_sla_met":95.2,
  "install_sla_met":98.0,
  "current_cycle_start":"2026-03-01",
  "current_cycle_end":"2026-03-15",
  "total_tasks_this_cycle":12,
  "sla_breaches_this_cycle":1,
  "history":[
    {"cycle":"Cycle 14","standing":"COMPLIANT","restore_met":95.2,"install_met":98.0},
    {"cycle":"Cycle 13","standing":"COMPLIANT","restore_met":92.0,"install_met":96.5},
    {"cycle":"Cycle 12","standing":"AT_RISK","restore_met":85.0,"install_met":90.0}
  ]
}
""".trimIndent()
    }
}
