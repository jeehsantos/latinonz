import type { Business } from "@/lib/mock/types";
import type { PlanTier } from "@/lib/plans";

type DbBusinessRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_group?: string | null;
  macro_category: string;
  subcategory: string | null;
  tags: string[] | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  locations: string[] | null;
  logo_url?: string | null;
  is_verified?: boolean;
  fast_responder?: boolean;
  response_time?: string | null;
  rating: number | null;
  review_count: number | null;
  address_street?: string | null;
  address_suburb?: string | null;
  google_place_id?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
};

/**
 * Map a DB businesses row into the legacy `Business` shape used by the
 * directory and business profile components.
 */
export function adaptBusiness(row: DbBusinessRow, plan: PlanTier = "starter"): Business {
  return {
    id: row.id,
    slug: row.slug,
    type: "Empresa",
    name: row.name,
    description: row.description ?? "",
    macro: row.macro_category,
    categoryGroup: row.category_group ?? null,
    subcategory: row.subcategory ?? "",
    location: (row.locations && row.locations[0]) || "",
    locations: row.locations ?? [],
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count ?? 0,
    plan,
    contactKind: row.website ? "website" : row.phone ? "whatsapp" : "instagram",
    logoUrl: row.logo_url ?? undefined,
    tags: row.tags ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    responseTime: row.response_time ?? undefined,
    fastResponder: row.fast_responder ?? undefined,
    addressStreet: row.address_street ?? undefined,
    addressSuburb: row.address_suburb ?? undefined,
    googlePlaceId: row.google_place_id ?? null,
    facebookUrl: row.facebook_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
  };
}
