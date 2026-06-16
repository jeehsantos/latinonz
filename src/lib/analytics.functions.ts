import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createHash } from "crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const logSchema = z.object({
  businessId: z.string().uuid(),
  referrer: z.string().max(500).optional().nullable(),
});

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT ?? "latinonz-default-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export const logProfileView = createServerFn({ method: "POST" })
  .inputValidator((input) => logSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let ip: string | null = null;
    try {
      const req = getRequest();
      if (req?.headers) {
        ip =
          req.headers.get("cf-connecting-ip") ??
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          req.headers.get("x-real-ip") ??
          null;
      }
    } catch {
      // Request context not available — proceed without IP.
    }

    const { error } = await supabaseAdmin.rpc("record_profile_view", {
      _business_id: data.businessId,
      _viewer_ip_hash: hashIp(ip) ?? "",
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (bizErr) return { ok: false as const, error: bizErr.message };
    if (!biz) {
      return {
        ok: true as const,
        views: 0,
        leads: 0,
        contactClicks: 0,
        conversionRate: 0,
      };
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString();
    const sinceDay = sinceIso.slice(0, 10);

    const [viewsRes, leadsRes, clicksRes] = await Promise.all([
      supabase
        .from("profile_views_daily")
        .select("views")
        .eq("business_id", biz.id)
        .gte("day", sinceDay),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", biz.id)
        .gte("created_at", sinceIso),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", biz.id)
        .in("source", ["whatsapp", "email", "directory"])
        .gte("created_at", sinceIso),
    ]);

    if (viewsRes.error) return { ok: false as const, error: viewsRes.error.message };
    if (leadsRes.error) return { ok: false as const, error: leadsRes.error.message };
    if (clicksRes.error) return { ok: false as const, error: clicksRes.error.message };

    const views = (viewsRes.data ?? []).reduce((sum, r) => sum + (r.views ?? 0), 0);
    const leads = leadsRes.count ?? 0;
    const contactClicks = clicksRes.count ?? 0;
    const conversionRate = views > 0 ? (leads / views) * 100 : 0;

    return {
      ok: true as const,
      views,
      leads,
      contactClicks,
      conversionRate: Number(conversionRate.toFixed(1)),
    };
  });
