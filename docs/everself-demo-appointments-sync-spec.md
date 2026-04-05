# SpaceGTM — Everself Demo UX Additions (Leads + Appointments + Sync Story)
**Scope:** Implement UX changes that communicate **online → offline outcomes → attribution confidence** for the **Everself** property demo.  
**Constraint:** These changes apply **only when `property=Everself`** (do not affect other properties).  
**Goal:** Make the demo interview-ready by showing how offline appointment outcomes are synced and how attribution confidence improves over time.

---

## 1) Summary of What We’re Adding
### A) Rename nav item
- Rename **“Acquisition” → “Leads”** (only for Everself).
- The existing “Acquisition” route/content stays the same, but the label changes.

### B) Add a new nav item + page
- Add **“Appointments”** (only for Everself).
- This page is the bridge between marketing and clinical ops outcomes.

### C) Add “Sync Appointments (Demo)” interaction
- Add a **demo-only sync button** on the Appointments page.
- Sync simulates importing appointment updates from an ops system (scheduler/CRM/EHR) and updates:
  - Appointment table rows and counts
  - Attribution Confidence metrics on the main dashboard (when user returns/reloads)
- Button and UI copy must clearly label it as **Demo** and describe production equivalent (“webhook/API import”).  

### D) Expand the “How this report works” explainer
- Add concise copy that explains:
  - “Marketing receipt” captured at lead time (UTMs + click IDs)
  - Offline appointment outcomes from ops systems (booked/completed/no-show)
  - Join via `lead_id`
  - Dashboard shows click-ID coverage + match rate to measure reliability over time

---

## 2) Data Model Additions (JSON-backed)
We continue using JSON fixtures (or server rollups generated from them).  
Add one optional dataset:

### 2.1 `offline_events.json` (derived / optional)
If you already compute everything server-side, you don’t need a separate file; you can compute on the fly.  
If you want a static file for demo “sync”, add:

```json
[
  {
    "event_id": "evt_001",
    "lead_id": "lead_001",
    "appointment_id": "appt_001",
    "city": "San Francisco",
    "event_type": "consult_booked",
    "event_time": "2026-04-03T16:11:00Z",
    "status": "booked"
  }
]
```

### 2.2 Appointment status source of truth
The Appointments page should treat `appointments.json` as **ops truth**:
- Booked, completed, canceled, no_show statuses
- `booked_at`, `completed_at` timestamps
- `lead_id` required for matching back to marketing receipt

---

## 3) Dashboard Concept to Communicate
### 3.1 The “story” we want the UI to tell
1. **Leads page** shows the marketing receipt: UTMs + click IDs + `lead_id`.
2. **Appointments page** shows outcomes created by humans in ops systems.
3. **Sync** simulates importing those outcomes.
4. **Attribution confidence** shows:
   - Click-ID coverage (can we tie leads to platforms?)
   - Match rate (can we tie appointments back to leads?)
   - Missing-lead_id failures (where pipeline breaks)

### 3.2 Key definitions (use in tooltips / explainer)
- **Click-ID coverage:** % of leads with platform click identifiers (Google: gclid/wbraid/gbraid; Meta: fbp/fbc/fbclid).
- **Match rate:** % of appointment records that successfully join to a lead (`lead_id` found in leads dataset).
- **Unmatched appointments:** appointment rows missing lead_id OR lead_id not found in leads.

---

## 4) UX Requirements

## 4.1 Left Nav changes (Everself only)
- For property Everself:
  - Change label: **Acquisition → Leads**
  - Add new item: **Appointments**
- For all other properties:
  - Keep existing nav unchanged

**Acceptance test:** Switching property away from Everself restores original nav labels and hides Appointments.

---

## 4.2 Leads Page (repurpose existing “Acquisition” content)
This can be minimal for demo, but it must not feel empty.

### Must show:
- A table of recent leads with columns:
  - created_at (or date)
  - city
  - channel
  - utm_campaign (or utm_source/medium)
  - click-id present? (Google/Meta icons or boolean)
  - lead_id
- A “Data Quality” panel:
  - % missing city
  - % missing channel
  - % missing utm_campaign
  - % missing all click ids

### Optional:
- Search box for lead_id / email hash / phone hash
- Row click opens a side panel showing the “marketing receipt” fields

---

## 4.3 Appointments Page (new)
### Header
- Title: **Appointments**
- Subtext: “Ops outcomes synced from scheduling systems (demo).”

### Primary CTAs (top-right)
- Button: **Sync Appointments (Demo)**
- Secondary text: “In production: webhook/API import from scheduling/CRM”

### 4.3.1 Appointment KPI strip (top tiles)
Show 4–6 tiles for the selected date range / filters:
- Booked consults
- Completed consults
- Canceled
- No-shows
- Median lead→book days
- Match rate (appointments matched to leads)

