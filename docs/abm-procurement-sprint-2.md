# SpaceABM — Programs Sprint 2 (USAspending + SpaceWERX + Intelligence + Rich Program Detail)
**Target:** `space-api` (Node/Express/MySQL/Sequelize) + `space-abm` (React/MUI)
**Goal:** Turn Programs into a high-signal procurement intelligence system:
1) ingest USAspending awards + SpaceWERX awards
2) normalize into a unified “Programs Feed”
3) classify to service lanes using registry rules (explainable + editable)
4) upgrade the right-side Program Detail into a real procurement dossier + triage workflow

---

## 0) Definition of Done
This sprint is “done” when:

- ✅ Programs tab defaults to **Relevant** view and feels “space-only”
- ✅ You can ingest:
  - SAM.gov opportunities (already) + USAspending awards + SpaceWERX awards
- ✅ Every program item shows:
  - source badge, lane chip, relevance score, confidence, why-matched
- ✅ Right-side detail panel has tabs (Overview / Requirements / Attachments / Contacts / Actions & Notes / Matching)
- ✅ Admin can edit:
  - lane definitions
  - positive match rules
  - suppression rules
  - reclassify last 30d without deploy
- ✅ You can link a program item to:
  - ProspectCompany (Account)
  - Mission
  - Create Mission from Program
- ✅ There is a Triage Queue view: “New Relevant”, “Due Soon”, “Unclassified but promising”

---

## 1) Concepts and Unified Vocabulary
You now have multiple procurement/award sources. Normalize into a single concept:

### 1.1 Unified Feed Item = “ProgramItem”
A ProgramItem can come from:
- `sam_opportunity` (SAM.gov)
- `usaspending_award` (USAspending.gov)
- `spacewerx_award` (SpaceWERX)

A ProgramItem has:
- `source_type` (enum)
- `source_id` (unique string per source)
- `title`
- `agency`
- `posted_at`
- `due_at` (nullable)
- `status` (open/closed/awarded/etc.)
- `description` (text)
- `naics`, `psc` (nullable)
- `place_of_performance` (json nullable)
- `amount_obligated` (decimal nullable)
- `amount_total_value` (decimal nullable)
- `links_json` (json)
- `attachments_json` (json)
- `contacts_json` (json)

Plus Intelligence:
- `service_lane` (string nullable)
- `topic` (string nullable)
- `relevance_score` (0–100)
- `match_confidence` (0–1)
- `match_reasons_json` (json array)
- `classification_version` (string)
- `suppressed` (bool)
- `suppressed_reason` (string nullable)

And Workflow:
- `owner_user_id` (uuid nullable)
- `triage_status` (enum: new|triaged|linked|mission_created|ignored|suppressed)
- `priority` (enum: low|med|high)
- `last_triaged_at` (datetime nullable)

---

## 2) Database Schema

> IMPORTANT: Keep your existing `procurement_programs` table if it already exists for SAM.
> For Sprint 2, add a unified table `program_items` and migrate SAM entries into it over time.
> Or: keep separate per-source tables and create a SQL VIEW `v_program_items`.
> **MVP approach:** create `program_items` and populate it for ALL new ingests; keep old SAM table but also backfill.

### 2.1 New: program_items
Fields (Sequelize model: `ProgramItem`)
- id (UUID, PK)
- source_type (ENUM: sam_opportunity, usaspending_award, spacewerx_award)
- source_id (STRING, unique with source_type)  // e.g. sam:noticeId, usaspending:award_id, spacewerx:award_key
- title (STRING)
- agency (STRING)
- agency_path (STRING or JSON) // optional
- status (STRING) // open/closed/awarded/etc.
- notice_type (STRING nullable) // solicitation/award/etc
- posted_at (DATETIME nullable)
- updated_at_source (DATETIME nullable)
- due_at (DATETIME nullable)
- due_in_days (INT nullable) // computed nightly or on read
- description (LONGTEXT nullable)

- naics (STRING nullable)
- psc (STRING nullable)
- set_aside (STRING nullable)
- place_of_performance_json (JSON nullable)

- amount_obligated (DECIMAL(18,2) nullable)
- amount_total_value (DECIMAL(18,2) nullable)

