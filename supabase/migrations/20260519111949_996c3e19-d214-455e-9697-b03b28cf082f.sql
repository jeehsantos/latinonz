-- Security definer helper to check admin/manager role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id
      AND p.role IN ('admin', 'manager')
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin_or_manager(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager(uuid) TO authenticated;

-- Admins and managers can read every business
DROP POLICY IF EXISTS "Admins read all businesses" ON public.businesses;
CREATE POLICY "Admins read all businesses"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- Admins and managers can update any business (approve / lock / unlock)
DROP POLICY IF EXISTS "Admins update any business" ON public.businesses;
CREATE POLICY "Admins update any business"
  ON public.businesses
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));
