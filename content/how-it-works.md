# How It Works

The following explains how the Space ABM system works end-to-end. It covers:

- The core ABM concepts (Accounts, Contacts, Lead Requests, Signals, Missions)
- The "Request a Reservation" modal ingestion pipeline
- Lead scoring (exact rules)
- Intent signals and account rollups
- **Phase 2 (6sense-lite)**: decayed scoring, surge detection, registry-driven architecture
- PostHog aggregation + daily batch job
- Three dashboards (Hot Accounts, Service Lane Intent, People Inside Accounts)
- AI Account Summary (cached)
- Missions (tracking procurement opportunities)
- Programs (unified procurement opportunities from SAM.gov, USAspending, SpaceWERX)
- Routing/workflow state
- The API surface we've added

---

## Overview

Space ABM is built around a simple idea:

1. **Prospects generate intent** by interacting with Space ABM pages and, most importantly, by submitting a **Request a Reservation** lead form.
2. The backend stores each submission as a **Lead Request** (a canonical, auditable "sales artifact").
3. The backend **upserts** the associated **Prospect Company** (account) and **Contact** (lead/person).
4. The backend writes **Intent Signals** (a time-series explanation of "why this account is hot").
5. The backend computes and maintains:
   - a **Lead Score** (per Lead Request)
   - an **Intent Score** (rolling 30-day account score, with Phase 2 decay + normalization)

The ABM dashboard (internal) uses these entities to show:
- **Top Accounts** (highest intent)
- **Hot Leads** (highest-scoring recent requests)
- **Service Lane Intent** (which service areas are trending)
- **Phase 2**: Hot Accounts, Service Lane Intent, and People Inside Accounts dashboards, plus AI-generated account summaries
- **Missions**: Tracked procurement opportunities—real work objects that tie accounts, lead requests, and intent together

---

## Missions: Tracking Procurement Opportunities

**Missions** turn ABM signals and lead requests into trackable procurement opportunities. While Accounts show *who* is hot and *why*, Missions answer *what* you're actually working on—a specific deal, demo, or program you want to close.

### What is a Mission?

A Mission represents a **specific procurement effort** you're tracking. It might have started from a Lead Request (someone submitted a reservation or hosted payload brief), been inferred from account activity, or created manually. Each Mission has:

- A **title** and **service lane** (e.g., Launch, Hosted Payload)
- **Stage** (new → qualified → solutioning → proposal → negotiation → won/lost/on_hold)
- **Requirements** (orbit, schedule, budget, readiness)
- **People** (primary contact and team)
- **Next step** and due date
- **Evidence** (linked lead requests, intent signals, artifacts)

### Finding the Missions Page

Open **Missions** from the left navigation (between Accounts and Lead Requests). The Missions page is your daily driver for space sales ops.

### Summary Cards at the Top

Four cards give you a quick snapshot:

- **Active** — All missions not yet closed (won/lost/on_hold)
- **Due Soon** — Missions with a next step due within 7 days
- **Stale** — Missions with no activity in 14+ days
- **Hot** — Missions where the account is hot or confidence is high

Click any card to filter the list accordingly.

### Filtering and Sorting

Use the filter bar to narrow the list:

- **Search** — By mission title or account name/domain
- **Stage** — e.g., qualified, solutioning, proposal
- **Lane** — Service lane (Launch, Refuel, etc.)
- **Owner** — Show only your missions or all
- **Due Soon** / **Stale** — Toggle chips to focus on time-sensitive or neglected missions
- **Sort** — By due date, last activity, or priority

Click **Apply** to refresh the list with your filters.

### The Missions List and Detail Inspector

The page uses a two-pane layout:

- **Left pane** — Table of missions (stage, title, account, lane, due date). Click a row to select it.
- **Right pane** — Detail inspector for the selected mission.

### Working with a Mission

In the detail inspector you can:

1. **View the header** — Title, stage, priority, confidence, account name, and owner. Use **Open Account** to jump to the full account view.

