ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_suburb text;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_address_street_check CHECK (address_street IS NULL OR length(address_street) <= 200),
  ADD CONSTRAINT businesses_address_suburb_check CHECK (address_suburb IS NULL OR length(address_suburb) <= 100);

GRANT SELECT (address_street, address_suburb) ON public.businesses TO anon;