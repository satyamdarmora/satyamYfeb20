# Wiom CSP App — Complete Handover Document
**Branch:** `csp-app-v1-2026-03-02`
**Date:** 2026-03-02
**Backend:** `satyam.wiom.in` (NestJS + Prisma + MySQL on AWS EC2)

---

## 1. Architecture Overview

### Android App (Kotlin + Jetpack Compose)
- **Location:** `android/` directory
- **Build:** `./gradlew assembleProductionDebug` (production flavor points to `satyam.wiom.in`)
- **DI:** Hilt
- **Networking:** Retrofit + OkHttp
- **Auth Storage:** Jetpack DataStore (`UserPreferences`)
- **Navigation:** Single-Activity, Compose NavGraph gated by 3 DataStore flags:
  1. `isLoggedIn` → LoginScreen vs rest
  2. `isProfileComplete` → OnboardingScreen vs rest
  3. `isPartnerActive` → PendingScreen vs HomeScreen

### Admin Portal (Next.js 15)
- **Location:** `src/app/admin/`
- **URL:** `http://satyam.wiom.in/csp/admin`
- **State:** React hooks + polling (15s interval)
- **Styling:** Inline CSS with CSS variables

### Backend (NestJS + Prisma)
- **Location on server:** `/home/ubuntu/wiom-backend/`
- **Service:** `sudo systemctl restart wiom-backend`
- **DB:** MySQL on AWS RDS (`wiom_dev`)
- **Port:** 4000 (proxied via nginx at `/v1/`)

---

## 2. Complete User Flow — Step-by-Step Checklist

### PHASE 1: Login (OTP)
- [ ] App opens → LoginScreen shown
- [ ] User enters 10-digit mobile number
- [ ] "Send OTP" calls `POST /api/auth/send-otp` → QA backend (`services.qa.i2e1.in`)
- [ ] OTP received, user enters 4-digit OTP
- [ ] "Verify" calls `GET /api/auth/verify-otp?mobile=...&otp=...`
- [ ] On success: JWT token stored in DataStore, `isLoggedIn = true`
- [ ] NavGraph transitions to: check `isProfileComplete`

**Edge cases:**
- [ ] Invalid phone number (less than 10 digits) → validation error
- [ ] Wrong OTP → error message, user can retry
- [ ] OTP expired → user must request new OTP
- [ ] Network failure during OTP send → error toast
- [ ] Network failure during OTP verify → error toast
- [ ] Token already exists (re-login) → should overwrite old token
- [ ] Backend returns non-200 → proper error message shown

### PHASE 2: Onboarding (Registration Form)
- [ ] If `isProfileComplete = false` → OnboardingScreen shown
- [ ] Multi-step form collects:
  - Business Name, Entity Type
  - State, City, Area, Pincode
  - GPS Location (latitude, longitude, address via device GPS)
  - PAN Number, Aadhaar Number
  - Bank Account Name, Account Number, IFSC, Bank Name
- [ ] "Submit" calls `POST /v1/partner/register` with Bearer token
- [ ] On success: `isProfileComplete = true` in DataStore
- [ ] NavGraph transitions to PendingScreen

**Edge cases:**
- [ ] All fields required → validation before submit
- [ ] GPS location required → user must tap "Get Current Location" before submit
- [ ] Location permission denied → shows message to enable in Settings
- [ ] GPS timeout or unavailable → user cannot proceed without location
- [ ] Address auto-filled from reverse geocoding but editable
- [ ] PAN format validation (ABCDE1234F)
- [ ] Aadhaar format validation (12 digits)
- [ ] IFSC format validation (e.g., SBIN0001234)
- [ ] Duplicate registration (same mobile) → backend returns error
- [ ] Session expired (401) → should redirect to login
- [ ] Network error during submit → error toast, form data preserved
- [ ] User kills app mid-submission → form state not persisted (user must re-enter)
- [ ] Backend 500 → "Something went wrong" message

### PHASE 3: Registration Fee Payment (₹2,000)
- [ ] PendingScreen shows → fetches `GET /v1/partner/status` (polls every 5s)
- [ ] Status = `PENDING` + `feePaid = false` → PaymentScreen shown
- [ ] Shows registration fee amount: ₹2,000
- [ ] "Pay Now" button calls `POST /v1/payment/initiate` with `registrationId`
- [ ] Backend creates PaymentTransaction (paymentType = `REGISTRATION_FEE`)
- [ ] Backend returns `paymentLink` from Juspay
- [ ] App opens Chrome Custom Tab with payment link
- [ ] App polls `GET /v1/payment/status/:transactionId` every 5s (max 60 attempts = 5 min)
- [ ] On payment success → `feePaid = true` in DB → status transitions to `PENDING`
- [ ] Screen updates to show "Under Review" state

