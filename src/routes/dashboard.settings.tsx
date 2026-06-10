import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreditCard, Palette, User, Shield, Download, Trash2, ExternalLink } from "lucide-react";
import { useCurrentPlan } from "@/lib/dev-plan";
import { PLAN_LABELS } from "@/lib/plans";
import { useSidebarColor, DEFAULT_SIDEBAR_COLOR } from "@/lib/sidebar-color";
import { useI18n } from "@/lib/i18n";
import { createBillingPortalSession } from "@/lib/stripe.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  { nameKey: "settings.colors.verde", value: "#facc15" },
  { nameKey: "settings.colors.azul", value: "#1E3A8A" },
  { nameKey: "settings.colors.vinho", value: "#7F1D1D" },
  { nameKey: "settings.colors.roxo", value: "#5B21B6" },
  { nameKey: "settings.colors.grafite", value: "#1F2937" },
  { nameKey: "settings.colors.ambar", value: "#92400E" },
];

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

type Section = "plan" | "appearance" | "account" | "privacy";

function SettingsPage() {
  const { t } = useI18n();
  const [plan] = useCurrentPlan();
  const [sidebarColor, setSidebarColor] = useSidebarColor();
  const billingPortal = useServerFn(createBillingPortalSession);
  const [portalLoading, setPortalLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [active, setActive] = useState<Section>("plan");
  const navigate = Route.useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
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
      if (res.ok && res.url) window.location.href = res.url;
      else toast.error(res.ok ? t("settings.portal_unavailable") : res.error);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.portal_error"));
    } finally {
      setPortalLoading(false);
    }
  };

  const items: { id: Section; label: string; icon: typeof CreditCard }[] = [
    { id: "plan", label: t("settings.current_plan_title"), icon: CreditCard },
    { id: "appearance", label: t("settings.appearance_title"), icon: Palette },
    { id: "account", label: t("settings.account_title"), icon: User },
    { id: "privacy", label: t("settings.privacy_title"), icon: Shield },
  ];

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t("settings.title")}</h1>
        <p className="text-sm sm:text-base text-neutral-400 mt-1">{t("settings.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 min-w-0">

        {/* Inner sidebar */}
        <aside className="lg:sticky lg:top-24 self-start min-w-0 -mx-4 sm:mx-0 px-4 sm:px-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible scrollbar-hide">

            {items.map((it) => {
              const Icon = it.icon;
              const isActive = active === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setActive(it.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap text-left",
                    isActive
                      ? "bg-[#facc15]/10 text-[#facc15] border border-[#facc15]/20"
                      : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent",
                  )}
                >
                  <Icon size={16} />
                  <span>{it.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content card */}
        <section className="bg-neutral-900 border border-white/10 rounded-3xl p-5 sm:p-8 min-h-[400px] min-w-0">
          {active === "plan" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  {t("settings.current_plan_title")}
                </h2>
                <p className="text-sm text-neutral-400 mt-1">
                  {t("settings.current_plan_on")}{" "}
                  <span className="font-bold text-white">{PLAN_LABELS[plan]}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleChangePlan}
                disabled={portalLoading}
                className="inline-flex bg-[#facc15] hover:bg-[#facc15]/90 disabled:opacity-60 text-neutral-950 font-bold rounded-xl px-5 py-2.5 text-sm"
              >
                {portalLoading ? t("settings.opening_portal") : t("settings.change_plan")}
              </button>
            </div>
          )}

          {active === "appearance" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  {t("settings.appearance_title")}
                </h2>
                <p className="text-sm text-neutral-400 mt-1">
                  {t("settings.appearance_subtitle")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map((c) => {
                  const isActive = sidebarColor.toLowerCase() === c.value.toLowerCase();
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSidebarColor(c.value)}
                      title={t(c.nameKey as any)}
                      style={{ backgroundColor: c.value }}
                      className={`h-10 w-10 rounded-full border-2 transition ${
                        isActive
                          ? "border-white ring-2 ring-offset-2 ring-offset-neutral-900 ring-white"
                          : "border-white/20"
                      }`}
                      aria-label={t(c.nameKey as any)}
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
          )}

          {active === "account" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  {t("settings.account_title")}
                </h2>
                <p className="text-sm text-neutral-400 mt-1">
                  {t("settings.account_update_subtitle")}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400">
                  {t("settings.email_label")}
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400">
                  {t("settings.new_password_label")}
                </label>
                <input
                  type="password"
                  className="mt-1 w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>
              <button className="bg-[#facc15] hover:bg-[#facc15]/90 text-neutral-950 font-bold rounded-xl px-5 py-2.5 text-sm">
                {t("settings.save_button")}
              </button>
            </div>
          )}

          {active === "privacy" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-white">{t("settings.privacy_title")}</h2>
                <p className="text-sm text-neutral-400 mt-1">
                  {t("settings.privacy_subtitle")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-[#facc15]" />
                    <h3 className="font-bold text-sm text-white">{t("settings.data_request_title")}</h3>
                  </div>
                  <p className="text-sm text-neutral-400">
                    {t("settings.data_request_body")}
                  </p>
                  <a
                    href={`mailto:hello@latinoconnecthub.co.nz?subject=Data%20Access%20Request&body=Account%20email%3A%20${encodeURIComponent(email)}`}
                    className="inline-flex mt-1 border border-white/10 hover:bg-white/5 text-white text-sm font-bold rounded-xl px-4 py-2"
                  >
                    {t("settings.data_request_btn")}
                  </a>
                </div>

                <div className="rounded-2xl border border-white/10 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-red-400" />
                    <h3 className="font-bold text-sm text-white">{t("settings.account_delete_title")}</h3>
                  </div>
                  <p className="text-sm text-neutral-400">
                    {t("settings.account_delete_body")}
                  </p>
                  <a
                    href={`mailto:hello@latinoconnecthub.co.nz?subject=Account%20Deletion%20Request&body=Account%20email%3A%20${encodeURIComponent(email)}`}
                    className="inline-flex mt-1 border border-red-500/30 hover:bg-red-500/10 text-red-400 text-sm font-bold rounded-xl px-4 py-2"
                  >
                    {t("settings.account_delete_btn")}
                  </a>
                </div>

                <a
                  href="/privacy"
                  className="inline-flex items-center gap-1.5 text-sm text-[#facc15] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("settings.privacy_policy_link")}
                </a>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
