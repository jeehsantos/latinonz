CREATE TABLE public.google_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  google_review_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_photo_url TEXT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  published_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, google_review_id)
);

CREATE INDEX idx_google_reviews_business_id ON public.google_reviews(business_id);
CREATE INDEX idx_google_reviews_published_at ON public.google_reviews(business_id, published_at DESC);

ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads google reviews"
  ON public.google_reviews FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_active = true)
  );