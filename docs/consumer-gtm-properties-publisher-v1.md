# Consumer GTM (Internal) — Properties + Publisher v1 Spec

This spec covers:

1. **Properties**: database table, API, and admin UI for managing consumer properties (e.g., `grouptext.co`, `650.dog`).
2. **Publisher v1**: minimal backend to schedule/publish posts to **X**, **Facebook**, and **Instagram**.
3. **Queue management via JSON**: preferred method to bulk-add scheduled posts from a flat JSON file (with optional UX for one-off posts).
4. **Settings sub-tab**: per-property credentials storage + UI for X/FB/IG.

**Non-goals (v1)**
- No experimentation taxonomy (pillars/angles/hooks), no advanced analytics joins.
- No multi-user permissions beyond whatever admin/auth system already exists.
- No sophisticated media pipeline (uploading/processing). v1 uses existing `media_urls` (hosted URLs).

--------

## 0) Terminology

- **Property**: a consumer product website (e.g., `ranch.dog`, `grouptext.co`, `650.dog`).
- **Publisher**: module that manages drafts/scheduled posts and executes publishing via worker/queue.
- **Queue JSON**: a JSON file containing a list of posts with scheduled date/time and content.

---

## 1) Data Model

### 1.1 Table: `properties`

Stores consumer properties used by `/consumer` UI and publisher scoping.

**Columns**
- `id` (PK; use your standard: UUID or BIGINT)
- `name` (VARCHAR(128), **required**) — display name (e.g., “GroupText”)
- `domain` (VARCHAR(255), **required**, **unique**) — normalized domain only (e.g., `grouptext.co`)
- `product_type` (VARCHAR(64) or ENUM, **required**) — v1 allowed: `content`, `marketplace`, `saas`, `other`
- `is_active` (BOOLEAN, default `true`)
- `created_at` (DATETIME/TIMESTAMP)
- `updated_at` (DATETIME/TIMESTAMP)

**Indexes**
- Unique index on `domain`
- Index on `is_active`

**Domain normalization rule**
- Accept user input like `https://grouptext.co/anything` but store only: `grouptext.co` (lowercase, trim, strip scheme, strip path/query/fragment).

---

### 1.2 Table: `publisher_posts` (minimal)

Represents a single post draft/scheduled/published item.

**Columns**
- `id` (PK)
- `property_id` (FK → `properties.id`, **required**)
- `platform` (ENUM/VARCHAR: `x`, `facebook`, `instagram`, **required**)
- `text` (TEXT, **required**)
- `media_urls` (JSON, nullable) — array of strings (hosted media URLs)
- `status` (ENUM/VARCHAR, **required**, default `draft`)
  - `draft` | `scheduled` | `publishing` | `published` | `failed` | `canceled`
- `scheduled_for` (DATETIME, nullable)
- `published_at` (DATETIME, nullable)
- `platform_post_id` (VARCHAR(255), nullable) — id returned by the platform
- `error_message` (TEXT, nullable) — user-readable summary
- **Source fields (for JSON import idempotency)**
  - `source` (VARCHAR(32), default `ui`) — `ui` or `json`
  - `source_key` (VARCHAR(255), nullable) — unique key from JSON item (see §3)
- `created_at`, `updated_at`

**Indexes**
- `(property_id, status)`
- `(status, scheduled_for)`
- `(property_id, platform, created_at)`
- Unique index (recommended) on `(property_id, source, source_key)` where `source_key` is not null  
  - This enables safe re-import of JSON without duplicates.

---

### 1.3 Table: `publisher_social_accounts`

Stores credentials per property and platform.

**Columns**
- `id` (PK)
- `property_id` (FK → `properties.id`, **required**)
- `platform` (ENUM/VARCHAR: `x`, `facebook`, `instagram`, **required**)
- `display_name` (VARCHAR(255), nullable) — handle/page name for UI display
- `credentials_json` (JSON, **required**) — token(s) + ids required for publishing
- `is_active` (BOOLEAN, default `true`)
- `created_at`, `updated_at`

**Indexes**
- Unique index on `(property_id, platform)` (v1 assumes one active account per platform per property)

---

### 1.4 Table: `publisher_publish_attempts` (recommended)

Tracks retries & debugging.

**Columns**
- `id` (PK)
- `post_id` (FK → `publisher_posts.id`, **required**)
- `attempt_number` (INT, **required**)
- `started_at` (DATETIME)
- `finished_at` (DATETIME)
- `result` (VARCHAR(16)) — `success` | `failed`
- `error_message` (TEXT, nullable)

**Indexes**
- `(post_id, attempt_number)`

---

## 2) Consumer UI (existing `/consumer` path)

