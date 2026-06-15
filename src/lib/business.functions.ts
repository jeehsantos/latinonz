import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import categoriesData from "@/lib/categories.json";

const GROUP_IDS = new Set<string>(categoriesData.groups.map((g) => g.id));


const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const listFilterSchema = z.object({
  category: z.string().trim().min(1).max(100).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  q: z.string().trim().min(1).max(200).optional(),
});

const slugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
});

const updateBusinessSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  category_group: z.string().trim().min(1).max(50).nullable().optional(),
  macro_category: z.string().trim().min(1).max(100).optional(),
  subcategory: z.string().trim().max(100).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  phone: z.string().trim().max(32).nullable().optional(),
  email: z.string().trim().toLowerCase().email().max(320).nullable().optional(),
  website: z.string().trim().url().max(500).nullable().optional(),
  facebook_url: z.string().trim().url().max(500).nullable().optional(),
  instagram_url: z.string().trim().url().max(500).nullable().optional(),
  locations: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  keywords: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  google_place_id: z.string().trim().max(200).nullable().optional(),
  response_time: z.string().trim().max(50).nullable().optional(),
  address_street: z.string().trim().max(200).nullable().optional(),
  address_suburb: z.string().trim().max(100).nullable().optional(),
  language_preference: z.enum(["pt", "es", "en"]).optional(),
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

const updateBranchesSchema = z.object({
  branches: z
    .array(
      z.object({
        location: z.string().trim().min(1).max(100),
        address_street: z.string().trim().max(200).nullable().optional(),
        address_suburb: z.string().trim().max(100).nullable().optional(),
        phone: z.string().trim().max(32).nullable().optional(),
      }),
    )
    .max(20),
});

const updateServiceOptionItemsSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80),
        description: z.string().trim().max(200).nullable().optional(),
        icon_key: z.string().trim().min(1).max(40),
      }),
    )
    .max(20),
});

// Public — list businesses with filters
export const getBusinesses = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => listFilterSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("businesses")
      .select(
        "id, slug, name, description, category_group, macro_category, subcategory, tags, locations, logo_url, is_verified, fast_responder, response_time, rating, review_count, address_street, address_suburb",
      )
      .eq("is_active", true)
      .order("rating", { ascending: false });

    if (data.category) {
      if (GROUP_IDS.has(data.category)) {
        query = query.eq("category_group", data.category);
      } else {
        query = query.eq("macro_category", data.category);
      }
    }
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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

    const [
      { data: hours },
      { data: serviceOptions },
      { data: serviceOptionItems },
      { data: photos },
      { data: coupons },
      { data: branches },
    ] = await Promise.all([
      supabaseAdmin.from("business_hours").select("*").eq("business_id", business.id),
      supabaseAdmin
        .from("service_options")
        .select("*")
        .eq("business_id", business.id)
        .maybeSingle(),
      supabaseAdmin
        .from("service_option_items")
        .select("id, title, description, icon_key, position")
        .eq("business_id", business.id)
        .order("position", { ascending: true }),
      supabaseAdmin
        .from("business_photos")
        .select("id, url, position")
        .eq("business_id", business.id)
        .order("position", { ascending: true }),
      supabaseAdmin
        .from("coupons")
        .select("id, code, title, description, expires_at, discount_type, discount_value")
        .eq("business_id", business.id)
        .eq("is_active", true),
      supabaseAdmin
        .from("business_branches")
        .select("id, location, address_street, address_suburb, phone, position")
        .eq("business_id", business.id)
        .order("position", { ascending: true }),
    ]);

    // Resolve owner plan tier separately so any failure here can be logged and
    // does not silently mask the business response with a starter fallback.
    let plan: "starter" | "premium" | "ultra" = "starter";
    if (business.owner_id) {
      const { data: profileRow, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("plan_tier")
        .eq("id", business.owner_id)
        .maybeSingle();
      if (profileError) {
        console.error(
          `[getBusinessBySlug] plan_tier lookup failed for slug=${business.slug} owner=${business.owner_id}:`,
          profileError,
        );
      }
      const rawTier = profileRow?.plan_tier ?? null;
      if (rawTier === "premium" || rawTier === "ultra") {
        plan = rawTier;
      }
      console.log(
        `[getBusinessBySlug] slug=${business.slug} owner=${business.owner_id} rawTier=${rawTier} resolvedPlan=${plan}`,
      );
    } else {
      console.warn(`[getBusinessBySlug] business ${business.slug} has no owner_id`);
    }



    return {
      ok: true as const,
      business,
      plan,
      hours: hours ?? [],
      serviceOptions: serviceOptions ?? null,
      serviceOptionItems: serviceOptionItems ?? [],
      photos: photos ?? [],
      coupons: coupons ?? [],
      branches: branches ?? [],
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
      return {
        ok: true as const,
        business: null,
        hours: [],
        serviceOptions: null,
        serviceOptionItems: [],
        branches: [],
      };
    }

    const [
      { data: hours },
      { data: serviceOptions },
      { data: serviceOptionItems },
      { data: branches },
    ] = await Promise.all([
      supabase.from("business_hours").select("*").eq("business_id", business.id),
      supabase.from("service_options").select("*").eq("business_id", business.id).maybeSingle(),
      supabase
        .from("service_option_items")
        .select("id, title, description, icon_key, position")
        .eq("business_id", business.id)
        .order("position", { ascending: true }),
      supabase
        .from("business_branches")
        .select("id, location, address_street, address_suburb, phone, position")
        .eq("business_id", business.id)
        .order("position", { ascending: true }),
    ]);

    return {
      ok: true as const,
      business,
      hours: hours ?? [],
      serviceOptions: serviceOptions ?? null,
      serviceOptionItems: serviceOptionItems ?? [],
      branches: branches ?? [],
    };
  });

