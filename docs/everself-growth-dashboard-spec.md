# Everself Growth Command Center (Demo) — Cursor Spec (JSON → Dashboard)

**Goal:** Add a polished, exec-ready dashboard to **SpaceGTM** that mirrors what Everself needs: **city-level budget allocation**, **paid performance accountability**, and **attribution confidence** — **without building backend pipelines yet**.  
**Approach:** Read from **static JSON** fixtures (or a simple JSON-serving endpoint) and compute a canonical daily rollup view: **`marketing_roi_daily_by_city`**.

---

## 0) Success Criteria (what “done” looks like)

### Must-have outcomes
1. A single dashboard page that answers in <30 seconds:
   - “Where should we allocate budget next week by **city**?”
   - “Which channel/campaign is driving **booked** and **completed consults**?”
   - “Is attribution getting better or worse?” (click ID coverage + lag)
2. Dashboard works with **JSON-only** data sources.
3. All metrics are computed deterministically and reproducibly (no “magic”).
4. UI is fast: initial load < 2s for typical demo datasets (<= 200k rows leads, <= 50k appointments, <= 50k spend rows).

### Nice-to-have outcomes
- Export CSV for City Allocation table.
- Shareable URL state (filters in querystring).
- “Data freshness” + “last loaded” stamps.

---

## 1) Product Scope

### 1.1 In scope
- New section in SpaceGTM, in the ConsumerGTM part: http://localhost:3003/consumer/reports
- Data sources (JSON):
  - `spend_daily.json`
  - `leads.json`
  - `appointments.json`
  - (optional) `creative_assets.json` for a creative grid
- Computation:
  - Daily rollups by **date × city × channel** (optionally campaign/adset)
  - Funnel metrics: lead → booked → completed
  - Lag metrics: lead → booked (days), booked → completed (days)
  - Attribution confidence: click ID coverage (gclid/wbraid/gbraid, fbp/fbc/fbclid)
- UI:
  - Executive KPI tiles
  - City Allocation “trading desk” table
  - Trends & “what changed” diagnostics
  - Attribution Confidence panel
  - Funnel explorer
  - (optional) Creative performance grid

### 1.2 Out of scope (for this demo phase)
- Live ad platform APIs (Google Ads / Meta APIs)
- Offline conversion uploads back to Google/Meta
- True MMM / incrementality tests
- Full identity stitching across devices
- HIPAA/PHI production-grade controls (demo only; no real patient data)

---

## 2) Data Contracts (JSON Fixtures)

### 2.1 Conventions
- All timestamps are ISO-8601 strings in UTC (e.g., `"2026-04-04T18:22:11Z"`)
- `date` fields are ISO date strings (e.g., `"2026-04-04"`)
- `city` is a canonical market name like `"San Francisco"`; do not use abbreviations
- `channel` is `"google"` or `"meta"` (lowercase)
- `campaign_id`/`adset_id` are strings; if unknown, set to `null`
- IDs are strings (UUIDs acceptable)

### 2.2 spend_daily.json
**One row = one day of spend for a city + channel + campaign scope**

```json
[
  {
    "date": "2026-04-01",
    "city": "San Francisco",
    "channel": "google",
    "platform": "google_ads",
    "campaign_id": "g_camp_123",
    "campaign_name": "SF | Weight Loss | Search",
    "adset_id": null,
    "adset_name": null,
    "spend": 1520.34,
    "impressions": 40321,
    "clicks": 913
  }
]
```

**Required:** `date, city, channel, spend`  
**Optional:** `platform, impressions, clicks, campaign_id, campaign_name, adset_id, adset_name`

### 2.3 leads.json
**One row = one lead submission / eligibility completion event**  
(For demo, this can mirror `lead_requests` in space-api, but as JSON.)

```json
[
  {
    "lead_id": "lead_001",
    "created_at": "2026-04-01T19:02:11Z",
    "date": "2026-04-01",
    "city": "San Francisco",
    "channel": "google",
    "campaign_id": "g_camp_123",
    "adset_id": null,
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "SF_Search",
    "utm_content": "ad_variant_02",
    "utm_term": "endoscopic weight loss",
    "landing_path": "/signup/eligibility/sf",
    "gclid": "CjwK...",
    "wbraid": null,
    "gbraid": null,
    "fbclid": null,
    "fbp": null,
    "fbc": null,
    "posthog_distinct_id": "ph_abc123",
    "tracking_session_id": "sess_123",
    "email_hash": "sha256:...",
    "phone_hash": "sha256:..."
  }
]
```

**Required:** `lead_id, created_at, city, channel`  
**Recommended:** `date` (derived if missing), `campaign_id/adset_id` (if known), click IDs, UTMs

> If `date` is missing, derive `date = created_at.slice(0, 10)`.

