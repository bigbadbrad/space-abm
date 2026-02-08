# SpaceABM Rev 2.5 — Procurement Radar (Programs) + Program Graph
**Product:** SpaceABM (internal ABM + mission workspace)  
**Backend:** space-api (Node.js, Express, MySQL, Sequelize)  
**Frontend:** space-abm (React dashboard)  
**Theme:** Make ABM *space-grade* by adding the missing “dark funnel” unique to space/defense: **procurement motion** (opportunities, awards, transition programs) + **program graph** that ties those signals to Accounts + Missions.

---

## 0) Why this feature (the “space-grade” unlock)
Generic ABM tools (6sense/Demandbase) are built around SaaS web journeys. Space/defense buying is driven by:
- **Programs / solicitations / awards**
- **contract vehicles**
- **SBIR → transition funding (e.g., STRATFI/TACFI) → Phase III**
- **timelines and artifacts** (RFI/RFP PDFs, SOWs, Q&As)

**Procurement Radar** turns public procurement signals into your existing ABM primitives:
- **IntentSignals** (evidence + time series)
- **Accounts** (ProspectCompany)
- **Missions** (opportunities you track)
- **LeadRequests** (procurement briefs)

So your ABM answers “who’s ready to buy” in a way that is *native to space/defense*:
> “This program just posted / is due in 30 days / awarded to a competitor — and it maps to our service lane.”

---

## 1) Data sources (MVP: public + legal)
### 1.1 SAM.gov — Contract Opportunities (solicitations / notices)
- Use **Get Opportunities Public API** for contract opportunity notices. (Docs: limits include max `limit` range 0–1000 and required `postedFrom/postedTo` formats.) https://open.gsa.gov/api/get-opportunities-public-api/  
- SAM.gov “Contract Opportunities” include pre-solicitation, solicitation, award, sole source notices, etc. https://sam.gov/opportunities  
- API key usage guidance exists in SAM/OpenGSA documentation (personal API key) and rate limits vary by user type across SAM public APIs (examples list 10/day non-federal, 1000/day federal on some public endpoints; treat limits as environment-specific and add throttling). https://open.gsa.gov/api/fh-public-api/ ; https://open.gsa.gov/api/opportunities-api/

### 1.2 USAspending — Awards / spending history
- Use USAspending API endpoints for awards/spending search and aggregation. https://api.usaspending.gov/docs/endpoints  
- USAspending provides award data (contracts/grants/etc.) via API; keep ingestion scoped to your topic/lane filters. https://api.usaspending.gov/

### 1.3 SpaceWERX / AFWERX — Transition programs (optional but high-signal)
- STRATFI/TACFI are designed to bridge Phase II to Phase III (signals “buy-ready” transition motion). https://afwerx.com/divisions/ventures/stratfi-tacfi/  
- SpaceWERX publishes STRATFI/TACFI program details and updates (use as a monitored source and/or ingest if structured feeds exist). https://spacewerx.us/accelerate/stratfi-tacfi/

> **MVP rule:** start with SAM Opportunities + (optional) USAspending awards. Add SpaceWERX as Phase 2.

---

## 2) Core product behavior
### 2.1 What Procurement Radar does
1) Imports new procurement notices daily (SAM) and optionally awards (USAspending)
2) Classifies each notice into:
   - **service_lane** (Launch / Ground / Hosted Payload / Relocation / Fueling / etc.)
   - **topic** (e.g., “LEO downlink”, “hosted payload”, “on-orbit servicing”)
   using a **registry-driven pattern matcher**
3) Creates:
   - a **Program** record (canonical artifact)
   - one or more **IntentSignals** for explainability and scoring
4) Links the Program to Accounts (ProspectCompany) via:
   - domain / vendor name matching (simple MVP)
   - manual linking in UI
   - (later) entity/DUNS/UEI enrichment, teaming graph

### 2.2 Why this fits your ABM architecture
- **Programs** become canonical, auditable procurement artifacts (like LeadRequest, but external)
- **IntentSignals** remain the time-series “why this is hot”
- **Missions** become the “work object” that packages:
  - account intent + lead requests + programs + artifacts + next actions

---

## 3) Backend changes (space-api)

### 3.1 New tables / models

#### A) `ProcurementProgram`
**Purpose:** Canonical external artifact (notice/opportunity/award)