You already have:
- `/consumer` route
- left nav tabs
- **Property dropdown** at top-left with **+ Add property** action

This spec defines exact behavior and new screens/components.

### 2.1 Property dropdown behavior (global for `/consumer`)

**On `/consumer` layout mount**
- Call `GET /api/consumer/properties`
- Populate dropdown list with active properties.

**Selected property state**
- Persist selected property in `localStorage`:
  - key: `consumer.activePropertyId`
- On load:
  - if stored id exists in fetched list, auto-select it
  - else select the first property.

**When property changes**
- Update localStorage
- All consumer tabs scope queries by the selected `property_id`.

---

### 2.2 Add Property modal (triggered from dropdown)

**Modal title:** `Add Property`

**Fields**
1) `Name` (text)
2) `Domain` (text; domain only)
3) `Product Type` (select): `Content`, `Marketplace`, `SaaS`, `Other`

**Validation**
- `name`: 2–128 chars
- `domain`: must normalize to a valid hostname; reject spaces; show helper text:
  - “Use domain only, e.g. `650.dog`”
- unique domain enforced server-side

**Submit**
- POST `/api/consumer/properties`
- On success:
  - close modal
  - refresh dropdown list (or append returned property)
  - auto-select newly created property
  - toast success: “Property created”

**Errors**
- 409 (domain exists) → “That domain already exists.”
- 400 validation errors → field-level messages

---

## 3) Queue Management via JSON (preferred)

### 3.1 Overview

We want to bulk-add posts easily without creating them one at a time in the UI.

**Preferred workflow**
1. Create/edit a JSON file for a property.
2. Import it to queue scheduled posts.
3. Worker publishes on schedule; UI shows status.

The system should support:
- **Idempotent re-imports** (safe to re-run without duplicates)
- Updating scheduled time/text for existing items (via same `source_key`)

---

### 3.2 JSON file format

**File path (recommended)**
- `./data/publisher/queues/<property-domain>.json`
  - examples:
    - `./data/publisher/queues/grouptext.co.json`
    - `./data/publisher/queues/650.dog.json`

> The file is maintained by you internally (committed or not — your choice). The backend import reads from a request payload (see §3.3). If you want the backend to read directly from disk in production, keep it behind an admin-only endpoint and restrict paths.

---

### 3.3 Import methods (choose one or implement both)

#### Option A — API import (recommended, works everywhere)
- Admin pastes JSON or uploads it via UI/CLI, backend validates and upserts posts.

Endpoint:
- `POST /api/consumer/publisher/import-json`

Request body:
```json
{
  "property_id": "<uuid>",
  "items": [
    {
      "key": "2026-03-03-x-morning-01",
      "platform": "x",
      "scheduled_for": "2026-03-03T17:00:00Z",
      "text": "…",
      "media_urls": ["https://…"]
    }
  ]
}
```

#### Option B — Server reads file from disk (dev-only)
Endpoint:
- `POST /api/consumer/publisher/import-file`

Request:
```json
{ "property_id": "<uuid>", "file_path": "./data/publisher/queues/grouptext.co.json" }
```

**Security requirement**
- Dev-only or admin-only.
- Restrict `file_path` to an allowlisted folder prefix: `./data/publisher/queues/`
- Reject `..` path traversal.

---

### 3.4 JSON item schema

Each item:

- `key` (string, **required**)  
  - must be unique per property; used as `source_key` for idempotency
- `platform` (string, **required**) — `x` | `facebook` | `instagram`
- `scheduled_for` (ISO datetime string, **required**)
- `text` (string, **required**)
- `media_urls` (array of strings, optional, default `[]`)

**Validation rules**
- `scheduled_for` must be a valid ISO datetime
- `text` required; length limits per platform enforced at publish time (or validation time)
- **Instagram rule (v1):** must include at least one `media_url`
  - If platform is instagram and `media_urls` is empty → reject item with validation error

---

### 3.5 Import behavior (idempotent upsert)

For each imported item:
- Compute `source='json'`, `source_key=item.key`
- Upsert by `(property_id, source, source_key)`:
  - If not found:
    - Insert a new row into `publisher_posts` with:
      - `status='scheduled'`
      - `scheduled_for=item.scheduled_for`
      - `text`, `media_urls`, `platform`, `property_id`
      - `source='json'`, `source_key=item.key`
  - If found and existing status is one of `draft` or `scheduled`:
    - Update `scheduled_for`, `text`, `media_urls`, `platform` if changed
  - If found and status is `published`:
    - Do **not** overwrite (return warning “already published”)
  - If found and status is `publishing`:
    - Do **not** overwrite (return warning “currently publishing”)

