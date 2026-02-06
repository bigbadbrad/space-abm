# ABM Rev 2 — Missions (Programs) Tab
**Product:** Space ABM (internal)  
**Backend:** space-api (Node/Express/MySQL/Sequelize)  
**Frontend:** space-abm (dashboard UI you’ve built)  
**Goal:** Add a “Missions” layer that turns ABM signals + lead requests into **real, trackable procurement opportunities** (space/defense flavored).

---

## 0) Why Missions (what this unlocks)
Your ABM MVP answers: **who is hot, why, and what lane**.

Rev 2 adds the missing “real work object” for space/defense:  
**Programs / Missions** (opportunities) that have:
- a service lane + mission pattern
- schedule window + readiness
- requirements artifacts (spec links, attachments)
- owners + statuses + next actions
- links to: accounts, contacts, lead requests, intent signals

This becomes your internal “opportunity workspace” even before Salesforce.

---

## 1) Concepts and Definitions

### 1.1 Mission
A Mission is an internal object representing a **specific procurement effort** (or candidate effort) that you want to track:
- may start from a Lead Request
- may be inferred from activity/intent
- may be created manually by sales

### 1.2 Relationship to existing ABM entities
- **ProspectCompany** → *the account*
- **Contact** → people on the account
- **LeadRequest** → structured procurement brief / inbound qualifier
- **IntentSignal** → evidence and timeline of interest
- **Missions** tie all of these together into a tractable object with a lifecycle.

---

## 2) Backend Spec (space-api)

### 2.1 New Sequelize Models / Tables

#### A) `Mission`
**Purpose:** Primary tracked work object (space/defense procurement opportunity).

Fields (minimum MVP):
- `id` (UUID, PK)
- `prospect_company_id` (UUID, FK → ProspectCompany, indexed, nullable for “unknown yet”)
- `primary_contact_id` (UUID, FK → Contact, nullable)
- `lead_request_id` (UUID, FK → LeadRequest, nullable)  
  - If mission originated from a lead request
- `title` (string, required)  
  - e.g. “Hosted payload imaging demo mission” / “LEO downlink expansion”
- `service_lane` (enum/string)  
  - must align with your existing lanes registry values
- `mission_type` (string/enum, nullable)  
  - Dedicated / Rideshare / Hosted payload / Managed mission / Unknown
- `mission_pattern` (string, nullable)  
  - e.g. `sense_compute_results`, `downlink_as_a_service`, etc. (freeform ok)
- `target_orbit` (string, nullable)
- `inclination_deg` (float, nullable)
- `payload_mass_kg` (float, nullable)
- `payload_volume` (string, nullable)
- `earliest_date` (date, nullable)
- `latest_date` (date, nullable)
- `schedule_urgency` (string, nullable)
- `integration_status` (string, nullable)
- `readiness_confidence` (enum/string, nullable)  (Low/Medium/High)
- `funding_status` (string, nullable)
- `budget_band` (string, nullable)
- `stage` (enum/string, required, default=`new`)  
  Suggested values:
  - `new`
  - `qualified`
  - `solutioning`
  - `proposal`
  - `negotiation`
  - `won`
  - `lost`
  - `on_hold`
- `priority` (enum/string, default=`medium`) (low/medium/high)
- `owner_user_id` (UUID, FK → User, required)  
  - internal owner
- `confidence` (float, default 0.5)  
  - internal system confidence in the mission (0–1)
- `source` (string, required)  
  - `manual` | `lead_request` | `inferred`
- `next_step` (string, nullable)  
- `next_step_due_at` (datetime, nullable)
- `last_activity_at` (datetime, nullable)
- `created_at`, `updated_at`

Indexes:
- (`prospect_company_id`)
- (`owner_user_id`)
- (`stage`)
- (`service_lane`)
- (`next_step_due_at`)
- (`last_activity_at`)

---

#### B) `MissionContact` (join)
**Purpose:** Many-to-many contacts per mission.

