REVOKE EXECUTE ON FUNCTION public.is_admin_or_manager(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can insert search queries" ON public.search_queries;
CREATE POLICY "Anyone can insert search queries"
  ON public.search_queries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (query IS NULL OR length(query) <= 200)
    AND (category IS NULL OR length(category) <= 100)
    AND (city IS NULL OR length(city) <= 100)
  );

REVOKE SELECT ON public.app_config FROM anon;
GRANT SELECT (key, value, updated_at) ON public.app_config TO anon;

REVOKE SELECT ON public.business_branches FROM anon;
GRANT SELECT (id, business_id, location, address_street, address_suburb, position, created_at, updated_at)
  ON public.business_branches TO anon;

DROP POLICY IF EXISTS "Owner deletes own leads" ON public.leads;
CREATE POLICY "Owner deletes own leads"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = leads.business_id AND b.owner_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_or_manager(auth.uid()) OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.plan_tier IS DISTINCT FROM OLD.plan_tier
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
  THEN
    RAISE EXCEPTION 'Not allowed to modify privileged profile fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();