
-- Explicit no-op policy so the linter sees RLS+policy and treats it as locked.
-- No grants exist for anon/authenticated on this table, so it remains server-only.
CREATE POLICY "No client access" ON public.profile_view_dedupe
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);
