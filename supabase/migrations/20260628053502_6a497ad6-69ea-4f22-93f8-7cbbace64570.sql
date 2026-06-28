
-- Lookup a single auth user by email. SECURITY DEFINER so callers
-- (service-role server functions) can read auth.users via a stable RPC,
-- avoiding O(n) listUsers() scans that break at scale.
CREATE OR REPLACE FUNCTION public.get_auth_user_by_email(_email text)
RETURNS TABLE (
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id, u.email::text, u.email_confirmed_at, u.raw_user_meta_data
  FROM auth.users u
  WHERE lower(u.email) = lower(btrim(_email))
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.get_auth_user_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user_by_email(text) TO service_role;

-- Batch lookup auth users by a list of IDs for admin listings.
CREATE OR REPLACE FUNCTION public.get_auth_users_by_ids(_ids uuid[])
RETURNS TABLE (
  id uuid,
  email text,
  raw_user_meta_data jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id, u.email::text, u.raw_user_meta_data
  FROM auth.users u
  WHERE u.id = ANY(_ids)
$$;

REVOKE EXECUTE ON FUNCTION public.get_auth_users_by_ids(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_users_by_ids(uuid[]) TO service_role;
