import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// NZ phone: starts with +64 then 8-12 digits, spaces allowed
const nzPhoneRegex = /^\+64[\s\d]{7,15}$/;

const submitSchema = z.object({
  business_name: z.string().trim().min(1).max(200),
  owner_name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(320),
  whatsapp_number: z
    .string()
    .trim()
    .regex(nzPhoneRegex, "Número NZ inválido (ex: +64 21 000 0000)")
    .max(32),
  service_category: z.string().trim().min(1).max(100),
});

// In-memory rate limit (per Worker isolate; acceptable for MVP)
const rateBucket = new Map<string, { count: number; reset: number }>();
function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const entry = rateBucket.get(key);
  if (!entry || entry.reset < now) {
    rateBucket.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

export const submitWaitlist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }) => {
    if (!rateLimit(`submit:${data.email}`)) {
      return { ok: false as const, error: "Muitas tentativas. Tente novamente em alguns minutos." };
    }

    const { error } = await supabaseAdmin.from("waitlist_signups").insert(data);

    if (error) {
      if (error.code === "23505") {
        return { ok: false as const, error: "Este e-mail já está na nossa lista. 🎉" };
      }
      console.error("submitWaitlist error", error);
      return { ok: false as const, error: "Não foi possível salvar agora. Tente novamente." };
    }
    return { ok: true as const };
  });

export const listWaitlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (profErr) return { ok: false as const, error: profErr.message };
    if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
      return { ok: false as const, error: "Acesso negado." };
    }
    const { data: rows, error } = await supabaseAdmin
      .from("waitlist_signups")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("listWaitlist error", error);
      return { ok: false as const, error: "Erro ao carregar dados." };
    }
    return { ok: true as const, rows: rows ?? [] };
  });
