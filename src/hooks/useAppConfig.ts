// React Query hooks for app_config. Falls back to bundled defaults so the
// UI never blocks on the network and works during SSR.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAppConfig, updateAppConfig } from "@/lib/app-config.functions";
import categoriesDefault from "@/lib/categories.json";

export const DEFAULT_CITIES = [
  "Auckland",
  "Wellington",
  "Christchurch",
  "Hamilton",
  "Tauranga",
  "Queenstown",
  "Outras regiões",
];

export type CategoriesConfig = typeof categoriesDefault;

function appConfigQueryKey(key: string) {
  return ["app_config", key] as const;
}

export function useCitiesConfig() {
  const fetcher = useServerFn(getAppConfig);
  const q = useQuery({
    queryKey: appConfigQueryKey("cities"),
    queryFn: async (): Promise<string[]> => {
      const res = await fetcher({ data: { key: "cities" } });
      if (!res.json) return DEFAULT_CITIES;
      try {
        const parsed = JSON.parse(res.json);
        return Array.isArray(parsed) && parsed.length > 0 ? (parsed as string[]) : DEFAULT_CITIES;
      } catch {
        return DEFAULT_CITIES;
      }
    },
    staleTime: 5 * 60_000,
    initialData: DEFAULT_CITIES,
  });
  return q.data ?? DEFAULT_CITIES;
}

export function useCategoriesConfig(): CategoriesConfig {
  const fetcher = useServerFn(getAppConfig);
  const q = useQuery({
    queryKey: appConfigQueryKey("categories"),
    queryFn: async (): Promise<CategoriesConfig> => {
      const res = await fetcher({ data: { key: "categories" } });
      if (!res.json) return categoriesDefault;
      try {
        const parsed = JSON.parse(res.json);
        if (parsed && Array.isArray(parsed.groups) && Array.isArray(parsed.categories)) {
          return parsed as CategoriesConfig;
        }
        return categoriesDefault;
      } catch {
        return categoriesDefault;
      }
    },
    staleTime: 5 * 60_000,
    initialData: categoriesDefault,
  });
  return q.data ?? categoriesDefault;
}

export function useSiteModeConfig() {
  const fetcher = useServerFn(getAppConfig);
  const q = useQuery({
    queryKey: appConfigQueryKey("site_mode"),
    queryFn: async (): Promise<"waitlist" | "live"> => {
      const res = await fetcher({ data: { key: "site_mode" } });
      if (!res.json) return "waitlist";
      try {
        const v = JSON.parse(res.json);
        return v === "live" ? "live" : "waitlist";
      } catch {
        return "waitlist";
      }
    },
    staleTime: 60_000,
  });
  // No initialData on purpose: gating routes on a default "waitlist" before
  // the real config has loaded causes a false redirect away from /business,
  // post-login /admin transitions, etc. Wait for the real fetch.
  return { mode: q.data ?? "waitlist", isLoading: !q.isFetched };
}

export function useUpdateAppConfig() {
  const updater = useServerFn(updateAppConfig);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: "categories" | "cities" | "site_mode"; value: unknown }) => {
      return updater({ data: { key: input.key, json: JSON.stringify(input.value) } });
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: appConfigQueryKey(vars.key) });
    },
  });
}
