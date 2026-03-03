# SpaceGTM — Pursuits v2 (Pre‑Mission Workspaces) + “Mission Intel” Spec (v1)

**Date:** 2026-02-22  
**Product:** SpaceGTM / SpaceABM  
**Backend:** space-api (Node/Express/MySQL/Sequelize)  
**Frontend:** space-abm (dashboard UI)

---

## 0) What changed vs prior spec (important)

### 0.1 Definitions (canonical)
- **Lead Request**: inbound request captured by widget/forms.  
- **Mission**: the **deal pipeline object** created **from a Lead Request promotion**. All deal progression lives on Mission.  
  - This matches the current unified flow: **New Lead → Promote to Mission → deal progression on Mission**.  
- **Pursuit**: a **pre-mission workspace** created when you have a target account and an early hypothesis, **before you know mission details** and often **before any lead request exists**.

**Key rule:**  
> A **Pursuit can exist without a Lead Request and without a Mission.**  
> When details become known, a Pursuit can be **converted** into a Mission (or attached when a Lead Request is promoted).

### 0.2 Why this matters
We should **not** overload Mission with early-stage “workspace” behavior, because Missions already have a clear meaning: *the post-lead-request pipeline*.

---

## 1) Product goal

Ship a **Pursuits** tab that lets a user:
1) Create a **Pursuit Workspace** for a target account (even with zero mission details)  
2) Click a **“Mission Intel”** button that returns decision-grade outputs in ~60 seconds  
3) Use a cockpit UI to run the pursuit until:
   - a Lead Request arrives and gets promoted to a Mission, or
   - the user defines enough to **convert the Pursuit into a Mission**.

---

## 2) UX: Pursuits tab + Pursuit Workspace

### 2.1 Routes
- List: `/abm/pursuits`
- Detail: `/abm/pursuits/:id`

### 2.2 List view (Pursuits)
**Columns**
- Pursuit Title
- Account
- Status (chip): `open | converted | closed`
- Stage (chip): `researching | shaping | engaging | proposal | on_hold` (pursuit-level stage; NOT mission stages)
- Intel Score (0–100)
- Signals (90d count)
- Next Action Due (date / Overdue)
- Owner
- Linked: Program count / Mission link (if converted)

**Filters**
- status, stage, owner
- has programs
- hot (score ≥ threshold)
- search (title, account, domain)

### 2.3 Pursuit Workspace (one-screen cockpit)
Four primary blocks + a conversion rail:

#### A) Intel Summary (Score + 5 bullets)
- Score (0–100)
- “Mission Intel” button (runs the waterfall)
- 5 bullets: explainable drivers + recommended next move
- Optional sub-panels (collapsed):
  - Partner shortlist (top 3)
  - Outreach angle (3 bullets + draft preview)

#### B) Signals Timeline (last 90 days, filterable)
- Filter by Source: `first_party | procurement | enrichment | manual | system`
- Filter by Type: `web_visit | procurement_notice | award | org_change | hiring | note | task_completed | intel_run`

#### C) Stakeholders Map (A/B/C grading + roles)
- Grade A/B/C + role + relationship
- “Missing roles” warnings (e.g., Contracting, PM, Technical)

#### D) Actions
Buttons (MVP):
- Book meeting
- Partner intro
- Draft sequence
- Add to campaign
- Convert to Mission (gated; see §7)

---

## 3) “Mission Intel” (killer feature)

### 3.1 What it does
**Input:** Target account + optional mission pattern (e.g., GEO comsat / SDA LEO / hosted payload / NSSL)  
**Output (decision-grade):**
1) **Mission Feasibility Score** (0–100) with component breakdown + “Because…” bullets  
2) **Active Signals & Timing** (what’s happening now; recency + urgency)  
3) **Likely Stakeholders** (who matters + why; A/B/C grading suggestions)  
4) **Partner Shortlist** (who completes the offer)  
5) **Recommended Outreach Angle** (3 bullets + draft)

### 3.2 Trust requirements (non-negotiable)
- Every output must carry **provenance**:
  - `{source, confidence, last_verified}`
- The agent must be **grounded**:
  - Use only evidence present in the entity graph / artifacts
  - Never invent claims
  - Ask for approval before sending any outbound

---

## 4) Buy vs Build: headless Clay + vertical waterfall

### 4.1 Integrate (commodity layer): headless enrichment
Use Clay strictly as a backend utility for:
- firmographics
- generic org chart / contacts
- email/phone verification
- tech stack crumbs (if available)

**Users never see Clay or spreadsheets.**

### 4.2 Build (vertical layer): Space Context Waterfall
Collectors (v1 mix):
- Open/public:
  - procurement notices (SAM.gov / agency pages)
  - USASpending award history
  - SpaceWERX topics/awards
  - FCC filings signals (licenses/earth stations) where feasible
  - press releases / investor decks
  - hiring signals / conference talks
- Paid sources later (Seradata, GovWin/Deltek, etc.)