**Edge cases:**
- [ ] Payment link already exists (user re-opens app) → reuse existing link, resume polling
- [ ] User closes Chrome tab without paying → polling continues, shows "Verifying" state
- [ ] Payment times out (5 min) → shows "Payment verification timed out" message with retry
- [ ] User pays but polling hasn't caught it yet → next status poll will detect `feePaid = true`
- [ ] Juspay returns failure → `FAILED` status, user can retry
- [ ] Double payment attempt → backend returns existing pending transaction
- [ ] Network loss during payment → Chrome tab may still complete; polling catches it on reconnect
- [ ] App killed during payment → on reopen, `fetchStatus` picks up existing paymentInfo and resumes polling
- [ ] Chrome Custom Tab not available → fallback to regular browser intent

### PHASE 4: Admin Review
- [ ] Admin opens `http://satyam.wiom.in/csp/admin` → sees registration in list
- [ ] Registration shows status badge (PENDING with green "fee paid" indicator)
- [ ] Admin can view all submitted details (business info, bank details, GPS location with Google Maps link, documents)
- [ ] Admin has 3 actions:
  - **Approve** → status = `APPROVED`
  - **Reject** (with reason) → status = `REJECTED`
  - **Request Info** (with message + requested doc types) → status = `INFO_REQUIRED`

**Edge cases:**
- [ ] Admin approves without reviewing → allowed (trust admin judgment)
- [ ] Admin rejects → app shows rejection reason + refund status
- [ ] Admin requests info → app shows info-required form (see Phase 4a)
- [ ] Multiple admins reviewing same registration → last action wins (no locking)
- [ ] Admin portal polling (15s) → new registrations appear automatically
- [ ] Admin portal browser notifications → fires when new partner response arrives
- [ ] Dynamic page title shows count: `(2) Wiom Operations Portal`
- [ ] Sound notification plays on new response

### PHASE 4a: Info Required (Back-and-forth)
- [ ] App shows INFO_REQUIRED state with admin's message and requested documents
- [ ] CSP can type a text response and/or upload documents
- [ ] Document types: PAN Card, Aadhaar Card, Address Proof, Bank Statement, Business License, Cancelled Cheque, Other
- [ ] "Submit" calls `POST /v1/partner/respond` with multipart form data
- [ ] Admin portal shows the response with documents in info exchange timeline
- [ ] Admin can request more info (multiple rounds) or approve/reject
- [ ] Each exchange is logged as an `InfoExchange` record with sender (ADMIN/PARTNER)

**Edge cases:**
- [ ] Empty response (no text, no files) → validation error
- [ ] Large file upload (>10MB) → check backend limits
- [ ] Unsupported file type → backend should validate mime types
- [ ] Multiple documents in single response → all attached correctly
- [ ] Admin sends info request while CSP is typing → CSP sees updated request on next poll
- [ ] Document download from admin portal → verify files are accessible

### PHASE 5: Training
- [ ] After admin approves → status = `APPROVED` (or `TRAINING`)
- [ ] App shows "Training" state with progress info
- [ ] Admin marks training complete → partner status changes to `ACTIVE`
- [ ] Admin can also mark training failed → `TRAINING_FAILED`

**Edge cases:**
- [ ] Training marked complete but partner doesn't see update → 5s polling should catch it
- [ ] Training failed → app shows failure message with support contact info
- [ ] Admin changes mind after marking complete → no undo in current system (manual DB fix needed)

### PHASE 6: Security Deposit Payment (₹20,000)
- [ ] After training complete → partnerStatus = `ACTIVE`, `securityDepositPaid = false`
- [ ] App shows SecurityDepositScreen with ₹20,000 amount
- [ ] **CRITICAL:** Payment state is RESET when transitioning from reg fee to security deposit
  - Previous registration fee `SUCCESS` state must NOT leak into this screen
  - PendingViewModel.fetchStatus() handles this reset (lines 111-122)
- [ ] "Pay ₹20,000" button calls `POST /v1/payment/security-deposit/initiate`
- [ ] Backend creates PaymentTransaction (paymentType = `SECURITY_DEPOSIT`)
- [ ] Chrome Custom Tab opens with Juspay link
- [ ] Polling via `GET /v1/payment/security-deposit/status/:transactionId`
- [ ] On success → `securityDepositPaid = true` in DB

