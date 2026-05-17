# Feature Spec — Product Catalogue & Smart Search

> Status: **Planned — not yet implemented**
> Priority: Post-launch, after platform stability is confirmed
> Plan gate: **Ultra only**

---

## Overview

Allows market businesses (type: "Produto") on the Ultra plan to import a product catalogue via CSV from their e-commerce store. Visitors can search for a product by name and see which shops carry it, sorted by proximity to their location.

---

## User Stories

### Business Owner (Ultra plan)
- I can upload a CSV file with my product catalogue (name, description, image URL, availability)
- I can toggle individual products as available or unavailable without re-importing
- I can re-import a new CSV to update my catalogue (merge or replace)
- I can see how many products are currently listed and how many are available

### Visitor (public, no account needed)
- I type a product name in the main search bar
- The system detects my query matches a product (not a business name) and shows product results
- I see a list of shops that carry that product, with availability status
- Shops are sorted by distance from my location (GPS first, manual city fallback)
- I can click a shop to go to its full profile page

---

## CSV Format

Expected columns (case-insensitive headers):

```csv
name,description,image_url,available
Arroz Tio João 5kg,Arroz branco tipo 1,https://myshop.co.nz/images/arroz.jpg,true
Feijão Carioca 1kg,Feijão carioca selecionado,https://myshop.co.nz/images/feijao.jpg,false
```

- `name` — required, product name (max 200 chars)
- `description` — optional, short description (max 500 chars)
- `image_url` — optional, external URL from the business's own site (not uploaded to Supabase Storage)
- `available` — optional, boolean (default: true)

---

## Database Schema

### Table: `products`

```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  description TEXT CHECK (length(description) <= 500),
  image_url TEXT,                    -- external URL from business's own site
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full-text search index for product name
CREATE INDEX products_name_fts ON public.products
  USING GIN (to_tsvector('portuguese', name || ' ' || COALESCE(description, '')));

-- Index for fast lookup by business
CREATE INDEX products_business_id ON public.products (business_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public reads available products of active businesses
CREATE POLICY "Public reads available products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (
    is_available = true AND
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.is_active = true
    )
  );

-- Ultra owner manages own products
CREATE POLICY "Ultra owner manages own products"
  ON public.products FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.profiles p ON p.id = b.owner_id
      WHERE b.id = business_id
        AND b.owner_id = auth.uid()
        AND p.plan_tier = 'ultra'
    )
  );
```

### Businesses table addition

The `businesses` table needs a `coordinates` column for proximity sorting:

```sql
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 7);

-- Spatial index (if using PostGIS, otherwise use lat/lng math)
CREATE INDEX businesses_location ON public.businesses (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;
```

---

## Server Functions

File: `src/lib/products.functions.ts`

### `importProductsCSV({ csv: string })`
- Parses CSV on the server
- Validates each row (name required, image_url must be a valid URL if provided)
- Upserts into `products` table (match on `business_id + name` to avoid duplicates on re-import)
- Returns `{ imported: number, skipped: number, errors: string[] }`
- Verifies caller is Ultra plan before proceeding

### `getMyProducts()`
- Returns all products for the authenticated business owner
- Includes available and unavailable

### `toggleProductAvailability(productId: string, available: boolean)`
- Updates `is_available` for a single product
- Verifies ownership

### `deleteProduct(productId: string)`
- Removes a single product

### `searchProducts(query: string, lat?: number, lng?: number, city?: string)`
- Full-text search across `products.name` and `products.description`
- Joins with `businesses` to get shop info
- If `lat`/`lng` provided: sorts by Haversine distance
- If only `city` provided: filters by `businesses.locations` containing that city
- Returns: list of `{ product, business, distance_km? }`
- Only returns products where `is_available = true` and business `is_active = true`

---

## Smart Search Detection Logic

The main search bar (`SearchBar` component) needs to detect whether a query is a product search or a business search. Logic:

```
User types query → debounce 300ms
  → Run both queries in parallel:
      1. searchBusinesses(query)   — existing logic
      2. searchProducts(query)     — new
  → If products results > 0 AND business results < 3:
      → Show product results view
  → Else:
      → Show business results view (existing behaviour)
  → If both have results:
      → Show tabs: "Negócios" | "Produtos"
```

This keeps the existing search behaviour intact and only surfaces product results when relevant.

---

## UI — Dashboard (Ultra only)

New route: `src/routes/dashboard.products.tsx`

Sections:
1. **Import** — drag-and-drop or file picker for CSV, shows import summary after upload
2. **Catalogue** — table/grid of all products with toggle switch for availability, delete button
3. **Stats** — total products, available count, last import date

Add "Catálogo" to the dashboard sidebar in `DashboardLayout` — visible only for Ultra plan.

---

## UI — Public Search Results

When product results are shown, each result card displays:
- Product image (from `image_url`, with fallback placeholder)
- Product name + description snippet
- Shop name + logo
- Distance from user (e.g. "2.3 km away") or city name if no GPS
- Availability badge: "Disponível" (green) or "Indisponível" (red)
- Link to the shop's full profile

---

## Location Strategy

1. On page load, request `navigator.geolocation.getCurrentPosition()`
2. If granted → store `{ lat, lng }` in component state
3. If denied or unavailable → show city selector (dropdown of NZ cities, same list as `NZ_CITIES` in `src/lib/mock/categories.ts`)
4. Pass coordinates or city to `searchProducts()`

Businesses need their coordinates stored. Options:
- Owner enters their address in the profile editor → geocode via Google Geocoding API on save → store `lat`/`lng`
- Or: owner selects city from dropdown → use city centroid coordinates (simpler, less precise but good enough for NZ)

**Recommendation:** Use city centroid for V1 (simpler, no extra API cost). Exact address geocoding can come in V2.

---

## Plan Gate

- Feature is **Ultra only**
- In `src/lib/plans.ts`, add: `productCatalogue: { starter: false, premium: false, ultra: true }`
- Dashboard route shows `<LockedFeatureCard>` for non-Ultra users
- `importProductsCSV()` server function verifies plan before executing

---

## Cost Impact

| Component | Cost |
|---|---|
| Supabase storage for products table | Negligible (text data only, no file uploads) |
| Full-text search (pg_trgm / GIN index) | $0 — built into PostgreSQL |
| Image loading | $0 — images served from business's own CDN via URL |
| Google Geocoding (if used for exact address) | ~$5 per 1,000 geocoding requests |
| City centroid approach | $0 |

This feature adds essentially zero infrastructure cost at any scale.

---

## Implementation Order (when ready)

1. Add `productCatalogue` to `src/lib/plans.ts`
2. Add `lat`/`lng` columns to `businesses` migration
3. Create `products` table migration
4. Create `src/lib/products.functions.ts`
5. Create `src/routes/dashboard.products.tsx`
6. Add "Catálogo" to `DashboardLayout` sidebar (Ultra only)
7. Update `SearchBar` with smart detection + product results view
8. Add location detection hook

---

## Open Questions (decide before implementing)

- Should unavailable products still appear in search results with a "Indisponível" badge, or be hidden entirely? (Current spec: hidden)
- Should the product search also work as a tab on the business profile page (showing that shop's full catalogue)?
- Price field — do you want to add an optional price column to the CSV in the future?
