
-- 1. Prevent privilege escalation via profiles self-update
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role (server-side admin client) and admins/managers bypass
  IF auth.role() = 'service_role' OR public.is_admin_or_manager(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Not allowed to modify role';
  END IF;
  IF NEW.plan_tier IS DISTINCT FROM OLD.plan_tier THEN
    RAISE EXCEPTION 'Not allowed to modify plan_tier';
  END IF;
  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    RAISE EXCEPTION 'Not allowed to modify subscription_status';
  END IF;
  IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
    RAISE EXCEPTION 'Not allowed to modify stripe_customer_id';
  END IF;
  IF NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN
    RAISE EXCEPTION 'Not allowed to modify stripe_subscription_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_priv_esc ON public.profiles;
CREATE TRIGGER profiles_prevent_priv_esc
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2. Anonymize viewer IPs in profile_views (rename + hash)
ALTER TABLE public.profile_views RENAME COLUMN viewer_ip TO viewer_ip_hash;

-- 3. Lock down SECURITY DEFINER helpers from anon/authenticated callers.
-- They are still callable from within RLS policies (postgres-owned context).
REVOKE EXECUTE ON FUNCTION public.is_admin_or_manager(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.list_admin_managers() FROM PUBLIC, anon;
-- list_admin_managers needs to be callable by signed-in admins/managers via PostgREST.
-- The function itself gates results via is_admin_or_manager(auth.uid()).
GRANT EXECUTE ON FUNCTION public.list_admin_managers() TO authenticated;

-- 4. Restrict public storage bucket listing.
-- Public file URLs (CDN) still work; only the storage.objects SELECT (list) API is gated.
DROP POLICY IF EXISTS "Public read business-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Public read business-logos" ON storage.objects;

CREATE POLICY "Owner lists own gallery"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'business-gallery' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner lists own logo"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'business-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 5. Tighten always-true INSERT policies with minimal validation
DROP POLICY IF EXISTS "Anyone can submit waitlist signup" ON public.waitlist_signups;
CREATE POLICY "Anyone can submit waitlist signup"
ON public.waitlist_signups FOR INSERT TO anon, authenticated
WITH CHECK (
  length(trim(business_name)) BETWEEN 1 AND 200
  AND length(trim(owner_name)) BETWEEN 1 AND 200
  AND length(trim(email)) BETWEEN 3 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(trim(whatsapp_number)) BETWEEN 5 AND 32
  AND length(trim(service_category)) BETWEEN 1 AND 100
);

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead"
ON public.leads FOR INSERT TO anon, authenticated
WITH CHECK (
  length(trim(name)) BETWEEN 1 AND 200
  AND (email IS NULL OR length(trim(email)) BETWEEN 3 AND 320)
  AND (phone IS NULL OR length(trim(phone)) BETWEEN 3 AND 32)
  AND (message IS NULL OR length(message) <= 2000)
  AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = leads.business_id AND b.is_active = true
  )
);

DROP POLICY IF EXISTS "Anyone can log a view" ON public.profile_views;
CREATE POLICY "Anyone can log a view"
ON public.profile_views FOR INSERT TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = profile_views.business_id AND b.is_active = true
  )
);
