
-- =====================================================================
-- Counter-based analytics: profile_views_daily, search_queries_daily
-- =====================================================================

-- 1) profile_views_daily ------------------------------------------------
CREATE TABLE public.profile_views_daily (
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  day date NOT NULL,
  views integer NOT NULL DEFAULT 0,
  unique_viewers integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, day)
);
CREATE INDEX idx_profile_views_daily_day ON public.profile_views_daily(day DESC);

GRANT SELECT ON public.profile_views_daily TO authenticated;
GRANT ALL ON public.profile_views_daily TO service_role;

ALTER TABLE public.profile_views_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/managers can view all daily views"
  ON public.profile_views_daily FOR SELECT TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Owners can view their business daily views"
  ON public.profile_views_daily FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = profile_views_daily.business_id
      AND b.owner_id = auth.uid()
  ));

-- 2) search_queries_daily ----------------------------------------------
CREATE TABLE public.search_queries_daily (
  day date NOT NULL,
  query text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  hits integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (day, query, category, city)
);
CREATE INDEX idx_search_queries_daily_day ON public.search_queries_daily(day DESC);
CREATE INDEX idx_search_queries_daily_query ON public.search_queries_daily(query) WHERE query <> '';

GRANT SELECT ON public.search_queries_daily TO authenticated;
GRANT ALL ON public.search_queries_daily TO service_role;

ALTER TABLE public.search_queries_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/managers can view search counters"
  ON public.search_queries_daily FOR SELECT TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- 3) profile_view_dedupe (tiny short-lived helper) ---------------------
CREATE TABLE public.profile_view_dedupe (
  business_id uuid NOT NULL,
  day date NOT NULL,
  viewer_ip_hash text NOT NULL,
  PRIMARY KEY (business_id, day, viewer_ip_hash)
);
GRANT ALL ON public.profile_view_dedupe TO service_role;
ALTER TABLE public.profile_view_dedupe ENABLE ROW LEVEL SECURITY;
-- No policies = no client access. Service role bypasses RLS.

-- 4) Recording functions (SECURITY DEFINER, called via service role) ---
CREATE OR REPLACE FUNCTION public.record_profile_view(
  _business_id uuid,
  _viewer_ip_hash text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := current_date;
  v_is_new boolean := false;
BEGIN
  IF _viewer_ip_hash IS NOT NULL AND length(_viewer_ip_hash) > 0 THEN
    INSERT INTO public.profile_view_dedupe(business_id, day, viewer_ip_hash)
    VALUES (_business_id, v_today, _viewer_ip_hash)
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_is_new = ROW_COUNT;
  ELSE
    v_is_new := true; -- no hash -> count as unique conservatively
  END IF;

  INSERT INTO public.profile_views_daily(business_id, day, views, unique_viewers, updated_at)
  VALUES (_business_id, v_today, 1, CASE WHEN v_is_new THEN 1 ELSE 0 END, now())
  ON CONFLICT (business_id, day) DO UPDATE
    SET views = profile_views_daily.views + 1,
        unique_viewers = profile_views_daily.unique_viewers
          + CASE WHEN v_is_new THEN 1 ELSE 0 END,
        updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_profile_view(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_profile_view(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.record_search_query(
  _query text,
  _category text,
  _city text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q text := coalesce(lower(btrim(_query)), '');
  c text := coalesce(lower(btrim(_category)), '');
  ci text := coalesce(lower(btrim(_city)), '');
BEGIN
  IF q = '' AND c = '' AND ci = '' THEN
    RETURN;
  END IF;
  INSERT INTO public.search_queries_daily(day, query, category, city, hits, updated_at)
  VALUES (current_date, q, c, ci, 1, now())
  ON CONFLICT (day, query, category, city) DO UPDATE
    SET hits = search_queries_daily.hits + 1,
        updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_search_query(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_search_query(text, text, text) TO service_role;

-- 5) Backfill from existing raw tables (if they exist) -----------------
INSERT INTO public.profile_views_daily (business_id, day, views, unique_viewers, updated_at)
SELECT
  business_id,
  (created_at AT TIME ZONE 'UTC')::date AS day,
  count(*)::int AS views,
  count(DISTINCT viewer_ip_hash)::int AS unique_viewers,
  now()
FROM public.profile_views
GROUP BY business_id, (created_at AT TIME ZONE 'UTC')::date
ON CONFLICT (business_id, day) DO UPDATE
  SET views = EXCLUDED.views,
      unique_viewers = EXCLUDED.unique_viewers,
      updated_at = now();

INSERT INTO public.search_queries_daily (day, query, category, city, hits, updated_at)
SELECT
  (created_at AT TIME ZONE 'UTC')::date AS day,
  coalesce(lower(btrim(query)), '') AS query,
  coalesce(lower(btrim(category)), '') AS category,
  coalesce(lower(btrim(city)), '') AS city,
  count(*)::int AS hits,
  now()
FROM public.search_queries
GROUP BY 1, 2, 3, 4
ON CONFLICT (day, query, category, city) DO UPDATE
  SET hits = EXCLUDED.hits,
      updated_at = now();

-- 6) Drop old raw tables -----------------------------------------------
DROP TABLE IF EXISTS public.profile_views CASCADE;
DROP TABLE IF EXISTS public.search_queries CASCADE;

-- 7) Nightly trim of dedupe helper (keep today + yesterday) -----------
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('trim-profile-view-dedupe');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'trim-profile-view-dedupe',
  '15 0 * * *',
  $$DELETE FROM public.profile_view_dedupe WHERE day < current_date - INTERVAL '1 day';$$
);
