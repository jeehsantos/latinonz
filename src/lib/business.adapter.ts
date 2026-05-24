import type { Business } from "@/lib/mock/types";

type DbBusinessRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: string;
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
};

/**
 * Map a DB businesses row into the legacy `Business` shape used by the
 * directory and business profile components. Keeps the UI untouched while
 * the data source moves from mock to Supabase.
 */
export function adaptBusiness(row: DbBusinessRow): Business {
  const typeUi: Business["type"] =
    row.type === "Produto" || row.type === "Serviço" ? "Empresa" : "Empresa";

  return {
    id: row.id,
    slug: row.slug,
    type: typeUi,
    name: row.name,
    description: row.description ?? "",
    macro: row.macro_category,
    subcategory: row.subcategory ?? "",
    location: (row.locations && row.locations[0]) || "",
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count ?? 0,
    plan: "starter",
    contactKind: row.website ? "website" : row.phone ? "whatsapp" : "instagram",
    logoUrl: row.logo_url ?? undefined,
    tags: row.tags ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    responseTime: row.response_time ?? undefined,
    fastResponder: row.fast_responder ?? undefined,
  };
}