### 2.4 appointments.json
**One row = one appointment or consult event associated to a lead**

```json
[
  {
    "appointment_id": "appt_001",
    "lead_id": "lead_001",
    "city": "San Francisco",
    "booked_at": "2026-04-03T16:11:00Z",
    "completed_at": "2026-04-10T17:05:00Z",
    "status": "completed",
    "type": "consult"
  }
]
```

**Required:** `appointment_id, lead_id, city, booked_at, status`  
**Optional:** `completed_at, type`

Status enum (demo):
- `booked`
- `completed`
- `canceled`
- `no_show`

### 2.5 creative_assets.json (optional)
**One row = one creative asset identifier (not the binary itself)**

```json
[
  {
    "creative_id": "cr_001",
    "hook_tag": "non_surgical",
    "format": "ugc",
    "headline": "Lose weight without surgery",
    "notes": "Doctor-led, supportive",
    "utm_content": "ad_variant_02"
  }
]
```

---

## 3) Canonical Model: marketing_roi_daily_by_city

### 3.1 Output row shape
**One row = date × city × channel** rollup. This is the dashboard’s backbone.

```ts
type MarketingRoiDailyByCity = {
  date: string;            // YYYY-MM-DD
  city: string;
  channel: "google" | "meta";

  spend: number;           // sum(spend)
  impressions?: number;    // sum
  clicks?: number;         // sum

  leads: number;           // count distinct lead_id
  booked_consults: number; // count distinct appointment_id where status in booked/completed
  completed_consults: number; // count distinct appointment_id where status == completed

  cost_per_lead: number | null;
  cost_per_booked: number | null;
  cost_per_completed: number | null;

  lead_to_book_rate: number | null;    // booked_consults / leads
  book_to_complete_rate: number | null;// completed_consults / booked_consults

  median_days_lead_to_book: number | null;
  p75_days_lead_to_book: number | null;

  attribution: {
    lead_click_id_coverage: number | null; // % of leads with any click id (Google or Meta)
    google_click_id_coverage: number | null; // % leads in google channel with gclid/wbraid/gbraid
    meta_click_id_coverage: number | null;   // % leads in meta channel with fbp/fbc/fbclid
    unattributed_leads: number;              // leads missing UTMs + click IDs
  };
};
```

### 3.2 Join logic
- **Spend rollups**: group `spend_daily` by `date, city, channel`
- **Leads rollups**: group `leads` by `date, city, channel`
- **Appointments rollups**:
  - Determine appointment “booked date” = `booked_at.slice(0,10)`
  - For daily rollups, count bookings by their booked date (not lead date)
  - For “lead→book lag”, link `appointments.lead_id` → `leads.lead_id`

### 3.3 Counting rules
- `leads`: count unique `lead_id` per day/city/channel where `created_at` date matches the day
- `booked_consults`: count unique `appointment_id` where `status in ["booked","completed"]`
- `completed_consults`: count unique `appointment_id` where `status == "completed"` and `completed_at` falls within date (see below)

**Completed consult date rule (choose one and implement consistently):**
- **Rule A (recommended for ops):** attribute completion to `completed_at` date.
- **Rule B (simpler for demo):** attribute completion to `booked_at` date if completed_at missing.

For this spec, implement **Rule A** and fall back to booked date only if `completed_at` is null.

### 3.4 Lag metrics
Compute for appointments where both timestamps exist:
- `days_lead_to_book = daysBetween(leads.created_at, appointments.booked_at)`
- `days_book_to_complete = daysBetween(appointments.booked_at, appointments.completed_at)`

Compute percentiles per **date/city/channel** for lead→book where:
- A) use the booked date as the grouping date
- B) join to lead’s channel/city from the lead record

> Important: Appointments must inherit `channel` and `campaign_id` from the lead record when available, because the appointment itself may not carry marketing fields.

---

## 4) Dashboard UX Spec (what to build)

### 4.1 Navigation
- Add left nav item under ConsumerGTM: 
  - http://localhost:3003/consumer/reports

### 4.2 Page Layout (high level) - use existing page layouts used on other dashboard pages!!
1. **Header Row**
   - Title: “Everself Growth Command Center”
   - Subtext: “Demo dataset · JSON-backed”
   - Right: Data freshness badge (“Loaded at 10:32am”)

2. **Global Filter Bar**
   - Date range picker (default: last 30 days)
   - City multi-select (default: All)
   - Channel multi-select (default: All)
   - Campaign search (optional; if campaign present)
   - Toggle: “Booked date vs Lead date” attribution (default booked date)

3. **Executive KPI Tiles** (8 tiles)
4. **City Allocation Table**
5. **Trend Charts + Diagnostics**
6. **Attribution Confidence Panel**
7. **Funnel Explorer**
8. **Creative Performance Grid** (optional)

