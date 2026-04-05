# SpaceGTM (Everself Property) — **Control** Tab Spec (Demo)  
_(Pacing + Campaign Control + “Pulse” Change Timeline + Guardrails)_

**Purpose:** Add an agency-style **control layer** for the Everself demo: **planning/pacing**, **campaign control**, and **automation/alerts**—plus **Pulse-style change detection** so you can answer “what changed?” instantly and avoid CAC cratering.  
**Constraint:** This tab and its UI/actions apply **only when `property=Everself`**.  
**Demo Mode:** **No live API writes** to Google/Meta. All “controls” are simulated against JSON-backed data with a transparent **Demo** label, persistent state, and an audit log.

> This spec incorporates the key behaviors described by **Vendo Pulse**: automatic detection of budget/bid/creative/structure changes, a unified timeline, annotations, “who changed what,” and alerts, with change data queryable in BigQuery (`change_history`). citeturn0view0

---

## 1) Tab Naming
Rename the prior “Pacing & Control” tab to: **Control**  
- Short, crisp, and matches the cockpit theme.
- UI label: **Control** with a **Demo** badge.

---

## 2) What We’re Building
### New Tab: **Control (Demo)**
This tab has **three sections** (can be stacked vertically or as sub-tabs):

1) **Pacing** — weekly plans by city/channel, daily pacing, variance, and forecasts  
2) **Campaigns** — unified “campaign objects” with editable budgets/targets/status, bulk actions, audit log  
3) **Pulse** — a unified timeline of “campaign changes” + annotations + alerts (Pulse-style) citeturn0view0

Everything writes to/reads from a shared **Everself-only demo control state**, so the rest of the Everself dashboard reflects changes.

---

## 3) Data Inputs (JSON + computed rollups)
Existing JSON:
- `spend_daily.json`
- `leads.json`
- `appointments.json`

Recommended new JSON:
- `campaigns.json` (normalized campaign list across Google/Meta)
- **NEW:** `change_history.json` (Pulse-style change events)
- Optional: `annotations.json` (or store annotations in local state)

### 3.1 `campaigns.json` (unchanged)
```json
[
  {
    "campaign_id": "g_camp_123",
    "platform": "google_ads",
    "channel": "google",
    "campaign_name": "SF | Consults | Search",
    "city": "San Francisco",
    "objective": "booked_consult",
    "status": "active",
    "daily_budget": 500,
    "target_cpa_booked": 250,
    "target_cpa_completed": 350,
    "start_date": "2026-03-01",
    "end_date": null
  }
]
```

### 3.2 **NEW: `change_history.json` (Pulse-style)**
One row = one detected change across Google Ads or Meta Ads. Mirrors the “single timeline” concept. citeturn0view0

```json
[
  {
    "change_id": "chg_0001",
    "platform": "google_ads",
    "channel": "google",
    "city": "San Francisco",
    "campaign_id": "g_camp_123",
    "campaign_name": "SF | Consults | Search",

    "change_type": "BUDGET_CHANGE",
    "object_type": "CAMPAIGN",
    "object_id": "g_camp_123",

    "field": "daily_budget",
    "before": 500,
    "after": 350,

    "actor": {
      "type": "user",
      "name": "Agency User",
      "email": "agency@vendor.com"
    },

    "detected_at": "2026-04-01T23:05:00Z",
    "source": "demo",
    "notes": null
  }
]
```

**Required fields**
- `change_id`, `platform`, `channel`, `change_type`, `object_type`, `field`, `before`, `after`, `detected_at`

**Recommended fields**
- `city`, `campaign_id`, `campaign_name`, `actor`

**Change types (minimum)**
- `BUDGET_CHANGE`
- `BID_STRATEGY_CHANGE`
- `CREATIVE_UPDATE`
- `STRUCTURE_CHANGE` (ad groups/audiences/status)

These match Pulse’s public feature categories. citeturn0view0

### 3.3 **Annotations**
Pulse supports adding annotations for launches/promos/seasonality/pricing. citeturn0view0  
For demo, store annotations in local state (preferred) or add `annotations.json`.

