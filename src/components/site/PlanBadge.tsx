import type { PlanTier } from "@/lib/plans";
import { PLAN_LABELS } from "@/lib/plans";

const styles: Record<PlanTier, string> = {
  starter: "bg-gray-100 text-gray-600 border-gray-200",
  premium: "bg-[#EFC64E]/20 text-[#8a6a16] border-[#EFC64E]/40",
  ultra: "bg-[#1A5336] text-white border-[#1A5336]",
};

export function PlanBadge({ plan, className = "" }: { plan: PlanTier; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[plan]} ${className}`}
    >
      {PLAN_LABELS[plan]}
    </span>
  );
}
