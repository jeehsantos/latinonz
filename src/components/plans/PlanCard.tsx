import { Check } from "lucide-react";
import type { PlanTier } from "@/lib/plans";
import { PLAN_LABELS, PLAN_PRICES_NZD } from "@/lib/plans";
import { useI18n } from "@/lib/i18n";

export function PlanCard({
  plan,
  highlight,
  features,
  ctaLabel,
  onSelect,
}: {
  plan: PlanTier;
  highlight?: boolean;
  features: string[];
  ctaLabel?: string;
  onSelect?: () => void;
}) {
  const { t } = useI18n();
  const price = PLAN_PRICES_NZD[plan];
  const label = ctaLabel ?? t("plans.cta_default");

  return (
    <div
      className={`relative rounded-3xl border p-8 flex flex-col bg-neutral-900 ${
        highlight ? "border-[#facc15] shadow-2xl scale-[1.02]" : "border-white/10"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-[#facc15] text-[10px] font-bold uppercase px-3 py-1 rounded-full">
          {t("plans.most_popular")}
        </span>
      )}
      <p className="text-sm font-bold uppercase tracking-wider text-neutral-400">
        {PLAN_LABELS[plan]}
      </p>
      <p className="mt-3 text-4xl font-black text-white">
        {price === 0 ? t("plans.free") : `NZ$ ${price}`}
        {price > 0 && (
          <span className="text-base font-bold text-neutral-500">{t("plans.per_month")}</span>
        )}
      </p>
      <ul className="mt-6 space-y-3 text-sm text-neutral-200 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check size={16} className="text-[#facc15] mt-0.5 flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        className={`mt-8 w-full font-bold rounded-2xl py-3 text-sm ${
          highlight
            ? "bg-[#facc15] hover:bg-[#1a1a1a] text-white"
            : "bg-white/5 hover:bg-white/10 text-white"
        }`}
      >
        {label}
      </button>
    </div>
  );
}
