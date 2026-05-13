-- Add INSERT-only policy so anonymous visitors can submit signups via the public client.
-- No SELECT/UPDATE/DELETE policies are added: reads remain server-side only via the service role.
CREATE POLICY "Anyone can submit waitlist signup"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (true);