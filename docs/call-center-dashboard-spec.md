# SpaceGTM / ConsumerGTM — Call Center Dashboard Spec (DNI + Marketing Attribution) (Demo)
**Goal (Everself-style):** Build a **world-class call center dashboard** that ties **calls → channel/city → booked consults**, highlights **missed calls**, and surfaces the operational KPIs call centers actually run on (queue health + answer speed).  
**Demo Mode:** JSON-backed data (no live telephony integration required).  
**Primary Use:** Interview demo + foundation for Telnyx programmable call control / DNI.

This spec is inspired by common call tracking dashboards (call volume, answered vs missed, top sources) and missed-calls reporting concepts emphasized by call tracking vendors, and call center KPI guidance (ASA, abandon rate, AHT, service level). citeturn0search0turn0search1turn0search13turn0search15turn0search11

---

## 0) What “world class” means here
A VP Sales / CMO should be able to answer in 30 seconds:
1) **Are we answering calls?** (missed rate, ASA, service level)
2) **Which channels/cities drive calls that book?** (call→book rate)
3) **Where is revenue leaking?** (missed calls by source/time, low booking conversion by city/rep)
4) **What changed?** (optional: “Pulse” timeline of routing/ staffing/ campaign changes)

---

## 1) Navigation & Page Structure
Add top-level nav item (or sub-nav under Everself/Consumer):
- **Calls**

Calls page has 4 sections (stacked) + optional sub-tabs:
1) **Executive KPIs**
2) **Calls by Channel/City**
3) **Missed Calls (Leak Report)**
4) **Booking Outcomes (Call → Consult)**

Optional sub-tabs:
- **Live Ops** (queue/rep status) — demo-friendly
- **Call Log** (row-level detail)
- **Attribution** (DNI mappings, click-ID coverage, match rate)

---

## 2) Data Inputs (JSON Fixtures)

### 2.1 `calls.json` (required)
One row per inbound call leg (or per call session).
```json
[
  {
    "call_id": "call_0001",
    "started_at": "2026-04-05T16:02:10Z",
    "answered_at": "2026-04-05T16:02:25Z",
    "ended_at": "2026-04-05T16:12:10Z",

    "from_number": "+14155551234",
    "to_tracking_number": "+14155550102",
    "forwarded_to": "+14155559999",

    "city": "San Francisco",
    "status": "answered",
    "end_reason": "completed",

    "agent_id": "rep_sf_01",
    "recording_url": null,

    "dni_assignment_id": "dni_abc123",
    "lead_id": "lead_001",
    "appointment_id": null,

    "utm_source": "google",
    "utm_campaign": "SF_Search",
    "channel": "google",
    "gclid": "CjwK...",
    "fbp": null,
    "fbc": null,

    "talk_seconds": 520,
    "ring_seconds": 15
  }
]
```

**Required fields**
- `call_id`, `started_at`, `to_tracking_number`, `status`
- `city` (if unknown at call time, set null and backfill from assignment)
- `dni_assignment_id` OR enough info to join by `to_tracking_number`

**Status enum**
- `answered`
- `missed` (no agent answered; may include voicemail)
- `abandoned` (caller hung up before answer)
- `voicemail`
- `failed`

### 2.2 `dni_assignments.json` (required for attribution)
One row per number assignment created by DNI on the landing page.
```json
[
  {
    "dni_assignment_id": "dni_abc123",
    "tracking_number": "+14155550102",
    "session_id": "sess_123",
    "assigned_at": "2026-04-05T15:55:00Z",
    "expires_at": "2026-04-05T16:55:00Z",

    "city": "San Francisco",
    "landing_path": "/sf/consult",

    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "SF_Search",
    "utm_content": "hook_02",
    "utm_term": "weight loss consult",

    "channel": "google",
    "gclid": "CjwK...",
    "wbraid": null,
    "gbraid": null,
    "fbclid": null,
    "fbp": null,
    "fbc": null,

    "posthog_distinct_id": "ph_abc"
  }
]
```

