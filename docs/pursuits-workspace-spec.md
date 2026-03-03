# SpaceGTM — Pursuits Tab & Pursuit Workspace Spec (v1)

> Goal: Ship a **Pursuits** tab that creates a **Pursuit Workspace** with four primary blocks:
> 1) Intel Summary (score + 5 bullets)
> 2) Signals Timeline (last 90 days, filterable)
> 3) Stakeholders Map (A/B/C grading + roles)
> 4) Actions (book meeting, partner intro, draft sequence, add to campaign)
>
> This spec assumes we will use **Clay as a headless data pump** (commodity enrichment), while keeping all user-facing data behind **SpaceGTM-owned models** so we can swap vendors later.

---

## 0) Key product decisions

### 0.1 Naming
- **UI label:** `Pursuits`
- **Meaning:** a GTM workspace that can exist **before** mission details are known.

### 0.2 Object model: Pursuit vs Mission
We have two viable implementation paths:

**Option A (recommended for SpaceGTM v1):**
- Keep the existing **Mission** object as the canonical “work object” (DB + API), and expose it in the UI as **Pursuit**.
- Rationale: avoids creating parallel objects that split tasks/signals/program links.
- Implementation: create `/api/abm/pursuits` as an alias to mission services, or simply relabel UI routes.

**Option B (future generalization / non-space):**
- Introduce a dedicated `pursuits` table and link to `missions` optionally once defined.
- Rationale: “Mission” is space-specific; “Pursuit” is universal B2B.
- Not required for v1.

This spec is written assuming **Option A** (Pursuit = Mission workspace), but the UI contract works for either.

---

## 1) UX scope

### 1.1 Routes
- List: `/abm/pursuits`
- Detail: `/abm/pursuits/:id`

### 1.2 Layout
Two-pane layout:
- **Left pane:** Pursuits list (filter + search + sort)
- **Right pane:** Pursuit Workspace (the 4 blocks)

### 1.3 Pursuits list (left pane)
**Columns**
- Title
- Account (ProspectCompany)
- Stage (chip)
- Priority (chip)
- Intel Score (0–100)
- Signals (90d count)
- Next Action Due (date / Overdue)
- Owner
- Source (Manual / Program / LeadRequest)

**Default sorting**
1) Overdue next-action first
2) Due soon
3) Highest Intel Score

**Filters**
- stage
- lane / mission_pattern
- owner
- due soon (next 7 days)
- has linked programs
- hot (score ≥ threshold)
- search (title, account, domain)

### 1.4 Pursuit Workspace (right pane)
Four blocks rendered in a single screen:

#### A) Intel Summary (score + 5 bullets)
- Big score pill (0–100)
- Last refresh timestamp
- 5 evidence bullets (explainable “why hot”)

#### B) Signals Timeline (last 90 days, filterable)
- Timeline list (most recent first)
- Filter controls:
  - Source: First-party / Procurement / Manual
  - Type: web_visit, procurement_notice, award, email_engagement, note, task_completed, etc.
  - Date window (default: 90 days)

#### C) Stakeholders Map (A/B/C grading + roles)
- Minimal org map view:
  - Grade A/B/C badges
  - Role and relationship tags
  - “Missing roles” hints (e.g., Contracting missing)
- Add/edit stakeholders inline

#### D) Actions
Buttons (MVP):
- Book meeting
- Partner intro
- Draft sequence
- Add to campaign

Actions must:
1) Create/update a task
2) Log an activity event
3) Optionally create an Action Run record (for integrations + audit)

---

## 2) Data model (v1)

### 2.1 Existing tables (reuse)
Assumes you already have:
- `missions` (or `pursuits`)
- `mission_tasks`
- `mission_activity`
- `intent_signals`
- `program_items` (SAM.gov / USASpending / SpaceWERX items)
- join tables linking programs → missions/pursuits

### 2.2 New tables (only what the Pursuit Workspace needs)

#### A) pursuit_intel_snapshots
Stores the Intel Summary so it’s fast, stable, and auditable.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| mission_id | UUID (FK) | indexed |
| score | INT | 0–100 |
| bullets_json | JSON | array of 5 strings |
| signals_used_json | JSON | ids + counts + date window |
| generated_by | ENUM | rules_v1 / ai_v1 / hybrid_v1 |
| created_at | TIMESTAMP | |

Notes:
- Keep last N snapshots per mission for diffing.
- Mark a “latest” snapshot by query (ORDER BY created_at DESC LIMIT 1).

