// Reads the current user's plan_tier from Supabase profiles.
// Keeps a legacy ?dev=1 localStorage override for previewing tiers without
// changing the backend record. The setter persists to that override only —
// real plan changes happen via Stripe webhooks.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PlanTier } from "@/lib/plans";

const KEY = "latinonz_dev_plan";

function isPlan(v: unknown): v is PlanTier {
  return v === "starter" || v === "premium" || v === "ultra";
}

function devOverride(): PlanTier | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("dev") !== "1") return null;
  const v = window.localStorage.getItem(KEY);
  return isPlan(v) ? v : null;
}

export function setStoredPlan(p: PlanTier) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, p);
  window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: p }));
}

export function getStoredPlan(): PlanTier {
  return devOverride() ?? "starter";
}

export function useCurrentPlan(): [PlanTier, (p: PlanTier) => void] {
  const [plan, setPlan] = useState<PlanTier>(() => devOverride() ?? "starter");

  useEffect(() => {
    let active = true;

    const load = async () => {
      const override = devOverride();
      if (override) {
        if (active) setPlan(override);
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        if (active) setPlan("starter");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("plan_tier")
        .eq("id", userId)
        .maybeSingle();
      if (!active) return;
      setPlan(isPlan(data?.plan_tier) ? (data!.plan_tier as PlanTier) : "starter");
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) load();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return [
    plan,
    (p) => {
      setStoredPlan(p);
      setPlan(p);
    },
  ];
}
