
CREATE TABLE public.search_queries (
  id uuid primary key default gen_random_uuid(),
  query text,
  category text,
  city text,
  created_at timestamptz not null default now()
);
CREATE INDEX search_queries_created_at_idx ON public.search_queries(created_at DESC);
CREATE INDEX search_queries_query_idx ON public.search_queries(lower(query));

GRANT INSERT ON public.search_queries TO anon, authenticated;
GRANT SELECT ON public.search_queries TO authenticated;
GRANT ALL ON public.search_queries TO service_role;

ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert search queries"
  ON public.search_queries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins/managers can read search queries"
  ON public.search_queries FOR SELECT
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));
