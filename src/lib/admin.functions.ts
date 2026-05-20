// Admin / manager server functions. All handlers verify the calling user has
// role 'admin' or 'manager' on public.profiles before performing privileged
// reads or writes via the admin Supabase client (RLS bypassed).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type AdminRole = "admin" | "manager";

async function requireAdminRole(userId: string): Promise<AdminRole> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const role = data?.role;
  if (role !== "admin" && role !== "manager") {
    throw new Error("Forbidden: admin or manager role required");
  }
  return role;
}

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
    await requireAdminRole(context.userId);

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
    await requireAdminRole(context.userId);
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
    await requireAdminRole(context.userId);
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
    await requireAdminRole(context.userId);
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
    await requireAdminRole(context.userId);

    const [businessesRes, profilesRes, leadsRes, viewsRes, waitlistRes] = await Promise.all([
      supabaseAdmin.from("businesses").select("id, is_active, is_verified"),
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
      revenue: {
        mrrNzd: mrr,
        arrNzd: mrr * 12,
        currency: "NZD" as const,
      },
    };
  });

// ---------- Managers ----------

export const getAdminManagers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminRole(context.userId);

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, role, created_at")
      .in("role", ["admin", "manager"])
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (profiles ?? []).map((p) => p.id);
    const emailById = new Map<string, string | null>();

    // Look up auth emails via admin API (paginated; cap at 1000 users for safety)
    if (ids.length > 0) {
      const { data: usersData, error: usersErr } =
        await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersErr) throw new Error(usersErr.message);
      for (const u of usersData.users) {
        if (ids.includes(u.id)) emailById.set(u.id, u.email ?? null);
      }
    }

    return {
      managers: (profiles ?? []).map((p) => ({
        id: p.id,
        role: p.role as AdminRole,
        email: emailById.get(p.id) ?? null,
        createdAt: p.created_at,
      })),
    };
  });

export const inviteManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().max(255),
        role: z.enum(["admin", "manager"]).default("manager"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Only admins may create new admins/managers
    const callerRole = await requireAdminRole(context.userId);
    if (callerRole !== "admin") {
      throw new Error("Forbidden: only admins can invite managers");
    }

    const { data: invite, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      data.name ? { data: { full_name: data.name } } : undefined,
    );
    if (error) throw new Error(error.message);
    const userId = invite.user?.id;
    if (!userId) throw new Error("Failed to create user");

    // Trigger handle_new_user inserts the profile with role='user'; promote it.
    const { error: roleErr } = await supabaseAdmin
      .from("profiles")
      .update({ role: data.role })
      .eq("id", userId);
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true as const, userId };
  });

export const removeManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const callerRole = await requireAdminRole(context.userId);
    if (callerRole !== "admin") {
      throw new Error("Forbidden: only admins can remove managers");
    }
    if (data.userId === context.userId) {
      throw new Error("You cannot demote your own account");
    }
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ role: "user" })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