Annotation shape:
```json
{
  "annotation_id": "ann_001",
  "ts": "2026-04-02T00:00:00Z",
  "scope": "city",
  "entity_id": "San Francisco",
  "label": "Promo launched",
  "details": "New consult promo started",
  "author": "user"
}
```

---

## 4) Shared Demo “Control State” (must persist)
Local storage key (Everself-only):
- `everself_demo_control_state_v2`

### 4.1 Control state shape (extend prior)
```ts
type ControlState = {
  last_updated_at: string;

  overrides: {
    campaigns: Record<string, {
      status?: "active" | "paused";
      daily_budget?: number;
      target_cpa_booked?: number;
      target_cpa_completed?: number;
      notes?: string;
      updated_at: string;
    }>;

    city_budgets: Record<string, {
      weekly_budget?: number;
      channel_split?: { google: number; meta: number }; // sums to 1
      updated_at: string;
    }>;
  };

  // NEW: Pulse-style
  annotations: Array<Annotation>;
  alert_rules: Record<string, { enabled: boolean; cooldown_days: number }>;
  last_rule_run_at?: string;

  change_log: Array<{
    id: string;
    ts: string;
    actor: "user" | "auto";
    scope: "campaign" | "city_budget" | "annotation";
    entity_id: string;         // campaign_id or city
    action: string;            // pause, budget:+10%, add_annotation, etc
    reason: string;
    before: any;
    after: any;
  }>;
};
```

**Important:** Do not affect other properties’ state. Gate reads/writes on `property=Everself`.

---

## 5) UX Layout

### 5.1 Control header
- Title: **Control**
- Badge: **Demo**
- Last updated timestamp
- Buttons:
  - **Run Rules (Recommend)**
  - **Run Rules (Apply Demo)**
  - **Reset Demo State** (confirm)

### 5.2 Sub-navigation inside Control
Use 3 sub-tabs:
- **Pacing**
- **Campaigns**
- **Pulse**

(Alternatively: one page with 3 sections; sub-tabs are cleaner for the demo.)

### 5.3 Global filters (shared across sub-tabs)
- Date range (default: last 30 days)
- City (multi-select)
- Channel (multi-select)
- Campaign search
- Toggle: Booked date vs Lead date (for funnel reporting)

---

# 6) Sub-tab: Pacing (Planning & Pacing)

## 6.1 Weekly plan table (city-level)
Editable (demo overrides):
- Weekly budget
- Channel split Google/Meta (must sum to 100%)
- Notes

Forecast logic:
- `cp_booked_city = spend / booked_consults` (from rollups)
- `forecast_booked = weekly_budget / cp_booked_city`
- If low volume (booked < 10), use blended cp_booked fallback.

## 6.2 Daily pacing
- Cumulative spend vs ideal pace chart
- “Under/Over pacing” flags

Thresholds:
- Underpacing: projected < 90%
- Overpacing: projected > 110%

## 6.3 “CAC risk” widget
- High risk if CP booked worsened > 25% vs previous period OR lead→book rate dropped > 20%.
- Show top 3 risk cities.

---

# 7) Sub-tab: Campaigns (Campaign Control)

## 7.1 Campaign table
Rows = `campaigns.json` + overrides + computed performance (where available).

Columns:
- Status (toggle)
- Platform (Google/Meta)
- Campaign name
- City
- Daily budget (editable)
- Spend (period)
- Leads (period)
- Booked consults (period)
- CP booked (period)
- Completed consults (period)
- CP completed (period)
- Last change (from change_history or audit log)
- Notes

Actions:
- Pause/activate
- +10% budget / -10% budget
- Add note
- Bulk actions + export CSV

## 7.2 Audit log drawer
Every action creates a log entry (timestamp, actor, before/after).

---

# 8) Sub-tab: Pulse (Change Timeline + Annotations + Alerts)

This section should look like “one glance answers what changed,” matching Pulse’s positioning. citeturn0view0

## 8.1 Unified timeline
A chronological feed combining:
- `change_history.json` events (platform changes)
- user annotations (business context)

Timeline row format:
- Timestamp
- Platform icon (Google/Meta) OR “Annotation”
- Change type label (Budget / Bid / Creative / Structure) citeturn0view0
- Entity (campaign / ad group)
- Field changed
- Before → After
- Actor (who made it) citeturn0view0
- “View impact” link (opens side panel)

