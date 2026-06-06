import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "business-gallery";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const baseFields = {
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
};

const createSchema = z.object(baseFields);
const updateSchema = z.object({ couponId: z.string().uuid(), ...baseFields });
const idSchema = z.object({ couponId: z.string().uuid() });

const PREMIUM_PLANS = new Set(["premium", "ultra"]);

function decodeBase64(str: string): Uint8Array {
  const clean = str.includes(",") ? str.split(",", 2)[1] : str;
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const couponSelect =
  "id, code, title, description, discount_type, discount_value, expires_at, is_active, promo_image_url, promo_image_path, created_at";

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
      .select(couponSelect)
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

export const updateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("coupons")
      .update({
        code: data.code.toUpperCase(),
        title: data.title,
        description: data.description ?? null,
        discount_type: data.discountType ?? null,
        discount_value: data.discountValue ?? null,
        expires_at: data.expiresAt ?? null,
      })
      .eq("id", data.couponId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const uploadCouponPromoImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        couponId: z.string().uuid(),
        contentBase64: z.string().min(1),
        contentType: z.string().min(1).max(100),
        ext: z
          .string()
          .min(1)
          .max(10)
          .regex(/^[a-z0-9]+$/i),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const type = data.contentType.toLowerCase();
    const ext = data.ext.toLowerCase().replace(/^\./, "");
    if (!ALLOWED_MIME.has(type)) return { ok: false as const, error: "Formato inválido." };
    if (!ALLOWED_EXT.has(ext)) return { ok: false as const, error: "Extensão inválida." };
    const bytes = decodeBase64(data.contentBase64);
    if (bytes.byteLength === 0) return { ok: false as const, error: "Arquivo vazio." };
    if (bytes.byteLength > MAX_BYTES)
      return { ok: false as const, error: "Imagem maior que 5MB." };

    // Verify the coupon belongs to the caller's business (RLS will also enforce).
    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!biz) return { ok: false as const, error: "Negócio não encontrado." };
    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, promo_image_path")
      .eq("id", data.couponId)
      .eq("business_id", biz.id)
      .maybeSingle();
    if (!coupon) return { ok: false as const, error: "Cupom não encontrado." };

    // Path must start with userId for storage RLS.
    const path = `${userId}/coupons/${data.couponId}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: type, upsert: true });
    if (upErr) return { ok: false as const, error: upErr.message };

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: updErr } = await supabase
      .from("coupons")
      .update({ promo_image_url: url, promo_image_path: path })
      .eq("id", data.couponId);
    if (updErr) return { ok: false as const, error: updErr.message };

    return { ok: true as const, url };
  });

export const removeCouponPromoImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: coupon } = await supabase
      .from("coupons")
      .select("promo_image_path")
      .eq("id", data.couponId)
      .maybeSingle();
    if (coupon?.promo_image_path) {
      await supabase.storage.from(BUCKET).remove([coupon.promo_image_path]);
    }
    const { error } = await supabase
      .from("coupons")
      .update({ promo_image_url: null, promo_image_path: null })
      .eq("id", data.couponId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
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
    const { data: coupon } = await supabase
      .from("coupons")
      .select("promo_image_path")
      .eq("id", data.couponId)
      .maybeSingle();
    if (coupon?.promo_image_path) {
      await supabase.storage.from(BUCKET).remove([coupon.promo_image_path]);
    }
    const { error } = await supabase.from("coupons").delete().eq("id", data.couponId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