// Authenticated — replace business branches for the owner's business
export const updateBusinessBranches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateBranchesSchema.parse(input))
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

    const { error: delError } = await supabase
      .from("business_branches")
      .delete()
      .eq("business_id", business.id);
    if (delError) {
      console.error("updateBusinessBranches delete error", delError);
      return { ok: false as const, error: delError.message };
    }

    if (data.branches.length === 0) {
      return { ok: true as const, branches: [] };
    }

    const rows = data.branches.map((b, idx) => ({
      business_id: business.id,
      location: b.location,
      address_street: b.address_street ?? null,
      address_suburb: b.address_suburb ?? null,
      phone: b.phone ?? null,
      position: idx,
    }));

    const { data: inserted, error: insError } = await supabase
      .from("business_branches")
      .insert(rows)
      .select();

    if (insError) {
      console.error("updateBusinessBranches insert error", insError);
      return { ok: false as const, error: insError.message };
    }
    return { ok: true as const, branches: inserted ?? [] };
  });

// Authenticated — update own business (auto-creates row on first save)
export const updateMyBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateBusinessSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing, error: findError } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (findError) {
      console.error("updateMyBusiness find error", findError);
      return { ok: false as const, error: findError.message, errorKey: "save_generic" };
    }

    if (!existing) {
      if (!data.name || !data.name.trim()) {
        return {
          ok: false as const,
          error: "Nome do negócio é obrigatório.",
          errorKey: "save_name_required",
        };
      }
      const baseSlug =
        data.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 60) || "negocio";
      const slug = `${baseSlug}-${userId.slice(0, 6)}`;

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: created, error: createError } = await supabaseAdmin
        .from("businesses")
        .insert({
          owner_id: userId,
          slug,
          name: data.name,
          description: data.description ?? null,
          category_group: data.category_group ?? null,
          macro_category: data.macro_category ?? "Outros",
          subcategory: data.subcategory ?? null,
          tags: data.tags ?? [],
          phone: data.phone ?? null,
          email: data.email ?? null,
          website: data.website ?? null,
          facebook_url: data.facebook_url ?? null,
          instagram_url: data.instagram_url ?? null,
          locations: data.locations ?? [],
          keywords: data.keywords ?? [],
          google_place_id: data.google_place_id ?? null,
          response_time: data.response_time ?? null,
          address_street: data.address_street ?? null,
          address_suburb: data.address_suburb ?? null,
          language_preference: data.language_preference ?? "en",
        })
        .select()
        .maybeSingle();

      if (createError || !created) {
        console.error("updateMyBusiness create error", createError);
        return {
          ok: false as const,
          error: createError?.message ?? "Não foi possível criar o negócio.",
          errorKey: "save_generic",
        };
      }
      return { ok: true as const, business: created };
    }

    const { data: updated, error } = await supabase
      .from("businesses")
      .update(data)
      .eq("owner_id", userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("updateMyBusiness error", error);
      return { ok: false as const, error: error.message, errorKey: "save_generic" };
    }
    if (!updated) {
      return { ok: false as const, error: "Negócio não encontrado.", errorKey: "save_not_found" };
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

// Authenticated — replace custom service option items for the owner's business
export const updateServiceOptionItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateServiceOptionItemsSchema.parse(input))
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

    const { error: delError } = await supabase
      .from("service_option_items")
      .delete()
      .eq("business_id", business.id);
    if (delError) {
      console.error("updateServiceOptionItems delete error", delError);
      return { ok: false as const, error: delError.message };
    }

    if (data.items.length === 0) {
      return { ok: true as const, items: [] };
    }

    const rows = data.items.map((it, idx) => ({
      business_id: business.id,
      title: it.title,
      description: it.description ?? null,
      icon_key: it.icon_key,
      position: idx,
    }));

    const { data: inserted, error: insError } = await supabase
      .from("service_option_items")
      .insert(rows)
      .select();

    if (insError) {
      console.error("updateServiceOptionItems insert error", insError);
      return { ok: false as const, error: insError.message };
    }
    return { ok: true as const, items: inserted ?? [] };
  });
