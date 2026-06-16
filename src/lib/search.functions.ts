import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const logSchema = z.object({
  query: z.string().trim().max(200).optional().default(""),
  category: z.string().trim().max(100).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
});

export const logSearchQuery = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => logSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!data.query && !data.category && !data.city) {
      return { ok: true as const, skipped: true as const };
    }
    const { error } = await supabaseAdmin.rpc("record_search_query", {
      _query: data.query,
      _category: data.category,
      _city: data.city,
    });
    if (error) {
      console.error("logSearchQuery error", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });
