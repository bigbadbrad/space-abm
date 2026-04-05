# SpaceGTM (Everself Property) — “Pacing & Control” Tab Spec (Demo)
**Purpose:** Add an **agency-style control layer** for the Everself demo: **planning/pacing**, **campaign control**, and **automation/alerts** to prevent CAC from cratering.  
**Constraint:** This tab and its UI/actions apply **only when `property=Everself`**.  
**Demo Mode:** **No live API writes** to Google/Meta. All “controls” are simulated against JSON-backed data with a transparent **Demo** label, persistent state, and an audit log.

---

## 1) What We’re Building
Add a new top-level nav/tab for Everself:

### New Tab: **Pacing & Control (Demo)**
This tab behaves like a lightweight agency cockpit:
1) **Planning & pacing**: weekly budgets by city/channel, daily pacing, variance, forecasted outcomes.  
2) **Campaign control**: a unified list of “campaign objects” with editable budgets/targets/status; bulk actions; change log.  
3) **Automation & alerts**: rule engine + guardrails that recommend actions or apply simulated actions; alerts when CAC metrics spike or tracking breaks.

**Key UX principle:** Every write-like action must be labeled **Demo** and must write to a local “control state” that the rest of the dashboard reads.

---

## 2) Research Patterns We’re Mimicking (for the demo feel)
The tab should feel like real agency tooling:
- Budget pacing and monitoring (common in PPC tools).
- Rule-based automation (pause/scale/alerts).
- Unified campaign management and “smart rules” concept.

(Implementation is still demo/simulated; the UX should resemble what users see in platforms that market budget pacing + rules + campaign automation.)

---

## 3) Data Inputs (JSON + computed rollups)
This spec assumes you already have (from the earlier dashboard work):
- `spend_daily.json`
- `leads.json`
- `appointments.json`
- server-computed rollups such as `marketing_roi_daily_by_city`

### Add one new JSON (recommended for demo realism)
#### 3.1 `campaigns.json`
Represents a “normalized” campaign list across Google and Meta for Everself demo.

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

**Required:** `campaign_id, platform, channel, campaign_name, city, status`  
**Recommended:** budgets + targets.

> If you don’t have campaign ids in spend/leads yet, you can still build this list and show “—” for campaign-level outcome metrics, while city-level pacing still works.

---

## 4) Shared Demo “Control State” (must persist)
All simulated changes must persist (only for Everself):
- Use local storage key: `everself_demo_control_state_v1`

### 4.1 Control state shape (minimum)
```ts
type ControlState = {
  last_updated_at: string; // ISO
  overrides: {
    campaigns: Record<string, {
      status?: "active" | "paused";
      daily_budget?: number;
      target_cpa_booked?: number;
      notes?: string;
      updated_at: string;
    }>;
    city_budgets: Record<string, {
      weekly_budget?: number;
      channel_split?: { google: number; meta: number }; // must sum to 1
      updated_at: string;
    }>;
  };
  rule_runs: Array<{
    run_id: string;
    ran_at: string;
    mode: "recommend" | "apply_demo";
    rules_fired: number;
  }>;
  change_log: Array<{
    id: string;
    ts: string;
    actor: "user" | "auto";
    scope: "campaign" | "city_budget";
    entity_id: string; // campaign_id or city name
    action: string;    // e.g. "pause", "budget:+10%", "reallocate"
    reason: string;
    before: any;
    after: any;
  }>;
};
```

### 4.2 Read behavior
- The **Dashboard**, **Leads**, **Appointments**, and this new tab must all read the same control state (Everself-only) so the demo “feels real.”

---

## 5) UX Layout

## 5.1 Header
- Title: **Pacing & Control**
- Badge: **Demo**
- “Last updated” timestamp from control state
- Buttons (right):
  - **Run Rules (Recommend)**  
  - **Run Rules (Apply Demo)**  
  - **Reset Demo State** (confirm modal)

## 5.2 Global Filters (same semantics as dashboard)
- Date range (default: last 30 days)
- City multi-select
- Channels multi-select
- Campaign search (text)
- Booking cohort toggle (Booked date vs Lead date)

---

## 6) Section A — Planning & Pacing

### 6.1 Weekly Plan Panel
**Purpose:** Set weekly budgets by city and channel split.

UI:
- Table: one row per city (filtered)
- Columns:
  - City
  - Weekly budget (editable; demo override)
  - Channel split (Google % / Meta % sliders or inputs; must sum to 100%)
  - Planned booked consults (forecast)
  - Planned completed consults (forecast)
  - Notes

Forecast logic (simple, demo-credible):
- Use trailing period efficiency by city:
  - `cp_booked_city = spend / booked_consults` (from rollups)
  - Forecast booked = weekly_budget / cp_booked_city
- If booked_consults too low for confidence (< min threshold), show “Low confidence” and use blended cp_booked across all cities as fallback.

Config:
```json
{
  "min_booked_for_confidence": 10,
  "default_weekly_budget": 25000
}
```

### 6.2 Daily Pacing Panel
For selected city or “All cities”:
- Chart: **Cumulative spend vs ideal pace** (line)
- Table:
  - Day
  - Actual spend
  - Ideal spend (weekly_budget/7)
  - Variance
  - “At risk?” flag if projected to miss pace by >X%

Pacing alert thresholds:
- Underpacing: projected week-end spend < 90% of planned
- Overpacing: projected week-end spend > 110% of planned