#### B) pursuit_stakeholders
Stores stakeholders with grades and roles.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| mission_id | UUID (FK) | indexed |
| contact_id | UUID (FK nullable) | if you have a contacts table |
| name | STRING | required if no contact_id |
| org | STRING | nullable |
| role | STRING | e.g., Contracting Officer, PM |
| grade | ENUM | A / B / C |
| relationship | ENUM | champion / economic_buyer / technical_buyer / gatekeeper / unknown |
| notes | TEXT | nullable |
| source | ENUM | manual / clay / import |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### C) pursuit_action_runs (optional but recommended)
Tracks execution of a high-level action.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| mission_id | UUID (FK) | indexed |
| action_type | ENUM | book_meeting / partner_intro / draft_sequence / add_to_campaign |
| status | ENUM | queued / done / error |
| provider | ENUM | internal / clay / salesforce / hubspot / marketo / other |
| meta_json | JSON | payload + resulting ids |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## 3) Intelligence computation (Intel Summary)

### 3.1 Score (0–100) — explainable, rules-first
Compute as weighted blend (v1 rules-only; add AI later):

1) **Account heat** (existing ABM score)
2) **Signals (last 90d)**: count + recency + source weight
   - includes procurement-origin signals (SAM/USASpending/SpaceWERX)
3) **Stakeholder coverage**
   - + points if ≥1 grade A
   - + points if both econ + technical roles present
4) **Program urgency**
   - + points if a linked program is due soon (e.g., ≤14 days)
5) **Action readiness**
   - + points if a next action exists and due soon
   - - points for overdue actions

### 3.2 5 bullets (evidence + “why hot”)
Generate 5 bullets derived from:
- top procurement changes (posted / amended / due / award)
- top first-party engagement signals (pricing page visits, repeat sessions, etc.)
- stakeholder gaps (“missing contracting”)
- lane/mission_pattern match confidence
- best next action suggestion

Persist the bullets into `pursuit_intel_snapshots`.

### 3.3 Refresh behavior
- On opening a workspace: show latest snapshot immediately
- Provide “Refresh Intel” button
- Optional: auto-refresh if snapshot older than X hours/days

---

## 4) Signals Timeline

### 4.1 Sources
Unified timeline items should include:
- First-party intent signals (web, email, ads, etc.)
- Procurement signals (SAM postings, awards, SpaceWERX topics)
- Internal ops events (note added, task completed, stakeholder updated)
- Program link/unlink events

### 4.2 Normalized timeline item schema
Store or project into a common shape:

```json
{
  "id": "uuid",
  "timestamp": "2026-02-19T18:30:00Z",
  "source": "first_party | procurement | manual | system",
  "type": "web_visit | procurement_notice | award | note | task_completed | stakeholder_update",
  "title": "string",
  "summary": "string",
  "meta": { "any": "json" }
}
```

### 4.3 Filters
- date window (default 90 days)
- source
- type

---

## 5) Stakeholders Map

### 5.1 MVP UI
- List grouped by grade: A / B / C
- Each stakeholder shows:
  - Name
  - Role
  - Relationship tag
  - Source tag (manual/clay)
  - Notes (expand)
- “Missing role” hints:
  - If no stakeholder with role containing “Contracting”, show warning badge
  - If no econ buyer, show warning badge

### 5.2 Add/edit flows
- Add manually
- Import from headless enrichment (Clay provider):
  - “Import suggested contacts” (role-based: procurement, BD, PM, engineering)

---

## 6) Actions block (MVP)

Each action must:
1) Create a `mission_task` (so it lands in Work Queue)
2) Add a `mission_activity` event
3) Optionally create a `pursuit_action_runs` record

### 6.1 Book meeting
- Creates task:
  - type: outreach
  - title: “Book meeting with {Account} re: {Pursuit}”
  - due: +3 business days
- Logs activity: `action.book_meeting.created`

### 6.2 Partner intro
- Prompts:
  - Partner org (pick existing account or free text)
  - Target stakeholder (optional)
  - One-line reason / ask
- Creates task:
  - type: outreach
  - title: “Request intro via {Partner} → {Target}”
  - due: +3 business days
- Logs activity: `action.partner_intro.created`

### 6.3 Draft sequence
- Generates a 3–5 step outreach sequence (text artifact):
  - Email 1 (contextual)
  - LinkedIn touch
  - Email 2 (program/pain angle)
  - Partner angle follow-up
- Stores as:
  - mission_activity entry (summary) and/or mission artifact record
- Creates follow-up task:
  - type: outreach
  - title: “Send Sequence Step 1 to {Account}”
  - due: +1 business day
- Logs activity: `action.draft_sequence.created`

### 6.4 Add to campaign
- MVP behavior:
  - Add a tag to the account OR link to a local campaign record
  - Log activity: `action.add_to_campaign.done`
- Later integrations:
  - Marketo list, HubSpot list, Salesforce campaign member, etc.

---

## 7) Headless enrichment (Clay) behind provider abstraction

### 7.1 Provider interface
Create an internal abstraction so you can swap vendors.

`IEnrichmentProvider` methods:
- `enrichCompany({ name, domain }) -> { firmographics, locations, industries, ids, raw }`
- `findContacts({ domain, roles[] }) -> { contacts[], raw }`
- `getSignals({ domain }) -> { events[], raw }` (optional)

