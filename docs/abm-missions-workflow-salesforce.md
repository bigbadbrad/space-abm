# ABM Rev 3 — Missions “Capture” Upgrade (Work Queue + Tasks + Timeline + Briefs + Salesforce Push)

**Product:** SpaceABM (internal)  
**Backend:** space-api (Node/Express/MySQL/Sequelize)  
**Frontend:** space-abm (React/MUI)

## 0) Context (what’s already implemented)
- Lead Request routing_status is unified to: `new | promoted | closed` and the primary flow is: **new lead → Promote to Mission → lead becomes `promoted`; deal progression lives on the Mission**. :contentReference[oaicite:2]{index=2}
- Promote endpoint exists: `POST /api/abm/lead-requests/:id/promote` sets `mission_id` and `routing_status='promoted'`. :contentReference[oaicite:3]{index=3}
- Missions create flow supports `lead_request_id` and updates the LeadRequest accordingly. :contentReference[oaicite:4]{index=4}
- Frontend already shows LeadRequest status chips and Mission links, and Mission detail shows Source: Lead Request. :contentReference[oaicite:5]{index=5}

## 1) Rev 3 Goal (“daily driver”)
Make Missions the operational center for capture:
- A Mission has **Tasks**, **Timeline**, **Briefs**, and a **Work Queue** view.
- Add a manual **“Push to Salesforce”** action (NO auto-create). One-way sync Mission → Opportunity until later.

### Definition of Done
- Missions list has meaningful operational columns (stage, priority, next task due, SF status)
- Mission detail includes:
  - Tasks panel (create/assign/complete)
  - Timeline/audit trail
  - “Mission Brief” (generated + cached)
  - Salesforce “Create/Sync” button and sync status
- Work Queue page exists and is useful daily (tasks due, missions needing qualification, programs due soon)
- No Salesforce objects are created automatically; only via explicit user action.

---

## 2) Data model changes (space-api)

### 2.1 Mission Tasks (core)
**New table:** `mission_tasks`
- id (UUID, PK)
- mission_id (UUID, FK, indexed)
- title (string)
- task_type (enum)
  - `qualify` | `research_account` | `create_brief` | `outreach` | `proposal` | `compliance` | `follow_up` | `other`
- status (enum): `open` | `done` | `canceled`
- priority (enum): `low` | `med` | `high`
- owner_user_id (UUID, FK -> users.id, nullable, indexed)
- due_at (datetime, nullable, indexed)
- source_type (enum, nullable): `lead_request` | `program_item` | `manual`
- source_id (uuid/string nullable)  // lead_request_id or program_item_id
- created_at, updated_at

**Rules**
- Completing tasks does NOT mutate mission stage automatically (keep stage manual for now).
- Task ordering in UI: overdue first, then due soon, then no due date.

### 2.2 Mission Activity / Timeline (audit trail)
**New table:** `mission_activity`
- id (UUID)
- mission_id (UUID, indexed)
- actor_user_id (UUID nullable)
- event_type (enum):
  - `mission_created`
  - `lead_request_promoted`
  - `program_linked`
  - `account_linked`
  - `contact_linked`
  - `task_created` / `task_completed`
  - `note_added`
  - `brief_generated`
  - `salesforce_push_requested`
  - `salesforce_push_succeeded`
  - `salesforce_push_failed`
  - `stage_changed`
- event_payload_json (json)
- created_at

**Requirement**
- Write at least these activity events:
  - promote lead → mission (`lead_request_promoted`)
  - create/complete task
  - generate brief
  - salesforce push

### 2.3 Mission Brief artifacts (cached outputs)
**New table:** `mission_artifacts`
- id (UUID)
- mission_id (UUID, indexed)
- artifact_type (enum): `mission_brief` | `procurement_brief` | `proposal_outline`
- content_md (longtext)
- input_hash (string) // hash of the inputs used to generate
- generated_by_user_id (uuid nullable)
- model_name (string nullable)
- created_at

**Caching rule**
- If latest `mission_brief` exists with same `input_hash`, return cached.
- Regenerate when:
  - mission stage changes OR
  - linked program items/lead request changes OR
  - > 7 days old

### 2.4 Salesforce fields (future-proof)
Add to `missions` table:
- salesforce_opportunity_id (string nullable, indexed)
- salesforce_account_id (string nullable, indexed)
- salesforce_sync_status (enum nullable): `not_synced` | `queued` | `synced` | `error`
- salesforce_last_synced_at (datetime nullable)
- salesforce_last_error (text nullable)

**Note:** keep this as “integration-ready” even if credentials are not configured.

---

## 3) Backend services & endpoints

### 3.1 Tasks API
Routes under `/api/abm/missions`:

