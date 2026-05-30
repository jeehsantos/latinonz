
CREATE OR REPLACE FUNCTION public.get_owner_plan_tier(p_owner uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT plan_tier FROM public.profiles WHERE id = p_owner
$$;

GRANT EXECUTE ON FUNCTION public.get_owner_plan_tier(uuid) TO anon, authenticated, service_role;