### 2.3 `agents.json` (optional but recommended)
```json
[
  { "agent_id": "rep_sf_01", "name": "SF Rep 1", "city": "San Francisco", "team": "SF", "active": true }
]
```

### 2.4 `appointments.json` (existing)
Must include:
- `appointment_id`, `lead_id`, `city`, `booked_at`, `status`

---

## 3) Stitching Logic (how calls match ads + bookings)
### 3.1 Call → attribution (DNI)
For each call:
1) Use `dni_assignment_id` if present; else match by `to_tracking_number` + time window:
   - find assignment where `tracking_number == call.to_tracking_number` and `assigned_at <= call.started_at <= expires_at`
2) Inherit attribution fields from assignment if missing on call:
   - channel, utms, click ids, landing_path, posthog_distinct_id, city

### 3.2 Call → lead
Preferred:
- If call originates after a form submit, the rep can attach `lead_id` in CRM; ingest it into `calls.json`.
Fallback (demo acceptable):
- Use `dni_assignment.session_id` to match to a lead created within X hours by same posthog_distinct_id or same phone hash (if present).

### 3.3 Lead/call → appointment
Join `appointments.json` by `lead_id`.
Compute “booked consult rate” from calls in a time window:
- **call→booked consult**: % of answered calls whose lead has an appointment booked within N days.
- Start with N=7 days (config).

---

## 4) Metrics Definitions (world-class call center + marketing)
Call center dashboards commonly track queue health KPIs like service level, ASA, abandon rate, and AHT. citeturn0search15turn0search11  
Call tracking dashboards emphasize call volume, answered vs missed, and top sources. citeturn0search0turn0search1turn0search13

### 4.1 Core call volume metrics
- **Total calls** = count(calls)
- **Answered calls** = status == answered
- **Missed calls** = status in [missed, voicemail] (configurable)
- **Abandoned calls** = status == abandoned

### 4.2 Operational KPIs
- **Missed rate** = missed / total
- **Abandon rate** = abandoned / total
- **Average Speed of Answer (ASA)** = avg(answered_at - started_at) for answered
- **Service Level** = % answered within X seconds (e.g., 30s)
- **Average Handle Time (AHT)** = avg(ended_at - answered_at) for answered (or talk_seconds)

### 4.3 Marketing attribution KPIs
- **Calls by channel** = group calls by `channel` (google/meta/organic/unknown)
- **Calls by city** = group calls by `city`
- **Missed calls by source** = missed grouped by channel/campaign (useful to prevent missed opportunities) citeturn0search13turn0search1
- **Click-ID coverage (calls)** = % calls with gclid/wbraid/gbraid or fbp/fbc present (via assignment join)
- **Attribution match rate (calls)** = % calls matched to a DNI assignment (call → assignment)

### 4.4 Sales outcome KPIs (the money)
- **Call → booked consult rate** = answered calls that resulted in appointment booked within N days / answered calls
- **Booked consult rate (by channel/city)** = same metric grouped
- **Call → completed consult rate** (optional) = answered calls with completed consult within N days
- **Rep conversion rate** = booked consults / answered calls per rep

---

## 5) Dashboard UX Spec (what to build)

## 5.1 Global Filters (top bar)
- Date range (last 7/14/30/90)
- City (multi)
- Channel (multi)
- Campaign search (string)
- Agent (optional)
- Toggle: **Include voicemail as missed** (default ON)
- Config: Booking window N days (default 7)

## 5.2 Section A — Executive KPI Tiles (top row)
Tiles (with delta vs previous period):
1) Total calls
2) Answered calls
3) Missed calls
4) Missed rate
5) ASA (sec)
6) Service level (<=30s)
7) Booked consults (from calls)
8) Call→booked rate

Tooltips define ASA, service level, missed rate.

## 5.3 Section B — Calls by Channel & City (allocation view)
### B1) Channel × City table (primary)
Rows = City, Columns = Channel  
Cells show:
- Calls
- Answered %
- Missed %
- Call→booked %

Cell click drills into Call Log filtered.

### B2) Trend charts
- Line: Total calls over time (daily)
- Line: Missed rate over time
- Line: Call→booked rate over time