2. **Review requirements** — Lane, mission type, orbit, mass, schedule window, readiness, and budget.

3. **Open the procurement brief** — If the mission came from a Lead Request, use **Open Lead Request** to see the full brief.

4. **See people** — Primary contact and other linked contacts with their roles.

5. **Edit the next step** — Update the next step text and due date, then click **Save**.

6. **Add a note** — Type a note and click **Add** to log it on the mission timeline.

7. **Generate Mission Brief** — Click to generate an AI summary of the opportunity: what we know, what's missing, and recommended next steps. The brief appears in a drawer.

8. **Close the mission** — When the deal is done, use **Won**, **Lost**, or **On Hold**. You can optionally provide a reason.

### Promoting a Lead Request to a Mission

When a Lead Request looks like a real opportunity, turn it into a Mission:

1. Open **Lead Requests** and select the lead request.
2. In the detail panel, click **Promote to Mission**.
3. You'll be taken to the new Mission with the lead request already linked. Key fields (lane, orbit, schedule, budget) are copied from the brief.

The promoted mission appears in your Missions list and in Today's Priorities.

### Missions in Today's Priorities

On the **Overview** (Command Center) page, **Today's Priorities** now includes mission-related items:

- **Mission Due** — Missions with a next step due soon
- **Mission Stale** — Missions that need attention
- **New Mission** — Missions recently created from lead requests

Use the **Missions** tab to see only these items. Click any row to open that mission.

---

## Programs: Procurement Opportunities Across Sources

The **Programs** tab is your unified view of federal procurement opportunities. It aggregates programs from multiple sources and lets you filter, triage, and link them to accounts and missions.

### What is a Program?

A **Program** is a procurement opportunity—a notice, solicitation, or award from federal sources. Programs are ingested from:

- **SAM.gov** — Federal opportunities (solicitations, pre-solicitations, sources sought)
- **USAspending** — Contract awards (obligations in the last 30 days)
- **SpaceWERX** — STRATFI/TACFI awards and company selections

Each program has a title, agency, status (open, awarded, etc.), posted date, and links to the source. Programs are **classified** by rules—assigning a **service lane** (Launch, Hosted Payload, Ground Station, etc.) and a **relevance score**—so you can focus on space-related opportunities.

### Finding the Programs Page

Open **Programs** from the left navigation (between Missions and Lead Requests). The page uses a two-pane layout: list on the left, detail inspector on the right.

### Summary Cards at the Top

Four cards give you a quick snapshot:

- **NEW (30D)** — Programs posted in the last 30 days
- **DUE SOON** — Programs with a due date in the next 14 days
- **AWARDED** — Programs that have been awarded
- **OPEN** — Programs still open for response

### Filtering and Sorting

Use the filter bar to narrow the list:

- **Search** — By title, agency, or source ID
- **Range** — 7, 30, or 90 days (posted date range)
- **Status** — All, open, awarded, etc.
- **View** — **Relevant** (default): programs with relevance score ≥ 35; **All**: all non-suppressed; **Suppressed**: programs that matched suppression rules
- **Source** — All, SAM.gov, USAspending, SpaceWERX
- **Lane** — Launch, Hosted Payload, Ground Station, Relocation, Fueling, Isam, Reentry Return
- **Sort** — Posted (newest), Due soon, etc.

Source and Lane filters work together. Lane filters apply to all sources—programs from SAM, USAspending, and SpaceWERX are all classified with the same rules.

Click **Apply** to refresh the list with your filters.

### The Programs List and Detail Inspector

- **Left pane** — Table of programs (status, source, title, agency, lane, posted date). Click a row to select it.
- **Right pane** — Detail inspector for the selected program.

### Working with a Program

In the detail inspector you can:

1. **View the header** — Title, source badge, status, lane, relevance score, and match confidence. Use **Open** (e.g. "Open SAM.gov") to jump to the source.

2. **Review key facts** — Agency, notice type, posted date, due date, set-aside, NAICS/PSC, place of performance.

3. **See requirements** — Full description and requirements (when available).