Fields:
- `id` (UUID, PK)
- `source` (enum/string): `sam_opportunity` | `usaspending_award` | `spacewerx` (later)
- `external_id` (string, required, indexed, unique with source)  
  - SAM: noticeId/solicitationId (use what API returns)
  - USAspending: award_id / generated key
- `title` (string, required)
- `summary` (text, nullable)
- `agency` (string, nullable)
- `office` (string, nullable)
- `naics` (string, nullable)
- `psc` (string, nullable)
- `set_aside` (string, nullable)
- `notice_type` (string, nullable)  
  - presolicitation/solicitation/award/etc. (source-dependent)
- `status` (enum/string, default `open`): `open` | `closed` | `awarded` | `cancelled` | `unknown`
- `posted_at` (datetime, indexed)
- `due_at` (datetime, indexed, nullable)
- `url` (string, nullable)
- `raw_json` (JSON, nullable)  *(store raw for traceability/debugging)*
- `service_lane` (string, indexed, nullable) *(computed via registry)*
- `topic` (string, indexed, nullable) *(computed via registry)*
- `weight_override` (int, nullable) *(optional manual tweak)*
- `created_at`, `updated_at`

Indexes:
- (`source`, `external_id`) unique
- (`posted_at`)
- (`due_at`)
- (`service_lane`)
- (`topic`)

#### B) `ProgramAccountLink`
**Purpose:** Link Programs ↔ Accounts (ProspectCompany) with confidence + role

Fields:
- `id` (UUID, PK)
- `procurement_program_id` (UUID, FK, indexed)
- `prospect_company_id` (UUID, FK, indexed)
- `link_type` (enum/string): `issuer` | `likely_prime` | `awardee` | `teammate` | `competitor` | `unknown`
- `confidence` (float, default 0.5)
- `evidence_json` (JSON, nullable)  *(matched vendor name, domain, UEI, etc.)*
- `created_by_user_id` (UUID, FK → User, nullable)
- `created_at`

Unique:
- (`procurement_program_id`, `prospect_company_id`, `link_type`)

#### C) `ProgramMissionLink` (optional but recommended for “space-grade”)
**Purpose:** Attach a Program to a Mission workspace.

Fields:
- `id` (UUID, PK)
- `procurement_program_id` (UUID, FK, indexed)
- `mission_id` (UUID, FK, indexed)
- `notes` (string, nullable)
- `created_by_user_id` (UUID, FK)
- `created_at`

Unique:
- (`procurement_program_id`, `mission_id`)

#### D) `ProcurementImportRun`
**Purpose:** Audit + reliability

Fields:
- `id` (UUID, PK)
- `source` (string)
- `started_at`, `finished_at`
- `status` (`success`|`partial`|`failed`)
- `records_fetched` (int)
- `records_upserted` (int)
- `error_count` (int)
- `error_sample_json` (JSON, nullable)

---

### 3.2 Changes to existing tables

#### `IntentSignal` additions
Add:
- `source` (string, indexed)  
  - `first_party` | `sam_opportunity` | `usaspending_award` | `spacewerx` (later)
- `external_ref_type` (string, nullable) e.g. `procurement_program`
- `external_ref_id` (UUID, nullable, indexed) → links to ProcurementProgram
- `meta_json` (JSON, nullable) (store due date, notice type, award amount, etc.)

> Keep your current scoring pipeline intact; these are just new signal sources.

---

## 4) Registry-driven classification (no hardcoded rules)

### 4.1 New registry tables (Phase A–E compatible)

#### A) `abm_topic_rules` (must-have)
**Purpose:** Pattern match programs into lane/topic/weight.

Fields:
- `id` (UUID)
- `enabled` (bool)
- `priority` (int)  *(higher wins)*
- `source` (string) `sam_opportunity|usaspending_award|*`
- `match_field` (string) `title|summary|naics|psc|agency|*`
- `match_type` (string) `contains|regex|equals`
- `match_value` (text)
- `service_lane` (string)
- `topic` (string)
- `weight` (int)
- `created_at`, `updated_at`

#### B) `abm_source_weights` (recommended)
**Purpose:** Make external sources tuneable.

Fields:
- `source` (string, PK)
- `multiplier` (float, default 1.0)
- `enabled` (bool)

Example:
- SAM opportunities multiplier 1.2
- USAspending awards multiplier 1.0

#### C) Loader layer
Implement a tiny in-memory loader used by:
- procurement import job
- scoring job
- AI summaries (for “why hot” phrasing)