## 5.4 Section C — Missed Calls “Leak Report”
### C1) Missed calls by hour-of-day heatmap
- X axis: hour
- Y axis: day of week
- Cell: missed calls count or missed rate

Missed-calls reporting is commonly used to identify times/days when calls are missed and adjust staffing. citeturn0search1

### C2) Missed calls by source (ranked table)
Columns:
- Channel
- Campaign (if available)
- Total calls
- Missed calls
- Missed %
- Estimated lost bookings (missed * baseline booked rate)

### C3) “Call handling gaps” list
Flags:
- City missed rate > 20%
- ASA > 45s
- Service level < 70% within 30s

## 5.5 Section D — Booking Outcomes (Call → Consult)
### D1) Funnel card
Answered calls → Leads matched → Booked consults → Completed consults

### D2) City ranking (“Where we’re leaving money on the table”)
Columns:
- City
- Answered calls
- Call→booked rate
- Booked consults
- Median lag call→booked (days)

### D3) Agent performance (optional, but strong for a sales-led org)
Columns:
- Agent
- Answered calls
- Avg handle time
- Call→booked rate
- Notes

Agent performance visibility is a common dashboard use case. citeturn0search11

---

## 6) Call Log (Row-level) — Required for credibility
A table view with pagination and powerful filters.

Columns:
- Call start time
- City
- Channel / campaign
- Tracking number (to)
- Status
- Ring seconds
- Talk seconds
- Agent
- Lead matched? (yes/no)
- Appointment booked? (yes/no)
- Recording link (if present)

Row click → side panel:
- Attribution payload (UTMs, click IDs)
- DNI assignment details
- Related lead + appointment timeline
- Notes/tags (demo)

---

## 7) Computation & Edge Cases

### 7.1 Date normalization
- Compute in UTC; optionally display in local timezone.

### 7.2 ASA and service level
- Only compute on answered calls.
- If `answered_at` missing, fallback to `ring_seconds`.

### 7.3 Missed vs abandoned
- If no answered_at and ended quickly (<X seconds) classify as abandoned; else missed/voicemail depending on `end_reason`.
- Allow override via status.

### 7.4 Booking attribution window
- Config `booking_window_days` default 7.

### 7.5 Deduplication
- calls.json must represent the final consolidated call session; unique key `call_id`.

---

## 8) Demo “Sync Calls” (optional)
Button: **Sync Calls (Demo)**
- Applies deterministic patch to calls (client-side state) to simulate new calls arriving
- Toast: “Imported 42 calls · 6 missed · 3 bookings created”

---

## 9) Implementation Plan (Cursor-friendly)
### 9.1 Compute layer (pure functions)
- `joinCallsToAssignments(calls, assignments)`
- `computeCallKpis(calls, appointments, bookingWindowDays)`
- `groupCallsByCityChannel(calls)`
- `computeMissedHeatmap(calls)`
- `computeAgentStats(calls, appointments)`

### 9.2 API (recommended)
Server route returns:
```json
{
  "meta": { "generated_at": "..." },
  "kpis": { ... },
  "series": { ... },
  "by_city_channel": [ ... ],
  "missed_heatmap": [ ... ],
  "missed_by_source": [ ... ],
  "agent_stats": [ ... ],
  "call_log": [ ... paginated ]
}
```

### 9.3 UX polish
- Sticky filter bar
- KPI deltas
- Drill-down from heatmap/table into call log
- Export CSV (missed_by_source, agent_stats)

---

## 10) Acceptance Criteria
1) Renders with JSON-only datasets.
2) Calls correctly join to DNI assignments.
3) Calls by channel/city + missed calls views drill down to call log.
4) Booked consult rate computed by channel/city.
5) ASA/service level computed and hidden gracefully if missing fields.
6) Works for a sales-led org (optional agent view).

---

## Appendix A — Default Config (`config.json`)
```json
{
  "service_level_seconds": 30,
  "asa_warning_seconds": 45,
  "missed_rate_warning": 0.20,
  "booking_window_days": 7,
  "include_voicemail_as_missed": true
}
```