4. **Create Mission** — Turn the program into a Mission you can track. The mission is created with the program linked.

5. **Link Account** — Associate the program with a Prospect Company.

6. **Link Mission** — Associate the program with an existing Mission.

7. **Add notes** — Log internal notes or actions on the program.

8. **Matching** — See which rules matched (e.g. "Matched 'space'").

### Reclassify 30d

Admin users can click **Reclassify 30d** to re-run the classifier on all programs in the last 30 days. This updates relevance scores and service lanes when rules have changed.

### Importing Programs

Programs are fetched by import jobs that run on a schedule (e.g. daily at 2am UTC) or manually from Admin:

- **Run SAM import** — Fetches opportunities from SAM.gov (requires `SAM_API_KEY`)
- **Run USAspending ingest** — Fetches awards from USAspending.gov
- **Run SpaceWERX ingest** — Fetches STRATFI/TACFI awards from spacewerx.us

If the program list is empty, run the import from the Admin page.

### Programs and Missions

Programs are raw procurement data. When you find one worth pursuing, **Create Mission** to turn it into a trackable Mission with stage, next step, and timeline. The mission stays linked to the program, so you can always jump back to the source notice or award.

---

## Service Lane (Definition)

A **Service Lane** is a category of service interest that Space ABM offers. It answers: *"What kind of service is this account or lead interested in?"*

**Sources of lane assignment:**
1. **Lead Request (explicit)** — When someone submits the "Request a Reservation" widget, they select a service (e.g. Launch, Refuel, Disposal). That `service_needed` value *is* the lane.
2. **Page-view inference (event rules)** — When we observe page views (e.g. via PostHog), we apply **event rules** to map URL paths to lanes. Example: `/services/relocation` → Orbit Transfer, `/news/deorbit-as-a-service` → Disposal.

