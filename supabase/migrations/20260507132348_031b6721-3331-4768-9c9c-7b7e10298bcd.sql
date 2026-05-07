
CREATE TABLE public.waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL CHECK (length(business_name) BETWEEN 1 AND 200),
  owner_name TEXT NOT NULL CHECK (length(owner_name) BETWEEN 1 AND 200),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 320),
  whatsapp_number TEXT NOT NULL CHECK (length(whatsapp_number) BETWEEN 5 AND 32),
  service_category TEXT NOT NULL CHECK (length(service_category) BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX waitlist_signups_email_unique ON public.waitlist_signups (lower(email));

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anonymous) to sign up to the waitlist
CREATE POLICY "Anyone can insert to waitlist"
  ON public.waitlist_signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies — admin reads go through service-role server functions only.
