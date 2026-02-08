# Addendum: Program Intelligence (Relevance + Lane Classification + Triage UX)
**Goal:** Reduce SAM.gov noise by automatically classifying Programs into Full Orbit service lanes,
filtering irrelevant notices, and surfacing a “Relevant Programs” queue with explainable reasons.

## 1) Problem
SAM ingestion pulls thousands of notices, most unrelated (HVAC, actuators, VA claims processing, etc.).
If Programs is noisy, users will stop using it.

## 2) Solution Overview
Add a 2-stage intelligence pipeline:

### Stage 1 — Deterministic Rules (Registry-driven, explainable)
- Keyword/regex rules (title/summary/NAICS/PSC/agency)
- Positive match → lane/topic + weight
- Negative match → suppress/ignore
- Confidence scoring

### Stage 2 — Semantic Classifier (optional but recommended)
- Embedding similarity against lane/topic descriptions
- Used only when rules are weak/ambiguous
- Produces lane + confidence + reasons

Result:
- Every Program gets:
  - service_lane (nullable)
  - topic (nullable)
  - relevance_score (0–100)
  - match_confidence (0–1)
  - match_reasons (json array)
  - classification_version (string)

Programs UI defaults to **Relevant** not “All”.

---

## 3) Data Model Changes

### 3.1 procurement_programs
Add fields:
- `relevance_score` (int, default 0, indexed)
- `match_confidence` (float, default 0, indexed)
- `match_reasons_json` (json, nullable) 
  - e.g. [{"type":"rule","rule_id":"...","label":"Matched 'hosted payload'","weight":35}]
- `classification_version` (string, default "v1")
- `suppressed` (bool, default false, indexed)
- `suppressed_reason` (string, nullable)

Optional:
- `source_tags` (json) — store derived tags (e.g. ["DoD","space","launch"])

### 3.2 New registry tables (add to Admin)
#### A) abm_program_rules (positive rules)
Purpose: Map programs → lane/topic/relevance (like your topic rules, but explicitly for Programs)
Fields:
- id (UUID)
- enabled (bool)
- priority (int)
- match_field (title|summary|agency|naics|psc|url|*)
- match_type (contains|regex|equals)
- match_value (text)
- service_lane (string)
- topic (string)
- add_score (int)  (e.g. +35)
- set_confidence (float) (optional)
- notes (text)

#### B) abm_program_suppression_rules (negative rules)
Purpose: Suppress obvious non-space noise (HVAC, plumbing, office supplies, etc.)
Fields:
- id (UUID)
- enabled (bool)
- priority (int)
- match_field (title|summary|naics|psc|agency|*)
- match_type (contains|regex|equals)
- match_value (text)
- suppress_reason (string)
- suppress_score_threshold (int, nullable) (if you want conditional suppression)

#### C) abm_lane_definitions (semantic prompts + keywords)
Purpose: Define lanes for classifier and UI
Fields:
- lane_key (PK) e.g. "launch", "hosted_payload", "ground_station", "relocation", "fueling", "isam", "reentry_return"
- display_name
- description (text) — used for embeddings + AI summaries
- keywords_json (array) — used for lightweight matching & admin visibility

---

## 4) Intelligence Pipeline (Backend)

### 4.1 Where it runs
Run classification immediately after upserting a Program (during import), and also allow reprocessing:
- On import: classify each new/updated program
- Nightly job: reclassify last 30d using newest registries (optional)
- Admin button: “Reclassify Selected / Reclassify Last 7d”

### 4.2 Deterministic scoring (MVP required)
Algorithm:
1) Initialize:
   - relevance_score = 0
   - reasons = []
2) Apply suppression rules first:
   - If a suppression rule matches strongly → set suppressed=true + reason and STOP
3) Apply positive rules:
   - For each matching rule:
     - relevance_score += add_score
     - if service_lane not set or rule.priority higher → set lane/topic
     - reasons.push({type:"rule", rule_id, label, add_score})
4) Normalize:
   - clamp relevance_score 0..100
   - match_confidence = min(1, relevance_score / 80) (tunable)
5) Save:
   - service_lane/topic, relevance_score, match_confidence, reasons_json

Default thresholds:
- Relevant if `relevance_score >= 35` AND not suppressed
- Highly relevant if `>= 60`