Implementations:
- `ClayProvider` (primary)
- future: `ApolloProvider`, `ClearbitProvider`, etc.

### 7.2 Normalization + storage
- Keep raw payloads in `raw_json` (or a sidecar table).
- Normalize into your entities:
  - Company fields → ProspectCompany
  - Contacts → Contacts table and/or pursuit_stakeholders suggestions

### 7.3 When enrichment runs
- On pursuit create:
  1) create stub company if needed
  2) call provider enrichment
  3) upsert normalized fields
  4) optionally suggest stakeholders

---

## 8) Backend API (v1)

All endpoints under `/api/abm` (protected).

### 8.1 Pursuits (alias missions)
- `GET /api/abm/pursuits`
  - query: `stage`, `owner`, `hot`, `has_program`, `q`
  - returns list rows with score, counts, due date

- `POST /api/abm/pursuits`
  - body: title, account_id (or name/domain), optional program links
  - creates mission/pursuit + kicks enrichment async

- `GET /api/abm/pursuits/:id`
  - returns:
    - pursuit (mission)
    - latest intel snapshot
    - signals (90d)
    - stakeholders
    - actions/tasks summary
    - linked programs (with due dates)

### 8.2 Intel
- `POST /api/abm/pursuits/:id/intel/refresh`
  - recompute score + bullets, write new snapshot

### 8.3 Signals
- `GET /api/abm/pursuits/:id/signals?range=90d&source=...&type=...`

### 8.4 Stakeholders
- `GET /api/abm/pursuits/:id/stakeholders`
- `POST /api/abm/pursuits/:id/stakeholders`
- `PATCH /api/abm/pursuits/:id/stakeholders/:stakeholder_id`
- `DELETE /api/abm/pursuits/:id/stakeholders/:stakeholder_id`

### 8.5 Actions
- `POST /api/abm/pursuits/:id/actions/book-meeting`
- `POST /api/abm/pursuits/:id/actions/partner-intro`
- `POST /api/abm/pursuits/:id/actions/draft-sequence`
- `POST /api/abm/pursuits/:id/actions/add-to-campaign`

Each action:
- creates a task
- appends a mission_activity row
- writes pursuit_action_runs (optional)

---

## 9) Programs feed into Pursuits

Programs are upstream procurement artifacts that should:
- create procurement-origin signals
- link to pursuits
- influence intel scoring + bullets

### 9.1 Create Pursuit from Program
Primary CTA in Programs UI:
- “Create Pursuit Workspace”
  - selects/creates account
  - links program
  - seeds intel + tasks

### 9.2 Display inside workspace
Inside Pursuit Workspace:
- Linked Programs panel (simple list):
  - program title
  - agency
  - status (forecast/RFI/solicitation/award)
  - due date
  - “why matched” (keywords/tags confidence)

---

## 10) Implementation order (Cursor-ready)

1) **UI relabel** Missions → Pursuits (no DB changes)
2) Add tables:
   - pursuit_intel_snapshots
   - pursuit_stakeholders
   - pursuit_action_runs (optional)
3) Add endpoints:
   - /pursuits list + detail
   - intel refresh
   - stakeholders CRUD
   - actions
4) Implement intel scoring v1 (rules-only)
5) Wire Actions → tasks + activity
6) Implement provider abstraction + ClayProvider
7) Add “Create Pursuit Workspace” modal:
   - select/create account
   - optional link program
   - optional import stakeholder suggestions

---

## Appendix A — Example API payloads

### A.1 GET /api/abm/pursuits (row)
```json
{
  "id": "mission_uuid",
  "title": "SDA LEO Comms Payload Pursuit",
  "account": { "id": "acct_uuid", "name": "Northrop Grumman", "domain": "northropgrumman.com" },
  "stage": "shaping",
  "priority": "high",
  "intel": { "score": 78, "last_refreshed_at": "2026-02-19T18:30:00Z" },
  "signals_90d_count": 14,
  "next_action_due": "2026-02-24",
  "owner": { "id": "user_uuid", "name": "Brad" },
  "source": "program"
}
```

### A.2 GET /api/abm/pursuits/:id (detail)
```json
{
  "pursuit": { "...": "mission fields..." },
  "intel_latest": {
    "score": 78,
    "bullets": [
      "2 procurement signals in last 30d: ...",
      "3 repeat visits to pricing + integration pages ...",
      "Stakeholders: 1 A (PM), missing Contracting ...",
      "Lane match: Hosted Payload (confidence 0.82) ...",
      "Next best action: draft a 4-step sequence focused on ... "
    ],
    "created_at": "2026-02-19T18:30:00Z"
  },
  "signals": [ { "...timelineItem": "..." } ],
  "stakeholders": [ { "...": "..." } ],
  "tasks": [ { "...": "..." } ],
  "linked_programs": [ { "...": "..." } ]
}
```