Fields:
- `mission_id` (UUID, FK, indexed)
- `contact_id` (UUID, FK, indexed)
- `role` (string, nullable)  
  - “Technical evaluator”, “Procurement”, “PM”, “Ops”, etc.
- `created_at`

Unique constraint:
- (`mission_id`, `contact_id`)

---

#### C) `MissionArtifact`
**Purpose:** Requirements / files / links associated with the mission.

Fields:
- `id` (UUID, PK)
- `mission_id` (UUID, FK, indexed)
- `type` (enum/string)  
  - `spec_link` | `rfp` | `conops` | `architecture` | `pdf` | `notes` | `other`
- `title` (string)
- `url` (string, nullable)  
- `storage_key` (string, nullable)  
  - if you later upload to S3
- `meta_json` (JSON, nullable)
- `created_by_user_id` (UUID, FK → User)
- `created_at`

---

#### D) `MissionActivity` (optional but recommended)
**Purpose:** Human-readable timeline on the mission page (actions + evidence).
This is separate from IntentSignal; it’s “mission log”.

Fields:
- `id` (UUID, PK)
- `mission_id` (UUID, FK, indexed)
- `type` (string)  
  - `note` | `status_change` | `linked_lead_request` | `linked_signal` | `call_logged` | `email_sent` | `task_created`
- `body` (text)
- `meta_json` (JSON, nullable)  
  - e.g. `{ intent_signal_id }`
- `created_by_user_id` (UUID, FK)
- `created_at`

---

### 2.2 Changes to Existing Models (minimal)

#### LeadRequest
Add:
- `mission_id` (UUID, FK → Mission, nullable, indexed)  
When a lead request is “promoted” into a mission.

#### IntentSignal (optional)
Add (optional for richer linkage):
- `mission_id` (UUID, nullable, indexed)  
Useful if you want to explicitly connect a specific signal to a mission (otherwise just show signals from account filtered by lane).

---

### 2.3 Associations
- Mission belongsTo ProspectCompany
- Mission belongsTo Contact (primary_contact_id)
- Mission belongsTo LeadRequest
- Mission belongsTo User (owner)
- Mission hasMany MissionArtifact
- Mission hasMany MissionActivity
- Mission belongsToMany Contact through MissionContact
- LeadRequest belongsTo Mission (optional)

---

## 3) API Endpoints (space-api)

All under `/api/abm` and protected with `requireInternalUser`.
Admin-only actions (registry-like or destructive) should require `requireInternalAdmin`.

### 3.1 Missions CRUD

#### GET `/api/abm/missions`
Query params:
- `range=7d|30d` (optional, affects default filtering by last_activity_at)
- `stage=...` (optional)
- `lane=...` (optional)
- `owner=me|userId` (optional)
- `search=` (title, account name, domain)
- `sort=` (`last_activity_at_desc` default, also `next_step_due_at_asc`, `priority_desc`)
- `page`, `limit`

Returns:
- list rows optimized for table
- include: account name/domain, stage, lane, owner, last_activity_at, next_step_due_at, priority, confidence

#### POST `/api/abm/missions`
Body:
- minimum required: `title`, `service_lane`, `owner_user_id`
- optional: `prospect_company_id`, `lead_request_id` (if creating from lead request), etc.

Server behavior:
- if `lead_request_id` provided:
  - copy relevant fields from LeadRequest into Mission if not provided
  - set `source='lead_request'`
  - set LeadRequest.mission_id = mission.id

#### GET `/api/abm/missions/:id`
Returns a full detail payload:
- mission
- account summary (ProspectCompany basics + current scores)
- contacts on mission
- artifacts
- activities (timeline)
- related lead requests (same account, same lane)
- related intent signals (filtered by account + lane + last 30d)

#### PATCH `/api/abm/missions/:id`
Editable fields:
- stage, priority, owner_user_id
- next_step + next_step_due_at
- all mission details (mass/orbit/etc.)
On change:
- append MissionActivity type `status_change` or `note` depending on field.

#### POST `/api/abm/missions/:id/close`
Body: `{ outcome: "won"|"lost"|"on_hold", reason?: string }`
Server:
- sets stage accordingly
- appends MissionActivity with reason

