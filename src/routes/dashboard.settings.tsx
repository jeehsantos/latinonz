import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreditCard, Palette, User, Shield, Download, Trash2, ExternalLink, Globe, Sparkles, CalendarDays, RefreshCw, CheckCircle2, Zap } from "lucide-react";
import { useCurrentPlan } from "@/lib/dev-plan";
import { PLAN_LABELS, PLAN_PRICES_NZD, PLAN_FEATURES } from "@/lib/plans";
import type { PlanTier } from "@/lib/plans";
import { useSidebarColor, DEFAULT_SIDEBAR_COLOR } from "@/lib/sidebar-color";
import { useI18n } from "@/lib/i18n";
import { createBillingPortalSession } from "@/lib/stripe.functions";
import { getMyBusiness, updateMyBusiness } from "@/lib/business.functions";
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

const PLAN_ACCENT: Record<PlanTier, string> = {
  starter: "#facc15",
  premium: "#a78bfa",
  ultra: "#f472b6",
};

const PLAN_GRADIENT: Record<PlanTier, string> = {
  starter: "from-[#facc15]/10 to-transparent",
  premium: "from-[#a78bfa]/10 to-transparent",
  ultra:   "from-[#f472b6]/10 to-transparent",
};

function getPlanFeatures(plan: PlanTier): string[] {
  const features: string[] = [];
  const limit = PLAN_FEATURES.photoLimit[plan];
  features.push(limit === Infinity ? "∞ photos" : `${limit} photos`);
  if (PLAN_FEATURES.businessHours[plan]) features.push("Business hours");
  if (PLAN_FEATURES.serviceOptions[plan]) features.push("Service options");
  if (PLAN_FEATURES.coupons[plan]) features.push("Coupons");
  if (PLAN_FEATURES.qrCode[plan]) features.push("QR Code");
  if (PLAN_FEATURES.analytics[plan]) features.push("Analytics");
  if (PLAN_FEATURES.events[plan]) features.push("Events");
  if (PLAN_FEATURES.socialPosts[plan]) features.push("Social posts");
  if (PLAN_FEATURES.topPlacement[plan]) features.push("Top placement");
  return features;
}

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

type Section = "plan" | "appearance" | "account" | "privacy";

function SettingsPage() {
  const { t, setLocale } = useI18n();
  const [plan] = useCurrentPlan();
  const [sidebarColor, setSidebarColor] = useSidebarColor();
  const billingPortal = useServerFn(createBillingPortalSession);
  const [portalLoading, setPortalLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailLang, setEmailLang] = useState<string>("en");
  const [langSaving, setLangSaving] = useState(false);
  const [active, setActive] = useState<Section>("plan");
  const [memberSince, setMemberSince] = useState<string>("");
  const navigate = Route.useNavigate();
  const myBusiness = useServerFn(getMyBusiness);
  const updateBiz = useServerFn(updateMyBusiness);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
      if (data.user?.created_at) setMemberSince(data.user.created_at);
    });
    myBusiness().then((res) => {
      if (res.ok && res.business) {
        setEmailLang((res.business as any).language_preference ?? "en");
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
      if (res.ok && res.url) window.location.href = res.url;
      else toast.error(res.ok ? t("settings.portal_unavailable") : res.error);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.portal_error"));
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const getNextRenewal = () => {
    if (plan === "starter") return t("settings.plan_renewal_na" as any);
    // When Stripe is integrated, this will come from the subscription object.
    // For now, show the next month from today as a placeholder.
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return formatDate(next.toISOString());
  };

  const accent = PLAN_ACCENT[plan];
  const price = PLAN_PRICES_NZD[plan];
  const features = getPlanFeatures(plan);

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
            <div className="space-y-6">
              {/* Plan header card */}
              <div className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br", PLAN_GRADIENT[plan])}>
                {/* Decorative glow */}
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-20" style={{ backgroundColor: accent }} />

                <div className="relative p-6 sm:p-8">
                  {/* Top row: plan name + status badge */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}30` }}>
                        {plan === "starter" ? <Sparkles className="w-6 h-6" style={{ color: accent }} /> : <Zap className="w-6 h-6" style={{ color: accent }} />}
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white">{PLAN_LABELS[plan]}</h2>
                        <p className="text-sm text-neutral-400">{t("settings.current_plan_on" as any)} <span className="font-bold text-white">{PLAN_LABELS[plan]}</span></p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border" style={{ color: accent, borderColor: `${accent}40`, backgroundColor: `${accent}10` }}>
                      <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
                      {t("settings.plan_status_active" as any)}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase text-neutral-500 tracking-wider mb-1">{t("settings.plan_price_label" as any)}</p>
                    {price === 0 ? (
                      <p className="text-3xl font-black text-white">{t("settings.plan_price_free" as any)}</p>
                    ) : (
                      <p className="text-3xl font-black text-white">
                        NZ${price}<span className="text-base font-medium text-neutral-400">{t("settings.plan_price_month" as any)}</span>
                      </p>
                    )}
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarDays className="h-4 w-4 text-neutral-500" />
                        <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider">{t("settings.plan_start_label" as any)}</span>
                      </div>
                      <p className="text-sm font-semibold text-white">{memberSince ? formatDate(memberSince) : "—"}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <RefreshCw className="h-4 w-4 text-neutral-500" />
                        <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider">{t("settings.plan_renewal_label" as any)}</span>
                      </div>
                      <p className="text-sm font-semibold text-white">{getNextRenewal()}</p>
                    </div>
                  </div>

                  {/* CTA button */}
                  <button
                    type="button"
                    onClick={handleChangePlan}
                    disabled={portalLoading}
                    className="inline-flex items-center gap-2 bg-[#facc15] hover:bg-[#facc15]/90 disabled:opacity-60 text-neutral-950 font-bold rounded-xl px-6 py-3 text-sm transition-all hover:shadow-lg hover:shadow-[#facc15]/20"
                  >
                    <CreditCard className="h-4 w-4" />
                    {portalLoading ? t("settings.opening_portal") : t("settings.change_plan")}
                  </button>
                </div>
              </div>

              {/* Included features */}
              <div>
                <h3 className="text-sm font-bold uppercase text-neutral-500 tracking-wider mb-3">{t("settings.plan_features_label" as any)}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/5 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: accent }} />
                      <span className="text-sm text-white">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
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
                      className={`h-10 w-10 rounded-full border-2 transition ${isActive
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
                  readOnly
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

              {/* Email Language Preference */}
              <div className="border-t border-white/10 pt-5 mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4 text-[#facc15]" />
                  <label className="text-xs font-bold uppercase text-neutral-400">
                    {t("settings.email_language_label" as any)}
                  </label>
                </div>
                <p className="text-sm text-neutral-400 mb-3">
                  {t("settings.email_language_description" as any)}
                </p>
                <select
                  id="email-language-select"
                  value={emailLang}
                  disabled={langSaving}
                  onChange={async (e) => {
                    const val = e.target.value as "pt" | "es" | "en";
                    setEmailLang(val);
                    setLangSaving(true);
                    try {
                      const res = await updateBiz({ data: { language_preference: val } });
                      if (res.ok) {
                        setLocale(val);
                        toast.success(t("settings.email_language_saved" as any));
                      } else {
                        toast.error(t("settings.email_language_error" as any));
                      }
                    } catch {
                      toast.error(t("settings.email_language_error" as any));
                    } finally {
                      setLangSaving(false);
                    }
                  }}
                  className="w-full sm:w-64 bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white appearance-none cursor-pointer disabled:opacity-60"
                >
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                  <option value="es">Español</option>
                </select>
              </div>
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
