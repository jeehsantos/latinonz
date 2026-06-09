// App config server functions. Public read (anyone can fetch config),
// admin-only write. Keys: "categories", "cities", "site_mode".
// Values are transported as JSON strings to keep the serializer happy.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const KEY = z.enum(["categories", "cities", "site_mode"]);

export const getAppConfig = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ key: KEY }).parse(input))
  .handler(async ({ data }): Promise<{ json: string | null; updatedAt: string | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("app_config")
      .select("value, updated_at")
      .eq("key", data.key)
      .maybeSingle();
    if (error) throw error;
    return {
      json: row?.value !== undefined && row?.value !== null ? JSON.stringify(row.value) : null,
      updatedAt: row?.updated_at ?? null,
    };
  });

export const getAllAppConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ entries: Array<{ key: string; json: string }> }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("app_config")
      .select("key, value");
    if (error) throw error;
    return {
      entries: (data ?? []).map((r) => ({
        key: String(r.key),
        json: JSON.stringify(r.value),
      })),
    };
  },
);

export const updateAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        key: KEY,
        // JSON-encoded payload; parsed and validated per-key inside handler.
        json: z.string().min(1).max(200_000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
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

    let parsed: unknown;
    try {
      parsed = JSON.parse(data.json);
    } catch {
      throw new Response("Invalid JSON payload", { status: 400 });
    }

    let value: unknown = parsed;
    if (data.key === "cities") {
      value = z.array(z.string().trim().min(1).max(80)).max(200).parse(parsed);
    } else if (data.key === "site_mode") {
      value = z.enum(["waitlist", "live"]).parse(parsed);
    } else if (data.key === "categories") {
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
      value = schema.parse(parsed);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("app_config").upsert(
      {
        key: data.key,
        value: value as never,
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) throw error;
    return { ok: true };
  });
