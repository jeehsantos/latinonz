import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useCategoriesConfig } from "@/hooks/useAppConfig";

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

export type CategoryWithGroup = Category & {
  groupLabel: string;
  iconKey: string;
  colorKey: string;
};

type Locale = "pt" | "es" | "en";

function isValidLocale(locale: string): locale is Locale {
  return locale === "pt" || locale === "es" || locale === "en";
}

export function useCategories() {
  const { locale } = useI18n();
  const safeLocale: Locale = isValidLocale(locale) ? locale : "pt";
  const categoriesData = useCategoriesConfig();

  const groups = useMemo<CategoryGroup[]>(() => {
    return categoriesData.groups.map((g) => ({
      id: g.id,
      iconKey: g.iconKey,
      colorKey: g.colorKey,
      label: g.labels[safeLocale],
    }));
  }, [safeLocale, categoriesData]);

  const categories = useMemo<Category[]>(() => {
    return categoriesData.categories.map((c) => ({
      key: c.key,
      group: c.group,
      label: c.labels[safeLocale],
    }));
  }, [safeLocale, categoriesData]);

  const groupsById = useMemo(() => {
    const map = new Map<string, CategoryGroup>();
    for (const g of groups) map.set(g.id, g);
    return map;
  }, [groups]);

  const categoriesByKey = useMemo(() => {
    const map = new Map<string, CategoryWithGroup>();
    for (const c of categories) {
      const g = groupsById.get(c.group);
      map.set(c.key, {
        ...c,
        groupLabel: g?.label ?? "",
        iconKey: g?.iconKey ?? "briefcase",
        colorKey: g?.colorKey ?? "slate",
      });
    }
    return map;
  }, [categories, groupsById]);

  const getGroupById = (id: string | null | undefined): CategoryGroup | undefined =>
    id ? groupsById.get(id) : undefined;

  const getCategoryByKey = (
    key: string | null | undefined,
  ): CategoryWithGroup | undefined => (key ? categoriesByKey.get(key) : undefined);

  return {
    groups,
    categories,
    getGroupById,
    getCategoryByKey,
    isLoading: false,
  };
}
