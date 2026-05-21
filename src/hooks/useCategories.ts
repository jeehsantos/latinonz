import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { listPublicCategories, type PublicCategory } from "@/lib/categories.functions";
import { useI18n } from "@/lib/i18n";

export type LocalizedCategory = {
  id: string;
  key: string;
  canonicalName: string; // PT canonical, matches businesses.macro_category
  name: string;
  blurb: string;
  iconKey: string;
  colorKey: string;
  kind: "service" | "product";
  count: number;
};

function pick(locale: string, c: PublicCategory): { name: string; blurb: string } {
  const nameByLocale: Record<string, string | null> = {
    pt: c.name_pt, es: c.name_es, en: c.name_en,
  };
  const blurbByLocale: Record<string, string | null> = {
    pt: c.blurb_pt, es: c.blurb_es, en: c.blurb_en,
  };
  return {
    name: nameByLocale[locale] || c.name_pt || c.name,
    blurb: blurbByLocale[locale] || c.blurb_pt || "",
  };
}

export function useCategories() {
  const { locale } = useI18n();
  const fetchFn = useServerFn(listPublicCategories);
  const query = useQuery({
    queryKey: ["categories", "public"],
    queryFn: () => fetchFn(),
  });
  const categories = useMemo<LocalizedCategory[]>(() => {
    const rows = query.data?.categories ?? [];
    return rows.map((c) => {
      const { name, blurb } = pick(locale, c);
      return {
        id: c.id,
        key: c.key,
        canonicalName: c.name,
        name,
        blurb,
        iconKey: c.icon_key,
        colorKey: c.color_key,
        count: c.count,
      };
    });
  }, [query.data, locale]);
  return { categories, isLoading: query.isLoading };
}
