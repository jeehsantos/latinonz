import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { PlanTier } from "@/lib/plans";
import { PLAN_LABELS } from "@/lib/plans";

export function LockedFeatureCard({
  title,
  description,
  requiredPlan,
}: {
  title: string;
  description: string;
  requiredPlan: PlanTier;
}) {
  return (
    <div className="inline-flex mt-5 text-sm font-bold px-5 py-2.5 rounded-xl bg-yellow-500 text-slate-950">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
        <Lock size={20} />
      </div>
      <h3 className="mt-4 font-extrabold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{description}</p>
      <p className="text-xs text-gray-400 mt-3">
        Disponível a partir do plano <span className="font-bold text-gray-700">{PLAN_LABELS[requiredPlan]}</span>.
      </p>
      <Link
        to="/dashboard/upgrade"
        className="inline-flex mt-5 bg-[#1A5336] hover:bg-[#123F27] text-white text-sm font-bold px-5 py-2.5 rounded-xl"
      >
        Fazer upgrade
      </Link>
    </div>
  );
}