### 4.3.2 Appointment table
Table columns:
- appointment_id
- lead_id (highlight if missing)
- city
- status (pill)
- booked_at
- completed_at
- days lead→book (if matched)
- channel (inherited from matched lead)
- campaign (inherited from matched lead; optional)

Row behaviors:
- If `lead_id` missing OR not found → show warning icon + “Unmatched” badge
- Click row opens side panel:
  - lead receipt fields (UTMs, click IDs) if matched
  - otherwise show “missing lead_id” or “lead not found” guidance

### 4.3.3 Sync interaction (demo)
When user clicks **Sync Appointments (Demo)**:
- Show loading state for 1–2 seconds
- Apply deterministic “import results” (see section 5)
- Show toast:  
  “Imported **{N}** appointment updates · **{F}** failed (missing lead_id)”
- Update KPIs + table immediately

**Persistence behavior (for demo realism):**
- Save the “synced state” in local storage keyed to property=Everself so it persists across refresh.
  - Example: `localStorage['everself_demo_sync_state_v1'] = ...`
- Dashboard should read the same state so Attribution Confidence updates after sync.

---

## 4.4 “How to read this report” explainer (Dashboard)
You already have “How to read this report” on the dashboard. Expand it with a short section:

### Required copy (keep tight)
**How attribution improves over time**
- Leads capture a **marketing receipt** (UTMs + click IDs + lead_id).
- Appointments are created in ops systems (call center/scheduler) and synced in.
- We join appointments back to leads using **lead_id**.
- **Click-ID coverage** and **match rate** show how reliable attribution is getting.

### Include two tooltips/definitions
- Click-ID coverage
- Match rate

---

## 5) Demo Sync Logic (deterministic, not random)
The sync should feel real but be predictable.

### 5.1 Suggested deterministic behavior
On first sync:
- Add / update a fixed set of appointments (e.g., +12 updates):
  - 8 booked
  - 3 completed
  - 1 no_show
- Include 2 “failure” records:
  - missing lead_id
  - lead_id not found
- Update existing records (e.g., 2 booked → completed)

On subsequent sync:
- No new records; show toast: “No new updates” OR add a smaller delta (+3) with 1 completion.

### 5.2 Where the sync data comes from
Choose one:
- **Option A:** ship `appointments_sync_patch.json` and apply it
- **Option B:** implement sync as an in-memory patch inside code (simpler)

Either way, **do not** call external APIs.

---

## 6) Attribution Confidence Updates After Sync
After sync, update these values for Everself:

### 6.1 Match Rate
- `match_rate = matched_appointments / total_appointments`
Where “matched” means:
- appointment has lead_id AND lead_id exists in leads dataset

### 6.2 Offline Conversions Ready (optional card)
Compute readiness for uploading offline events:
- Google-ready completed consults: % matched appointments where lead has gclid/wbraid/gbraid
- Meta-ready completed consults: % matched appointments where lead has fbp/fbc/fbclid

These can be shown on Dashboard under Attribution Confidence as:
- “Google offline-ready: 62%”
- “Meta offline-ready: 41%”

### 6.3 Failure counts
- Unmatched appointments count
- Missing lead_id count

**Acceptance test:** After pressing sync, match rate and unmatched counts change in a believable direction.

---

## 7) Filters (consistency across Dashboard / Leads / Appointments)
All Everself pages should use consistent filter semantics:
- Start date / End date
- City (multi)
- Channels (multi)
- Campaign search (optional)

Appointments should include a filter:
- Status (all/booked/completed/no_show/canceled)

If you don’t implement shared state, minimum requirement:
- Each page has its own filters; no broken interactions.

---

## 8) Visual/Copy Guidelines (make it interview-safe)
- Every “fake” element must be labeled **Demo**.
- Never imply actual integration with an EHR/CRM unless explicitly called out as “production plan”.
- Use language like:
  - “In production, this would be fed by webhooks / API imports.”
  - “This demo simulates daily appointment sync.”

---

## 9) Acceptance Criteria (Done = true)
1. When property=Everself:
   - Nav shows **Leads** (renamed) and **Appointments** (new)
2. When property!=Everself:
   - No change to nav labels or pages
3. Appointments page exists and renders with:
   - KPI strip
   - appointment table with unmatched highlighting
   - Sync button with deterministic import + toast
4. Sync persists (local storage) and dashboard reflects updated match rate/click-id readiness after sync
5. Dashboard explainer includes “marketing receipt → ops sync → join → confidence” copy
6. No console errors; empty states render cleanly.

---

## 10) Demo Talk Track (what you say while clicking)
Use this while demoing:
1. “Leads page shows the marketing receipt — UTMs + click IDs captured at lead time.”
2. “Appointments are created by humans in ops systems; that’s the true offline outcome.”
3. Click **Sync Appointments (Demo)**: “This simulates our daily import/webhook feed.”
4. “Now match rate improved — we can trust city-level allocation more, and we’re ready to send offline conversions back to Google/Meta.”
