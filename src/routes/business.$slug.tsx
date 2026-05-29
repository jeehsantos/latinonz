import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Clock,
  Ticket,
  Image as ImageIcon,
  X,
  ShoppingBag,
  UtensilsCrossed,
  Bike,
  CalendarClock,
  Sparkles,
  Truck,
  Wrench,
  Heart,
  Gift,
  Coffee,
  Package,
} from "lucide-react";

const CUSTOM_ICON_MAP: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  shopping: ShoppingBag,
  utensils: UtensilsCrossed,
  bike: Bike,
  truck: Truck,
  wrench: Wrench,
  heart: Heart,
  gift: Gift,
  star: Star,
  coffee: Coffee,
  package: Package,
  calendar: CalendarClock,
};
import { SiteShell } from "@/components/site/SiteShell";
import { PlanBadge } from "@/components/PlanBadge";
import { getBusinessBySlug } from "@/lib/business.functions";
import { adaptBusiness } from "@/lib/business.adapter";
import { getReviews } from "@/lib/reviews.functions";
import { submitLead } from "@/lib/leads.functions";
import { logProfileView } from "@/lib/analytics.functions";
import { COUPONS_BY_BUSINESS } from "@/lib/mock/businesses";
import { can, getLimit } from "@/lib/plans";
import { useI18n, usePageMetadata } from "@/lib/i18n";

export const Route = createFileRoute("/business/$slug")({
  loader: async ({ params }) => {
    const res = await getBusinessBySlug({ data: { slug: params.slug } });
    if (!res.ok) throw notFound();
    logProfileView({ data: { businessId: res.business.id } }).catch(() => {});
    return {
      business: adaptBusiness(res.business, res.plan),
      hours: res.hours,
      serviceOptions: res.serviceOptions,
      serviceOptionItems: res.serviceOptionItems ?? [],
      photos: res.photos,
      coupons: res.coupons,
      locations: (res.business.locations ?? []) as string[],
    };
  },
  head: ({ params, loaderData }) => ({
    meta: [
      { title: `${loaderData?.business.name ?? "Perfil"} — Latino Connect` },
      { name: "description", content: loaderData?.business.description ?? "" },
      { property: "og:title", content: loaderData?.business.name ?? "" },
      { property: "og:description", content: loaderData?.business.description ?? "" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `https://latinoconnecthub.co.nz/business/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `https://latinoconnecthub.co.nz/business/${params.slug}` }],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: loaderData.business.name,
              description: loaderData.business.description,
              address: {
                "@type": "PostalAddress",
                addressLocality: loaderData.business.location,
                addressCountry: "NZ",
              },
              telephone: loaderData.business.phone,
              email: loaderData.business.email,
              url: loaderData.business.website,
              aggregateRating: loaderData.business.reviewCount
                ? {
                    "@type": "AggregateRating",
                    ratingValue: loaderData.business.rating,
                    reviewCount: loaderData.business.reviewCount,
                  }
                : undefined,
            }),
          },
        ]
      : [],
  }),
  notFoundComponent: BusinessNotFound,
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="text-red-600">{error.message}</p>
      </div>
    </SiteShell>
  ),
  component: BusinessPage,
});

