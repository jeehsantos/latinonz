## Revised approach: counters instead of event logs

You're right. We don't need raw events + cron deletes. We only need the numbers. Switch both tables to **pre-aggregated daily counters** that grow in a bounded, predictable way and keep history forever.

## Growth math (why this works long-term)

- `profile_views_daily`: 1 row per business per day. 1,000 businesses × 365 days = **365k rows/year**. Trivial.
- `search_queries_daily`: 1 row per unique (term, category, city) per day. Realistically a few hundred to a few thousand per day = **<1M rows/year**, still trivial.

Compare to today's design where 1,000 businesses each getting 200 views/day = **73M rows/year** in `profile_views` alone.

## New schema

```text
profile_views_daily(
  business_id uuid,
  day date,
  views int,            -- total hits
  unique_viewers int,   -- distinct viewer_ip_hash that day
  PRIMARY KEY (business_id, day)
)

search_queries_daily(
  day date,
  query text,           -- normalized (lower/trim), '' if empty
  category text,
  city text,
  hits int,
  PRIMARY KEY (day, query, category, city)
)
```

RLS: admin/manager SELECT; business owner SELECT own rows on `profile_views_daily`; service_role ALL. No anon access.

## Write path (the counter trick)

Replace `INSERT` with an atomic upsert. Postgres does this in one statement:

```sql
-- profile_views
INSERT INTO profile_views_daily (business_id, day, views, unique_viewers)
VALUES ($1, current_date, 1, 1)
ON CONFLICT (business_id, day) DO UPDATE
  SET views = profile_views_daily.views + 1;
-- unique_viewers handled separately (see below)
```

For `unique_viewers` we still need to know "have I seen this IP today?" without storing every event. Two options — I'll pick **(a)** unless you prefer (b):

- **(a) Small short-lived dedupe table** `profile_view_dedupe(business_id, day, viewer_ip_hash)` with PK on all three. Insert with `ON CONFLICT DO NOTHING`; if it inserted a row, also bump `unique_viewers`. A nightly job (or just `WHERE day < current_date - 2`) trims it — this is the only table that ever needs purging, and it stays tiny (~today + yesterday only).
- **(b)** Use a HyperLogLog sketch column (approximate, no dedupe table, ~1% error). More complex; only worth it at very high scale.

Search counter is simpler — no uniqueness needed:

```sql
INSERT INTO search_queries_daily (day, query, category, city, hits)
VALUES (current_date, $1, $2, $3, 1)
ON CONFLICT (day, query, category, city) DO UPDATE
  SET hits = search_queries_daily.hits + 1;
```

## Read path

- **Business analytics (last 30 days)**: `SELECT sum(views), sum(unique_viewers) FROM profile_views_daily WHERE business_id=$1 AND day >= current_date - 30`. One indexed scan over ~30 rows.
- **Admin metrics (any range incl. "all time")**: same shape, no business_id filter. Fast forever.
- **Top searches**: `SELECT query, sum(hits) FROM search_queries_daily WHERE day >= … GROUP BY query ORDER BY sum DESC LIMIT 10`.

## Migration steps (single migration)

1. Create the three new tables + GRANTs + RLS + policies.
2. Backfill from existing `profile_views` / `search_queries` (group by business_id+date / term+date).
3. Drop old `profile_views` and `search_queries` tables.
4. (Optional) Schedule a tiny daily pg_cron to trim `profile_view_dedupe` rows older than 2 days. This is the only retention job and it touches a table that never grows beyond ~2 days of data.

## Code changes

- `src/lib/analytics.functions.ts`
  - `logProfileView`: do the dedupe-insert + upsert counter (two statements in one handler).
  - `getAnalytics`: read sums from `profile_views_daily`.
- `src/lib/search.functions.ts`
  - `logSearchQuery`: normalize inputs, upsert counter.
- `src/lib/admin.functions.ts` (`getAdminMetrics`)
  - Reads `profile_views_daily` and `search_queries_daily` for all ranges including "all time".

## Out of scope

- Per-hour granularity (we'd lose it — confirm you only need daily, which is what the dashboards already show).
- Tracking referrer per event (would defeat the counter design). If you want top referrers, we can add `referrer_daily(day, referrer, hits)` later.

## Confirm before I build

1. Daily granularity is fine? (vs hourly)
2. OK to **drop** the existing `profile_views` and `search_queries` tables after backfill? Current data will be preserved as daily totals, but per-event detail will be gone.
3. Use approach **(a)** small dedupe table for unique-viewer counting?
