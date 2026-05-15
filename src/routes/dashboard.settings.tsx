import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentPlan } from "@/lib/dev-plan";
import { PLAN_LABELS } from "@/lib/plans";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [plan] = useCurrentPlan();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Conta, plano e preferências.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-3xl p-8">
        <h2 className="font-extrabold text-gray-900">Plano atual</h2>
        <p className="text-sm text-gray-500 mt-1">Você está no plano <span className="font-bold text-gray-900">{PLAN_LABELS[plan]}</span>.</p>
        <Link to="/dashboard/upgrade" className="inline-flex mt-4 bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl px-5 py-2.5 text-sm">
          Mudar plano
        </Link>
      </div>
      <div className="bg-white border border-gray-200 rounded-3xl p-8 space-y-4">
        <h2 className="font-extrabold text-gray-900">Conta</h2>
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">E-mail</label>
          <input defaultValue="hello@tacosdochef.co.nz" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-gray-500">Nova senha</label>
          <input type="password" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
        </div>
        <button className="bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl px-5 py-2.5 text-sm">Salvar</button>
      </div>
    </div>
  );
}