- GET `/api/abm/missions/:id/tasks`
- POST `/api/abm/missions/:id/tasks`
  - body: { title, task_type, priority, owner_user_id?, due_at?, source_type?, source_id? }
  - writes activity: `task_created`
- PATCH `/api/abm/missions/:id/tasks/:taskId`
  - body can update: status, priority, owner_user_id, due_at, title
  - if status becomes done → activity: `task_completed`
- DELETE `/api/abm/missions/:id/tasks/:taskId` (optional; or use status=canceled)

### 3.2 Timeline API
- GET `/api/abm/missions/:id/activity`
  - returns most recent first, paginated

### 3.3 Brief generator API
- POST `/api/abm/missions/:id/generate-brief`
  - returns cached if input_hash matches
  - writes activity: `brief_generated`
- GET `/api/abm/missions/:id/artifacts?type=mission_brief`
  - returns latest cached brief

**Inputs for brief JSON (MVP)**
- mission: { name, stage, service_lane, timeline, budget_band, notes }
- linked lead_request (if any): the procurement brief fields (no attachments content yet)
- linked account (ProspectCompany): name/domain + intent_score + top_lane + surge (if available)
- linked program items (if implemented): title, agency, due, summary
- tasks summary: next 3 due tasks

**Prompt output**
- 1-page “Capture Brief” in markdown with:
  - Objective / What we’re selling
  - Why now (signals + due dates)
  - Fit (lane mapping)
  - Risks / unknowns (missing fields)
  - Next actions (tasks)

### 3.4 Salesforce “Push” (manual, one-way)
**Principle:** Do not auto-create. Sales clicks a button when ready.

- POST `/api/abm/missions/:id/push-to-salesforce`
  - behavior:
    - validate mission has minimum fields (stage >= qualified, account linked, at least one contact OR lead_request exists)
    - set salesforce_sync_status = queued
    - write activity: `salesforce_push_requested`
    - enqueue background job (BullMQ or your existing worker pattern)

**Worker job:** `jobs/pushMissionToSalesforce.js`
- If mission.salesforce_opportunity_id is NULL:
  - create Salesforce Opportunity + optionally Account if you’re allowed (config flag)
- Else:
  - update Opportunity fields from Mission
- One-way mapping Mission → Opportunity fields (no pulling SF updates yet)
- On success:
  - set sync_status=synced, last_synced_at
  - activity: `salesforce_push_succeeded`
- On failure:
  - set sync_status=error, last_error
  - activity: `salesforce_push_failed`

**CRM Adapter layer**
- `services/crmAdapter/index.js`
  - `pushMission(missionPayload) -> { opportunityId, accountId }`
- When SF env vars are not set: noop/stub (no API call; mission still marked synced for demo).
- When set: get token (Client Credentials or Username-Password), then REST create/update Opportunity (and Account if needed).

**Getting credentials when the UI has no “New Connected App” or “External Client App”**

Spring '26 removed the “New Connected App” button and many orgs don’t show “External Client App Manager” in Quick Find. **Creating a Connected App via the Metadata API still works** (the restriction is UI-only; deploy via CLI is documented and in use). If your org has locked down Connected App creation at the API level as well (rare), deploy will fail and you’d need to contact Salesforce Support; you’ll know within one deploy attempt (~5 min).

**One path that works: deploy Connected App with Salesforce CLI**

1. **Install Salesforce CLI**  
   - https://developer.salesforce.com/tools/sfdxcli  
   - Or: `npm install -g @salesforce/cli` (then use `sf` in the steps below).

2. **Log in to your Salesforce org**  
   ```bash
   sf org login web --instance-url https://login.salesforce.com
   ```  
   (Use `https://test.salesforce.com` for sandbox.)  
   Complete the browser login; note the **alias** you give the org (e.g. `myorg`).

