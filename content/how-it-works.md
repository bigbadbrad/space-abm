# How It Works

This guide explains Space ABM in the order you’ll use it: from your daily view, to drilling into accounts and people, to working leads and missions. Reference sections at the end cover how data gets in, scoring, and the data model.

---

## Table of contents

1. [Start here: The big picture](#1-start-here-the-big-picture)
2. [Your daily view: Command Center](#2-your-daily-view-command-center)
3. [Digging into an account](#3-digging-into-an-account)
4. [People and activity (anonymous → known)](#4-people-and-activity-anonymous--known)
5. [Service lanes](#5-service-lanes)
6. [Lead requests and routing](#6-lead-requests-and-routing)
7. [Missions: Tracking opportunities](#7-missions-tracking-opportunities)
8. [Programs: Federal procurement](#8-programs-federal-procurement)
9. [Reference: How the data gets in](#9-reference-how-the-data-gets-in)
10. [Reference: Data model and API](#10-reference-data-model-and-api)
11. [Glossary](#11-glossary)

---

## 1. Start here: The big picture

Space ABM is built around a simple flow:

1. **Prospects generate intent** by visiting your site and, most importantly, by submitting the **Request a Reservation** lead form.
2. Each submission becomes a **Lead Request** (the canonical “sales artifact”) and we create or update the **Prospect Company** (account) and **Contact** (person).
3. We record **intent signals** and compute a **Lead Score** (per submission) and an **Intent Score** (rolling account score, with decay and normalization).
4. When we have PostHog enabled, we **stitch** anonymous site visits to the contact once they submit the form—so you see one timeline from “anonymous visitor” to “known contact.”

As a dashboard user, you start at **Command Center** to see what’s hot, then open **Accounts** and **People** to see who’s doing what and why. **Lead Requests** and **Missions** are where you manage and advance opportunities.

---

## 2. Your daily view: Command Center

**Where:** **Dashboard** (Overview) — first item in the left nav.

Command Center is your home base. It shows:

- **Hot Accounts** — Highest intent in the selected range; click through to account detail.
- **Surging** / **Top lane** — Accounts heating up or leading in a service lane.
- **Today’s Priorities** — Mission due soon, mission stale, new mission, recent lead requests. Use the **Missions** tab to focus on mission-related items.
- **Recent Lead Requests** — Latest submissions; click to open the lead request or the account.

From here you typically go to **Accounts** (to dig into a company), **People** (to see contacts and their activity), or **Lead Requests** / **Missions** (to work opportunities).

---

## 3. Digging into an account

**Where:** **Accounts** in the left nav → click an account (or open it from Command Center).

Account detail gives you the full picture for one prospect company:

- **Header** — Name, domain, **Intent Score**, stage (Cold / Warm / Hot), **Surge level**, **Top lane**, last seen. Use **View Lead Requests** and **View scoring details** for more.
- **Overview tab** — Snapshot and “Why this score (7d)” — evidence strings from recent activity (e.g. pricing views, widget steps, lead submit).
- **Lane Breakdown** — Score by service lane (Launch, Refuel, etc.).
- **People tab** — Contacts we know at this account. Each row has **View Activity**: click it to see that person’s **event timeline** (anonymous and known in one list). See [People and activity](#4-people-and-activity-anonymous--known) below.
- **Lead Requests tab** — All submissions tied to this account.
- **AI Account Summary** — Generate or open the cached AI brief for this account (what we know, what’s missing, next steps). Caching is by account, date, and top lane; we regenerate when score or surge changes enough.

Intent score, stage, and surge come from our **decayed intent scoring** (PostHog or intent_signals → daily batch job → `daily_account_intent` and `prospect_companies`). Evidence comes from the same pipeline.

---

## 4. People and activity (anonymous → known)

**Where:**  
- **Account detail → People tab** → **View Activity** on a contact row (expands the timeline).  
- **People** in the left nav → **View Activity** on a row (opens a drawer with the same timeline).

We use PostHog to **stitch** anonymous site behavior to identified contacts. When someone browses your site (anonymous) and later submits the lead form, we merge that history into one person so you see a **single activity timeline**.

### How stitching works

1. **Anonymous visit** — The site sends events to PostHog with a browser-generated anonymous id. No contact yet.
2. **Lead submit** — The user submits Request a Reservation with a work email. We create the Contact and a **ContactIdentity** linking that PostHog id to the contact.
3. **Identify** — The front end calls PostHog `identify(contact_id)` (and `group('company', account_key)` for work domains). PostHog merges the anonymous id and the contact id into one **person**. All events—before and after identify—are now attributed to that person.

So one person in PostHog = one contact in Space ABM, with both pre- and post-identify events.

### What the activity list shows

- **Event** — Human-readable labels when we have them (e.g. “typed something into input”, “clicked button with text …”, “content_viewed (/pricing)”). We use PostHog’s event type and element props so you don’t just see raw `$autocapture`.
- **When** — Timestamp.
- **Path** — Page or screen (from URL/path).
- **Identity** — Each event is labeled **anonymous** (before identify) or **known** (at or after the identify/lead submit). That’s how you see the transition from anonymous browsing to identified contact in one timeline.

We derive anonymous vs known by finding the first identify-type event (`$identify`, `identify`, or `lead_request_submitted`) in time order; everything before that is anonymous, that event and after is known. Events are shown **newest first**.

---

## 5. Service lanes

**Where:** **Service Lanes** in the left nav.

A **Service Lane** is a category of service interest: *“What kind of service is this account or lead interested in?”*

**Where lanes come from:**

1. **Lead Request** — When someone submits the widget, they choose a service (e.g. Launch, Refuel, Disposal). That value *is* the lane.
2. **Page-view inference** — We use **event rules** to map URL paths to lanes (e.g. `/services/relocation` → Orbit Transfer).

**Current lanes:** Launch, Last-Mile Insertion (Post-Launch), Orbit Transfer (On-Orbit), Refuel, Docking, Upgrade, Disposal, Other.

**On the Lanes dashboard:** Accounts grouped by lane, with hot/surging counts. Account detail shows **Top lane** and lane-level scores.

---

## 6. Lead requests and routing

**Where:** **Lead Requests** in the left nav.

Each **Lead Request** is one completed “Request a Reservation” submission. The list is filterable and sortable; click a row to see the full brief (service needed, organization, contact, budget, schedule, etc.).

**Routing status:** Each lead request has a **routing status**: **`new`** | **`promoted`** | **`closed`**. There is no separate "routed" or "contacted"; once you promote a lead to a Mission, its status becomes **promoted** and all deal progression lives on the Mission. If you close the lead without promoting (e.g. not a fit), set status to **closed**.

**Promote to Mission:** When a lead request is a real opportunity, use **Promote to Mission** in the detail panel. A new Mission is created with the lead request linked; key fields (lane, orbit, schedule, budget) are copied from the brief. The lead's status becomes **promoted** and the Mission shows a **Source: Lead Request from [org], [date]** link. The mission appears in **Missions** and in Today's Priorities. If the lead is already promoted, the detail panel shows **Mission: Open Mission** and the Promote button is hidden.

---

## 7. Missions: Tracking opportunities

**Where:** **Missions** in the left nav (between Accounts and **Work Queue**).

**Missions** turn ABM signals and lead requests into trackable procurement opportunities. Accounts answer *who* is hot and *why*; Missions answer *what* you’re working on—a specific deal or program. Missions are the operational center for capture: they have **Tasks**, a **Timeline**, a **Mission Brief**, and optional **Salesforce** sync.

### What is a Mission?

A Mission is a **specific procurement effort** you’re tracking. It may have started from a Lead Request, from account activity, or created manually. It has:

- **Title** and **service lane**
- **Stage**: new → qualified → solutioning → proposal → negotiation → won / lost / on_hold
- **Priority** (low / medium / high)
- **Requirements** (orbit, schedule, budget, readiness)
- **People** (primary contact and team)
- **Next step** and due date
- **Tasks** — Action items with type (e.g. qualify, research_account, outreach, proposal), due date, and owner; ordered overdue first, then due soon, then no date.
- **Timeline** — Audit trail of events (promoted from lead, task created/completed, note added, brief generated, Salesforce push).
- **Mission Brief** — AI-generated one-pager (cached; regenerates when stage, linked data, or tasks change, or after 7 days).
- **Salesforce** — Optional one-way sync: push Mission → Opportunity when ready (manual button; no auto-create).

### Using the Missions page

- **Summary cards** — Active, Due Soon, Stale, Hot. Click to filter the list.
- **Filter bar** — Search (title or account), Stage, Lane, Owner, Due Soon / Stale chips, Sort. Click **Apply** to refresh.
- **List columns** — Stage, Priority, Title, Account, Lane, **Next Task Due** (or “Overdue”), **Open Tasks** count, **Source** (Lead / Manual), **Salesforce** status (Not synced / Queued / Synced / Error).
- **Quick actions per row** — **Open** (detail), **Push SF** (queue a Salesforce push; disabled or errors if the mission doesn’t meet eligibility).
- **Two panes** — List on the left; click a row to open the detail inspector on the right.

### In the detail inspector

**Header** — Title, stage, priority, confidence, account, owner. Buttons: **Add Task**, **Generate Brief**, **Push to Salesforce**. **Open Account** goes to full account view.

**Tabs:**

1. **Overview** — Requirements (lane, type, orbit, schedule, budget), Source (Lead Request link when applicable), Related Programs, People, Next step (edit + Save), Add note, Artifacts, Activity preview, and **Won** / **Lost** / **On Hold** (or Reopen).
2. **Procurement Brief** — Source line when from a lead; **Generate Mission Brief** button; cached brief content (or open the drawer from Overview).
3. **Tasks** — List of tasks (checkbox to complete), **Add Task** (title, optional due date). Tasks are ordered: overdue first, then due soon, then no date.
4. **Timeline** — Full activity stream (event type, who, when, body). **Add note** to log a timeline entry.
5. **Salesforce** — Sync status (Not synced / Queued / Synced / Error), last synced time, last error (if any), and **Push to Salesforce now**. Push is only allowed when the mission is eligible (stage qualified/solutioning/proposal/negotiation, linked account, and at least one contact or lead-request work email).

### Work Queue (daily driver)

**Where:** **Work Queue** in the left nav (between Missions and Programs).

The **Work Queue** page is your daily view for what needs attention:

- **Overdue Tasks** — All missions: open tasks whose due date is in the past. Click **Open Mission** to go to the mission.
- **Due Soon** — Open tasks due in the next 7 days.
- **Missions needing qualification** — Missions in stage **new** that have a linked lead request or account (good candidates to move to qualified and add tasks).

Use Work Queue to triage tasks and decide which missions to qualify or push to Salesforce.

### Today’s Priorities

On **Command Center**, the **Missions** tab in Today’s Priorities shows Mission Due, Mission Stale, and New Mission items. Click a row to open that mission.

---

## 8. Programs: Federal procurement

**Where:** **Programs** in the left nav (between Missions and Lead Requests).

**Programs** are procurement opportunities from federal sources:

- **SAM.gov** — Solicitations, pre-solicitations, sources sought
- **USAspending** — Contract awards (last 30 days)
- **SpaceWERX** — STRATFI/TACFI awards and company selections

Each program has title, agency, status, posted date, and links to the source. We **classify** programs with a **service lane** and **relevance score** so you can focus on space-related opportunities.

### Using the Programs page

- **Summary cards** — NEW (30D), DUE SOON, AWARDED, OPEN.
- **Filter bar** — Search, Range, Status, View (Relevant / All / Suppressed), Source, Lane, Sort. Click **Apply**.
- **Two panes** — List on the left; detail inspector on the right.

### In the detail inspector

- **Header** — Title, source, status, lane, relevance. **Open** (e.g. Open SAM.gov) goes to the source.
- **Key facts** — Agency, notice type, dates, set-aside, NAICS/PSC.
- **Create Mission** — Turn the program into a Mission you can track.
- **Link Account** / **Link Mission** — Associate the program with a prospect company or existing mission.
- **Add notes** — Log internal notes.

**Importing:** Programs are fetched by scheduled or manual jobs from Admin (SAM, USAspending, SpaceWERX). If the list is empty, run the import from Admin.

---

## 9. Reference: How the data gets in

### Request a Reservation → backend

- **Endpoint:** `POST /api/hooks/lead-requests` (optional auth: `x-lead-request-secret`).

When a lead form is submitted:

1. **Validate** required fields (service_needed, organization_name, work_email, consent_contact).
2. **Resolve account key** — Normalized domain from org website or work email. Personal domains (gmail, yahoo, etc.) → `account_key = null`; we still store the Lead Request but don’t create a Prospect Company.
3. **Compute Lead Score** (consent, budget, funding, urgency, readiness, etc.).
4. **Upsert Prospect Company** (when account_key is non-null).
5. **Upsert Contact** (when company exists).
6. **Create Lead Request** (with account_key, full payload).
7. **Create Intent Signals** (lead_submitted, budget_band, schedule_urgency, readiness_confidence, etc.).
8. **Recompute account intent** (real-time 30-day sum on ingest; full decayed scoring is done by the daily batch job).

### Account key (domain normalization)

**Account key** = normalized domain (lowercase, no protocol/path, no www). Source: (1) domain from organization_website, (2) fallback email domain from work_email. Personal domains → `account_key = null`. Helper: `utils/domain.js` (`resolveAccountKey`, `normalizeDomainFromEmail`, etc.).

### PostHog and the daily batch job

- We **don’t** store raw PostHog events in MySQL; we aggregate only.
- **Daily batch** (e.g. 2am UTC, BullMQ): when PostHog is configured, we query PostHog (HogQL) for events by company group; otherwise we use `intent_signals` as fallback. For each account we compute decayed scores, write `daily_account_intent`, and update `prospect_companies`.
- **Manual trigger:** `POST /api/abm/jobs/recompute-intent` (internal auth).
- Env: `POSTHOG_HOST`, `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, `REDIS_URL`.

### Intent signals

When a Lead Request is created we write intent signals (e.g. lead_submitted, budget_band, schedule_urgency, readiness_confidence) with prospect_company_id, signal_type, topic (service lane), weight, occurred_at. They feed the real-time rollup and (when PostHog is off) the batch job.

### Stitching (technical)

ContactIdentity links `contact_id` to `identity_type = 'posthog_distinct_id'` and `identity_value = <anonymous distinct_id>`. The front end calls PostHog `identify(contact_id)` and `group('company', account_key)` (for work domains) so PostHog merges the anonymous id and contact id into one person. **GET /api/abm/accounts/:id/people-activity** returns per-contact events with `event`, `event_display`, `timestamp`, `path`, and `identity` (anonymous | known); we derive identity from the first identify-type event in time order.

---

## 10. Reference: Data model and API

### Core entities

- **Prospect Company** — Account we sell to. domain, name, stage, intent_score, intent_stage (Cold/Warm/Hot), surge_level, top_lane, last_seen_at, score_updated_at.
- **Contact** — Person at a prospect company (usually from lead form). prospect_company_id, email, status, title, last_seen_at.
- **Lead Request** — One “Request a Reservation” submission. account_key, lead_score, routing_status, payload, etc.
- **Intent Signal** — Time-series “why it’s hot” entry. prospect_company_id, signal_type, topic, weight, occurred_at.
- **Daily Account Intent** — Daily rollup per account. date, intent_score, intent_stage, surge_ratio, surge_level, unique_people_7d, top_lane, lane_scores_*_json, key_events_7d_json, etc.
- **Contact Identity** — Links contact to posthog_distinct_id (or email, crm_id, etc.) for People and activity.
- **Mission** — Tracked procurement opportunity. stage, priority, next_step, next_step_due_at, salesforce_opportunity_id, salesforce_sync_status, salesforce_last_synced_at, salesforce_last_error; links to prospect_company, lead_request, contacts.
- **Mission Task** — mission_id, title, task_type, status (open/done/canceled), priority, owner_user_id, due_at, source_type/source_id.
- **Mission Activity** — mission_id, type (e.g. lead_request_promoted, task_created, note_added, brief_generated, salesforce_push_succeeded), body, meta_json, created_by_user_id.
- **Mission Artifact** — mission_id, type (e.g. mission_brief), content_md, input_hash, model_name; used to cache generated briefs.
- **Registry tables** — abm_event_rules (URL → lane/content_type/weight), abm_score_configs, abm_score_weights, abm_prompt_templates.

### Lead scoring

Stored in `lead_requests.lead_score`. Weights for consent, budget band, funding, urgency, readiness, integration, mission type, completeness (see implementation).

### Decayed intent scoring (Phase 2)

- **Decay:** `exp(-λ × age_days)` (default λ = 0.10). Contribution per event: weight × decay(age_days).
- **Windows:** raw_7d, raw_prev_7d, raw_30d; lane-level lane_scores_7d, lane_scores_30d.
- **Normalization:** intent_score = round(100 × (1 - exp(-raw_30d / k))), default k = 80 → 0–100.
- **Stage:** Cold 0–34, Warm 35–69, Hot 70+.
- **Surge:** surge_ratio = (raw_7d + 5) / (raw_prev_7d + 5). Normal &lt; 1.5, Surging 1.5–2.5, Exploding &gt; 2.5.
- **Event weights** from registry (page_view by content_type, cta_click, form_started, form_submitted, etc.).

### Account intent rollup

- **Real-time (on ingest):** Sum of IntentSignal.weight for last 30 days.
- **Batch (Phase 2):** Decayed scoring above, stored in daily_account_intent and mirrored to prospect_companies.

### AI Account Summary

- **Endpoint:** `POST /api/abm/accounts/:id/ai-summary`. Caching by (account_id, cache_date, top_lane). Regeneration when intent_score change ≥ 10 or surge_level changes, or `?force=true`. Prompt from abm_prompt_templates (lane + persona + stage). Model: `AI_MODEL` env (default gpt-4o-mini).

### ABM API routes (summary)

**Public:** `POST /api/hooks/lead-requests`, `POST /api/hooks/posthog` (optional).

**Internal — Lead Requests:** GET list/detail, PATCH, POST convert, GET summary/timeline.

**Internal — Dashboards:** GET accounts, GET accounts/:id, GET accounts/:id/people, GET accounts/:id/people-activity, POST accounts/:id/ai-summary, GET lanes, GET people.

**Internal — Missions:** GET list/summary/detail, PATCH, close, contacts, artifacts, activities; GET work-queue (overdue/due-soon tasks, missions needing qualification); GET/POST/PATCH tasks, GET activity, GET artifacts, POST generate-brief, POST push-to-salesforce.

**Internal — Programs:** GET list/summary/detail, PATCH, notes, link-account, link-mission, create-mission.

**Internal — Jobs:** POST jobs/recompute-intent.

**Legacy:** GET/POST companies.

### Tracking and env

**Client tracking fields:** utm.*, tracking.session_id, tracking.client_id, tracking.posthog_distinct_id.

**Env:** POSTHOG_*, REDIS_URL, OPENAI_API_KEY, AI_MODEL, LEAD_REQUEST_SECRET (optional).

---

## 11. Glossary

- **Account Key** — Normalized domain for resolving/grouping accounts (null for personal email domains).
- **Contact** — Identified person at a Prospect Company (usually via email).
- **Content Type** — Category of page/event for scoring (pricing, security, request_reservation, etc.); from event rules or inferred.
- **Daily Account Intent** — Daily snapshot of decayed scores, stage, surge, lanes (Phase 2).
- **Event Rule** — Registry config mapping URL patterns + event type → content_type and lane.
- **Intent Score** — 0–100 normalized score from decayed event weights (Phase 2) or rolling 30-day sum (legacy).
- **Intent Signal** — Time-series event explaining why a company is heating up.
- **Intent Stage** — Cold | Warm | Hot (from score thresholds).
- **Lead Request** — One completed reservation/procurement submission (canonical record).
- **Lead Score** — Qualification score per Lead Request (from submission fields).
- **Mission** — Tracked procurement opportunity; ties account, lead request(s), contacts, requirements; has stage, priority, next step, timeline, **tasks**, and optional **Salesforce** sync (one-way push to Opportunity).
- **Mission Task** — Action item on a mission (title, type, status, priority, due date, owner); types include qualify, research_account, outreach, proposal, etc.
- **Mission Activity** — Timeline/audit event on a mission (e.g. lead_request_promoted, task_created, task_completed, note_added, brief_generated, salesforce_push_succeeded).
- **Mission Artifact** — Stored output (e.g. **mission_brief**): cached AI brief with content_md and input_hash; reused when inputs unchanged within 7 days.
- **Program** — Procurement opportunity from SAM.gov, USAspending, or SpaceWERX; classified by lane and relevance; linkable to accounts and missions.
- **Prospect Company** — ABM account we sell to (domain-deduped).
- **Recompute Job** — Daily batch that fetches events (PostHog or intent_signals), applies event rules, computes decayed scores, writes DailyAccountIntent.
- **Registry** — Configuration tables (event rules, score configs, weights, prompt templates); no hardcoding.
- **Score Config** — Versioned scoring model (lambda_decay, normalize_k, stage/surge thresholds).
- **Service Lane** — Category of service interest (Launch, Refuel, Disposal, etc.); from LeadRequest.service_needed or from page views via event rules.
- **Surge Level** — Normal | Surging | Exploding (from 7d vs prev-7d ratio).
- **Top Lane** — Primary service lane with highest 7d activity for an account.