- links_json (JSON nullable)
- attachments_json (JSON nullable)
- contacts_json (JSON nullable)

**Intelligence**
- service_lane (STRING nullable)
- topic (STRING nullable)
- relevance_score (INT default 0, index)
- match_confidence (FLOAT default 0, index)
- match_reasons_json (JSON nullable)
- classification_version (STRING default "v1_rules")
- suppressed (BOOLEAN default false, index)
- suppressed_reason (STRING nullable)

**Workflow**
- owner_user_id (UUID nullable, index)
- triage_status (ENUM new|triaged|linked|mission_created|ignored|suppressed, default "new", index)
- priority (ENUM low|med|high, default "med", index)
- last_triaged_at (DATETIME nullable)

**Linking**
- linked_prospect_company_id (UUID nullable, index)
- linked_mission_id (UUID nullable, index)

- raw_json (JSON nullable)

Indices:
- unique(source_type, source_id)
- index(relevance_score), index(match_confidence)
- index(service_lane), index(suppressed), index(triage_status)
- index(due_at), index(posted_at)

### 2.2 New: program_item_notes
Sequelize model: `ProgramItemNote`
- id (UUID, PK)
- program_item_id (UUID FK -> program_items.id, index)
- user_id (UUID FK -> users.id, index)
- note (TEXT)
- created_at

### 2.3 Registries (Phase A–C)
#### A) lane_definitions
Sequelize model: `LaneDefinition`
- lane_key (STRING PK) // launch, hosted_payload, ground_station, relocation, fueling, isam, reentry_return
- display_name (STRING)
- description (TEXT) // used for semantic classifier later + AI
- keywords_json (JSON array)
- enabled (BOOLEAN default true)

#### B) program_match_rules  (positive)
Sequelize model: `ProgramMatchRule`
- id (UUID, PK)
- enabled (BOOLEAN default true)
- priority (INT default 100)
- source_type (ENUM sam_opportunity|usaspending_award|spacewerx_award|all)
- match_field (ENUM title|description|agency|naics|psc|url|any)
- match_type (ENUM contains|regex|equals)
- match_value (TEXT)
- service_lane (STRING)
- topic (STRING nullable)
- add_score (INT) // +5..+60
- set_confidence (FLOAT nullable)
- notes (TEXT nullable)

#### C) program_suppression_rules (negative)
Sequelize model: `ProgramSuppressionRule`
- id (UUID, PK)
- enabled (BOOLEAN default true)
- priority (INT default 100)
- source_type (ENUM sam_opportunity|usaspending_award|spacewerx_award|all)
- match_field (ENUM title|description|agency|naics|psc|url|any)
- match_type (ENUM contains|regex|equals)
- match_value (TEXT)
- suppress_reason (STRING)
- notes (TEXT nullable)

### 2.4 (Optional later) semantic_lane_vectors
- lane_key
- embedding_json
- embedding_model
- updated_at

---

## 3) Ingestion Jobs

### 3.1 SAM.gov (existing)
- Keep as-is, but after ingest/upsert, write/merge into `program_items`.
- source_type = `sam_opportunity`
- source_id = SAM noticeId (or a deterministic unique field)
- attachments_json from SAM links if present
- contacts_json if present

### 3.2 USAspending.gov Awards Ingest
Create: `jobs/ingestUsaspendingAwards.js`

**Fetch strategy (daily):**
- Pull last 30 days by default (configurable)
- POST to USAspending endpoint:
  - `/api/v2/search/spending_by_award/`
- Use filters:
  - time_period: last 30d
  - award_type_codes: contracts (later: add grants)
  - optionally filter on agencies or keywords

**Normalize into ProgramItem:**
- source_type: `usaspending_award`
- source_id: `award_id` (prefix if needed)
- title: award title if present else “Award: {recipient_name}”
- agency: awarding_agency
- posted_at: action_date / start_date (whichever exists)
- status: “awarded”
- amount_obligated: obligated_amount
- naics/psc if available
- description: award_description
- links_json: include a url to USAspending award page if available (or store enough to construct later)
- raw_json stored

