
-- Categories table for admin-managed category list
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  blurb text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads categories"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Bootstrap admin role for all existing profiles so the admin panel is usable.
-- After login, admins can demote others via /admin/managers.
UPDATE public.profiles SET role = 'admin' WHERE role = 'user';