**Current lanes** (aligned with the widget "Service Needed" list):
- Launch
- Last-Mile Insertion (Post-Launch)
- Orbit Transfer (On-Orbit)
- Refuel
- Docking
- Upgrade
- Disposal
- Other (fallback for content that doesn't match a specific service)

**Where lanes appear:**
- `DailyAccountIntent.top_lane` — primary lane for that account (highest 7d activity)
- `DailyAccountIntent.lane_scores_7d_json`, `lane_scores_30d_json` — score breakdown by lane
- `LeadRequest.service_needed` — explicit lane from the widget
- **Service Lanes dashboard** — accounts grouped by lane, with hot/surging counts

---

## Canonical Domain Normalization (Account Key)

**Account Key** = normalized domain (lowercase, strip protocol/path, strip `www.`).

Rules:
- Source preference: (1) domain from `organization_website`, (2) fallback: email domain from `work_email`
- Personal email domains (gmail.com, yahoo.com, outlook.com, hotmail.com, etc.) **must not** be used to group to an account
- If domain is personal → `account_key = null` (we still store the Lead Request, but do not create a Prospect Company)

Shared helper: `utils/domain.js`
- `normalizeDomainFromUrl(url)`
- `normalizeDomainFromEmail(email)` — returns `null` for personal domains
- `resolveAccountKey(payload)` — prefers org website, then work email (null if personal)

Examples:
- `https://www.AcmeSpace.com/path` → `acmespace.com`
- `name@gmail.com` → `null`

---

## Data Model (People + ABM)

### 1) Prospect Companies (ABM Accounts)
A **Prospect Company** represents an organization we are selling to.

Key properties:
- `domain` (unique): primary identifier for the account
- `name`
- `stage` (ex: `new`, `engaged`, `opportunity`, `customer`)
- `intent_score` (integer): rollup score (0–100 in Phase 2)
- `intent_last_at`: last time we updated intent

**Phase 2 additions:**
- `intent_stage`: `Cold` | `Warm` | `Hot` (from decayed scoring)
- `surge_level`: `Normal` | `Surging` | `Exploding`
- `top_lane`: primary service lane (e.g. `Launch`, `Refuel`, `Disposal`)
- `last_seen_at`, `score_updated_at`
- `score_7d_raw`, `score_30d_raw` (debug)
- `salesforce_account_id`, `salesforce_account_url`, `salesforce_owner_id` (future sync)

---

### 2) Contacts (People at Prospect Companies)
A **Contact** represents an identified person associated with a Prospect Company (usually from a lead form submission).

Key properties:
- `prospect_company_id`
- `email` (stored per company)
- `status` (ex: `new`, `engaged`, `meeting_set`, `qualified`)
- `last_seen_at`
- `title` (in v1 we map `role` from the payload into `title` if `title` is missing)

**Phase 2 additions:**
- `salesforce_lead_id`, `salesforce_contact_id` (future sync)

---

### 3) Lead Requests (Canonical Submission Artifact)
A **Lead Request** is one completed "Request a Reservation" submission.

Key properties: (see original list in prior section)

**Phase 2 additions:**
- `account_key` (nullable): resolved normalized domain for easier joins
- `why_hot_json` (optional): top 3 "why hot" reasons
- `salesforce_lead_id`, `salesforce_task_id` (future sync)

---

### 4) Intent Signals (The "Why It's Hot" Timeline)
An **Intent Signal** represents a time-series entry that increases account intent.

Signals are stored with:
- `prospect_company_id`
- `signal_type` (string)
- `topic` (we use `service_needed` as the topic/service-lane axis)
- `weight` (integer)
- `occurred_at` (timestamp)

---

### 5) Daily Account Intent (Phase 2)
Stores daily rollups for dashboards and account detail timeline.

- `prospect_company_id`, `date`
- `score_config_id`, `raw_score_7d`, `raw_score_prev_7d`, `raw_score_30d`
- `intent_score` (0–100), `intent_stage`, `surge_ratio`, `surge_level`
- `unique_people_7d`, `top_lane`
- `lane_scores_7d_json`, `lane_scores_30d_json`
- `key_events_7d_json`, `top_categories_7d_json`, `top_pages_7d_json`

---

### 6) Account AI Summaries (Phase 2)
Caches the "premium" AI-generated account brief.

- `prospect_company_id`, `cache_date`, `top_lane`
- `intent_score`, `surge_level`
- `prompt_template_id`, `input_json`, `summary_md`, `model`

---

### 7) Contact Identities (Phase 2)
Links contacts to external identifiers for the People dashboard.

- `contact_id`, `identity_type` (`posthog_distinct_id` | `email` | `hashed_email` | `crm_id`)
- `identity_value` (unique per type)

---

### 8) Registry Tables (Phase 2)
Configuration-driven, no hardcoding:

- **abm_event_rules**: map URL patterns → lane/content_type/weight (path_prefix, contains, etc.)
- **abm_score_configs**: versioned scoring models (lambda_decay, normalize_k, stage thresholds, surge thresholds)
- **abm_score_weights**: event weights per config (page_view by content_type, cta_click by cta_id, form events)
- **abm_prompt_templates**: prompt per lane + persona + stage for AI summaries

---

## Ingestion: Request a Reservation → ABM System

### Endpoint
- `POST /api/hooks/lead-requests`

Optional auth: `x-lead-request-secret` header if `LEAD_REQUEST_SECRET` is set.

### Server Processing Steps
When `POST /api/hooks/lead-requests` is called:

1. **Validate required fields** (service_needed, organization_name, work_email, consent_contact)

2. **Resolve account key**
   - Use `resolveAccountKey(payload)` from `utils/domain.js`
   - Personal domains (gmail, yahoo, etc.) → `account_key = null`
   - No Prospect Company is created for personal domains; Lead Request is still stored

3. **Compute Lead Score** (details below)

4. **Upsert Prospect Company** (only when `account_key` is non-null)
   - Find or create by `domain` (= account_key)
   - Stage bump: `new` → `engaged`

5. **Upsert Contact** (when company exists)

6. **Create Lead Request**
   - Store `account_key` for easier joins
   - Full `payload_json`

7. **Create Intent Signals**

8. **Recompute Account Intent Score** (simple 30-day sum; Phase 2 batch job does decayed scoring separately)

---

## Lead Scoring (Exact Logic)

Stored in `lead_requests.lead_score`. (See original weights: Consent, Budget Band, Funding, Urgency, Readiness, Integration, Mission Type, Completeness.)

---

## Phase 2: Decayed Intent Scoring (6sense-lite)

The daily batch job computes a more sophisticated **Account Intent Score** using:

### Exponential Decay
- `decay(age_days) = exp(-λ × age_days)` (default λ = 0.10)
- Contribution per event: `weight × decay(age_days)`

### Windows
- `raw_7d`, `raw_prev_7d`, `raw_30d` (events in 0–7d, 7–14d, 0–30d with decay)
- Lane-level: `lane_scores_7d`, `lane_scores_30d`

### Normalization
- `intent_score = round(100 × (1 - exp(-raw_30d / k)))` (default k = 80)
- Result: 0–100 score

### Stage Thresholds
- Cold: 0..34
- Warm: 35..69
- Hot: 70+

### Surge Classification
- `surge_ratio = (raw_7d + 5) / (raw_prev_7d + 5)`
- Normal: < 1.5
- Surging: 1.5–2.5
- Exploding: > 2.5

### "Why Hot" Reasons
Top 3 from 7d key events, e.g. `["2× Pricing", "1× Security", "1× Form Started"]`

### Event Weights (Registry)
- page_view by content_type: pricing 25, request_reservation 30, integrations 18, security 18, case_study 12, etc.
- cta_click: request_reservation 25, contact_sales 20
- form_started 20, form_submitted 60

---

## PostHog Aggregation + Daily Batch Job

- **No raw PostHog events in MySQL** — we aggregate only.
- **Daily batch at 2am UTC** (BullMQ job)
- Sources: PostHog API (HogQL) when configured, or `intent_signals` as fallback
- For each account: compute scores, write `daily_account_intent`, update `prospect_companies`
- **Manual trigger**: `POST /api/abm/jobs/recompute-intent` (internal auth)
- **Queue/worker**: `abm-intent-recompute`, `abmIntentWorker.js`
- **Schedule**: `npm run schedule:abm` (run once on deploy)

Env: `POSTHOG_HOST`, `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, `REDIS_URL`

---

## Intent Signals (What We Write, and Why)

When a Lead Request is created, we write intent signals (lead_submitted, budget_band, schedule_urgency, readiness_confidence) as described earlier.

---

## Account Intent Score Rollup

**Simple (real-time)**: sum of `IntentSignal.weight` for last 30 days (used on lead ingestion).

**Phase 2 (batch)**: decayed scoring with normalization, stage, surge, stored in `daily_account_intent` and mirrored to `prospect_companies`.

---

## Routing and Workflow

- `routing_status`: `new | routed | contacted | closed_won | closed_lost`
- `routed_to_user_id`, `internal_notes`, `tags_json`, `disposition_reason`

---

## ABM API Routes Implemented

### Public ingestion
- `POST /api/hooks/lead-requests`
- `POST /api/hooks/posthog` (PostHog webhook, optional)

### Internal ABM — Lead Requests
- `GET /api/abm/lead-requests` (list, filter, paginate)
- `GET /api/abm/lead-requests/:id`
- `PATCH /api/abm/lead-requests/:id` (workflow fields)
- `POST /api/abm/lead-requests/:id/convert`
- `GET /api/abm/lead-requests/summary`
- `GET /api/abm/lead-requests/:id/timeline`

### Internal ABM — Phase 2 Dashboards
- `GET /api/abm/accounts` — Hot Accounts (range, stage, lane, surge, search, page, limit)
- `GET /api/abm/accounts/:id` — Account detail (snapshot, timeline, people, AI summary)
- `POST /api/abm/accounts/:id/ai-summary` — Generate or return cached AI summary
- `GET /api/abm/lanes` — Service Lane Intent (hot/surging/exploding counts per lane)
- `GET /api/abm/people` — People Inside Accounts (account_id optional)

### Internal ABM — Programs
- `GET /api/abm/programs` — List programs (range, status, lane, source, relevant, search, sort, page, limit)
- `GET /api/abm/programs/summary` — Summary counts (new, due soon, awarded, open)
- `GET /api/abm/programs/:id` — Program detail
- `PATCH /api/abm/programs/:id` — Update program (triage, priority, notes)
- `POST /api/abm/programs/:id/notes` — Add note
- `GET /api/abm/programs/:id/notes` — List notes
- `POST /api/abm/programs/:id/link-account` — Link to Prospect Company
- `POST /api/abm/programs/:id/link-mission` — Link to Mission
- `POST /api/abm/programs/:id/create-mission` — Create Mission from program

### Internal ABM — Jobs
- `POST /api/abm/jobs/recompute-intent` — Enqueue intent recompute job

### Legacy (still supported)
- `GET /api/abm/companies` — List prospect companies
- `GET /api/abm/companies/:id` — Company detail
- `POST /api/abm/companies/:id/convert`

---

## AI Account Summary

- **Endpoint**: `POST /api/abm/accounts/:id/ai-summary`
- **Caching**: by (account_id, cache_date, top_lane)
- **Regeneration**: when intent_score change ≥ 10, or surge_level changes, or `?force=true`
- **Prompt**: from `abm_prompt_templates` registry (lane + persona + stage precedence)
- **Model**: `AI_MODEL` env (default gpt-4o-mini)

---

## Recommended Tracking Fields (Client)

- `utm.*`, `tracking.session_id`, `tracking.client_id`, `tracking.posthog_distinct_id`

---

## Required Env Vars (Phase 2)

- `POSTHOG_HOST`, `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`
- `REDIS_URL` (BullMQ)
- `OPENAI_API_KEY`, `AI_MODEL` (AI summaries)
- `LEAD_REQUEST_SECRET` (optional)

---

## Glossary

- **Account Key**: normalized domain used to resolve/group accounts (null for personal email domains)
- **Contact**: an identified person at a Prospect Company (usually via email)
- **Content Type**: category of page/event used for scoring (e.g. pricing, security, request_reservation, service_page) — from event rules or inferred
- **Daily Account Intent**: daily snapshot of decayed scores, stage, surge, lanes (Phase 2)
- **Event Rule**: registry config that maps URL patterns + event type → content_type and lane (path_prefix, contains, equals, path_regex)
- **Intent Score**: 0–100 normalized score from decayed event weights (Phase 2) or rolling 30-day sum (legacy)
- **Intent Signal**: time-series event explaining why a company is heating up
- **Mission**: a tracked procurement opportunity—ties an account, lead request(s), contacts, and requirements into one work object with stage, next step, and timeline
- **Program**: a procurement opportunity from SAM.gov, USAspending, or SpaceWERX; classified with service lane and relevance score; can be linked to accounts and missions
- **Intent Stage**: Cold | Warm | Hot (from score thresholds)
- **Lead Request**: one completed reservation/procurement submission (canonical record)
- **Lead Score**: qualification score computed from a submission (per Lead Request)
- **Prompt Template**: registry config for AI summaries — system/user prompt per lane + persona + intent_stage
- **Prospect Company**: ABM account we are selling to (domain-deduped)
- **Recompute Job**: daily batch (BullMQ) that fetches events, applies event rules, computes decayed scores, writes DailyAccountIntent
- **Registry**: configuration tables (event rules, score configs, weights, prompt templates) — no hardcoding
- **Score Config**: versioned scoring model (lambda_decay, normalize_k, stage/surge thresholds) — only one active at a time
- **Service Lane**: category of service interest (Launch, Refuel, Disposal, etc.); from `LeadRequest.service_needed` or inferred from page views via event rules
- **Surge Level**: Normal | Surging | Exploding (from 7d vs prev-7d ratio)
- **Top Lane**: primary service lane with highest 7d activity for an account
