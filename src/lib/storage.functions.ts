import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getLimit, type PlanTier } from "@/lib/plans";
import { type SupabaseClient } from "@supabase/supabase-js";
import { type Database } from "@/integrations/supabase/types";

const LOGO_BUCKET = "business-logos";
const GALLERY_BUCKET = "business-gallery";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const fileSchema = z.object({
  contentBase64: z.string().min(1),
  contentType: z.string().min(1).max(100),
  ext: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[a-z0-9]+$/i),
});

function decodeBase64(str: string): Uint8Array {
  const clean = str.includes(",") ? str.split(",", 2)[1] : str;
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function validateFile(input: z.infer<typeof fileSchema>) {
  const type = input.contentType.toLowerCase();
  const ext = input.ext.toLowerCase().replace(/^\./, "");
  if (!ALLOWED_MIME.has(type)) throw new Error("Formato de imagem inválido.");
  if (!ALLOWED_EXT.has(ext)) throw new Error("Extensão de imagem inválida.");
  const bytes = decodeBase64(input.contentBase64);
  if (bytes.byteLength === 0) throw new Error("Arquivo vazio.");
  if (bytes.byteLength > MAX_BYTES) throw new Error("Imagem maior que 5MB.");
  return { bytes, type, ext };
}

async function getOwnerBusinessId(
  supabase: ReturnType<typeof getSupabaseFromContext>,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Nenhum negócio encontrado para este usuário.");
  return data.id as string;
}

// Helper to type the context.supabase client.
function getSupabaseFromContext(ctx: { supabase: SupabaseClient<Database> }) {
  return ctx.supabase;
}

async function getUserPlan(supabase: SupabaseClient<Database>, userId: string): Promise<PlanTier> {
  const { data } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", userId)
    .maybeSingle();
  const t = data?.plan_tier;
  return t === "premium" || t === "ultra" || t === "starter" ? t : "starter";
}

export const uploadLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => fileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { bytes, type, ext } = validateFile(data);

    // Ensure the user has a business row first — otherwise the update
    // silently affects 0 rows and the logo URL is lost on refresh.
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (bizErr) throw new Error(bizErr.message);
    if (!biz) {
      throw new Error(
        "Salve as informações do seu negócio antes de enviar o logo.",
      );
    }

    const path = `${userId}/logo.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, bytes, { contentType: type, upsert: true });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`;

    const { data: updated, error: updErr } = await supabase
      .from("businesses")
      .update({ logo_url: url })
      .eq("owner_id", userId)
      .select("id")
      .maybeSingle();
    if (updErr) throw new Error(updErr.message);
    if (!updated) throw new Error("Não foi possível salvar o logo.");

    return { ok: true as const, url };
  });

export const uploadPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    fileSchema.extend({ position: z.number().int().min(0).max(999).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { bytes, type, ext } = validateFile(data);

    const businessId = await getOwnerBusinessId(supabase, userId);

    // Enforce plan photo limit
    const plan = await getUserPlan(supabase, userId);
    const limit = getLimit(plan, "photoLimit");
    if (Number.isFinite(limit)) {
      const { count, error: cErr } = await supabase
        .from("business_photos")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId);
      if (cErr) throw new Error(cErr.message);
      if ((count ?? 0) >= limit) {
        throw new Error(
          `Limite de ${limit} fotos atingido. Faça upgrade do plano para adicionar mais.`,
        );
      }
    }

    const uuid = crypto.randomUUID();
    const path = `${userId}/${businessId}/${uuid}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(GALLERY_BUCKET)
      .upload(path, bytes, { contentType: type, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path);
    const url = pub.publicUrl;

    let position = data.position;
    if (position === undefined) {
      const { data: last } = await supabase
        .from("business_photos")
        .select("position")
        .eq("business_id", businessId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      position = (last?.position ?? -1) + 1;
    }

    const { data: row, error: insErr } = await supabase
      .from("business_photos")
      .insert({ business_id: businessId, storage_path: path, url, position })
      .select("id, url, position, storage_path")
      .single();
    if (insErr) {
      // best-effort cleanup
      await supabase.storage.from(GALLERY_BUCKET).remove([path]);
      throw new Error(insErr.message);
    }

    return { ok: true as const, photo: row };
  });

export const listMyPhotos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!biz) return { ok: true as const, photos: [] };
    const { data, error } = await supabase
      .from("business_photos")
      .select("id, url, position, storage_path")
      .eq("business_id", biz.id)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return { ok: true as const, photos: data ?? [] };
  });

export const deletePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ photoId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const businessId = await getOwnerBusinessId(supabase, userId);

    const { data: photo, error: selErr } = await supabase
      .from("business_photos")
      .select("id, storage_path, business_id")
      .eq("id", data.photoId)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);
    if (!photo || photo.business_id !== businessId) {
      throw new Error("Foto não encontrada.");
    }

    await supabase.storage.from(GALLERY_BUCKET).remove([photo.storage_path]);
    const { error: delErr } = await supabase.from("business_photos").delete().eq("id", photo.id);
    if (delErr) throw new Error(delErr.message);

    return { ok: true as const };
  });

export const reorderPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ photoIds: z.array(z.string().uuid()).min(1).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const businessId = await getOwnerBusinessId(supabase, userId);

    const { data: existing, error: selErr } = await supabase
      .from("business_photos")
      .select("id")
      .eq("business_id", businessId);
    if (selErr) throw new Error(selErr.message);
    const owned = new Set((existing ?? []).map((r) => r.id));
    for (const id of data.photoIds) {
      if (!owned.has(id)) throw new Error("Foto inválida no reordenamento.");
    }

    for (let i = 0; i < data.photoIds.length; i++) {
      const { error } = await supabase
        .from("business_photos")
        .update({ position: i })
        .eq("id", data.photoIds[i]);
      if (error) throw new Error(error.message);
    }

    return { ok: true as const };
  });