3. **Create a minimal project and Connected App metadata**  
   ```bash
   mkdir sf-connected-app && cd sf-connected-app
   mkdir -p force-app/main/default/connectedApps
   ```  
   Create `sfdx-project.json` in the project root:
   ```json
   { "packageDirectories": [{ "path": "force-app", "default": true }], "sourceApiVersion": "59.0" }
   ```  
   Create `force-app/main/default/connectedApps/ABM_Space_API.connectedApp-meta.xml` with:

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <ConnectedApp xmlns="http://soap.sforce.com/2006/04/metadata">
       <label>ABM Space API</label>
       <contactEmail>YOUR_EMAIL@example.com</contactEmail>
       <description>API integration for ABM Mission push to Salesforce</description>
       <oauthConfig>
           <callbackUrl>https://login.salesforce.com/services/oauth2/success</callbackUrl>
           <scopes>Api</scopes>
           <scopes>RefreshToken</scopes>
           <scopes>Full</scopes>
           <enablePasswordToken>true</enablePasswordToken>
       </oauthConfig>
   </ConnectedApp>
   ```  
   Replace `YOUR_EMAIL@example.com` with a real email. Do **not** add `consumerKey` or `consumerSecret`; Salesforce generates them on first deploy. After deploy, read them from Manage Connected Apps.

4. **Deploy to your org**  
   From the project root:
   ```bash
   sf project deploy start --target-org myorg
   ```  
   (Use the alias from step 2 instead of `myorg`.)

5. **Get Consumer Key and Secret in the browser**  
   - In Salesforce, go to **Setup** → Quick Find → **Manage Connected Apps**.  
   - Open the app **ABM Space API**.  
   - Copy **Consumer Key** → `SALESFORCE_CLIENT_ID`.  
   - Click **Manage Consumer Details** and copy **Consumer Secret** → `SALESFORCE_CLIENT_SECRET`.

6. **Set .env**  
   - `SALESFORCE_CLIENT_ID` = Consumer Key  
   - `SALESFORCE_CLIENT_SECRET` = Consumer Secret  
   - `SALESFORCE_LOGIN_URL` = `https://login.salesforce.com` or `https://test.salesforce.com`  
   - `SALESFORCE_USERNAME` = your API user’s login email  
   - `SALESFORCE_PASSWORD` = that user’s password + security token (concatenated, no space)

If “External Client App Manager” appears in your org’s Quick Find, you can create an External Client App there and use only the three vars (Client Credentials flow); the adapter supports both.

---

## 4) Frontend (space-abm) UX changes

### 4.1 Missions list page upgrades
Add columns:
- Stage (chip)
- Priority (chip)
- Next Task Due (date / “Overdue”)
- Open Tasks (#)
- Linked Account
- Source (LeadRequest / Program / Manual)
- Salesforce (status chip: Not synced / Queued / Synced / Error)

Add quick actions per row:
- “Open”
- “Push to Salesforce” (disabled if not eligible; tooltip shows missing requirements)

### 4.2 Mission detail page upgrades (primary work area)
Add sections (top-down):

**A) Header bar**
- Stage dropdown (manual)
- Priority chips
- Owner (internal user)
- Buttons:
  - Add Task
  - Generate Brief
  - Push to Salesforce (manual)

**B) Tabs inside Mission detail**
1) Overview
2) Procurement Brief (existing lead_request content)
3) Tasks (new)
4) Timeline (new)
5) Salesforce (new)

**Tasks tab**
- Task list with filters: open/done, due soon, owner
- Inline complete checkbox
- Add task form (title, type, due, owner, priority)

**Timeline tab**
- Render activity stream (icon + text)
- “Add note” action writes activity `note_added`

**Salesforce tab**
- Show mapping preview (what fields will be pushed)
- Status + last sync time + last error
- Button: Push now

### 4.3 Work Queue page (new left-nav item)
**Purpose:** daily driver for the team.

Sections:
1) Overdue Tasks (all missions)
2) Due Soon (next 7 days)
3) Missions needing qualification (stage=new with >0 signals OR has lead_request)
4) Programs due soon & relevant (optional if program_items exist)
Each item is clickable and has quick actions:
- assign owner
- complete task
- create task
- push to Salesforce (if eligible)

---

## 5) Minimal eligibility rules for Salesforce push (MVP)
Mission is eligible if:
- stage in {qualified, solutioning, proposal, negotiation} (not new/on_hold)
- has linked ProspectCompany OR lead_request has organization_website/domain
- has at least one of:
  - a linked Contact, OR
  - lead_request has work_email
- has a name/title

If not eligible, UI shows “Missing: linked account, contact, stage”.

---

## 6) Implementation order (Cursor checklist)
1) Migrations: mission_tasks, mission_activity, mission_artifacts + missions SF fields
2) Sequelize models + associations
3) Write mission activity helpers (one function to log events)
4) Implement Tasks API + activity writes
5) Implement Activity API
6) Implement Brief generator endpoint + caching (store markdown)
7) Implement Salesforce push endpoint + stub adapter + worker job
8) Update Missions list UI columns + chips + quick actions
9) Update Mission detail tabs: Tasks + Timeline + Salesforce
10) Add Work Queue page and nav link

---

## 7) QA scenarios
- Promote a LeadRequest → Mission; Mission shows Source line (already) and timeline logs `lead_request_promoted`.
- Add tasks; due soon sorting works; completing a task logs activity.
- Generate brief twice with no changes → returns cached; change mission stage → brief regenerates.
- Push to Salesforce:
- not eligible → button disabled with tooltip
- eligible → sets queued → worker runs → synced or error surfaces in UI