function BusinessPage() {
  const { t } = useI18n();
  const { business, hours, serviceOptions, serviceOptionItems, photos, coupons, locations } = Route.useLoaderData();
  usePageMetadata(
    undefined,
    undefined,
    `${business.name ?? t("business.profile_title_fallback")} — Latino Connect`,
    business.description,
  );

  const fetchReviews = useServerFn(getReviews);
  const submitLeadFn = useServerFn(submitLead);
  const { data: reviewsData } = useQuery({
    queryKey: ["google-reviews", business.id],
    queryFn: () => fetchReviews({ data: { businessId: business.id } }),
  });
  const reviews = (reviewsData?.ok ? reviewsData.reviews : []).map((r) => ({
    name: r.author_name,
    rating: r.rating,
    text: r.text ?? "",
  }));

  const displayType =
    business.type === "Empresa"
      ? t("business.type_business")
      : business.type === "Autônomo"
        ? t("business.type_freelancer_m")
        : business.type === "Autônoma"
          ? t("business.type_freelancer_f")
          : business.type;

  const [leadOpen, setLeadOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [leadStatus, setLeadStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [leadError, setLeadError] = useState<string | null>(null);

  const waNumber = business.phone ? business.phone.replace(/\D/g, "") : "";
  const wantsWhatsappFlow = can(business.plan, "leadWhatsapp") && Boolean(waNumber);

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLeadStatus("submitting");
    setLeadError(null);
    try {
      const res = await submitLeadFn({
        data: {
          businessId: business.id,
          name: leadForm.name.trim(),
          email: leadForm.email.trim() || null,
          phone: leadForm.phone.trim() || null,
          message: leadForm.message.trim() || null,
          source: wantsWhatsappFlow ? "whatsapp" : "direct",
        },
      });
      if (!(res as { ok?: boolean })?.ok) {
        throw new Error((res as { error?: string })?.error ?? t("modal.error_generic"));
      }

      if (wantsWhatsappFlow) {
        const lines = [
          `Olá ${business.name},`,
          ``,
          `Nome: ${leadForm.name.trim()}`,
          leadForm.email.trim() ? `Email: ${leadForm.email.trim()}` : "",
          leadForm.phone.trim() ? `Telefone: ${leadForm.phone.trim()}` : "",
          ``,
          leadForm.message.trim() || "Gostaria de mais informações.",
        ].filter(Boolean);
        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }

      setLeadStatus("success");
      setLeadForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setLeadStatus("error");
      setLeadError(err instanceof Error ? err.message : t("modal.error_generic"));
    }
  }

  const photoLimit = getLimit(business.plan, "photoLimit");
  const visiblePhotos = Number.isFinite(photoLimit) ? photos.slice(0, photoLimit) : photos;

  const planName =
    business.plan === "starter"
      ? t("business.plan_starter")
      : business.plan === "premium"
        ? t("business.plan_premium")
        : t("business.plan_ultra");

  // Build localized day labels from business_hours rows.
  const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const DAY_LABELS: Record<string, string> = {
    mon: "Seg",
    tue: "Ter",
    wed: "Qua",
    thu: "Qui",
    fri: "Sex",
    sat: "Sáb",
    sun: "Dom",
  };
  type HourRow = {
    day_key: string;
    is_closed: boolean;
    slots: { open: string; close: string }[];
    location: string;
  };
  const sortedHours = [...(hours as HourRow[])].sort(
    (a, b) => DAY_ORDER.indexOf(a.day_key as (typeof DAY_ORDER)[number]) -
      DAY_ORDER.indexOf(b.day_key as (typeof DAY_ORDER)[number]),
  );

  const serviceOptionBadges: { key: string; label: string }[] = [];
  if (serviceOptions) {
    if (serviceOptions.takeaway) serviceOptionBadges.push({ key: "takeaway", label: "Take away" });
    if (serviceOptions.dinein) serviceOptionBadges.push({ key: "dinein", label: "Dine in" });
    if (serviceOptions.delivery) serviceOptionBadges.push({ key: "delivery", label: "Delivery" });
    if (serviceOptions.booking)
      serviceOptionBadges.push({ key: "booking", label: "Book in advance" });
    if (serviceOptions.other && serviceOptions.other.trim())
      serviceOptionBadges.push({ key: "other", label: serviceOptions.other.trim() });
  }
  const customItems = (serviceOptionItems ?? []) as {
    id: string;
    title: string;
    description: string | null;
    icon_key: string;
  }[];

  void COUPONS_BY_BUSINESS;


  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-white via-white to-white text-[#facc15]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link to="/directory" className="text-sm text-white/60 hover:text-white">
            {t("business.back_to_directory")}
          </Link>
          <div className="mt-6 flex flex-col md:flex-row md:items-center gap-6">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover bg-neutral-900/10 border border-white/20 shrink-0"
              />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-neutral-900/10 border border-white/20 flex items-center justify-center text-3xl font-black shrink-0">
                {(business.name || "?").trim().charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase bg-neutral-900/15 px-2 py-0.5 rounded-full">
                  {displayType}
                </span>
                <PlanBadge plan={business.plan} />
                {business.fastResponder && (
                  <span className="text-[10px] font-bold uppercase bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                    {t("business.fast_responder")}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-4xl md:text-5xl font-black">{business.name}</h1>
              <p className="mt-2 text-white/70 max-w-2xl">{business.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1 text-white/80">
                  <MapPin size={14} />{" "}
                  {locations.length > 0 ? locations.join(", ") : business.location}
                </span>
                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                  <Star size={14} className="fill-amber-400 text-amber-400" />{" "}
                  {business.rating.toFixed(1)}
                  <span className="text-white/50">
                    ({business.reviewCount} {t("business.reviews_label")})
                  </span>
                </span>
                <span className="text-white/60">{business.subcategory}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8">
            <h2 className="font-extrabold text-white">{t("business.about_title")}</h2>
            <p className="mt-3 text-neutral-300">{business.description}</p>
            {business.tags && (
              <div className="mt-5 flex flex-wrap gap-2">
                {business.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold bg-white/5 text-neutral-200 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Gallery */}
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-white flex items-center gap-2">
                <ImageIcon size={18} /> {t("business.gallery_title")}
              </h2>
              <p className="text-xs text-neutral-500">
                {Number.isFinite(photoLimit)
                  ? `Até ${photoLimit} ${t("business.photos_limit")} (${planName})`
                  : t("business.gallery_full")}
              </p>
            </div>
            {visiblePhotos.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-400">{t("business.no_reviews")}</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {visiblePhotos.map((p: { id: string; url: string }) => (
                  <img
                    key={p.id}
                    src={p.url}
                    alt={business.name}
                    className="aspect-square rounded-2xl object-cover bg-white/5"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8">
            <h2 className="font-extrabold text-white">{t("business.reviews_title")}</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-400">{t("business.no_reviews")}</p>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((r, i) => (
                  <div key={i} className="border-b border-white/10 pb-4 last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-white">{r.name}</p>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            size={14}
                            className={
                              j < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-300 mt-2">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          {/* Contact card */}
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 sticky top-24">
            <h3 className="font-extrabold text-white">{t("business.contact_title")}</h3>
            <div className="mt-4 space-y-3 text-sm">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-3 text-neutral-200 hover:text-[#facc15]"
                >
                  <Phone size={16} /> {business.phone}
                </a>
              )}
              {can(business.plan, "leadWhatsapp") && business.phone && (
                <a
                  href={`https://wa.me/${business.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-neutral-200 hover:text-[#facc15]"
                >
                  <MessageCircle size={16} /> {t("business.whatsapp_label")}
                </a>
              )}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="flex items-center gap-3 text-neutral-200 hover:text-[#facc15]"
                >
                  <Mail size={16} /> {business.email}
                </a>
              )}
              {business.website && (
                <a
                  href={business.website}
                  className="flex items-center gap-3 text-neutral-200 hover:text-[#facc15]"
                >
                  <Globe size={16} /> {t("business.website_label")}
                </a>
              )}
            </div>

            {/* Contact CTA — varies by plan */}
            {can(business.plan, "leadWhatsapp") && business.phone ? (
              <a
                href={`https://wa.me/${business.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 w-full bg-neutral-900 hover:bg-white/5 text-[#facc15] font-bold rounded-2xl py-3 text-sm flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> {t("business.whatsapp_cta")}
              </a>
            ) : (
              <button
                onClick={() => {
                  setLeadStatus("idle");
                  setLeadError(null);
                  setLeadOpen(true);
                }}
                className="mt-6 w-full bg-neutral-900 hover:bg-white/5 text-[#facc15] font-bold rounded-2xl py-3 text-sm"
              >
                {t("business.send_message")}
              </button>
            )}
            {business.responseTime && (
              <p className="text-xs text-neutral-500 text-center mt-3">{business.responseTime}</p>
            )}
          </div>

          {/* Hours — Premium+ only */}
          {can(business.plan, "businessHours") && sortedHours.length > 0 && (
            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
              <h3 className="font-extrabold text-white flex items-center gap-2">
                <Clock size={16} /> {t("business.hours_title")}
              </h3>
              <div className="mt-3 space-y-2 text-sm">
                {sortedHours.map((h) => (
                  <div key={`${h.location}-${h.day_key}`} className="flex justify-between">
                    <span className="text-neutral-400">{DAY_LABELS[h.day_key] ?? h.day_key}</span>
                    <span className="font-semibold text-neutral-100">
                      {h.is_closed || h.slots.length === 0
                        ? "—"
                        : h.slots.map((s) => `${s.open}–${s.close}`).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service options — Premium+ only */}
          {can(business.plan, "serviceOptions") &&
            (serviceOptionBadges.length > 0 || customItems.length > 0) && (
              <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
                <h3 className="font-extrabold text-white">Opções de atendimento</h3>
                {serviceOptionBadges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {serviceOptionBadges.map((b) => (
                      <span
                        key={b.key}
                        className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full"
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                )}
                {customItems.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {customItems.map((it) => {
                      const Icon = CUSTOM_ICON_MAP[it.icon_key] ?? Sparkles;
                      return (
                        <div key={it.id} className="flex items-start gap-3">
                          <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-black text-[#facc15] shrink-0">
                            <Icon size={16} />
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">{it.title}</p>
                            {it.description && (
                              <p className="text-xs text-neutral-400">{it.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          {/* Service cities */}
          {locations.length > 0 && (
            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
              <h3 className="font-extrabold text-white flex items-center gap-2">
                <MapPin size={16} /> Cidades atendidas
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {locations.map((loc: string) => (
                  <span
                    key={loc}
                    className="text-xs font-semibold bg-white/5 text-neutral-200 px-3 py-1 rounded-full"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Coupons — Premium+ only */}
          {can(business.plan, "coupons") && coupons.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
              <h3 className="font-extrabold text-amber-900 flex items-center gap-2">
                <Ticket size={16} /> {t("business.coupons_title")}
              </h3>
              <div className="mt-3 space-y-3">
                {coupons.map((c: { id: string; code: string; title: string; expires_at: string | null }) => (
                  <div key={c.id} className="bg-neutral-900 rounded-2xl p-4 border border-amber-200">
                    <p className="font-extrabold text-amber-700 text-lg tracking-wider">{c.code}</p>
                    <p className="text-sm text-neutral-200">{c.title}</p>
                    {c.expires_at && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {t("business.coupon_valid_until")} {c.expires_at}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>

      {leadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setLeadOpen(false)}
        >
          <div
            className="bg-neutral-900 rounded-3xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-lg">{t("business.send_message")}</h3>
              <button
                onClick={() => setLeadOpen(false)}
                className="text-neutral-500 hover:text-neutral-200"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            {leadStatus === "success" ? (
              <div className="mt-6 text-center space-y-3">
                <p className="text-emerald-700 font-bold">
                  {t("business.lead_modal.success_title")}
                </p>
                <p className="text-sm text-neutral-300">{t("business.lead_modal.success_body")}</p>
                <button
                  onClick={() => setLeadOpen(false)}
                  className="mt-2 bg-neutral-900 hover:bg-white/5 text-[#facc15] font-bold rounded-2xl py-2 px-5 text-sm"
                >
                  {t("business.lead_modal.close")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="mt-4 space-y-3">
                <input
                  required
                  type="text"
                  placeholder={t("business.lead_modal.placeholder_name")}
                  value={leadForm.name}
                  onChange={(e) => setLeadForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  placeholder={t("business.lead_modal.placeholder_email")}
                  value={leadForm.email}
                  onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm"
                />
                <input
                  type="tel"
                  placeholder={t("business.lead_modal.placeholder_phone")}
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm"
                />
                <textarea
                  rows={4}
                  placeholder={t("business.lead_modal.placeholder_message")}
                  value={leadForm.message}
                  onChange={(e) => setLeadForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm resize-none"
                />
                <p className="text-xs text-neutral-500">{t("business.lead_modal.disclaimer")}</p>
                {leadError && <p className="text-xs text-red-600">{leadError}</p>}
                <button
                  type="submit"
                  disabled={leadStatus === "submitting"}
                  className="w-full bg-neutral-900 hover:bg-white/5 disabled:opacity-50 text-[#facc15] font-bold rounded-2xl py-3 text-sm"
                >
                  {leadStatus === "submitting"
                    ? t("business.lead_modal.submitting")
                    : t("business.lead_modal.submit")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </SiteShell>
  );
}

function BusinessNotFound() {
  const { t } = useI18n();
  return (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-black text-white">{t("business.not_found_title")}</h1>
        <Link
          to="/directory"
          className="inline-flex mt-6 bg-black text-[#facc15] font-bold px-5 py-2.5 rounded-xl"
        >
          {t("business.back_to_directory_btn")}
        </Link>
      </div>
    </SiteShell>
  );
}
