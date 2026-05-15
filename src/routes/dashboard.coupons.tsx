import { createFileRoute } from "@tanstack/react-router";
import { Plus, Ticket } from "lucide-react";
import { useCurrentPlan } from "@/lib/dev-plan";
import { can } from "@/lib/plans";
import { LockedFeatureCard } from "@/components/dashboard/LockedFeatureCard";

export const Route = createFileRoute("/dashboard/coupons")({
  component: CouponsPage,
});

function CouponsPage() {
  const [plan] = useCurrentPlan();
  if (!can(plan, "coupons")) {
    return (
      <LockedFeatureCard
        title="Cupons promocionais"
        description="Crie cupons de desconto exclusivos para atrair e fidelizar clientes."
        requiredPlan="premium"
      />
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Cupons</h1>
          <p className="text-gray-500 mt-1">Crie ofertas e descontos para sua audiência.</p>
        </div>
        <button className="bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
          <Plus size={16} /> Novo cupom
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
          <Ticket className="text-amber-700" size={20} />
          <p className="font-extrabold tracking-wider text-amber-700 text-2xl mt-3">TACOS10</p>
          <p className="text-sm text-gray-700">10% off no primeiro pedido</p>
          <p className="text-xs text-gray-400 mt-2">Válido até 31 Dez, 2026</p>
        </div>
      </div>
    </div>
  );
}
