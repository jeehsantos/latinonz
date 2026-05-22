import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/),
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().nullable(),
  discountType: z.enum(["percent", "fixed"]).optional().nullable(),
  discountValue: z.number().min(0).max(100000).optional().nullable(),
  expiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

const idSchema = z.object({ couponId: z.string().uuid() });

const PREMIUM_PLANS = new Set(["premium", "ultra"]);

export const getMyCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (bizErr) return { ok: false as const, error: bizErr.message };
    if (!biz) return { ok: true as const, coupons: [] };

    const { data: rows, error } = await supabase
      .from("coupons")
      .select(
        "id, code, title, description, discount_type, discount_value, expires_at, is_active, created_at",
      )
      .eq("business_id", biz.id)
      .order("created_at", { ascending: false });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, coupons: rows ?? [] };
  });

export const createCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("plan_tier")
      .eq("id", userId)
      .maybeSingle();
    if (profileErr) return { ok: false as const, error: profileErr.message };
    const plan = (profile?.plan_tier ?? "starter").toLowerCase();
    if (!PREMIUM_PLANS.has(plan)) {
      return { ok: false as const, error: "Cupons disponíveis apenas nos planos Premium e Ultra." };
    }

    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (bizErr) return { ok: false as const, error: bizErr.message };
    if (!biz) return { ok: false as const, error: "Crie seu negócio antes de criar cupons." };

    const { data: row, error } = await supabase
      .from("coupons")
      .insert({
        business_id: biz.id,
        code: data.code.toUpperCase(),
        title: data.title,
        description: data.description ?? null,
        discount_type: data.discountType ?? null,
        discount_value: data.discountValue ?? null,
        expires_at: data.expiresAt ?? null,
        is_active: true,
      })
      .select("id")
      .single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, couponId: row.id };
  });

export const toggleCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: current, error: readErr } = await supabase
      .from("coupons")
      .select("is_active")
      .eq("id", data.couponId)
      .maybeSingle();
    if (readErr) return { ok: false as const, error: readErr.message };
    if (!current) return { ok: false as const, error: "Cupom não encontrado." };

    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !current.is_active })
      .eq("id", data.couponId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, isActive: !current.is_active };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("coupons").delete().eq("id", data.couponId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