### 4.3 Executive KPI Tiles (exact tiles)
Tiles should show:
- Primary value
- % change vs previous period (same length)
- Tooltip with definition

Tiles:
1) Spend  
2) Leads  
3) Booked consults  
4) Completed consults  
5) Cost per lead  
6) Cost per booked consult  
7) Cost per completed consult  
8) Median days lead→book

### 4.4 City Allocation Table (“Trading Desk”)
**Default sort:** cost_per_booked ascending (best first) with spend > 0 filter.

Columns:
- City
- Spend (period)
- Leads
- Booked consults
- Completed consults
- CPL
- CP Booked
- CP Completed
- Lead→Book rate
- Book→Complete rate
- Median lag (lead→book)

Row “Scale Signal” badge (green/yellow/red) based on thresholds:
- Green if:
  - booked_consults >= 10 (in period) AND cost_per_booked <= target
- Yellow if:
  - booked_consults < 10 OR cost_per_booked within +20% of target
- Red if:
  - cost_per_booked > +20% target OR lead→book rate < min threshold

Targets should be configurable in a small JSON config:
```json
{
  "targets": {
    "cost_per_booked": 250,
    "lead_to_book_rate_min": 0.15,
    "min_booked_consults_for_confidence": 10
  }
}
```

Table interactions:
- Click city row → side panel detail:
  - time series for that city
  - channel split
  - top campaigns
  - lag distribution

Buttons:
- Export CSV

### 4.5 Trend Charts + Diagnostics
Charts:
1) Line: **Cost per booked consult** over time (daily)  
   - series: google vs meta (toggle)
2) Line: **Booked consult volume** over time (daily)  
   - series: total and/or by channel

Diagnostics strip (small cards):
- CPC = spend / clicks (if clicks present)
- CTR = clicks / impressions
- Lead rate = leads / clicks
- Book rate = booked / leads

If impressions/clicks missing, hide CPC/CTR cards gracefully.

### 4.6 Attribution Confidence Panel
Purpose: show why spend→outcome confidence is improving.

Widgets:
- % Leads with any click ID
- % Google leads with gclid/wbraid/gbraid
- % Meta leads with fbp/fbc/fbclid
- Unattributed leads count + trend

Definitions:
- A lead is “attributed” if any of:
  - any click ID present OR
  - utm_source + utm_campaign present

Also show “Top missing fields”:
- % leads missing `city`
- % missing `channel`
- % missing `campaign_id`

### 4.7 Funnel Explorer
A vertical funnel with counts and conversion rates:
- Leads
- Booked consults
- Completed consults

Allow breakdown toggle:
- by channel
- by city

Implementation note: this is a computed view from the rollups, not a live PostHog funnel.

### 4.8 Creative Performance Grid (optional, but makes it “look great”)
A table/grid keyed by `utm_content` (or `creative_id`):
- Hook tag
- Format
- Spend (if spend has campaign/adset mapping; otherwise hide)
- Leads
- Booked consults
- CPL / CP booked
- CTR (if available)

If spend cannot be tied to creative, still show:
- leads/booked by utm_content, plus hook tags from creative_assets.json

---

## 5) Computation Details (functions & edge cases)

### 5.1 Safe division helper
- Return `null` if denominator is 0
- Round to 2 decimals for currency, 4 decimals for rates

### 5.2 Date handling
- Use UTC for all transforms
- Derive:
  - lead_date from `created_at`
  - booked_date from `booked_at`
  - completed_date from `completed_at` (fallback booked_date)

### 5.3 De-duplication
- Leads: unique by `lead_id`
- Appointments: unique by `appointment_id`
- Spend: unique by composite key `date+city+channel+campaign_id+adset_id` (if duplicates exist, sum)

### 5.4 Percentiles
Implement median + p75 with a simple sorted array per bucket.  
For performance, compute percentiles only on filtered dataset (post-filters).

---

## 6) Implementation Plan (SpaceGTM)

### 6.1 Assumptions about stack
- SpaceGTM is a Next.js app (App Router acceptable) with existing auth/layout.
- We will add a new page route and internal data loading utilities.

### 6.2 File/Folder layout (recommended)
```
/app/everself/growth/page.tsx
/components/everself/filters-bar.tsx
/components/everself/kpi-tiles.tsx
/components/everself/city-allocation-table.tsx
/components/everself/trends-panel.tsx
/components/everself/attribution-confidence.tsx
/components/everself/funnel-explorer.tsx
/components/everself/creative-grid.tsx (optional)

/lib/everself/load-json.ts
/lib/everself/compute-rollups.ts
/lib/everself/metrics.ts
/lib/everself/types.ts

/public/demo/everself/spend_daily.json
/public/demo/everself/leads.json
/public/demo/everself/appointments.json
/public/demo/everself/creative_assets.json (optional)
/public/demo/everself/config.json
```