**The point:** convert raw signals into **mission implications**.

---

## 5) Data model (v1)

### 5.1 New primary table: `pursuits`
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| title | STRING | required |
| prospect_company_id | UUID (FK) | required |
| owner_user_id | UUID (FK) | required |
| status | ENUM | `open | converted | closed` |
| stage | ENUM | `researching | shaping | engaging | proposal | on_hold` |
| mission_pattern | STRING | optional early hint |
| notes | TEXT | optional |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 5.2 Links
#### A) Pursuit ↔ Programs
`pursuit_program_links`
- `pursuit_id`, `program_item_id`, `created_at`
- Many-to-many

#### B) Pursuit ↔ Lead Requests (optional)
`pursuit_lead_request_links`
- `pursuit_id`, `lead_request_id`, `created_at`
- Purpose: if a Lead Request arrives later, attach it to the existing Pursuit.

#### C) Pursuit → Mission (0..1)
Add a nullable FK:
- `pursuits.mission_id` (nullable)
- When converted, set `status='converted'` and store mission_id.

### 5.3 Workspace blocks

#### A) `pursuit_intel_runs`
Tracks each “Mission Intel” run.
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| pursuit_id | UUID (FK) | indexed |
| provider | ENUM | `rules_v1 | ai_v1 | hybrid_v1` |
| status | ENUM | `queued | running | done | error` |
| cost_usd | DECIMAL | optional |
| started_at | TIMESTAMP | |
| finished_at | TIMESTAMP | |
| meta_json | JSON | provider/debug |
| created_at | TIMESTAMP | |

#### B) `pursuit_intel_snapshots`
Stores the latest decision-grade outputs for the UI.
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| pursuit_id | UUID (FK) | indexed |
| score | INT | 0–100 |
| score_components_json | JSON | fit/readiness/timing/partnerability/competition |
| bullets_json | JSON | 5 bullets |
| signals_summary_json | JSON | top signals + timing |
| stakeholders_suggested_json | JSON | suggested A/B/C + roles (optional) |
| partners_json | JSON | top 3 partners + why |
| outreach_json | JSON | 3 bullets + draft |
| provenance_json | JSON | sources + confidence + last_verified |
| created_at | TIMESTAMP | |

#### C) `pursuit_stakeholders`
(Manual + suggested stakeholders; you can store suggestions here with `source='intel'`.)
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| pursuit_id | UUID (FK) | indexed |
| contact_id | UUID (FK nullable) | |
| name | STRING | |
| org | STRING | nullable |
| role | STRING | |
| grade | ENUM | A / B / C |
| relationship | ENUM | champion / economic_buyer / technical_buyer / gatekeeper / unknown |
| notes | TEXT | nullable |
| source | ENUM | manual / clay / intel / import |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### D) `pursuit_tasks` + `pursuit_activity`
To avoid breaking Mission workflow, Pursuits get their own task + activity tables (v1).
- `pursuit_tasks`: same shape as `mission_tasks` (due_date, status, type, owner, etc.)
- `pursuit_activity`: append-only event log (note_added, task_completed, intel_run_done, program_linked, etc.)

*(Future: unify into a polymorphic `work_items` table shared by pursuits + missions.)*

### 5.4 Enrichment storage (provider-agnostic)
To keep Clay “headless” and swappable:
- `enrichment_jobs` (queued/running/done/error; target_type=company/contact)
- `enrichment_sources` (provider name, raw_json, created_at)
- Normalize results into your canonical `prospect_companies`, `contacts`, etc.

---

## 6) Orchestration flow

### 6.1 Create Pursuit
1) User chooses account (existing ProspectCompany) or creates stub (name + domain)
2) System queues enrichment job (headless Clay) to fill basic firmographics + contacts
3) Pursuit created in `open/researching`
4) Signals begin collecting (first-party + procurement + enrichment)

### 6.2 Run Mission Intel
When user clicks **Mission Intel**:
1) Create `pursuit_intel_runs` row (queued)
2) Execute waterfall:
   - Commodity enrichment (if stale / missing)
   - Vertical collectors (space sources)
   - Normalize into entity graph with provenance
   - Compute feasibility score + components
   - Generate outputs (bullets, stakeholders suggestions, partners, outreach)
3) Persist `pursuit_intel_snapshots` (latest)
4) Write `pursuit_activity` event
5) Optionally create recommended tasks:
   - “Add missing stakeholder role: Contracting”
   - “Draft partner intro to X”
   - “Send Outreach Step 1”

### 6.3 Freshness engine (v1)
- Weekly refresh of open pursuits
- Event-driven refresh when:
  - new procurement item linked
  - new high-intent signal arrives
  - new enrichment results arrive

---

## 7) Converting Pursuit → Mission (and Lead Request interaction)

### 7.1 Why conversion exists
A Mission should remain the post-lead pipeline object. A Pursuit becomes a Mission when:
- enough mission details are known **or**
- a Lead Request exists and you want deal progression in the mission pipeline.

