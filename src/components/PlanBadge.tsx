import type { PlanTier } from "@/lib/plans";
import { PLAN_LABELS } from "@/lib/plans";

const STYLES: Record<PlanTier, string> = {
  starter: "bg-neutral-200 text-neutral-800 border-neutral-300",
  premium: "bg-amber-50 text-amber-700 border-amber-200",
  ultra: "bg-black text-[#facc15] border-[#facc15]/40",
};

export function PlanBadge({ plan, className = "" }: { plan: PlanTier; className?: string }) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STYLES[plan]} ${className}`}
    >
      {PLAN_LABELS[plan]}
    </span>
  );
}
