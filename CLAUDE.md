# CSP Web App (Wiom Partner Portal)

## Quick Facts
- Next.js 15 App Router, TypeScript, inline styles (CSS variables), port 3456
- `npm run dev` to start. No tests, no linter config.
- Two platforms: Web (this codebase) + Android native (`android/` directory, Kotlin/Compose)
- Design reference: 333-page design PDF (user shares relevant section per module)

## Architecture
5 routes + API proxy:
- `/login` — OTP login (QA backend: services.qa.i2e1.in)
- `/onboarding` — Partner registration + payment + status tracking
- `/` — CSP Dashboard (task feed, assurance, wallet, team, support, netbox, policies, profile)
- `/admin` — Operations portal (registration review, task creation, event simulation)
- `/technician` — Technician task view
- `/logout` — Clears auth, redirects to login

## Auth Flow
1. OTP sent via proxy `POST /api/auth/send-otp` → QA backend
2. Verified via proxy `GET /api/auth/verify-otp` → QA backend returns jwt_token
3. Token stored in `localStorage` as `wiom_token`
4. `AuthGuard` component checks `wiom_profile_complete` flag for protected routes
5. Backend calls use Bearer token in Authorization header
6. Token decoded server-side to extract mobile number (username field)

## Data Layer
- `src/lib/data/` — In-memory seed data store (tasks, technicians, assurance, wallet, support, notifications)
- `src/lib/types.ts` — All TypeScript interfaces (Task, AssuranceState, Technician, WalletState, etc.)
- `src/app/api/` — 14 Next.js API routes that read/write the in-memory store
- Backend proxy: `src/app/api/backend/[...path]/route.ts` → NestJS at localhost:4000
- Auth proxies: `src/app/api/auth/send-otp/` and `verify-otp/` → services.qa.i2e1.in

## Key Patterns
- Styling: inline `React.CSSProperties` using CSS variables from `globals.css`
- State: React hooks (useState, useCallback). No external state library.
- Polling: `setInterval` in `useEffect` for real-time updates
- Task queue: 7-bucket priority algorithm
- Modules: `_components/` subdirectory per route for page-specific components
- i18n: English + Hindi via `useI18n()` context

## Module Map
| Module | Status | Key Files | Context |
|--------|--------|-----------|---------|
| Auth | Done | `login/`, `logout/`, `lib/auth.ts`, `AuthGuard.tsx` | `memory/module-auth.md` |
| Onboarding | Done | `onboarding/_components/` | `memory/module-onboarding.md` |
| Admin | Done | `admin/_components/` | `memory/module-admin.md` |
| Home Dashboard | Planned | `page.tsx`, components/ | `memory/module-home.md` |
| Wallet | Planned | `WalletHub.tsx` | `memory/module-wallet.md` |
| Team | Planned | `TeamHub.tsx` | `memory/module-team.md` |
| Support | Planned | `SupportHub.tsx` | `memory/module-support.md` |
| NetBox | Planned | `NetBoxHub.tsx` | `memory/module-netbox.md` |
| Policies | Planned | `PoliciesPage.tsx` | `memory/module-policies.md` |
| Profile | Planned | `ProfilePage.tsx` | `memory/module-profile.md` |
| Technician | Partial | `technician/`, `TechDashboard.tsx` | `memory/module-technician.md` |

## NestJS Backend Integration
- Backend repo: `/Users/satya/wiom-backend` (port 4000)
- All calls proxied through `/api/backend/[...path]`
- Endpoints: partner/register, partner/status, partner/respond, partner/registrations, payment/initiate, payment/status, dashboard/stats
- Response format: `{ status: 0, msg: "...", data: {...} }` (0 = success)

## Current Status
Last worked on: 2026-02-22 — Modularization plan approved, creating context files
Next up: Split onboarding/page.tsx, admin/page.tsx, lib/data.ts into focused modules