Requirements:
- cache registries in memory with TTL (e.g., 5 minutes)
- admin endpoints invalidate cache on update

---

## 5) Import jobs (workers/cron)

### 5.1 SAM Opportunities import (MVP)
Schedule:
- daily at 02:30 UTC
- fetch `postedFrom` = yesterday, `postedTo` = today (buffer 48h)
- obey API constraints (limit up to 1000, required date formats, etc.). (See SAM Get Opportunities Public API docs.)

Flow:
1) Fetch opportunities batch
2) For each item:
   - upsert ProcurementProgram (source+external_id unique)
   - classify via `abm_topic_rules` → set lane/topic/weight
   - create an IntentSignal:
     - `signal_type` = `procurement_notice`
     - `source` = `sam_opportunity`
     - `topic` = computed topic
     - `weight` = rule.weight * source_multiplier
     - `occurred_at` = posted_at
     - `external_ref_type/id` = link to ProcurementProgram
3) Attempt account linking (MVP heuristics):
   - if program text contains known account names/domains from ProspectCompany table → create ProgramAccountLink(confidence=0.6)
   - otherwise no auto link
4) Write ProcurementImportRun

### 5.2 USAspending awards import (Phase 2)
Schedule:
- daily at 03:00 UTC (or weekly to start)

Flow:
- query awards that match keywords/topics (use your abm_topic_rules patterns)
- upsert ProcurementProgram with `status=awarded`
- write IntentSignal `source=usaspending_award`

---

## 6) API endpoints (space-api)

All under `/api/abm` and gated by `requireInternalUser`.
Admin endpoints require `requireInternalAdmin`.

### 6.1 Programs
#### GET `/api/abm/programs`
Query:
- `range=7d|30d|90d` (default 30d)
- `status=open|awarded|closed|all`
- `lane=...`
- `topic=...`
- `agency=...` (optional)
- `due=soon` (optional) *(<=14 days)*
- `search=` (title, agency, external_id)
- `page`, `limit`
- `sort=posted_desc|due_asc`

Return:
- list rows optimized for table cards:
  - title, source, status, posted_at, due_at, lane, topic, agency, url
  - counts: linked_accounts_count, linked_missions_count

#### GET `/api/abm/programs/:id`
Return:
- program detail
- linked accounts
- linked missions
- related intent signals
- suggested lane/topic + matched rules (for explainability)

#### POST `/api/abm/programs/:id/link-account`
Body:
- `prospect_company_id`
- `link_type`
- `confidence` (optional)
- `evidence_json` (optional)

#### DELETE `/api/abm/programs/:id/link-account/:link_id`

#### POST `/api/abm/programs/:id/link-mission`
Body:
- `mission_id`
- `notes?`

#### POST `/api/abm/programs/:id/create-mission`
Body:
- `owner_user_id?` default current user
- `title?` default from program title + lane
- `priority?` default medium

Server:
- create Mission (source=`inferred`)
- set service_lane/topic from program
- create ProgramMissionLink
- add MissionActivity “Created from Procurement Program”

### 6.2 Program summary (for dashboard cards)
#### GET `/api/abm/programs/summary?range=30d`
Return:
- counts by lane
- open vs due soon vs new posted
- top agencies
- newly awarded signals

### 6.3 Admin: topic rules
- GET `/api/abm/admin/topic-rules`
- POST `/api/abm/admin/topic-rules`
- PATCH `/api/abm/admin/topic-rules/:id`
- POST `/api/abm/admin/topic-rules/reorder`
- POST `/api/abm/admin/cache/flush` *(flush registry loader cache)*

---

## 7) UX spec (space-abm)

### 7.1 Left nav
Add:
- **Programs** after Missions (recommended)

Order suggestion:
- Overview
- Accounts
- Programs ✅
- Missions
- People
- Service Lanes
- Lead Requests
- Activity
- Admin

### 7.2 Programs page (daily driver for procurement motion)
Route: `/abm/programs`

Layout: two-pane
- Left: Programs list
- Right: Program inspector

#### A) Top cards (summary)
- New postings (30d)
- Due soon (14d)
- Awarded (30d) *(Phase 2 if USAspending ingest enabled)*
- Most active lane (30d)

Each card filters the list.