---

### 3.2 Mission linking actions

#### POST `/api/abm/missions/:id/contacts`
Body: `{ contact_id, role? }`
Adds MissionContact.

#### DELETE `/api/abm/missions/:id/contacts/:contact_id`
Removes MissionContact.

#### POST `/api/abm/missions/:id/artifacts`
Body: `{ type, title, url?, meta_json? }`

#### DELETE `/api/abm/missions/:id/artifacts/:artifact_id`

#### POST `/api/abm/missions/:id/activities`
Body: `{ type: "note", body, meta_json? }`

---

### 3.3 Promote Lead Request → Mission (key workflow)
#### POST `/api/abm/lead-requests/:id/promote`
Body:
- `title?` (default derived from lane + org)
- `owner_user_id?` (default current user)
- `priority?`

Server:
1) Create Mission with `source='lead_request'`
2) Copy key LeadRequest fields into Mission (lane, mission_type, orbit, schedule, budget)
3) Set LeadRequest.mission_id
4) Add MissionActivity entries:
   - “Promoted from lead request”
   - “Procurement brief attached”

Response:
- mission id + detail payload for immediate UI routing

---

### 3.4 “Missions Dashboard” aggregates
#### GET `/api/abm/missions/summary?range=7d`
Returns counts:
- by stage
- by lane
- due soon (next_step_due_at <= 7d)
- stale (last_activity_at > 14d)

Used for top cards on Missions page.

---

## 4) UX Spec (space-abm)

### 4.1 Left Nav
Add a new item:
- **Missions** (between Accounts and Lead Requests OR after Accounts)
Recommended order:
- Overview
- Accounts
- Missions  ✅
- People
- Service Lanes
- Lead Requests
- Activity
- Admin

---

## 5) Missions Page (daily driver for “space sales ops”)

Route: `/abm/missions`

### 5.1 Top section: Mission Summary Cards
4 cards:
1) **Active Missions** (not closed)
2) **Due Soon** (next_step_due_at within 7 days)
3) **Stale** (no activity in 14 days)
4) **Hot Missions** (missions where account stage=Hot OR confidence>=0.75)

Each card acts as a filter shortcut.

### 5.2 Main layout: Two-pane (like Lead Requests)
Left: Missions list (table)
Right: Mission detail inspector

#### Missions list columns
- Stage (pill)
- Priority (pill)
- Mission Title
- Account (domain)
- Lane
- Owner
- Next step due
- Last activity

Default sort: `next_step_due_at asc` with nulls last, then `last_activity_at desc`.

Row click selects mission, populates detail panel.

#### Filters (top bar or filter drawer)
- stage
- lane
- owner (me/all)
- due soon toggle
- stale toggle
- search

### 5.3 Mission detail inspector
Sections:

**Header**
- Title
- Account name/domain (click “Open Account”)
- Stage + Priority + Confidence
- Owner dropdown
- Buttons:
  - “Add note”
  - “Add artifact”
  - “Close mission” (won/lost/on_hold)

**Mission Requirements (structured)**
Render key fields cleanly:
- service_lane, mission_type, mission_pattern
- orbit / inclination
- payload mass / volume
- schedule window + urgency
- integration status + readiness confidence
- budget band + funding status

**Procurement Brief**
If mission linked to LeadRequest:
- show a condensed “brief” preview
- button “Open Lead Request”

**People**
- primary contact
- other contacts (role tags)
- add/remove contact

**Evidence (dark funnel)**
Show top “why” and key signals:
- last 7d signals (chips)
- “View timeline” opens a drawer:
  - IntentSignals filtered by lane + last 30d
  - plus MissionActivity entries

**Next Step**
- editable next_step text
- due date
- quick actions:
  - “Snooze 7d”
  - “Mark contacted”
  - “Generate AI brief” (optional, could reuse account summary prompt)

---

## 6) Overview Page Integration (small upgrade)
On Overview, “Today’s Priorities” should now include mission-driven items:
- “Mission due today”
- “Mission stale”
- “New mission created from lead request”
This makes Missions feel connected to the daily driver.