Upsert:
- unique(source_type, source_id)
- update on change

### 3.3 SpaceWERX Ingest (Portfolio + STRATFI/TACFI pages)
Create: `jobs/ingestSpacewerxAwards.js`

**Approach (MVP):**
- Fetch HTML from:
  - /accelerate/stratfi-tacfi/
  - /ventures/portfolio/
- Parse:
  - company_name
  - program_type (STRATFI/TACFI/SBIR/STTR if indicated)
  - cohort/year if indicated
  - portfolio entry link if present

Normalize into ProgramItem:
- source_type: `spacewerx_award`
- source_id: `spacewerx:{year}:{program_type}:{slug(company_name)}`
- title: `{company_name} — {program_type}` or portfolio title
- agency: “SpaceWERX”
- posted_at if found; else null
- status: “awarded” (or “portfolio”)
- description: excerpt if present
- links_json: portfolio link(s)
- raw_json stored

> NOTE: Keep parser resilient. If HTML structure changes, ingest should fail softly and log.

### 3.4 Scheduler
Add to your existing job runner / cron:
- Daily 2am UTC:
  - ingest SAM (existing)
  - ingest USAspending
  - ingest SpaceWERX
  - reclassify items updated in last 24h (or last 30d nightly if cheap)

---

## 4) Intelligence: Classification Engine (Rules-Based v1)

### 4.1 Service: services/programClassifier.js
Inputs:
- programItem (title, description, agency, naics, psc, links)
- registries:
  - lane_definitions
  - program_match_rules
  - program_suppression_rules

Algorithm:
1) Build searchable text:
   - text = `${title}\n${description}\n${agency}\n${naics}\n${psc}\n${links}`
2) Apply suppression rules (priority order):
   - if match: set suppressed=true, reason, return
3) Apply positive rules:
   - accumulate lane_scores {lane_key: score}
   - capture reasons array:
     - {type:"rule", rule_id, label, field, match_value, add_score}
4) Determine top lane:
   - service_lane = argmax(lane_scores)
   - relevance_score = clamp(sum of matched add_score, 0..100)
   - match_confidence:
     - default = min(1, relevance_score / 80)
     - if rule sets confidence, take max
5) Save:
   - service_lane, topic (top topic match), relevance_score, match_confidence, match_reasons_json
   - classification_version = "v1_rules"
   - suppressed fields if applicable

Default Relevant threshold:
- relevant if relevance_score >= 35 AND not suppressed

### 4.2 Reclassify Endpoint + Button
Implement:
- POST `/api/abm/programs/reclassify?range=30d`
- Reclassifies program_items within range (posted_at >= now-range)
- Uses current registries
- Returns counts:
  - total, suppressed, relevant, lane distribution

Button:
- “Reclassify 30d” already present → wire to this endpoint.

---

## 5) API Endpoints (space-api)

### 5.1 Programs list
GET `/api/abm/programs`
Query params:
- `range=30d|7d|90d`
- `view=relevant|all|suppressed` (default relevant)
- `lane=launch|hosted_payload|ground_station|relocation|fueling|isam|reentry_return|all`
- `status=open|closed|awarded|all`
- `min_score=35` (default 35 when view=relevant)
- `due_soon=true` (optional)
- `q=search` (title/agency)
- `sort=posted_desc|due_asc|score_desc`

Response rows must include:
- id, source_type, title, agency, status, service_lane, relevance_score, posted_at, due_at
- reasons_summary (string) // derived from match_reasons_json top 2–3

### 5.2 Program detail (for right panel)
GET `/api/abm/programs/:id`

Return a normalized “view model”:
```json
{
  "program": { ... },
  "overview": { ... key facts ... },
  "requirements": {
    "description": "...",
    "extracted": {
      "objective": "...",
      "scope": ["..."],
      "deliverables": ["..."],
      "submission": ["..."],
      "evaluation": ["..."]
    }
  },
  "attachments": [...],
  "contacts": [...],
  "triage": { "owner_user_id": "...", "triage_status": "...", "priority": "...", "notes": [...] },
  "matching": { "relevance_score": 35, "confidence": 0.44, "reasons": [...] }
}
