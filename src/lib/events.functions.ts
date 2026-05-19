import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().max(300).optional().nullable(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1).optional().nullable(),
  imageUrl: z.string().url().max(2000).optional().nullable(),
});

const idSchema = z.object({ eventId: z.string().uuid() });

export const getMyEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (bizErr) return { ok: false as const, error: bizErr.message };
    if (!biz) return { ok: true as const, events: [] };

    const { data: rows, error } = await supabase
      .from("events")
      .select("id, title, description, location, starts_at, ends_at, image_url, is_active, created_at")
      .eq("business_id", biz.id)
      .order("starts_at", { ascending: false });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, events: rows ?? [] };
  });

export const createEvent = createServerFn({ method: "POST" })
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
    if (plan !== "ultra") {
      return { ok: false as const, error: "Eventos disponíveis apenas no plano Ultra." };
    }

    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (bizErr) return { ok: false as const, error: bizErr.message };
    if (!biz) return { ok: false as const, error: "Crie seu negócio antes de criar eventos." };

    const { data: row, error } = await supabase
      .from("events")
      .insert({
        business_id: biz.id,
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        starts_at: data.startsAt,
        ends_at: data.endsAt ?? null,
        image_url: data.imageUrl ?? null,
        is_active: true,
      })
      .select("id")
      .single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, eventId: row.id };
  });

export const toggleEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: current, error: readErr } = await supabase
      .from("events")
      .select("is_active")
      .eq("id", data.eventId)
      .maybeSingle();
    if (readErr) return { ok: false as const, error: readErr.message };
    if (!current) return { ok: false as const, error: "Evento não encontrado." };

    const { error } = await supabase
      .from("events")
      .update({ is_active: !current.is_active })
      .eq("id", data.eventId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, isActive: !current.is_active };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("events").delete().eq("id", data.eventId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
