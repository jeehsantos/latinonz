
CREATE POLICY "Admins read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins read waitlist signups"
ON public.waitlist_signups
FOR SELECT
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));
