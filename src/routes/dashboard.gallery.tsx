import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCurrentPlan } from "@/lib/dev-plan";
import { getLimit } from "@/lib/plans";

export const Route = createFileRoute("/dashboard/gallery")({
  component: GalleryPage,
});

function GalleryPage() {
  const [plan] = useCurrentPlan();
  const limit = getLimit(plan, "photoLimit");
  const max = Number.isFinite(limit) ? limit : 12;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Galeria</h1>
        <p className="text-gray-500 mt-1">
          Plano <span className="font-bold capitalize">{plan}</span> permite{" "}
          {Number.isFinite(limit) ? `até ${limit} fotos` : "fotos ilimitadas"}.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-gradient-to-br from-emerald-100 via-amber-100 to-emerald-50 border border-gray-200" />
        ))}
        <button className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#1A5336] hover:text-[#1A5336] flex flex-col items-center justify-center gap-2">
          <Plus size={20} />
          <span className="text-xs font-bold">Adicionar</span>
        </button>
      </div>
    </div>
  );
}
