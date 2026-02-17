# ABM — Unified Lead / Mission Flow (Sprint Spec)
**Product:** Space ABM (internal)  
**Backend:** space-api (Node/Express/MySQL/Sequelize)  
**Frontend:** space-abm (dashboard UI)  
**Goal:** Simplify lead request status to three states and make Mission the single place for deal progression. Record of implementation sprint.

---

## 0) Summary

- **Lead Request:** One status — `new` | `promoted` | `closed` (no routed/contacted/closed_won/closed_lost).
- **Mission:** Single deal pipeline; stages unchanged (new → qualified → solutioning → proposal → negotiation → won/lost/on_hold).
- **Flow:** New lead → Promote to Mission → lead status becomes `promoted`; all deal progression lives on the Mission. Or close without promoting → `closed`.
- **UI/Data:** Lead Requests list/detail show status and Mission link when promoted; Mission detail shows Source: Lead Request from [org], [date] with link to the lead.

---

## 1) Backend (space-api)

### 1.1 Migration
- **File:** `migrations/20260213000000-lead-request-routing-status-unified.js`
- **Behavior:**
  - Map existing data: `routed` / `contacted` → `new`; `closed_won` / `closed_lost` → `closed`.
  - Change `routing_status` ENUM to `('new', 'promoted', 'closed')`.

**Note:** Run migration (e.g. `npx sequelize-cli db:migrate`) before relying on the new ENUM.

### 1.2 Model
- **File:** `models/lead_request.js`
- **Change:** `routing_status` ENUM set to `('new', 'promoted', 'closed')`.

### 1.3 API — Lead Requests (abmRoutes)
- **PATCH lead-requests:** `allowedStatuses = ['new', 'promoted', 'closed']`.
- **POST lead-requests/:id/promote:** On success, `LeadRequest.update({ mission_id: mission.id, routing_status: 'promoted' })`.
- **POST lead-requests/:id/convert:** Sets `leadRequest.routing_status = 'closed'` (no routed/closed_won branching).

### 1.4 API — Missions (missionsRoutes)
- **Create mission with `lead_request_id`:** After creating the mission, `LeadRequest.update({ mission_id: mission.id, routing_status: 'promoted' }, { where: { id: lead_request_id } })`.

---

## 2) Frontend (space-abm)

### 2.1 Lead Requests page  
**File:** `src/app/dashboard/(dashboard)/lead-requests/page.tsx`

- **List:**
  - **Status column:** Show `routing_status` (new / promoted / closed) as a chip.
  - **Mission column:** When `lr.mission_id` is set, show “Mission →” link to `paths.abm.missions?id={mission_id}`; otherwise “—”.
- **Detail panel:**
  - Keep status chip (`routing_status`).
  - When `detail.mission_id` is set: show “Mission: Open Mission →” linking to the mission; do not show (or disable) “Promote to Mission”.
  - When no `mission_id`, show “Promote to Mission” as before.

### 2.2 Account detail — Lead Requests tab  
**File:** `src/app/dashboard/(dashboard)/accounts/[id]/page.tsx`

- **Lead Requests tab (tab === 3):**
  - Add **Mission** column.
  - For each row with `lr.mission_id`, show “Mission →” link to `paths.abm.missions?id={lr.mission_id}`; otherwise “—”.
  - Status column continues to show `routing_status` (new / promoted / closed).

### 2.3 Mission detail  
**File:** `src/app/dashboard/(dashboard)/missions/page.tsx`

- When mission has an associated lead request (`lead_request_id` or `detail.mission.leadRequest`):
  - Add **Source** section above “Procurement Brief”:
    - **Label:** “Source”
    - **Content:** “Lead Request from [organization_name or organization_domain], [date]” with “Lead Request” linking to the lead request detail (`paths.abm.leadRequests?id={lead_request_id}`).
  - Keep existing “Procurement Brief” / “Open Lead Request” block below.
- Data: Mission GET already includes `leadRequest`; use `detail.mission.leadRequest` for organization name and `created_at`.

---

## 3) Data / API contracts

- **Lead request list/detail and account detail** already return full lead request objects (including `mission_id`); no backend response changes required for the new UI.
- **Mission GET** already includes `leadRequest`; frontend uses it for the “Source: Lead Request from …” line.

---

## 4) Additional

- **item 5:** How-it-works doc update (content/how-it-works.md) to describe the new flow and remove references to routed/contacted/closed_won/closed_lost — not implemented in this sprint.
- **Status filter** on Lead Requests list (e.g. filter by new/promoted/closed) — not implemented; only Status and Mission columns were added.
