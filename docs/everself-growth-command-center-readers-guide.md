# Everself Growth Command Center — Reader’s Guide (Marketing & Leadership)

This guide is for **marketing leaders, growth teams, and executives** who use the Growth Command Center report. It explains **what you are looking at**, **why it matters**, and **how the underlying system is designed to connect the full journey** from first touch through booked and completed consultations—so you can interpret the numbers with confidence.

---

## What this dashboard is for

The Growth Command Center is built to answer three questions in one place:

1. **Where should we put the next dollar?** (By city and channel, with clear efficiency metrics.)
2. **Which campaigns and channels actually drive booked and completed consults—not just leads?**
3. **How trustworthy is our measurement?** (Attribution coverage, data quality, and lag from lead to appointment.)

The report is designed for **weekly or monthly reviews**, budget allocation conversations, and board-level accountability on paid performance.

---

## How the data comes together (the full picture)

In a production deployment, Everself does not rely on a single tool. It **stitches together** signals from across your stack so you see one coherent story. Think of it as a **revenue and operations layer** that sits on top of your website, ads, CRM, and scheduling systems.

### Website and product behavior (PostHog)

**PostHog** (or an equivalent product analytics layer) captures what happens on your site and in your funnels: page views, eligibility flows, session identity, and stable visitor IDs. That gives you **behavioral continuity**—who did what, in what order—so marketing is not guessing from ad clicks alone.

In the report, this shows up indirectly in **lead quality**, **conversion patterns by landing path**, and in **attribution confidence** when sessions are tied to downstream leads.

### Paid media (Meta and Google Ads)

**Meta** and **Google Ads** provide spend, impressions, clicks, and campaign structure (campaign, ad set/ad group, and creative-level signals where available). The dashboard rolls this up by **date, market (city), and channel** so you can compare **efficiency**, not just volume.

**Click and cookie identifiers** (for example Google’s click IDs and Meta’s browser parameters) are the technical hooks that let us say: *this ad click belongs to this lead*—which is essential for honest cost-per-outcome math.

### Web analytics (Google Analytics)

**Google Analytics** adds a complementary view of **traffic sources, landing pages, and cross-session behavior**, especially for users who discover you through organic search, referrals, or non-paid channels that still influence paid paths. In a full implementation, GA segments and conversions are **reconciled** with CRM and ad data so “last click” in one tool does not fight “truth” in another.

### Lead capture and forms

When someone submits a **lead form**—whether on a landing page, embedded widget, or third-party scheduler—we capture **who they are** (at least a durable pseudonymous ID), **when they converted**, **which market they belong to**, and **which campaign and creative** they came from (UTM parameters, click IDs, and hidden fields populated from the session).

That is how a **lead** becomes a row in the system with a clear **source of truth** for “this lead cost us X and came from Y.”

### Consultations: booked and completed (including offline)

**Booked consultations** and **completed consultations** often live in **scheduling tools, EHR-adjacent systems, or call-center workflows**—including **phone bookings** that never touched the website again.

A robust implementation does not ignore those. Offline or phone bookings are matched back using **rules you control**, for example:

- The same **email or phone** as the lead record  
- A **CRM or scheduling ID** passed from the form into the booking flow  
- **Staff-entered** links in your operations tool (“attach this appointment to lead #123”) for edge cases  

Once linked, **booked** and **completed** events carry the **same marketing lineage** as online-only journeys. The dashboard’s funnel metrics—**cost per booked consult**, **cost per completed consult**, and **lag from lead to first booking**—are meant to reflect **true commercial outcomes**, not only form fills.

---

## End-to-end attribution (what we mean by that)

**End-to-end attribution** means: we can explain, for a meaningful share of revenue-impacting events, **which spend and which creative** contributed to **downstream outcomes** (lead → booked consult → completed consult), not just top-of-funnel clicks.

No system achieves **100%** attribution in healthcare marketing—privacy rules, device changes, and offline behavior guarantee gaps. What “robust” means in practice is:

- **High coverage** of identifiable touchpoints (click IDs, session IDs, UTMs)  
- **Explicit handling** of unknown or partial journeys (shown as **unattributed** or **low-confidence** segments)  
- **Consistent definitions** so leadership compares the same KPIs every week  

The **Attribution confidence** area of the report exists so you can see whether trends in CPA or ROAS are **real efficiency gains** or partly **measurement getting better or worse**.

### How attribution improves over time

**Leads** capture a **marketing receipt** at conversion time: UTMs, platform **click IDs**, and a durable **`lead_id`**. **Appointments** (booked, completed, no-show, canceled) are created in **ops systems**—scheduling, CRM, or call-center workflows—and are **synced in** on a schedule (in production: webhooks or API imports). The dashboard **joins** appointments back to marketing using **`lead_id`**.

**Click-ID coverage** and **match rate** tell you whether attribution is **getting more reliable** as data quality improves: more leads with click IDs means better platform feedback loops; more appointments matched to leads means city- and campaign-level outcomes are **trustworthy** for allocation.

| Term | Definition |
|------|------------|
| **Click-ID coverage** | % of leads with platform click identifiers (Google: `gclid` / `wbraid` / `gbraid`; Meta: `fbclid` / `fbp` / `fbc`). |
| **Match rate** | % of appointment records that successfully join to a lead: `lead_id` is present **and** exists in the leads dataset. |

---

## How to read the main sections of the report

### Executive KPIs

These are **headline outcomes** for the selected period: spend, leads, booked consults, completed consults, and **cost per outcome**. The **comparison to the prior period** helps you see momentum—whether efficiency and volume are moving in the right direction together.

### City allocation (“trading desk”)

This view supports **budget allocation by market**. It highlights where you are **efficiently buying consultations** versus where spend is expensive or volume is too thin to trust. The **scale signal** is a disciplined read on “enough volume to learn” versus “too early to call.”

### Trends

Trend lines show **how cost per booked consult and volume move over time** by channel. Use this to catch **drift** (creative fatigue, auction pressure, or landing-page issues) before it shows up only in end-of-month totals.

### Attribution confidence

These metrics summarize **how much of your lead volume is tied to observable marketing signals**. When coverage improves, you can move faster with optimization; when it drops, you should treat channel efficiency shifts with more caution until data quality recovers.

### Funnel explorer

This is the **vertical story**: leads → booked → completed. Breaking it down by **channel or city** helps marketing and ops speak the same language about where the funnel breaks.

### Creative performance

Where creative-level labels exist (for example **utm_content** aligned to hooks and formats), you can see **which messages** resonate in **leads and downstream consults**, not only in CTR.

---

## Offline reality (why this matters for healthcare)

Patients **call**. They ** reschedule**. Sometimes the **first booking** happens in a system your marketing stack never sees directly. A serious growth operating model **plans for that** by designing identity and operations so **offline completions still roll up** to the campaigns and cities you measure in this report.

---

## Demo vs. production (one honest sentence)

The **Growth Command Center** you are viewing may run on **representative or consolidated demo data** for presentation purposes. The **definitions, layout, and logic** described above reflect how the product is **architected to run in production**: unified pipelines from analytics, ads, forms, and scheduling so leadership sees **one version of the truth** for growth.

---

## Related documents

- **Technical / implementation detail** (for product and engineering): `everself-growth-command-center-how-it-works.md`  
- **Original product and data specification**: `everself-growth-dashboard-spec.md`  

If you need a **one-slide summary** for an executive readout, pull from the three questions at the top of this guide and one example of **offline booking reconciliation** from the section above.
