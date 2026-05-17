import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUSINESS_TYPES = ["Serviço", "Produto", "ONG", "Grupo"] as const;
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const listFilterSchema = z.object({
  category: z.string().trim().min(1).max(100).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  q: z.string().trim().min(1).max(200).optional(),
});

const slugSchema = z.object({
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/),
});

const updateBusinessSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(500).optional(),
  type: z.enum(BUSINESS_TYPES).optional(),
  macro_category: z.string().trim().min(1).max(100).optional(),
  subcategory: z.string().trim().max(100).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  phone: z.string().trim().max(32).nullable().optional(),
  email: z.string().trim().toLowerCase().email().max(320).nullable().optional(),
  website: z.string().trim().url().max(500).nullable().optional(),
  locations: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  keywords: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  google_place_id: z.string().trim().max(200).nullable().optional(),
  response_time: z.string().trim().max(50).nullable().optional(),
});

const slotSchema = z.object({
  open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

const updateHoursSchema = z.object({
  hours: z
    .array(
      z.object({
        location: z.string().trim().min(1).max(100),
        day_key: z.enum(DAY_KEYS),
        is_closed: z.boolean(),
        slots: z.array(slotSchema).max(6),
      }),
    )
    .max(7 * 20),
});

const updateServiceOptionsSchema = z.object({
  takeaway: z.boolean(),
  dinein: z.boolean(),
  delivery: z.boolean(),
  booking: z.boolean(),
  other: z.string().trim().max(200).nullable().optional(),
});

// Public — list businesses with filters
export const getBusinesses = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => listFilterSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from("businesses")
      .select(
        "id, slug, name, description, type, macro_category, subcategory, tags, locations, logo_url, is_verified, fast_responder, response_time, rating, review_count",
      )
      .eq("is_active", true)
      .order("rating", { ascending: false });

    if (data.category) query = query.eq("macro_category", data.category);
    if (data.city) query = query.contains("locations", [data.city]);
    if (data.q) query = query.ilike("name", `%${data.q}%`);

    const { data: rows, error } = await query.limit(200);
    if (error) {
      console.error("getBusinesses error", error);
      return { ok: false as const, error: "Erro ao carregar negócios.", rows: [] };
    }
    return { ok: true as const, rows: rows ?? [] };
  });

// Public — single business by slug
export const getBusinessBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => slugSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: business, error } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("getBusinessBySlug error", error);
      return { ok: false as const, error: "Erro ao carregar perfil." };
    }
    if (!business) {
      return { ok: false as const, error: "Negócio não encontrado." };
    }

    const [{ data: hours }, { data: serviceOptions }] = await Promise.all([
      supabaseAdmin.from("business_hours").select("*").eq("business_id", business.id),
      supabaseAdmin
        .from("service_options")
        .select("*")
        .eq("business_id", business.id)
        .maybeSingle(),
    ]);

    return {
      ok: true as const,
      business,
      hours: hours ?? [],
      serviceOptions: serviceOptions ?? null,
    };
  });

// Authenticated — current user's business
export const getMyBusiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    if (error) {
      console.error("getMyBusiness error", error);
      return { ok: false as const, error: "Erro ao carregar perfil." };
    }
    if (!business) {
      return { ok: true as const, business: null, hours: [], serviceOptions: null };
    }

    const [{ data: hours }, { data: serviceOptions }] = await Promise.all([
      supabase.from("business_hours").select("*").eq("business_id", business.id),
      supabase
        .from("service_options")
        .select("*")
        .eq("business_id", business.id)
        .maybeSingle(),
    ]);

    return {
      ok: true as const,
      business,
      hours: hours ?? [],
      serviceOptions: serviceOptions ?? null,
    };
  });

// Authenticated — update own business
export const updateMyBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateBusinessSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: updated, error } = await supabase
      .from("businesses")
      .update(data)
      .eq("owner_id", userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("updateMyBusiness error", error);
      return { ok: false as const, error: error.message };
    }
    if (!updated) {
      return { ok: false as const, error: "Negócio não encontrado." };
    }
    return { ok: true as const, business: updated };
  });

// Authenticated — replace business hours for the owner's business
export const updateBusinessHours = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateHoursSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (bizError || !business) {
      return { ok: false as const, error: "Negócio não encontrado." };
    }

    const rows = data.hours.map((h) => ({
      business_id: business.id,
      location: h.location,
      day_key: h.day_key,
      is_closed: h.is_closed,
      slots: h.slots,
    }));

    const { error: delError } = await supabase
      .from("business_hours")
      .delete()
      .eq("business_id", business.id);
    if (delError) {
      console.error("updateBusinessHours delete error", delError);
      return { ok: false as const, error: delError.message };
    }

    if (rows.length === 0) {
      return { ok: true as const, hours: [] };
    }

    const { data: inserted, error: insError } = await supabase
      .from("business_hours")
      .insert(rows)
      .select();

    if (insError) {
      console.error("updateBusinessHours insert error", insError);
      return { ok: false as const, error: insError.message };
    }
    return { ok: true as const, hours: inserted ?? [] };
  });

// Authenticated — upsert service options for the owner's business
export const updateServiceOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateServiceOptionsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (bizError || !business) {
      return { ok: false as const, error: "Negócio não encontrado." };
    }

    const { data: upserted, error } = await supabase
      .from("service_options")
      .upsert(
        {
          business_id: business.id,
          takeaway: data.takeaway,
          dinein: data.dinein,
          delivery: data.delivery,
          booking: data.booking,
          other: data.other ?? null,
        },
        { onConflict: "business_id" },
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error("updateServiceOptions error", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const, serviceOptions: upserted };
  });