#### B) Programs list
Columns:
- Status pill (Open/Due/Awarded)
- Program title
- Agency (short)
- Lane + topic chips
- Posted
- Due
- Links count (Accounts, Missions)

Row click populates inspector.

#### C) Program inspector
Sections:
- Header: title, source badge, external link
- Key fields: agency/office, posted/due, NAICS/PSC
- Lane/topic and “matched rule” (explainability drawer)
- Linked accounts (chips + add button)
- Linked missions (chips + add button)
- Primary CTA:
  - **Create Mission** (prefill from program)
  - Secondary: “Attach to existing Mission”

#### D) Filters drawer
- range (30/90)
- status
- lane
- agency
- due soon toggle
- search

### 7.3 Mission integration
On Mission detail inspector:
- Add “Related Programs” section
  - list linked programs + due dates
  - button “Attach Program”
- Add Activity entry when linked/unlinked

### 7.4 Overview integration (optional but high impact)
Extend Today’s Priorities:
- “New program posted in your top lane”
- “Program due in 7 days with linked account”
- “Award posted to competitor/teammate (if linked)”

Backend: extend `/api/abm/queue` to include program items.

---

## 8) Scoring impact (minimal, registry-driven)
You already compute rolling intent scores with decay/normalization.

Add Program signals into scoring by:
- classifying them as IntentSignals with weights from `abm_topic_rules`
- applying `abm_source_weights.multiplier`
- letting the existing decay + normalization run unchanged

Recommended default weights (starting point):
- New solicitation/opportunity: +35
- Presolicitation/market research/RFI: +20
- Award notice (competitor/teammate): +25
- Due soon (computed bonus): +10 (applied during daily scoring if due_at within 14d)

All weights should live in registries, not constants.

---

## 9) Admin UX (Super User)
Add Admin tab:
- **Topic Rules**
  - list + enable/disable + priority reorder
  - test rule (paste title/summary) → see matched output lane/topic/weight
- **Source Weights**
  - multipliers toggle and values
- **Import Runs**
  - last 10 runs with error samples
  - “Run import now” button (manual trigger)

---

## 10) Cursor implementation plan (Sprint steps)

### Step 1 — Migrations + models
- Create migrations:
  - procurement_programs
  - program_account_links
  - program_mission_links (optional)
  - procurement_import_runs
  - add columns to intent_signals (source/external_ref/meta)
  - add registry tables: abm_topic_rules, abm_source_weights
- Add Sequelize models + associations
- Add indexes + unique constraints

### Step 2 — Registry loader
- Create `services/registryLoader.js`
  - loads topic rules + source weights
  - caches with TTL
- Ensure scoring job + import job use loader

### Step 3 — Import job (SAM)
- Implement `jobs/importSamOpportunities.js`
  - fetch batch (postedFrom/postedTo buffered)
  - upsert programs
  - classify via topic rules
  - write IntentSignals
  - write ImportRun record
- Add scheduler hook (BullMQ/cron — whichever you use)

### Step 4 — Programs API
- Add `programRoutes.js` under `/api/abm/programs`
- Implement list/detail + linking endpoints
- Implement summary endpoint

### Step 5 — Admin API
- Add `/api/abm/admin/topic-rules` CRUD + reorder
- Add `/api/abm/admin/source-weights` CRUD
- Add `/api/abm/admin/import-runs` read + “run now”

### Step 6 — Frontend Programs page
- Add nav item
- Build `/abm/programs` page:
  - summary cards
  - table list
  - inspector panel
  - “Create Mission” action

### Step 7 — Mission integration
- Add “Related Programs” section in mission inspector
- Add attach/detach UI
- Add activity logging (MissionActivity entries)

### Step 8 — Overview queue integration (optional)
- extend queue endpoint + Today’s Priorities panel

---

## 11) Acceptance criteria (definition of done)
This sprint is complete when:
1) Programs ingest runs daily and creates ProcurementPrograms + IntentSignals
2) Programs page shows newest + due soon programs with lane/topic tags
3) Users can link a program to an account manually
4) Users can create a Mission from a Program and see it linked
5) The scoring system reflects procurement signals in account “why hot”
6) Admin can edit topic rules + rerun import safely

---

## 12) Notes / guardrails
- Start with **public APIs** only.
- Add throttling + retries; store raw_json for traceability.
- Keep auto-linking conservative; prefer manual linking with confidence scores.
- Keep everything registry-driven to evolve quickly without redeploy.