### 7.2 Conversion paths
#### Path A: Convert Pursuit directly
- `POST /api/abm/pursuits/:id/convert-to-mission`
- Creates Mission (stage `new`), copies over:
  - account
  - mission pattern / orbit / payload hints (if present)
  - linked programs (optional)
  - key stakeholders (optional)
  - latest intel snapshot as “Source Artifact”
- Sets: `pursuits.mission_id = mission.id`, `pursuits.status='converted'`

#### Path B: Attach Lead Request to Pursuit, then promote Lead Request to Mission
- If a lead arrives for an account that already has an open pursuit:
  - user can link it: `POST /api/abm/pursuits/:id/link-lead-request`
- When Lead Request is promoted (existing behavior):
  - on mission creation, also set `pursuits.mission_id` if linked
  - mark pursuit converted

**Policy:** Missions created via Lead Request remain source-of-truth for deal progression.

---

## 8) Backend API (v1)

### 8.1 Pursuits
- `GET /api/abm/pursuits`
- `POST /api/abm/pursuits`
- `GET /api/abm/pursuits/:id`
- `PATCH /api/abm/pursuits/:id` (stage/status/title/notes)
- `POST /api/abm/pursuits/:id/convert-to-mission`
- `POST /api/abm/pursuits/:id/link-lead-request`
- `POST /api/abm/pursuits/:id/link-program`

### 8.2 Intel
- `POST /api/abm/pursuits/:id/intel/run`
- `GET /api/abm/pursuits/:id/intel/latest`

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

Actions create:
- a `pursuit_task`
- a `pursuit_activity` row
- optional `pursuit_action_runs` (if you add it)

---

## 9) Headless enrichment provider abstraction (Clay)

### 9.1 Provider interface
`IEnrichmentProvider`:
- `enrichCompany({ name, domain })`
- `findContacts({ domain, roles[] })`
- `verifyEmail({ email })` (optional)

Implementations:
- `ClayProvider` (v1)
- future: Apollo, etc.

### 9.2 Normalization rule
Raw vendor payloads must be stored but never drive UI directly:
- `enrichment_sources.raw_json`
- normalize into canonical models (Company/Contacts) with provenance

---

## 10) MVP acceptance criteria

### 10.1 Pursuits
- Can create a pursuit for an account with only name/domain
- Pursuit workspace loads instantly (even if intel not yet run)
- Signals timeline shows at least manual/system events + linked program events

### 10.2 Mission Intel
- Button runs within ~60 seconds for typical accounts (async + progress acceptable)
- Produces:
  - score + component breakdown
  - 5 bullets
  - top signals
  - at least 3 stakeholder suggestions
  - partner shortlist (top 3)
  - outreach angle (3 bullets + draft)
- Outputs are explainable + include provenance and freshness

### 10.3 Conversion
- Pursuit can be converted to a Mission
- Converted pursuit links to mission and becomes read-only (or limited edit)
- Lead Request promotion path can link to an existing pursuit

---

## Appendix A — Example payloads

### A.1 GET /api/abm/pursuits (row)
```json
{
  "id": "pursuit_uuid",
  "title": "Northrop — SDA adjacency (early shaping)",
  "account": { "id": "acct_uuid", "name": "Northrop Grumman", "domain": "northropgrumman.com" },
  "status": "open",
  "stage": "shaping",
  "intel": { "score": 78, "last_refreshed_at": "2026-02-19T18:30:00Z" },
  "signals_90d_count": 14,
  "next_action_due": "2026-02-24",
  "owner": { "id": "user_uuid", "name": "Brad" },
  "mission_id": null,
  "program_count": 2
}
```

### A.2 GET /api/abm/pursuits/:id (detail)
```json
{
  "pursuit": { "...": "core fields..." },
  "intel_latest": {
    "score": 78,
    "score_components": {
      "mission_fit": 22,
      "procurement_readiness": 18,
      "timing": 16,
      "partnerability": 12,
      "competitive_pressure": 10
    },
    "bullets": [
      "2 procurement signals in last 30d (due in 12d)…",
      "3 repeat visits to pricing + integration pages…",
      "Missing Contracting role; add stakeholder…",
      "Lane match: Hosted Payload (confidence 0.82)…",
      "Next best action: request partner intro to X…"
    ],
    "partners": [{ "name": "Partner A", "why": "…" }],
    "outreach": { "angle_bullets": ["…"], "draft": "…" },
    "provenance": [{ "field": "timing", "source": "sam.gov", "confidence": 0.8, "last_verified": "2026-02-20" }],
    "created_at": "2026-02-19T18:30:00Z"
  },
  "signals": [ { "...timelineItem": "..." } ],
  "stakeholders": [ { "...": "..." } ],
  "tasks": [ { "...": "..." } ],
  "linked_programs": [ { "...": "..." } ],
  "linked_lead_requests": [ { "...": "..." } ],
  "mission_link": null
}
```
