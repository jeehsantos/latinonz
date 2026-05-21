// Admin / manager server functions. All handlers verify the calling user has
// role 'admin' or 'manager' on public.profiles before performing privileged
// reads or writes via the admin Supabase client (RLS bypassed).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  deleteAdminManager,
  inviteAdminManager,
  listAdminManagers,
  requireAdminRole,
  type AdminRole,
} from "@/lib/admin-managers.server";

// ---------- Businesses ----------

export const getAdminBusinesses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        filter: z.enum(["all", "pending", "active", "blocked"]).optional(),
        query: z.string().max(200).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.userId, context.supabase);

    let q = supabaseAdmin
      .from("businesses")
      .select(
        "id, name, slug, macro_category, subcategory, locations, is_active, is_verified, rating, review_count, view_count, owner_id, created_at, updated_at",
      )
      .order("created_at", { ascending: false });

    switch (data.filter) {
      case "pending":
        q = q.eq("is_verified", false).eq("is_active", true);
        break;
      case "active":
        q = q.eq("is_active", true).eq("is_verified", true);
        break;
      case "blocked":
        q = q.eq("is_active", false);
        break;
      default:
        break;
    }

    if (data.query && data.query.trim()) {
      const term = data.query.trim().replace(/[,%]/g, " ");
      q = q.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
    }

    const { data: rows, error } = await q.limit(500);
    if (error) throw new Error(error.message);

    const ownerIds = Array.from(new Set((rows ?? []).map((r) => r.owner_id).filter(Boolean)));
    const planByOwner = new Map<string, "starter" | "premium" | "ultra">();
    if (ownerIds.length > 0) {
      const { data: profs, error: profErr } = await supabaseAdmin
        .from("profiles")
        .select("id, plan_tier")
        .in("id", ownerIds);
      if (profErr) throw new Error(profErr.message);
      for (const p of profs ?? []) {
        const tier = (p.plan_tier ?? "starter") as "starter" | "premium" | "ultra";
        planByOwner.set(p.id, tier);
      }
    }

    const businesses = (rows ?? []).map((b) => ({
      ...b,
      plan_tier: planByOwner.get(b.owner_id) ?? ("starter" as const),
      city: Array.isArray(b.locations) && b.locations.length > 0 ? String(b.locations[0]) : null,
    }));

    return { businesses };
  });


export const approveBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ businessId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.userId, context.supabase);
    const { error } = await supabaseAdmin
      .from("businesses")
      .update({ is_verified: true })
      .eq("id", data.businessId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const lockBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ businessId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.userId, context.supabase);
    const { error } = await supabaseAdmin
      .from("businesses")
      .update({ is_active: false })
      .eq("id", data.businessId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const unlockBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ businessId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.userId, context.supabase);
    const { error } = await supabaseAdmin
      .from("businesses")
      .update({ is_active: true })
      .eq("id", data.businessId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ---------- Metrics ----------

const PLAN_PRICES_NZD: Record<string, number> = {
  starter: 0,
  premium: 49,
  ultra: 99,
};

export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminRole(context.userId, context.supabase);

    const [businessesRes, profilesRes, leadsRes, viewsRes, waitlistRes] = await Promise.all([
      supabaseAdmin.from("businesses").select("id, macro_category, is_active, is_verified"),
      supabaseAdmin
        .from("profiles")
        .select("plan_tier, subscription_status"),
      supabaseAdmin.from("leads").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("profile_views")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("waitlist_signups")
        .select("id", { count: "exact", head: true }),
    ]);

    if (businessesRes.error) throw new Error(businessesRes.error.message);
    if (profilesRes.error) throw new Error(profilesRes.error.message);

    const businesses = businessesRes.data ?? [];
    const profiles = profilesRes.data ?? [];

    const planCounts: Record<string, number> = { starter: 0, premium: 0, ultra: 0 };
    let mrr = 0;
    for (const p of profiles) {
      const tier = (p.plan_tier ?? "starter") as keyof typeof PLAN_PRICES_NZD;
      planCounts[tier] = (planCounts[tier] ?? 0) + 1;
      if (p.subscription_status === "active" || p.subscription_status === "trialing") {
        mrr += PLAN_PRICES_NZD[tier] ?? 0;
      }
    }

    const byCategoryMap = new Map<string, number>();
    for (const b of businesses) {
      if (!b.is_active) continue;
      const key = b.macro_category ?? "Outros";
      byCategoryMap.set(key, (byCategoryMap.get(key) ?? 0) + 1);
    }
    const byCategory = Array.from(byCategoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totals: {
        businesses: businesses.length,
        activeBusinesses: businesses.filter((b) => b.is_active).length,
        pendingBusinesses: businesses.filter((b) => !b.is_verified && b.is_active).length,
        blockedBusinesses: businesses.filter((b) => !b.is_active).length,
        leads: leadsRes.count ?? 0,
        profileViews: viewsRes.count ?? 0,
        waitlist: waitlistRes.count ?? 0,
      },
      planCounts,
      byCategory,
      revenue: {
        mrrNzd: mrr,
        arrNzd: mrr * 12,
        currency: "NZD" as const,
      },
    };
  });