Filters:
- Change type
- Platform
- City
- Campaign
- “Only high impact” toggle (budget/bid changes only)

## 8.2 “View impact” side panel (critical for demo wow)
When clicking a change event:
- Show 7-day window charts:
  - CP booked trend (before vs after)
  - Booked consult volume trend
  - Spend trend
- Show small “correlation hint” copy:
  - “Performance shifted after this change” (if change time aligns to KPI move)
  - “No immediate shift detected” (otherwise)

**Note:** This is correlation only (demo), but it feels like real ops tooling.

## 8.3 Add annotation
Button: **Add Annotation (Demo)**
- Timestamp (default now)
- Scope: Global / City / Campaign
- Label + details
- Save to control state
- Add to timeline

Examples:
- “Promo launched”
- “New landing page”
- “Call center staffing issue”
- “Price change”

Pulse explicitly supports annotations for this purpose. citeturn0view0

## 8.4 Change alerts (Pulse-style)
Pulse FAQ mentions alerts for specific change types; implement demo alerts tied to change events and guardrails. citeturn0view0

### Alert types (minimum)
1) **High-impact budget cut**
   - Trigger: budget decreased >= 20% on a top city/campaign
2) **Bid strategy change**
   - Trigger: change_type == BID_STRATEGY_CHANGE
3) **Creative swap in top campaign**
   - Trigger: change_type == CREATIVE_UPDATE and campaign spend in top 20%
4) **Structural change**
   - Trigger: change_type == STRUCTURE_CHANGE

Alert UI:
- Severity (High/Med/Low)
- Timestamp
- Summary
- Link to the timeline event
- “Acknowledge” + “Add note” actions

---

## 9) “Query in BigQuery” messaging (demo-safe)
Pulse stores change data in BigQuery (`change_history` table). citeturn0view0  
For the demo:
- Add a small “Data” box:
  - “In production, change events + annotations land in BigQuery `change_history`.”
  - Provide a “Copy sample SQL” button (demo).

Sample SQL (demo text):
```sql
SELECT
  DATE(detected_at) AS day,
  platform,
  change_type,
  COUNT(*) AS changes
FROM change_history
WHERE detected_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY 1,2,3
ORDER BY day DESC;
```

---

## 10) Rule Engine (Guardrails) — updates
Keep prior rules, but add **Pulse-integrated logic**:

### New Rule: “Recent change spike”
- Condition: > N changes in last 24h for a city/campaign
- Action: Create alert “High change velocity—expect volatility; verify intent.”

### Update existing CAC spike rule
If CAC spike occurs AND there was a budget/bid/creative/structure change in prior 48h:
- Alert includes: “Likely related to recent change: [link to timeline event]”

This is the core “Pulse value” for agencies: faster root-cause analysis.

---

## 11) Demo datasets (how to ship fixtures)
Place under:
- `/public/demo/everself/campaigns.json`
- `/public/demo/everself/change_history.json`

For deterministic wow:
- Include at least:
  - 2 budget changes
  - 1 bid strategy change
  - 2 creative updates
  - 1 structure change
  - Actors (agency user vs internal user)
  - Times aligned to a visible KPI shift

---

## 12) Acceptance Criteria
1) **Control** tab appears only for `property=Everself`.
2) Sub-tabs: **Pacing / Campaigns / Pulse** all render.
3) Timeline shows unified changes + annotations; filters work.
4) Clicking an event opens impact panel with 7-day before/after charts.
5) “Add annotation” writes to control state and appears in timeline.
6) Alerts are generated deterministically from change history and rules.
7) Campaign edits write audit log and (optionally) generate corresponding change_history entries labeled `source="demo"`.
8) Reset clears Everself demo state only.

---

## 13) Demo Talk Track (tight)
1) “Pacing sets weekly budgets by city and keeps spend on track.”  
2) “Campaigns is the control surface—every change is logged.”  
3) “Pulse answers ‘what changed?’ in one timeline—budget/bid/creative/structure, plus business annotations.” citeturn0view0  
4) “Rules + Pulse prevent CAC cratering by catching risky changes and correlating them to performance.”