### 6.3 Data loading
Two acceptable approaches (pick one):

**Approach A (simplest):** fetch from `/public/demo/...` via `fetch()` on the client and compute in browser.  
Pros: zero server work. Cons: heavy compute if huge.

**Approach B (recommended):** Next.js route handler computes rollups server-side and returns ready-to-render JSON.
- `/api/demo/everself/marketing-roi?start=...&end=...&city=...&channel=...`
Pros: fast UI, scalable. Cons: small server work.

For Cursor: implement **Approach B**.

### 6.4 API contract (server computed)
`GET /api/demo/everself/marketing-roi`
Query params:
- `start` (YYYY-MM-DD)
- `end` (YYYY-MM-DD)
- `cities` (comma-separated)
- `channels` (comma-separated)

Response:
```json
{
  "meta": { "generated_at": "2026-04-04T18:22:11Z", "source": "json-demo" },
  "kpis": { ... },
  "daily": [ ...MarketingRoiDailyByCity ],
  "by_city": [ ...aggregated ],
  "by_channel": [ ...aggregated ],
  "creative": [ ...optional ],
  "diagnostics": { ... }
}
```

### 6.5 Aggregations returned
- `daily`: date×city×channel rows
- `by_city`: period aggregate per city (for City Allocation table)
- `by_channel`: period aggregate per channel
- `kpis`: period headline metrics (for tiles)
- `diagnostics`: CPC/CTR/lead rates + missing field rates
- `creative`: optional

### 6.6 Caching
- Cache JSON loads in memory on server for 60 seconds.
- Memoize computed results per unique querystring for 30 seconds.

---

## 7) Definitions & Formulas

### 7.1 Core formulas
- `CPL = spend / leads`
- `CP Booked = spend / booked_consults`
- `CP Completed = spend / completed_consults`
- `Lead→Book rate = booked_consults / leads`
- `Book→Complete rate = completed_consults / booked_consults`
- `CPC = spend / clicks` (if clicks present)
- `CTR = clicks / impressions` (if impressions present)
- `Lead rate = leads / clicks` (if clicks present)

### 7.2 Attribution coverage
- `lead_click_id_coverage = leads_with_any_click_id / total_leads`
- Google click id present if any of: `gclid || wbraid || gbraid`
- Meta click id present if any of: `fbclid || fbp || fbc`
- “Unattributed lead” if missing both:
  - (any click id) AND
  - (`utm_source` and `utm_campaign`)

---

## 8) Demo Dataset Generation (optional helper)
If you want to generate plausible demo data quickly:
- leads: 50–500/day across 5–20 cities
- booked consult rate: 10–25% of leads (with 1–14 day lag)
- completion rate: 60–85% of booked (with 3–21 day lag)
- spend: correlated with leads, with CPC variability by channel/city

Not required for Cursor unless you want a script later.

---

## 9) Acceptance Tests (QA checklist)

### Functional
- Changing date range updates all panels consistently.
- City filter restricts KPI tiles, table, and charts.
- If clicks/impressions missing, CPC/CTR cards disappear without errors.
- Export CSV downloads correct city aggregates.
- Percent change calculations match “previous period” logic.

### Metric correctness
- For a known tiny dataset, calculations match hand math.
- Lag medians are correct for joined lead→book pairs.
- Attribution coverage reflects click ID presence exactly.

### UX polish
- Table sorts instantly; sticky header.
- KPIs show deltas + tooltips.
- Empty states look deliberate (“No data for selection”).

---

## 10) Deliverable Summary (what Cursor must ship)
1. New page: `http://localhost:3003/consumer/reports` with the full layout and components.
2. New API route: `/api/demo/everself/marketing-roi` that loads JSON, computes rollups, returns aggregates.
3. JSON fixture folder under `/public/demo/everself/` with sample data + config.
4. Clean TypeScript types + pure compute functions in `/lib/everself/`.
5. Polished UI matching SpaceGTM aesthetic (dark, clean, exec-ready).

---

## Appendix A — Minimal Example: marketing_roi_daily_by_city row
```json
{
  "date": "2026-04-01",
  "city": "San Francisco",
  "channel": "google",
  "spend": 1520.34,
  "impressions": 40321,
  "clicks": 913,
  "leads": 78,
  "booked_consults": 14,
  "completed_consults": 10,
  "cost_per_lead": 19.49,
  "cost_per_booked": 108.6,
  "cost_per_completed": 152.03,
  "lead_to_book_rate": 0.1795,
  "book_to_complete_rate": 0.7143,
  "median_days_lead_to_book": 3,
  "p75_days_lead_to_book": 6,
  "attribution": {
    "lead_click_id_coverage": 0.82,
    "google_click_id_coverage": 0.88,
    "meta_click_id_coverage": null,
    "unattributed_leads": 14
  }
}
```