### 4.3 Semantic classifier (Phase 2, recommended)
Only run if:
- not suppressed
- relevance_score < 35 OR lane is null
Method:
- compute embedding of `title + summary + agency`
- compare cosine similarity to embeddings for each lane definition description+keywords
- pick best lane if similarity >= threshold (e.g. 0.78)
- add reasons: {type:"semantic", lane, similarity}
- add relevance_score bump (e.g. +25) if strong match

Store:
- classifier_version = "v2_semantic"
- match_confidence updated accordingly

> Keep this optional so MVP works with just registries.

---

## 5) API Updates

### 5.1 GET /api/abm/programs
Add filters:
- `relevant=true|false` (default true)
- `lane=...`
- `min_score=...` (default 35 if relevant=true)
- `suppressed=false` (default true)
- `confidence_min=...` (optional)

Return additional fields per row:
- service_lane
- relevance_score
- match_confidence
- suppressed
- due_at
- reasons_summary (string) e.g. "Matched: hosted payload, on-orbit, integration"

### 5.2 GET /api/abm/programs/:id
Return:
- match_reasons_json
- matched_rules (optional expansion)
- suppression_reason if suppressed

### 5.3 Admin endpoints
- GET/POST/PATCH `/api/abm/admin/program-rules`
- GET/POST/PATCH `/api/abm/admin/program-suppression-rules`
- GET/PATCH `/api/abm/admin/lane-definitions`
- POST `/api/abm/admin/programs/reclassify?range=7d|30d`
- POST `/api/abm/admin/programs/:id/override`
  Body:
  - service_lane
  - topic
  - relevance_score (optional)
  - suppressed (optional)
  - notes

---

## 6) UX Updates (space-abm)

### 6.1 Programs page defaults
- Default view shows **Relevant Programs** (not all)
- Add a toggle pill: [Relevant] [All] [Suppressed]
- Add lane filter chips at top (Launch, Hosted Payload, Ground, Mobility, Fueling, ISAM, Return)
- Add “Confidence” indicator and “Why” hover

### 6.2 Columns
Programs table:
- Status
- Title
- Agency
- Lane (chip)
- Score (0–100)
- Posted / Due
- Links

### 6.3 Program detail panel
Add sections:
- “Match” card:
  - Lane + confidence
  - Reasons list (rule hits + semantic hit)
  - Button: “Override classification”
- If suppressed:
  - show suppressed reason + “Unsuppress” button

### 6.4 Triage workflow (this is the daily driver)
Add a secondary view/tab inside Programs:
- **Triage Queue**
  - “Unclassified but high potential” (score 20–34)
  - “Newly relevant today”
  - “Due soon & relevant”
Actions:
- Assign lane
- Create Mission from Program
- Link account
- Dismiss/suppress

---

## 7) Starter rule sets (ship these day one)

### 7.1 Suppression rules (high ROI)
- title/summary contains: "HVAC|air conditioner|plumbing|janitorial|roof|generator maintenance|actuator|valve|starter motor|UPS|fuel card|office supplies|medical coding|claims review"
- PSC codes typical of facilities/maintenance (add list)
- NAICS obvious non-aero (construction/facilities)

### 7.2 Positive rules (lane mapping examples)
**Hosted Payload**
- "hosted payload|payload integration|payload accommodation|rideshare payload|secondary payload"
**Launch**
- "launch services|launch vehicle|rideshare|payload to orbit|launch integration"
**Ground Station**
- "ground station|TT&C|telemetry tracking|antenna|downlink|uplink|X-band|S-band|Ka-band"
**Mobility/Relocation**
- "orbital transfer|space tug|OTV|rendezvous|proximity ops|station-keeping"
**ISAM**
- "on-orbit servicing|inspection|rpo|life extension|debris removal|refueling"
**Return**
- "reentry|return capsule|downmass|in-space manufacturing return"

Each rule adds +20 to +45 relevance depending on specificity.

---

## 8) Acceptance Criteria
Done when:
1) Programs default view shows only relevant items (score >= 35) and feels “space-only”
2) Suppressed noise is hidden by default
3) Every relevant program shows lane + score + “why” reasons
4) Admin can add/edit rules without deploy, and reclassify last 30d
5) Users can override lane/topic from Program detail

---

## 9) Cursor step plan
1) Migrations: add fields + create 3 registry tables
2) Build classification service: `services/programClassifier.js` (rules-based)
3) Integrate into SAM import job
4) Update programs endpoints to support relevant filters + return scoring fields
5) Build Admin screens for rules + reclassify
6) Update Programs UI: relevant toggle + lane chips + score + why
7) Add Triage Queue subview
8) (Optional) Add semantic classifier v2