Import response:
```json
{
  "created": 12,
  "updated": 3,
  "skipped_published": 2,
  "skipped_publishing": 0,
  "errors": [
    { "key": "…", "message": "Instagram requires media_urls" }
  ]
}
```

---

## 4) Publisher API (v1)

Base path: `/api/consumer/publisher`

All endpoints should require admin auth (same as your internal tooling standard).

### 4.1 Posts

#### GET `/posts`
Query params:
- `property_id` (**required**)
- `status` (optional)
- `platform` (optional)
- `from`, `to` (optional date filters)

Returns:
- list of posts for the selected property

#### POST `/posts`
Creates a draft (UX one-off creation)

Request:
```json
{ "property_id": "...", "platform": "x", "text": "…", "media_urls": [] }
```

Response:
```json
{ "post": { ... } }
```

Validation:
- instagram requires media_urls for schedule/publish; draft can allow empty but schedule/publish must validate.

#### PATCH `/posts/:id`
Edits `text`, `media_urls`, `scheduled_for` (only if status allows)

Allowed updates:
- if `status=draft` → edit freely
- if `status=scheduled` → edit and reschedule
- if `status=published` → reject

#### POST `/posts/:id/schedule`
Request:
```json
{ "scheduled_for": "…" }
```

Behavior:
- Validate platform requirements (IG media)
- Set `status='scheduled'`, set `scheduled_for`
- Enqueue a delayed job (see §5)

#### POST `/posts/:id/publish-now`
Behavior:
- Validate platform requirements
- Set status to `publishing`
- Enqueue immediate job

#### POST `/posts/:id/cancel`
Allowed only when `status=scheduled`
- sets `status=canceled`

---

### 4.2 JSON import

#### POST `/import-json`
See §3.3 Option A.

#### POST `/import-file` (optional; dev-only)
See §3.3 Option B.

---

### 4.3 Social account credentials

#### GET `/accounts`
Query params:
- `property_id` (**required**)

Returns current accounts for property (x/facebook/instagram).

#### PUT `/accounts/:platform`
Upserts credentials for property + platform.

Request (generic):
```json
{
  "property_id": "...",
  "display_name": "@handle or Page Name",
  "credentials_json": { "... platform specific ..." },
  "is_active": true
}
```

Validation:
- `property_id` required
- `credentials_json` required

---

## 5) Publishing Execution (Worker / Queue)

### 5.1 Queue

Queue name:
- `publisher:publish`

Job payload:
```json
{ "post_id": "..." }
```

### 5.2 Scheduling approach

**Use delayed jobs**:
- When a post is scheduled:
  - enqueue `publisher:publish` with delay = `scheduled_for - now` (ms)
- If delay is negative or very small:
  - enqueue immediately

### 5.3 Worker logic

On job:
1. Load post by `post_id`
2. Validate status:
   - If `status` not in (`scheduled`, `publishing`) → no-op
   - If `status=scheduled` but `scheduled_for > now` → re-enqueue with remaining delay (safety)
3. Transition to `publishing`
4. Load credentials from `publisher_social_accounts` for `(property_id, platform)` and `is_active=true`
   - If missing credentials → set `failed` with `error_message="Missing credentials for <platform>"`
5. Call platform publishing function
6. On success:
   - Update post:
     - `status='published'`
     - `published_at=now`
     - `platform_post_id=<id>`
     - `error_message=null`
7. On failure:
   - Update post:
     - `status='failed'`
     - `error_message=<short message>`
8. Insert `publisher_publish_attempts` row for each attempt.

### 5.4 Retries

- Retry up to **3 times** for transient errors (timeouts, 429 rate limits, 5xx)
- Do not retry auth errors (invalid token, permission denied)
- Use exponential backoff (e.g., 30s, 2m, 10m) or your default BullMQ settings.

---

## 6) Platform Integrations (v1)

### 6.1 X (Twitter)

**Credentials stored (example)**
- depends on your implementation (OAuth 2.0 user context recommended)
- store minimal needed values in `credentials_json`

**Publish**
- text-only v1
- return tweet id → `platform_post_id`

**v1 constraints**
- enforce max length (X rules) either at create time or at publish time with friendly error.

---

### 6.2 Facebook

**Credentials stored**
- `page_id`
- `page_access_token`

**Publish**
- create Page feed post with `message=text`
- return post id

---

### 6.3 Instagram (via Meta Graph)

**Credentials stored**
- `page_id` (often needed for context)
- `ig_business_account_id`
- `page_access_token` (or long-lived token with required scopes)

**Publish workflow (v1)**
- Requires at least one media URL (image/video)
- Use IG container creation + publish flow (Meta Graph)
- Return IG media id → `platform_post_id`