// ---------- Categories ----------

const ICON_KEYS = z.enum([
  "utensils","briefcase","hammer","car","music","heart-pulse","scissors",
  "shopping-bag","book-open","users","sparkles","graduation-cap","home",
  "wrench","camera","plane","laptop","baby","paw-print","dumbbell",
]);
const COLOR_KEYS = z.enum([
  "orange","blue","yellow","slate","purple","red","pink","teal","indigo","rose","emerald",
]);

const categoryInputSchema = z.object({
  namePt: z.string().trim().min(1).max(120),
  nameEs: z.string().trim().max(120).optional().default(""),
  nameEn: z.string().trim().max(120).optional().default(""),
  blurbPt: z.string().trim().max(400).optional().default(""),
  blurbEs: z.string().trim().max(400).optional().default(""),
  blurbEn: z.string().trim().max(400).optional().default(""),
  iconKey: ICON_KEYS.default("briefcase"),
  colorKey: COLOR_KEYS.default("slate"),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  kind: z.enum(["service", "product"]).default("service"),
});

export const listAdminCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminRole(context.userId, context.supabase);

    const [catsRes, bizRes] = await Promise.all([
      supabaseAdmin
        .from("categories")
        .select("id, key, name, name_pt, name_es, name_en, blurb, blurb_pt, blurb_es, blurb_en, icon_key, color_key, sort_order, created_at")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("businesses")
        .select("macro_category, is_active"),
    ]);
    if (catsRes.error) throw new Error(catsRes.error.message);
    if (bizRes.error) throw new Error(bizRes.error.message);

    const counts = new Map<string, number>();
    for (const b of bizRes.data ?? []) {
      if (!b.is_active || !b.macro_category) continue;
      counts.set(b.macro_category, (counts.get(b.macro_category) ?? 0) + 1);
    }

    return {
      categories: (catsRes.data ?? []).map((c) => ({
        id: c.id,
        key: c.key,
        name: c.name,
        namePt: c.name_pt ?? c.name,
        nameEs: c.name_es ?? "",
        nameEn: c.name_en ?? "",
        blurbPt: c.blurb_pt ?? c.blurb ?? "",
        blurbEs: c.blurb_es ?? "",
        blurbEn: c.blurb_en ?? "",
        iconKey: c.icon_key ?? "briefcase",
        colorKey: c.color_key ?? "slate",
        sortOrder: c.sort_order ?? 0,
        count: counts.get(c.name) ?? 0,
      })),
    };
  });

function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const createAdminCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => categoryInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.userId, context.supabase);
    const key = slugifyCategory(data.namePt);
    if (!key) throw new Error("Nome de categoria inválido");
    const { error } = await supabaseAdmin.from("categories").insert({
      key,
      name: data.namePt.trim(),
      name_pt: data.namePt.trim(),
      name_es: data.nameEs.trim() || null,
      name_en: data.nameEn.trim() || null,
      blurb: data.blurbPt.trim() || null,
      blurb_pt: data.blurbPt.trim() || null,
      blurb_es: data.blurbEs.trim() || null,
      blurb_en: data.blurbEn.trim() || null,
      icon_key: data.iconKey,
      color_key: data.colorKey,
      sort_order: data.sortOrder,
    });
    if (error) {
      if (error.code === "23505") throw new Error("Categoria já existe");
      throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const updateAdminCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    categoryInputSchema.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.userId, context.supabase);
    const { error } = await supabaseAdmin
      .from("categories")
      .update({
        name: data.namePt.trim(),
        name_pt: data.namePt.trim(),
        name_es: data.nameEs.trim() || null,
        name_en: data.nameEn.trim() || null,
        blurb: data.blurbPt.trim() || null,
        blurb_pt: data.blurbPt.trim() || null,
        blurb_es: data.blurbEs.trim() || null,
        blurb_en: data.blurbEn.trim() || null,
        icon_key: data.iconKey,
        color_key: data.colorKey,
        sort_order: data.sortOrder,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });


export const deleteAdminCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.userId, context.supabase);
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });


// ---------- Managers ----------

export const getAdminManagers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    listAdminManagers({
      callerUserId: context.userId,
      supabase: context.supabase,
    }),
  );

export const inviteManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().max(255),
        role: z.enum(["admin", "manager"]).default("manager"),
        redirectTo: z.string().url().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) =>
    inviteAdminManager({
      callerUserId: context.userId,
      supabase: context.supabase,
      name: data.name,
      email: data.email,
      role: data.role,
      redirectTo: data.redirectTo,
    }),
  );

export const removeManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) =>
    deleteAdminManager({
      callerUserId: context.userId,
      supabase: context.supabase,
      userId: data.userId,
    }),
  );
