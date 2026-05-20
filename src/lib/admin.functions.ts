// Admin / manager server functions. All handlers verify the calling user has
// role 'admin' or 'manager' on public.profiles before performing privileged
// reads or writes via the admin Supabase client (RLS bypassed).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type AdminRole = "admin" | "manager";

async function requireAdminRole(
  userId: string,
  authedClient?: { from: typeof supabaseAdmin.from },
): Promise<AdminRole> {
  // Prefer the user's authenticated client: RLS "User reads own profile"
  // guarantees the caller can read their own role, regardless of whether
  // the service-role key is correctly configured. Fall back to supabaseAdmin
  // only when no authenticated client was passed in.
  const client = authedClient ?? supabaseAdmin;
  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const role = data?.role;
  if (role !== "admin" && role !== "manager") {
    throw new Error("Forbidden: admin or manager role required");
  }
  return role as AdminRole;
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
  .handler(async ({ context }) => {
    await requireAdminRole(context.userId, context.supabase);

    // Use a SECURITY DEFINER RPC so admins can read all staff profiles
    // regardless of profiles RLS / service-role key state.
    const { data: rows, error } = await context.supabase.rpc("list_admin_managers");
    if (error) throw new Error(error.message);

    type Row = { id: string; role: string; created_at: string };
    const profiles = (rows ?? []) as unknown as Row[];

    const ids = profiles.map((p) => p.id);
    const emailById = new Map<string, string | null>();
    const nameById = new Map<string, string | null>();

    if (ids.length > 0) {
      const { data: usersData, error: usersErr } =
        await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersErr) throw new Error(usersErr.message);
      for (const u of usersData.users) {
        if (ids.includes(u.id)) {
          emailById.set(u.id, u.email ?? null);
          const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
          const metaName =
            (typeof meta.full_name === "string" && meta.full_name) ||
            (typeof meta.owner_name === "string" && meta.owner_name) ||
            (typeof meta.name === "string" && meta.name) ||
            null;
          nameById.set(u.id, metaName as string | null);
        }
      }
    }

    return {
      managers: profiles.map((p) => ({
        id: p.id,
        role: p.role as AdminRole,
        name: nameById.get(p.id) ?? null,
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
        redirectTo: z.string().url().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Only admins may create new admins/managers
    const callerRole = await requireAdminRole(context.userId, context.supabase);
    if (callerRole !== "admin") {
      throw new Error("Forbidden: only admins can invite managers");
    }

    let userId: string | undefined;
    let status: "invited" | "magic_link_sent" | "promoted_only" = "invited";
    let warning: string | undefined;

    const inviteOptions: { data?: Record<string, unknown>; redirectTo?: string } = {};
    if (data.name) inviteOptions.data = { full_name: data.name };
    if (data.redirectTo) inviteOptions.redirectTo = data.redirectTo;
    const { data: invite, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
      inviteOptions,
    );
    if (error) {
      // If the user already exists, look them up and send a magic-link email
      // so they can sign in and land on the accept-invite page.
      const msg = error.message?.toLowerCase() ?? "";
      const alreadyExists =
        msg.includes("already been registered") ||
        msg.includes("already registered") ||
        msg.includes("already exists");
      if (!alreadyExists) throw new Error(error.message);

      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (listErr) throw new Error(listErr.message);
      const existing = list.users.find(
        (u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase(),
      );
      if (!existing) throw new Error("User already exists but could not be located");
      userId = existing.id;

      // Send a magic-link sign-in email via the anon client so Supabase's
      // built-in email service actually delivers a message to the recipient.
      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SUPABASE_ANON_KEY =
        process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            // Server-issued OTP cannot use PKCE (no browser verifier exists),
            // so force implicit flow so the magic link returns tokens in the URL hash.
            flowType: "implicit",
          },
        });
        const { error: otpErr } = await anon.auth.signInWithOtp({
          email: data.email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: data.redirectTo,
          },
        });
        if (otpErr) {
          status = "promoted_only";
          warning = `User already existed; role promoted but magic-link email failed: ${otpErr.message}`;
        } else {
          status = "magic_link_sent";
        }
      } else {
        status = "promoted_only";
        warning = "User already existed; role promoted but email service is not configured.";
      }
    } else {
      userId = invite.user?.id;
    }
    if (!userId) throw new Error("Failed to create user");

    // Ensure profile exists and force the requested role. Upsert avoids a
    // silent no-op if .update() races the handle_new_user trigger.
    // Use the caller's authenticated client so the admin RLS policy applies
    // reliably (service-role bypass has been observed to fail in this env).
    const { error: roleErr } = await context.supabase
      .from("profiles")
      .upsert({ id: userId, role: data.role }, { onConflict: "id" });
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true as const, userId, status, warning };
  });

export const removeManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const callerRole = await requireAdminRole(context.userId, context.supabase);
    if (callerRole !== "admin") {
      throw new Error("Forbidden: only admins can remove managers");
    }
    if (data.userId === context.userId) {
      throw new Error("You cannot remove your own account");
    }
    // Fully delete the auth user so the email can be re-invited cleanly.
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (delErr) throw new Error(delErr.message);
    // Clean up the profile row in case no FK cascade is set.
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    return { ok: true as const };
  });