**Validation**
- Reject schedule/publish if `media_urls` empty.

---

## 7) Settings Tab (Consumer) — Credentials UI

You already have a left nav item: **Settings**.

Add a **sub-tab** (or section) within Settings:

### 7.1 Settings layout

Settings page sections:

1. **Property Details** (optional v1)
   - name, domain, product_type
   - edit + deactivate toggle

2. **Social Accounts** (**required v1**)
   - X
   - Facebook
   - Instagram

Only show/edit accounts for the **currently selected property**.

---

### 7.2 Social Accounts section UX

For each platform: render a collapsible card:

**Card title**
- `X`
- `Facebook`
- `Instagram`

**Fields (v1)**
- `Display name` (optional)
- `Active` toggle
- `Credentials` (platform-specific fields; stored in `credentials_json`)

#### X card fields (v1)
Because OAuth UI is not required v1, allow “paste tokens” approach:

- `Access Token` (masked input)
- `Refresh Token` (masked input) (if used)
- `Client ID` (optional)
- `Client Secret` (optional)
- `Note`: your exact X auth approach may differ; v1 UI should match what your backend expects.

Buttons:
- `Save`
- `Test` (optional but recommended): calls a lightweight API to verify token validity

#### Facebook card fields
- `Page Name` (display_name)
- `Page ID`
- `Page Access Token` (masked)

Buttons:
- `Save`
- `Test` (optional): verify page token and permissions

#### Instagram card fields
- `Instagram Account Name` (display_name)
- `Instagram Business Account ID`
- `Facebook Page ID`
- `Page Access Token` (masked)

Buttons:
- `Save`
- `Test` (optional): verify IG account access and permissions

---

### 7.3 Settings API interactions

On Settings load (property selected):
- GET `/api/consumer/publisher/accounts?property_id=...`
- Populate cards for x/facebook/instagram if present; otherwise show “Not configured”.

On Save:
- PUT `/api/consumer/publisher/accounts/:platform`
- payload includes `property_id`, `display_name`, `credentials_json`, `is_active`

On success:
- toast: “Saved”

On errors:
- field-level if possible
- otherwise show toast with returned error message

---

## 8) Publisher Tab (Consumer) — Minimal UX for v1

Left nav item exists: **Publisher**

Publisher page should scope to current property and include:

### 8.1 Sub-tabs (recommended)
- **Queue**
- **Import JSON**
- **New Post** (optional but useful)

#### Queue
- Table/list of posts:
  - scheduled_for, platform, status, short preview of text, actions
- Filters:
  - status, platform, date range

Actions by status:
- draft: Edit, Schedule, Publish now
- scheduled: Edit, Cancel, Publish now
- failed: View error, Retry (publish-now)
- published: View platform_post_id, View details

#### Import JSON
- Textarea to paste JSON (Option A)
- Button: “Import”
- Show import summary (created/updated/skipped/errors)
- (Optional) file upload input that reads file client-side and submits JSON

#### New Post (optional)
- platform select
- text textarea
- media_urls input (simple “Add URL” list)
- Save draft
- Schedule or Publish now

---

## 9) Acceptance Criteria

### Properties
- `properties` table exists with required fields
- `/consumer` dropdown lists properties via API
- Add Property modal creates property and auto-selects it
- Domain uniqueness enforced with friendly UX

### Settings (Social Accounts)
- Settings page shows social account cards per property
- Save credentials per platform per property
- Credentials used by publisher worker

### Publisher core
- Can create draft post via API/UX
- Can schedule post; worker publishes and updates status
- Status transitions visible in UI
- Failures show `failed` + `error_message` and can retry

### JSON queue import
- Can paste/import JSON for a property
- Idempotent upsert using `key` → `source_key`
- Re-import does not duplicate items
- Updates are applied to draft/scheduled items
- Instagram validation enforced (media required)

---

## 10) Open Decisions (pick defaults if you don’t care)

1. **Timezones**
   - Recommended: store `scheduled_for` as UTC; UI displays in local timezone with clear label.

2. **Auth**
   - Admin-only endpoints; use existing auth middleware.

3. **Instagram media handling**
   - v1 uses externally hosted URLs only. No uploading pipeline.

4. **X token strategy**
   - Align Settings fields with whichever X API auth approach you’ve implemented.

---

## 11) Implementation Order (fastest path)

1. DB migration: `properties`
2. DB migration: `publisher_posts`, `publisher_social_accounts`, `publisher_publish_attempts`
3. API: properties endpoints + dropdown wiring
4. Settings: accounts endpoints + UI cards
5. Publisher: posts endpoints + Queue UI list
6. JSON import endpoint + Import JSON UI
7. Worker publishing for X + Facebook first; then Instagram