**Edge cases:**
- [ ] Payment state leaking from registration fee → reset logic in fetchStatus() must work
- [ ] `isSecurityDeposit` flag tracks which payment is active
- [ ] Existing pending security deposit transaction → reuse link (same as reg fee)
- [ ] Backend response format: single wrap only (ResponseInterceptor handles it)
  - **BUG HISTORY:** Controller was double-wrapping → `data.data.paymentLink` was null → fixed
- [ ] All registration fee edge cases apply here too (timeout, retry, network loss, etc.)
- [ ] Security deposit already paid (DB flag true) → should skip this screen entirely
- [ ] Admin portal shows deposit status (PAID/PENDING) in BatchSizeConfig panel

### PHASE 7: "You're All Set" Screen
- [ ] After security deposit paid → partnerStatus = `ACTIVE`, `securityDepositPaid = true`
- [ ] App shows "You're All Set!" screen (NOT auto-redirect)
  - **BUG HISTORY:** Previously auto-called `setPartnerActive(true)` in background polling,
    which triggered NavGraph switch while Chrome tab was in foreground → app crash
- [ ] Two buttons:
  - **"Continue to Dashboard"** → calls `goToDashboard()` → sets `isPartnerActive = true` in DataStore
  - **"Logout"** → clears auth, returns to LoginScreen
- [ ] Polling is stopped at this point (no more status checks needed)

**Edge cases:**
- [ ] User stays on this screen indefinitely → no issue, polling stopped
- [ ] User kills app on this screen → on reopen, PendingScreen loads, fetches status, shows same screen
- [ ] User chooses "Continue to Dashboard" → NavGraph switches to HomeScreen
- [ ] User chooses "Logout" → DataStore cleared, back to LoginScreen
- [ ] App is in background when deposit is confirmed → no crash (no auto-navigation)

### PHASE 8: Dashboard (HomeScreen)
- [ ] After `isPartnerActive = true` → HomeScreen shown
- [ ] Shows CSP dashboard with task feed, stats, etc.
- [ ] Logout available via menu drawer

**Edge cases:**
- [ ] User logs out → all DataStore flags cleared → back to LoginScreen
- [ ] User logs in again with same number → `isProfileComplete = true` (registration exists), `isPartnerActive = true` (partner is ACTIVE) → goes directly to HomeScreen
- [ ] User logs in with new number → fresh flow from Phase 2

### PHASE 9: Admin — NetBox Release
- [ ] Admin portal: after security deposit confirmed, BatchSizeConfig shows "PAID" badge
- [ ] "Release NetBoxes" button becomes enabled (was disabled while deposit pending)
- [ ] Admin sets batch size (default 5) and releases
- [ ] Calls `POST /v1/admin/registrations/:id/batch-size`
- [ ] App picks up `deviceBatchSize` in next status poll

**Edge cases:**
- [ ] Release before deposit paid → button disabled, shows "Awaiting security deposit"
- [ ] Batch size = 0 → should be validated (minimum 1)
- [ ] Admin changes batch size after release → allowed, updates DB

---

## 3. Backend Endpoints Reference

| Method | Endpoint | Purpose | PaymentType |
|--------|----------|---------|-------------|
| POST | `/v1/partner/register` | Submit registration form | — |
| GET | `/v1/partner/status` | Get current status + payment info | — |
| POST | `/v1/partner/respond` | Submit info response (multipart) | — |
| POST | `/v1/payment/initiate` | Start registration fee payment | `REGISTRATION_FEE` |
| GET | `/v1/payment/status/:txnId` | Check reg fee payment status | `REGISTRATION_FEE` |
| POST | `/v1/payment/security-deposit/initiate` | Start security deposit payment | `SECURITY_DEPOSIT` |
| GET | `/v1/payment/security-deposit/status/:txnId` | Check deposit status | `SECURITY_DEPOSIT` |
| GET | `/v1/admin/registrations` | List all registrations (admin) | — |
| POST | `/v1/admin/registrations/:id/approve` | Approve registration | — |
| POST | `/v1/admin/registrations/:id/reject` | Reject registration | — |
| POST | `/v1/admin/registrations/:id/info-request` | Request more info | — |
| POST | `/v1/admin/registrations/:id/complete-training` | Mark training complete | — |
| POST | `/v1/admin/registrations/:id/batch-size` | Set device batch size | — |

---

## 4. Database Schema (Key Tables)

