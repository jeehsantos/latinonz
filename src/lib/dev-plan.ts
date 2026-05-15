// Dev-only plan switcher used by the dashboard to preview Starter/Premium/Ultra
// without real auth. Persisted in localStorage.
import { useEffect, useState } from "react";
import type { PlanTier } from "@/lib/plans";

const KEY = "latinonz_dev_plan";

export function getStoredPlan(): PlanTier {
  if (typeof window === "undefined") return "starter";
  const v = window.localStorage.getItem(KEY);
  return v === "premium" || v === "ultra" || v === "starter" ? v : "starter";
}

export function setStoredPlan(p: PlanTier) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, p);
  window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: p }));
}

export function useCurrentPlan(): [PlanTier, (p: PlanTier) => void] {
  const [plan, setPlan] = useState<PlanTier>("starter");
  useEffect(() => {
    setPlan(getStoredPlan());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setPlan(getStoredPlan());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return [plan, (p) => { setStoredPlan(p); setPlan(p); }];
}
