import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useCurrentPlan } from "@/lib/dev-plan";
import { PLAN_LABELS } from "@/lib/plans";
import { useSidebarColor, DEFAULT_SIDEBAR_COLOR } from "@/lib/sidebar-color";
import { useI18n } from "@/lib/i18n";
import { createBillingPortalSession } from "@/lib/stripe.functions";
import { supabase } from "@/integrations/supabase/client";

const PRESET_COLORS = [
  { name: "Verde Latino", value: "#facc15" },
  { name: "Azul Oceano", value: "#1E3A8A" },
  { name: "Vinho", value: "#7F1D1D" },
  { name: "Roxo", value: "#5B21B6" },
  { name: "Grafite", value: "#1F2937" },
  { name: "Âmbar", value: "#92400E" },
];

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useI18n();
  const [plan] = useCurrentPlan();
  const [sidebarColor, setSidebarColor] = useSidebarColor();
  const billingPortal = useServerFn(createBillingPortalSession);
  const [portalLoading, setPortalLoading] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = Route.useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setEmail(data.user.email);
      }
    });
  }, []);

  const handleChangePlan = async () => {
    if (plan === "starter") {
      navigate({ to: "/dashboard/upgrade" });
      return;
    }
    try {
      setPortalLoading(true);
      const res = await billingPortal();
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        toast.error(res.ok ? "Portal indisponível." : res.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao abrir portal");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">{t("settings.title")}</h1>
        <p className="text-neutral-400 mt-1">{t("settings.subtitle")}</p>
      </div>

      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8">
        <h2 className="font-extrabold text-white">{t("settings.current_plan_title")}</h2>
        <p className="text-sm text-neutral-400 mt-1">
          {t("settings.current_plan_on")}{" "}
          <span className="font-bold text-white">{PLAN_LABELS[plan]}</span>.
        </p>
        <button
          type="button"
          onClick={handleChangePlan}
          disabled={portalLoading}
          className="inline-flex mt-4 bg-neutral-900 hover:bg-white/5 disabled:opacity-60 text-[#facc15] font-bold rounded-xl px-5 py-2.5 text-sm"
        >
          {portalLoading ? "Abrindo..." : t("settings.change_plan")}
        </button>
      </div>

      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 space-y-5">
        <div>
          <h2 className="font-extrabold text-white">{t("settings.appearance_title")}</h2>
          <p className="text-sm text-neutral-400 mt-1">{t("settings.appearance_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {PRESET_COLORS.map((c) => {
            const active = sidebarColor.toLowerCase() === c.value.toLowerCase();
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setSidebarColor(c.value)}
                title={c.name}
                style={{ backgroundColor: c.value }}
                className={`h-10 w-10 rounded-full border-2 transition ${
                  active
                    ? "border-gray-900 ring-2 ring-offset-2 ring-gray-900"
                    : "border-white shadow"
                }`}
                aria-label={c.name}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold uppercase text-neutral-400">
            {t("settings.custom_color")}
          </label>
          <input
            type="color"
            value={sidebarColor}
            onChange={(e) => setSidebarColor(e.target.value)}
            className="h-10 w-14 rounded-lg border border-white/10 cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={sidebarColor}
            onChange={(e) => setSidebarColor(e.target.value)}
            className="bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white w-32"
          />
          <button
            type="button"
            onClick={() => setSidebarColor(DEFAULT_SIDEBAR_COLOR)}
            className="text-sm font-bold text-neutral-300 hover:text-white"
          >
            {t("settings.restore_default")}
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 space-y-4">
        <h2 className="font-extrabold text-white">{t("settings.account_title")}</h2>
        <div>
          <label className="text-xs font-bold uppercase text-neutral-400">
            {t("settings.email_label")}
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-neutral-400">
            {t("settings.new_password_label")}
          </label>
          <input
            type="password"
            className="mt-1 w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm"
          />
        </div>
        <button className="bg-neutral-900 hover:bg-white/5 text-[#facc15] font-bold rounded-xl px-5 py-2.5 text-sm">
          {t("settings.save_button")}
        </button>
      </div>
    </div>
  );
}
