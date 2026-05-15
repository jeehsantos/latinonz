
import { Lock } from "lucide-react";
import type { PlanTier } from "@/lib/plans";
import { PLAN_LABELS } from "@/lib/plans";

export function LockedFeatureCard({
  requiredPlan,
  title,
  description,
}: {
  requiredPlan: PlanTier;
  title: string;
  description?: string;
}) {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-[#EFC64E]/10 border border-[#EFC64E]/30 rounded-2xl p-8 text-center">
      <div className="w-16 h-16 bg-[#EFC64E]/20 text-[#8a6a16] rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock size={28} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">{description}</p>}
      <Link
        to="/dashboard/upgrade"
        className="inline-flex bg-[#EFC64E] text-[#0B2C1A] font-bold px-6 py-3 rounded-xl hover:brightness-95 shadow-md"
      >
        Mudar para {PLAN_LABELS[requiredPlan]}
      </Link>
    </div>
  );
}
