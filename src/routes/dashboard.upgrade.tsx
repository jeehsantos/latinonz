import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { PlanCard } from "@/components/plans/PlanCard";
import { PlanComparisonTable } from "@/components/plans/PlanComparisonTable";
import { useCurrentPlan } from "@/lib/dev-plan";
import type { PlanTier } from "@/lib/plans";
import { useI18n } from "@/lib/i18n";
import {
  createCheckoutSession,
  getSubscriptionSchedule,
  scheduleDowngrade,
  cancelScheduledDowngrade,
} from "@/lib/stripe.functions";

export const Route = createFileRoute("/dashboard/upgrade")({
  component: UpgradePage,
});

const RANK: Record<PlanTier, number> = { starter: 0, premium: 1, ultra: 2 };

function UpgradePage() {
  const { t, raw } = useI18n();
  const [plan] = useCurrentPlan();
  const checkout = useServerFn(createCheckoutSession);
  const getSchedule = useServerFn(getSubscriptionSchedule);
  const downgradeFn = useServerFn(scheduleDowngrade);
  const cancelDowngradeFn = useServerFn(cancelScheduledDowngrade);

  const [loading, setLoading] = useState<PlanTier | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [schedule, setSchedule] = useState<{
    periodEnd: number | null;
    pendingTier: PlanTier | null;
  } | null>(null);

  const starterFeatures = raw<string[]>("plans.features_starter") ?? [];
  const premiumFeatures = raw<string[]>("plans.features_premium") ?? [];
  const ultraFeatures = raw<string[]>("plans.features_ultra") ?? [];

  const refreshSchedule = useCallback(async () => {
    try {
      const res = await getSchedule();
      if (res?.ok) {
        setSchedule({
          periodEnd: res.periodEnd ?? null,
          pendingTier: (res.pendingTier as PlanTier | null) ?? null,
        });
      }
    } catch {
      // ignore
    }
  }, [getSchedule]);

  useEffect(() => {
    if (plan !== "starter") refreshSchedule();
    else setSchedule(null);
  }, [plan, refreshSchedule]);

  const formatDate = (ts: number | null) => {
    if (!ts) return "";
    try {
      return new Date(ts * 1000).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const select = async (p: PlanTier) => {
    if (p === plan) return;

    // Downgrade path
    if (RANK[p] < RANK[plan]) {
      if (p === "ultra") return; // can't downgrade to ultra
      const effective = schedule?.periodEnd ? formatDate(schedule.periodEnd) : "";
      const confirmMsg = t("upgrade.downgrade_confirm")
        .replace("{plan}", p)
        .replace("{date}", effective || t("upgrade.next_renewal"));
      if (!window.confirm(confirmMsg)) return;
      try {
        setLoading(p);
        const res = await downgradeFn({ data: { targetTier: p as "starter" | "premium" } });
        if (res?.ok) {
          toast.success(
            t("upgrade.downgrade_scheduled")
              .replace("{plan}", p)
              .replace("{date}", res.effectiveAt ? formatDate(res.effectiveAt) : ""),
          );
          await refreshSchedule();
        } else {
          toast.error(t("upgrade.downgrade_error"));
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("upgrade.downgrade_error"));
      } finally {
        setLoading(null);
      }
      return;
    }

    // Upgrade (or new subscription) path
    if (p === "starter") return;
    try {
      setLoading(p);
      const res = await checkout({ data: { planTier: p } });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        toast.error(t("toasts.checkout_init_error"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.checkout_error"));
    } finally {
      setLoading(null);
    }
  };

  const cancelPending = async () => {
    try {
      setCancelling(true);
      const res = await cancelDowngradeFn();
      if (res?.ok) {
        toast.success(t("upgrade.downgrade_cancelled"));
        await refreshSchedule();
      } else {
        toast.error(t("upgrade.downgrade_error"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("upgrade.downgrade_error"));
    } finally {
      setCancelling(false);
    }
  };

  const ctaFor = (target: PlanTier): string => {
    if (target === plan) return t("upgrade.current_plan_label");
    if (loading === target) return t("upgrade.redirecting");
    if (RANK[target] < RANK[plan]) return t("upgrade.downgrade_button");
    if (target === "premium") return t("upgrade.subscribe_premium");
    if (target === "ultra") return t("upgrade.subscribe_ultra");
    return t("plans.cta_default");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">{t("upgrade.title")}</h1>
        <p className="text-neutral-400 mt-1">
          {t("upgrade.current_plan")} <span className="font-bold capitalize">{plan}</span>
        </p>
      </div>

      {schedule?.pendingTier && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="text-amber-100 font-semibold">
              {t("upgrade.pending_change_title").replace("{plan}", schedule.pendingTier)}
            </p>
            <p className="text-amber-100/80 mt-1">
              {t("upgrade.pending_change_body")
                .replace("{plan}", schedule.pendingTier)
                .replace("{date}", formatDate(schedule.periodEnd))}
            </p>
            <button
              onClick={cancelPending}
              disabled={cancelling}
              className="mt-3 text-xs font-bold uppercase tracking-wider text-amber-200 hover:text-white underline underline-offset-2 disabled:opacity-60"
            >
              {cancelling ? t("upgrade.cancelling") : t("upgrade.cancel_downgrade")}
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <PlanCard
          plan="starter"
          features={starterFeatures}
          ctaLabel={ctaFor("starter")}
          onSelect={() => select("starter")}
        />
        <PlanCard
          plan="premium"
          highlight
          features={premiumFeatures}
          ctaLabel={ctaFor("premium")}
          onSelect={() => select("premium")}
        />
        <PlanCard
          plan="ultra"
          features={ultraFeatures}
          ctaLabel={ctaFor("ultra")}
          onSelect={() => select("ultra")}
        />
      </div>
      <PlanComparisonTable />
    </div>
  );
}
