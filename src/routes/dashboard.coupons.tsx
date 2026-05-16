import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Tag, Ticket } from "lucide-react";
import { useCurrentPlan } from "@/lib/dev-plan";
import { can } from "@/lib/plans";

export const Route = createFileRoute("/dashboard/coupons")({
  component: CouponsPage,
});

function CouponsPage() {
  const [plan] = useCurrentPlan();
  const unlocked = can(plan, "coupons");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Cupons</h1>
          <p className="text-gray-500 mt-1">Crie ofertas e descontos para sua audiência.</p>
        </div>
        {unlocked && (
          <button className="bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
            <Plus size={16} /> Novo cupom
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-6">
        <h2 className="text-lg font-extrabold text-gray-900 mb-4">Cupons Ativos</h2>

        {unlocked ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
              <Ticket className="text-amber-700" size={20} />
              <p className="font-extrabold tracking-wider text-amber-700 text-2xl mt-3">TACOS10</p>
              <p className="text-sm text-gray-700">10% off no primeiro pedido</p>
              <p className="text-xs text-gray-400 mt-2">Válido até 31 Dez, 2026</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/60 px-6 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Tag size={22} />
            </div>
            <p className="mt-5 font-extrabold text-gray-900 text-base">
              Cupons são um recurso Premium
            </p>
            <Link
              to="/dashboard/upgrade"
              className="mt-4 inline-flex items-center bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              Mudar de Plano
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