Backend:
- extend `/api/abm/queue` to include mission items (type: `mission_due`, `mission_stale`, `mission_new`)

---

## 7) Admin / Registry additions (optional but recommended)
You already have registries for mapping/scoring/prompts.

Add one more registry to keep missions “space-native” and consistent:

### `abm_mission_templates` (optional)
Purpose: quick-create structured mission types per lane.
Fields:
- id
- lane
- template_name
- default_title_pattern
- default_fields_json (e.g. typical orbit options, required fields)
- enabled

UI:
- Admin > Mission Templates (super user)
- used in “Create Mission” modal

This keeps Rev 2 extensible without hardcoding.

---

## 8) AI (optional in Rev 2, but high impact)
Add a Mission AI Brief generator:
- Similar to account summary but focused on “what’s the opportunity, what’s missing, next steps”.

### Endpoint
`POST /api/abm/missions/:id/ai-brief`
- reads prompt templates registry (add “mission” prompt type)
- caches in `MissionActivity` or separate `MissionAiBrief` table

### UI
Button in mission inspector: “Generate Mission Brief”
Shows in a drawer.

---

## 9) Salesforce forward-compatibility (fields to add now)
Even if you don’t integrate yet, add fields so you never migrate later:

On `Mission`:
- `salesforce_opportunity_id` (string, nullable)
- `salesforce_campaign_id` (string, nullable)
- `salesforce_last_synced_at` (datetime, nullable)

On `ProspectCompany` (if not already):
- `salesforce_account_id`

On `Contact`:
- `salesforce_contact_id`

Do not implement sync in Rev 2; just reserve fields.

---

## 10) Cursor Implementation Plan (Sprint steps)

### Step 1 — DB + Models
- Create migrations for:
  - missions
  - mission_contacts
  - mission_artifacts
  - mission_activities
- Add `mission_id` to lead_requests
- Add associations and indexes

### Step 2 — API routes
- Implement missions CRUD under `/api/abm/missions`
- Implement promote endpoint `/api/abm/lead-requests/:id/promote`
- Implement missions summary `/api/abm/missions/summary`
- Implement artifacts/contacts/activities endpoints

### Step 3 — Frontend nav + routing
- Add Missions to left nav
- Create page: `/abm/missions`
- Two-pane layout like Lead Requests (reuse components)

### Step 4 — Missions list + inspector
- List calls `GET /api/abm/missions`
- Inspector calls `GET /api/abm/missions/:id`
- Editable fields:
  - stage, owner, priority
  - next step + due date
  - add note
  - add artifact link
  - add contact

### Step 5 — Lead Request → Mission workflow
- Add “Promote to Mission” button in Lead Request detail
- On click:
  - call promote endpoint
  - route to Missions and auto-select the created mission

### Step 6 — Queue integration (optional but recommended)
- Extend Today’s Priorities to include:
  - mission_due
  - mission_stale
- Add simple filters/tabs in Today’s Priorities for “Missions”

### Step 7 — Polish & guardrails
- Role gating: only internal users, admin-only where needed
- Add optimistic UI updates + toasts
- Add empty states and skeleton loading

---

## 11) Acceptance Criteria (definition of done)
Rev 2 is “done” when an operator can:

1) Promote a Lead Request into a Mission
2) View Missions list and filter by stage/lane/owner
3) Open a mission and:
   - edit stage/priority/owner
   - set next step + due date
   - add a note
   - attach a spec link
   - link contacts
4) See mission-linked brief + evidence (signals) in the mission detail
5) (Optional) See mission due/stale items in Today’s Priorities

---

## 12) Notes on scope discipline
- Don’t build Salesforce sync yet; just add ID fields.
- Don’t build file uploads yet; use URLs and store S3 later.
- Don’t over-model defense programs—keep “Mission” general and flexible.

This Rev 2 makes the ABM system feel space-native: **Accounts show intent; Missions turn intent into tracked procurements.**