### `partner_registrations`
- `id`, `registrationId` (UUID), `mobile`, `businessName`, `entityType`
- `state`, `city`, `area`, `pincode`, `panNumber`, `aadhaarNumber`
- `bankAccountName`, `bankAccountNumber`, `bankIfsc`, `bankName`
- `latitude` (Float, nullable), `longitude` (Float, nullable), `address` (String, nullable)
- `status` (PENDING | INFO_REQUIRED | APPROVED | REJECTED)
- `feePaid` (Boolean), `feeRefunded` (Boolean)
- `securityDepositPaid` (Boolean) — **added in this build**
- `deviceBatchSize` (Int, default 5) — **added in this build**

### `payment_transactions`
- `id`, `registrationId` (FK), `mobile`, `amount`
- `transactionId` (from Juspay), `orderId`, `paymentLink`
- `status` (INITIATED | PENDING | SUCCESS | FAILED)
- `paymentMode` (ONLINE)
- `paymentType` (REGISTRATION_FEE | SECURITY_DEPOSIT) — **added in this build**

### `partners`
- Created when registration is approved
- `status` (TRAINING | ACTIVE | INACTIVE | SUSPENDED | TRAINING_FAILED)
- Linked to `partner_registrations` via `registrationId`

### `info_exchanges`
- `id`, `registrationId` (FK), `sender` (ADMIN | PARTNER), `message`
- `requestedDocs` (JSON array), `createdAt`

### `info_documents`
- `id`, `infoExchangeId` (FK), `documentType`, `originalName`, `storedName`, `mimeType`, `sizeBytes`

---

## 5. Key Files Map

### Android App
| File | Purpose |
|------|---------|
| `android/app/build.gradle.kts` | Product flavors (dev/production), dependencies |
| `.../ui/login/LoginScreen.kt` | OTP login UI |
| `.../ui/onboarding/OnboardingScreen.kt` | Registration form |
| `.../ui/onboarding/OnboardingViewModel.kt` | Form submission logic |
| `.../ui/pending/PendingScreen.kt` | All pending states (payment, review, training, deposit, active) |
| `.../ui/pending/PendingViewModel.kt` | Payment initiation, polling, state machine |
| `.../ui/home/HomeScreen.kt` | Dashboard after activation |
| `.../ui/navigation/NavGraph.kt` | Navigation routing (3-flag gate) |
| `.../data/remote/BackendApiService.kt` | All Retrofit API definitions |
| `.../data/remote/dto/StatusDtos.kt` | Status response data classes |
| `.../data/preferences/UserPreferences.kt` | DataStore for auth flags |

### Admin Portal
| File | Purpose |
|------|---------|
| `src/app/admin/_components/AdminDashboard.tsx` | Main admin layout + dynamic title |
| `src/app/admin/_components/PartnerRegistrations.tsx` | Registration list + detail + actions |
| `src/app/admin/_components/useAdminActions.ts` | Data fetching, notifications, state |
| `src/app/admin/_components/AdminTypes.ts` | TypeScript interfaces |

### Backend (on server)
| File | Purpose |
|------|---------|
| `src/partners/partners.controller.ts` | Partner registration endpoints |
| `src/partners/partners.service.ts` | Registration + status logic |
| `src/payment/payment.controller.ts` | Payment endpoints (reg fee + security deposit) |
| `src/payment/payment.service.ts` | Juspay integration, transaction management |
| `src/admin/admin.controller.ts` | Admin review endpoints |
| `src/admin/admin.service.ts` | Approve/reject/info-request/training/batch-size |
| `prisma/schema.prisma` | Database schema |

---

## 6. Known Issues & Production Considerations

### Must Fix Before Production
1. **Sandbox mode:** Backend uses sandbox payment (fake Juspay links). Production needs real Juspay API credentials.
2. **OTP backend:** Currently uses QA backend (`services.qa.i2e1.in`). Production needs production OTP service.
3. **HTTPS:** Backend is HTTP only. Production must be HTTPS.
4. **Auth:** JWT token has no expiry handling in app. Add token refresh or re-login flow.
5. **File storage:** Uploaded documents stored locally on server. Production needs S3/cloud storage.
6. **Error messages:** Some raw error messages exposed to user. Sanitize for production.
7. **Rate limiting:** No rate limiting on OTP send or payment initiate endpoints.

### Should Fix
8. **Offline handling:** App has no offline mode. Shows raw errors on network failure.
9. **Form persistence:** Onboarding form data lost if app is killed mid-entry.
10. **Payment retry:** After timeout, user must manually retry. Could auto-retry.
11. **Admin auth:** Admin portal has no authentication. Anyone with the URL can access it.
12. **Concurrent admin actions:** No optimistic locking. Two admins can act on same registration.
13. **Batch size validation:** No minimum/maximum validation on batch size input.

