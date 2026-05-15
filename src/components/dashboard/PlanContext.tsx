// Dev-only plan switcher context — lets you preview Starter / Premium / Ultra
// dashboard and profile views without authentication.
// Persisted in localStorage so a refresh keeps your selection.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PlanTier } from "@/lib/plans";

const KEY = "latinonz_dev_plan";

type Ctx = { plan: PlanTier; setPlan: (p: PlanTier) => void };
const PlanContext = createContext<Ctx | null>(null);

export function CurrentPlanProvider({ children, initial = "starter" }: { children: ReactNode; initial?: PlanTier }) {
  const [plan, setPlan] = useState<PlanTier>(initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(KEY) as PlanTier | null;
    if (stored === "starter" || stored === "premium" || stored === "ultra") setPlan(stored);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      plan,
      setPlan: (p) => {
        setPlan(p);
        if (typeof window !== "undefined") window.localStorage.setItem(KEY, p);
      },
    }),
    [plan],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function useCurrentPlan(): Ctx {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("useCurrentPlan must be used inside <CurrentPlanProvider>");
  return ctx;
}
