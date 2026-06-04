import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import categoriesData from "@/lib/categories.json";

export type CategoryGroup = {
  id: string;
  iconKey: string;
  colorKey: string;
  label: string;
};

export type Category = {
  key: string;
  group: string;
  label: string;
};

type Locale = "pt" | "es" | "en";

function isValidLocale(locale: string): locale is Locale {
  return locale === "pt" || locale === "es" || locale === "en";
}

export function useCategories() {
  const { locale } = useI18n();
  const safeLocale: Locale = isValidLocale(locale) ? locale : "pt";

  const groups = useMemo<CategoryGroup[]>(() => {
    return categoriesData.groups.map((g) => ({
      id: g.id,
      iconKey: g.iconKey,
      colorKey: g.colorKey,
      label: g.labels[safeLocale],
    }));
  }, [safeLocale]);

  const categories = useMemo<Category[]>(() => {
    return categoriesData.categories.map((c) => ({
      key: c.key,
      group: c.group,
      label: c.labels[safeLocale],
    }));
  }, [safeLocale]);

  return { groups, categories, isLoading: false };
}
