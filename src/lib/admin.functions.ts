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
    const viewerRole = await requireAdminRole(context.userId, context.supabase);

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
      // Use the auth-scoped client; admins/managers have an RLS policy that
      // permits reading all profiles. The service-role client is not used
      // here because some hosting environments do not bypass RLS reliably.
      const { data: profs, error: profErr } = await context.supabase
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

    return { businesses, viewerRole };
  });

export const setBusinessPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        businessId: z.string().uuid(),
        plan: z.enum(["starter", "premium", "ultra"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const role = await requireAdminRole(context.userId, context.supabase);
    if (role !== "admin") {
      throw new Error("Forbidden: only admins can change business plan");
    }

    // Call SECURITY DEFINER RPC via the caller's authenticated client so
    // auth.uid() resolves to the admin and the function's internal gate passes.
    const { data: rpcRows, error: rpcError } = await context.supabase.rpc(
      "admin_set_business_plan",
      { _business_id: data.businessId, _plan: data.plan },
    );
    if (rpcError) throw new Error(rpcError.message);

    const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    if (!row?.owner_id || row.plan_tier !== data.plan) {
      throw new Error("Failed to persist business plan change");
    }

    return {
      ok: true as const,
      businessId: data.businessId,
      ownerId: row.owner_id as string,
      plan: row.plan_tier as "starter" | "premium" | "ultra",
    };
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
      context.supabase.from("businesses").select("id, macro_category, is_active, is_verified"),
      context.supabase.from("profiles").select("plan_tier, subscription_status"),
      context.supabase.from("leads").select("id", { count: "exact", head: true }),
      context.supabase.from("profile_views").select("id", { count: "exact", head: true }),
      context.supabase.from("waitlist_signups").select("id", { count: "exact", head: true }),
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

// Categories CRUD removed — source of truth is now src/lib/categories.json.

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
