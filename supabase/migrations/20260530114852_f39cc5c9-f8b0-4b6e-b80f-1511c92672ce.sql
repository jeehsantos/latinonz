
-- 1. Restrict get_owner_plan_tier RPC to service_role only (server-side admin)
REVOKE EXECUTE ON FUNCTION public.get_owner_plan_tier(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_owner_plan_tier(uuid) FROM anon, authenticated;

-- 2. Restrict trigger-only functions from direct callers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- 3. Column-level restriction on profiles - hide Stripe IDs from authenticated users
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, role, plan_tier, subscription_status, created_at, updated_at)
  ON public.profiles TO authenticated;

-- 4. Hide email and owner_id from public reads on businesses
REVOKE SELECT ON public.businesses FROM anon;
GRANT SELECT (
  id, slug, name, description, type, macro_category, subcategory, tags,
  phone, website, locations, keywords, logo_url, google_place_id,
  is_verified, is_active, response_time, rating, review_count, view_count,
  fast_responder, created_at, updated_at
) ON public.businesses TO anon;

-- Authenticated users still need full row access for their own business (owner policy)
-- and admins (admin policy) - keep full select for authenticated
GRANT SELECT ON public.businesses TO authenticated;

-- 5. Hide storage_path from public reads on business_photos
REVOKE SELECT ON public.business_photos FROM anon;
GRANT SELECT (id, business_id, url, position, created_at)
  ON public.business_photos TO anon;
GRANT SELECT ON public.business_photos TO authenticated;
