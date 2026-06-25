import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">{t("dashboard.nav_analytics")}</h1>
        <p className="text-neutral-400 mt-1">{t("dashboard.coming_soon_desc")}</p>
      </div>

      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-900 via-black to-neutral-900 border border-white/10 shadow-2xl group">
        {/* Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#df991b,transparent_60%)] opacity-15 group-hover:opacity-25 transition-opacity duration-1000"></div>

        <div className="relative p-12 md:p-24 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-[#df991b]/10 rounded-2xl mb-8 ring-1 ring-[#df991b]/30 backdrop-blur-md">
            <Sparkles className="w-10 h-10 text-[#df991b]" />
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            {t("dashboard.coming_soon_title")}
          </h2>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-medium leading-relaxed">
            {t("dashboard.coming_soon_desc")}
          </p>

          <div className="mt-12 flex items-center justify-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#df991b] animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#df991b] animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#df991b] animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
