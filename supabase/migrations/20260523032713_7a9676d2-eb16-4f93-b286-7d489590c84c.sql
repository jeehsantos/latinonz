-- 1. Make handle_new_user idempotent and re-attach the auth.users trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any auth.users that don't yet have a profile row
INSERT INTO public.profiles (id)
SELECT u.id FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 2. Admin-only RPC to change a business owner's plan tier
CREATE OR REPLACE FUNCTION public.admin_set_business_plan(
  _business_id uuid,
  _plan text
)
RETURNS TABLE(owner_id uuid, plan_tier text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF NOT public.is_admin_or_manager(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: admin or manager role required';
  END IF;

  IF _plan NOT IN ('starter','premium','ultra') THEN
    RAISE EXCEPTION 'Invalid plan: %', _plan;
  END IF;

  SELECT b.owner_id INTO v_owner
  FROM public.businesses b
  WHERE b.id = _business_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Business owner not found';
  END IF;

  INSERT INTO public.profiles (id, plan_tier)
  VALUES (v_owner, _plan)
  ON CONFLICT (id) DO UPDATE SET plan_tier = EXCLUDED.plan_tier;

  RETURN QUERY
  SELECT p.id, p.plan_tier FROM public.profiles p WHERE p.id = v_owner;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_business_plan(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_business_plan(uuid, text) TO authenticated;