// App config server functions. Public read (anyone can fetch config),
// admin-only write. Keys: "categories", "cities", "site_mode".
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const KEY = z.enum(["categories", "cities", "site_mode"]);

export const getAppConfig = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ key: KEY }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("app_config")
      .select("value, updated_at")
      .eq("key", data.key)
      .maybeSingle();
    if (error) throw error;
    return { value: (row?.value ?? null) as unknown, updatedAt: row?.updated_at ?? null };
  });

export const getAllAppConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("app_config")
    .select("key, value, updated_at");
  if (error) throw error;
  const map: Record<string, unknown> = {};
  for (const r of data ?? []) map[r.key as string] = r.value;
  return map;
});

export const updateAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        key: KEY,
        // value can be any JSON-serializable shape — validated per-key in the handler.
        value: z.unknown(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Verify admin/manager role.
    const { data: profile, error: pErr } = await context.supabase
      .from("profiles")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (profile?.role !== "admin" && profile?.role !== "manager") {
      throw new Response("Forbidden", { status: 403 });
    }

    // Per-key lightweight shape validation.
    if (data.key === "cities") {
      const arr = z.array(z.string().trim().min(1).max(80)).max(200).parse(data.value);
      data = { ...data, value: arr };
    } else if (data.key === "site_mode") {
      const mode = z.enum(["waitlist", "live"]).parse(data.value);
      data = { ...data, value: mode };
    } else if (data.key === "categories") {
      // Loose schema: must be { groups: [...], categories: [...] }.
      const schema = z.object({
        groups: z.array(
          z.object({
            id: z.string().min(1),
            iconKey: z.string().min(1),
            colorKey: z.string().min(1),
            labels: z.object({ pt: z.string(), es: z.string(), en: z.string() }),
          }),
        ),
        categories: z.array(
          z.object({
            key: z.string().min(1),
            group: z.string().min(1),
            labels: z.object({ pt: z.string(), es: z.string(), en: z.string() }),
          }),
        ),
      });
      data = { ...data, value: schema.parse(data.value) };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_config")
      .upsert(
        {
          key: data.key,
          value: data.value as never,
          updated_by: context.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );
    if (error) throw error;
    return { ok: true };
  });
