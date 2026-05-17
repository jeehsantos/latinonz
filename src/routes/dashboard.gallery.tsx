import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCurrentPlan } from "@/lib/dev-plan";
import { getLimit } from "@/lib/plans";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/gallery")({
  component: GalleryPage,
});

function GalleryPage() {
  const { t } = useI18n();
  const [plan] = useCurrentPlan();
  const limit = getLimit(plan, "photoLimit");
  const max = Number.isFinite(limit) ? limit : 12;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">{t("gallery.title")}</h1>
        <p className="text-gray-500 mt-1">
          {t("gallery.subtitle_plan")} <span className="font-bold capitalize">{plan}</span>{" "}
          {t("gallery.subtitle_allows")}{" "}
          {Number.isFinite(limit)
            ? `${t("gallery.subtitle_photos").replace("{n}", String(limit))}`
            : t("gallery.subtitle_unlimited")}.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl bg-gradient-to-br from-emerald-100 via-amber-100 to-emerald-50 border border-gray-200"
          />
        ))}
        <button className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#1A5336] hover:text-[#1A5336] flex flex-col items-center justify-center gap-2">
          <Plus size={20} />
          <span className="text-xs font-bold">{t("gallery.add_button")}</span>
        </button>
      </div>
    </div>
  );
}
