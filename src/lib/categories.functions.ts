import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PublicCategory = {
  id: string;
  key: string;
  name: string;
  name_pt: string | null;
  name_es: string | null;
  name_en: string | null;
  blurb_pt: string | null;
  blurb_es: string | null;
  blurb_en: string | null;
  icon_key: string;
  color_key: string;
  sort_order: number;
  kind: "service" | "product";
  count: number;
};

export const listPublicCategories = createServerFn({ method: "GET" })
  .handler(async (): Promise<{ categories: PublicCategory[] }> => {
    const [catsRes, bizRes] = await Promise.all([
      supabaseAdmin
        .from("categories")
        .select("id, key, name, name_pt, name_es, name_en, blurb_pt, blurb_es, blurb_en, icon_key, color_key, sort_order, kind")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabaseAdmin.from("businesses").select("macro_category, is_active"),
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
        name_pt: c.name_pt,
        name_es: c.name_es,
        name_en: c.name_en,
        blurb_pt: c.blurb_pt,
        blurb_es: c.blurb_es,
        blurb_en: c.blurb_en,
        icon_key: c.icon_key,
        color_key: c.color_key,
        sort_order: c.sort_order,
        kind: (((c as unknown as { kind?: string }).kind) === "product" ? "product" : "service"),
        count: counts.get(c.name) ?? 0,
      })),
    };
  });