### Nice to Have
14. **Push notifications:** Replace polling with FCM for real-time updates.
15. **Payment receipt:** Show transaction details after successful payment.
16. **Document preview:** Allow viewing uploaded documents in-app.
17. **Biometric auth:** Fingerprint/face unlock for returning users.
18. **Analytics:** Track funnel drop-off at each onboarding step.

---

## 7. How to Test End-to-End

### Quick Start (No Build Required)
- **APK Download:** https://satyam.wiom.in/wiom-csp.apk (install on any Android phone, enable "Install from unknown sources")
- **Admin Portal:** https://satyam.wiom.in/csp/admin
- **Test phone number:** `9711870456` (only this number works — it's registered on the QA auth server)
- Other numbers will get HTTP 500 from the QA auth server (`services.qa.i2e1.in`) — this is a QA server bug, not our code

### Prerequisites (for building from source)
- Android phone connected via USB (or use emulator)
- Backend running at `satyam.wiom.in`
- Admin portal at `https://satyam.wiom.in/csp/admin`

### Clean Test Data
```bash
ssh -i ~/.ssh/satyam-hosting.pem ubuntu@18.61.63.78
mysql -h satyam-hosting.cre2y0mswdtc.ap-south-2.rds.amazonaws.com -u admin -p'v8d1PQEQ3qGE3YQ' wiom_dev

SET FOREIGN_KEY_CHECKS=0;
DELETE FROM info_documents WHERE infoExchangeId IN (SELECT id FROM info_exchanges WHERE registrationId IN (SELECT id FROM partner_registrations WHERE mobile='PHONE_NUMBER'));
DELETE FROM info_exchanges WHERE registrationId IN (SELECT id FROM partner_registrations WHERE mobile='PHONE_NUMBER');
DELETE FROM payment_transactions WHERE registrationId IN (SELECT id FROM partner_registrations WHERE mobile='PHONE_NUMBER');
-- Delete partner-related tables (tasks, assurance, wallet) if partner exists
DELETE FROM partners WHERE registrationId IN (SELECT id FROM partner_registrations WHERE mobile='PHONE_NUMBER');
DELETE FROM partner_registrations WHERE mobile='PHONE_NUMBER';
SET FOREIGN_KEY_CHECKS=1;
```

### Build & Install APK
```bash
cd android/
./gradlew assembleProductionDebug
adb install -r app/build/outputs/apk/production/debug/app-production-debug.apk
```

### Test Sequence
1. Open app → Login with `9711870456` → Get OTP → Verify
2. Fill registration form (tap "Get Current Location" for GPS) → Submit → See payment screen
3. Pay ₹2,000 (sandbox: click "Pay" on sandbox payment page) → See "Under Review"
4. Open admin portal → Find registration → Approve → Complete Training
5. App auto-updates to SecurityDepositScreen → Pay ₹20,000
6. After payment → See "You're All Set!" screen
7. Tap "Continue to Dashboard" → HomeScreen loads
8. Logout → Login again with same number → Should go directly to HomeScreen (no onboarding)

---

## 8. Sandbox Payment Flow
The backend is in sandbox mode. When payment is initiated:
1. A fake transaction ID is generated (`sandbox_...` or `sandbox_sd_...`)
2. A payment link is generated pointing to `/v1/payment/sandbox/pay/:id`
3. Opening this link in browser shows a simple "Pay" button
4. Clicking it marks the transaction as SUCCESS in DB
5. App polling detects the success and updates UI

No real money is involved. Production will use actual Juspay API.

---

## 9. Admin Portal Verification Checklist
- [ ] Registration appears with all details (business info, GPS location with Google Maps link, bank details)
- [ ] Approve / Reject / Request Info buttons work (Approve & Info disabled until fee is paid)
- [ ] "Request Info" → CSP app shows the request → CSP responds with text + documents → Admin sees response
- [ ] Browser notification + sound alert when CSP responds (grant notification permission when prompted)
- [ ] Page title shows unread count: `(2) Wiom Operations Portal`
- [ ] After "Complete Training" → security deposit status shows PAID/PENDING in BatchSizeConfig
- [ ] "Release NetBoxes" button enabled only after deposit is paid
- [ ] Batch size can be changed and reflects in the app on next poll

---

## 10. Audit Trail
Two separate `paymentType` values in `payment_transactions` table:
- `REGISTRATION_FEE` — ₹2,000 registration fee
- `SECURITY_DEPOSIT` — ₹20,000 security deposit

This separation enables:
- Independent payment tracking and reconciliation
- Separate refund workflows (registration fee refundable on rejection)
- Financial reporting by payment type
- Audit compliance with clear payment categorization