### 6.3 “Where CAC is at risk” card
Compute a simple “risk index” per city:
- If cost_per_booked worsened by >20% vs prior period OR lead→book rate dropped >20% → risk=High
- Display top 3 risk cities.

---

## 7) Section B — Campaign Control (Unified List)

### 7.1 Campaign List Table
Rows = `campaigns.json` merged with:
- spend (from spend_daily)
- outcomes (from leads/appointments rollups by city/channel; campaign if available)
- overrides from control state

Columns:
- Status (toggle Active/Paused — demo)
- Platform (Google Ads / Meta)
- Campaign name
- City
- Daily budget (editable — demo)
- Spend (period)
- Leads (period)
- Booked consults (period)
- CP booked (period)
- Completed consults (period)
- CP completed (period)
- Notes / last change

Actions:
- Pause
- Activate
- Increase budget +10%
- Decrease budget -10%
- Apply city budget split (optional)
- Add note

Bulk actions:
- Select multiple campaigns
- Pause selected
- Set daily budget
- Tag “needs creative refresh”
- Export CSV

### 7.2 Change Log Drawer (auditability)
Every action writes an entry into `change_log` and appears in a right-side drawer:
- Timestamp
- Actor (user/auto)
- Action
- Reason
- Before → After diff view

---

## 8) Section C — Automation & Alerts (Guardrails)

### 8.1 Rule Engine UI
A simple “Rules” list with toggles:
- Enabled/Disabled
- Mode: Recommend vs Apply Demo
- Lookback window (default: 7 days)
- Min data threshold (default: 20 leads or 5 booked consults)
- Cooldown per entity (default: 3 days)

Each rule has:
- Name
- Condition
- Action (recommend or apply)
- Scope (city-level or campaign-level)

### 8.2 Rules to implement (minimum viable set)
**Rule 1 — CAC spike protection (city)**
- Condition:
  - `cost_per_booked` increased > 25% vs prior period AND spend > $X
- Action:
  - Recommend: “Reduce city budget by 15% and shift to best city”
  - Apply Demo: adjust city weekly budget override (-15%)

**Rule 2 — Tracking break / attribution confidence drop**
- Condition:
  - Click-ID coverage drops below threshold OR match rate drops below threshold
- Action:
  - Create alert: “Tracking degradation — investigate click-id capture / lead_id join”
  - No auto budget change (safety)

**Rule 3 — Conversion rate collapse**
- Condition:
  - Lead→Book rate drops > 30% vs prior period for a city/channel
- Action:
  - Recommend: reduce city budget OR pause worst campaigns if campaign-level is available

**Rule 4 — Overpacing guardrail**
- Condition:
  - Projected weekly spend > 115% of planned
- Action:
  - Recommend: reduce budgets today by X%
  - Apply Demo: reduce campaign daily budgets proportionally for that city/channel

**Rule 5 — Winner scaling (careful)**
- Condition:
  - CP booked <= target AND volume >= min threshold
- Action:
  - Recommend: increase budget +10% (with cap)
  - Apply Demo: increase budgets +10% with max cap

### 8.3 Alerts Panel
A “latest alerts” list with severity:
- High / Medium / Low
- Timestamp
- City / Channel / Campaign scope
- Suggested next action
- “Mark resolved” (demo)

Alerts should be derived from rules + pacing checks.

---

## 9) How This Tab Affects the Existing Dashboard
### 9.1 Overlay logic
When Everself control state includes overrides:
- Dashboard displays an “Active demo overrides” badge.
- Rollup calculations remain based on JSON actuals, BUT:
  - “Planned” and “Projected” views use overrides
  - Control tab shows **Actual** vs **Planned** side-by-side where relevant

### 9.2 Simulated vs actual (must be explicit)
- **Actual metrics**: derived from JSON (spend/leads/appointments)
- **Simulated controls**: budgets/status/targets stored in local state; used for pacing/projections and “what would we do” narrative

---

## 10) Safety Constraints (prevent ridiculous demo output)
- Clamp budgets:
  - City weekly budget: min 0, max 5× historical weekly spend
  - Campaign daily budget: min 0, max 3× historical daily avg (if available)
- Scaling cooldown:
  - Do not apply winner scaling more than once every 3 days per entity

---

## 11) Copy Requirements (interview-safe)
Include small, clear copy blocks:
- “**Demo:** No live edits to Google/Meta. Actions are simulated and logged.”
- “In production, this connects via Google Ads API / Meta API and offline conversions.”

Tooltips:
- Explain why tracking-break rule never auto-scales
- Explain why scaling is capped/cooldowned

---

## 12) Acceptance Criteria
1) Tab appears only for **property=Everself**.
2) Weekly plan table edits persist across refresh.
3) Daily pacing chart updates when budgets change.
4) Campaign actions write to change log.
5) Rule engine runs in Recommend mode and produces alerts.
6) Apply Demo mode updates overrides + logs changes.
7) Reset clears only Everself demo control state.
8) No UI/behavior changes for other properties.

---

## 13) Demo Talk Track (30 seconds)
1) “This is our agency cockpit: weekly plan by city, daily pacing, and guardrails.”  
2) “Campaign control is unified with an audit log — every change is explainable.”  
3) “Rules catch CAC spikes, overpacing, and tracking breaks before performance craters.”  
4) “In production, the same outputs drive API writes and offline conversion uploads.”
