import { useMemo, useState } from "react";
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
  ExternalLink,
  Check,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Instagram,
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
import { useCategories } from "@/hooks/useCategories";

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
      branches: res.branches ?? [],
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
  const { t, locale } = useI18n();
  const { getCategoryByKey } = useCategories();
  const { business, hours, serviceOptions, serviceOptionItems, photos, coupons, locations, branches } = Route.useLoaderData();
  const categoryLabel =
    getCategoryByKey(business.macro_category)?.label ?? business.subcategory ?? "";
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
    publishedAt: r.published_at ?? null,
  }));

  const reviewDateFmt = useMemo(() => {
    const map: Record<string, string> = { pt: "pt-BR", es: "es-ES", en: "en-NZ" };
    return new Intl.DateTimeFormat(map[locale] ?? "en-NZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [locale]);

  const googleReviewsUrl = business.googlePlaceId
    ? `https://search.google.com/local/reviews?placeid=${encodeURIComponent(business.googlePlaceId)}`
    : null;

  const openGooglePopup = (url: string) => {
    const w = 720;
    const h = 760;
    const left = Math.max(0, (window.screen.width - w) / 2);
    const top = Math.max(0, (window.screen.height - h) / 2);
    window.open(
      url,
      "google-reviews",
      `popup=yes,width=${w},height=${h},left=${left},top=${top},noopener,noreferrer`,
    );
  };

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Active branch selection — drives contact, address, hours
  type Branch = {
    id: string;
    location: string;
    address_street: string | null;
    address_suburb: string | null;
    phone: string | null;
  };
  const branchList = (branches ?? []) as Branch[];
  const initialCity =
    branchList[0]?.location ?? locations[0] ?? business.location ?? "";
  const [activeCity, setActiveCity] = useState<string>(initialCity);
  const currentBranch =
    branchList.find((b) => b.location === activeCity) ?? branchList[0] ?? null;

  const effectivePhone = (currentBranch?.phone && currentBranch.phone.trim())
    ? currentBranch.phone
    : business.phone ?? "";
  const effectiveStreet = currentBranch?.address_street ?? business.addressStreet ?? null;
  const effectiveSuburb = currentBranch?.address_suburb ?? business.addressSuburb ?? null;

  const waNumber = effectivePhone ? effectivePhone.replace(/\D/g, "") : "";
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
  // Group hours by location for clearer display
  const hoursByLocation = new Map<string, HourRow[]>();
  for (const h of hours as HourRow[]) {
    const key = h.location || "—";
    if (!hoursByLocation.has(key)) hoursByLocation.set(key, []);
    hoursByLocation.get(key)!.push(h);
  }
  const hoursGroups = Array.from(hoursByLocation.entries()).map(([location, rows]) => ({
    location,
    rows: rows.sort(
      (a, b) =>
        DAY_ORDER.indexOf(a.day_key as (typeof DAY_ORDER)[number]) -
        DAY_ORDER.indexOf(b.day_key as (typeof DAY_ORDER)[number]),
    ),
  }));
  const totalHourRows = (hours as HourRow[]).length;

  const serviceOptionBadges: { key: string; label: string }[] = [];
  if (serviceOptions) {
    if (serviceOptions.takeaway) serviceOptionBadges.push({ key: "takeaway", label: t("service_options.takeaway_label") });
    if (serviceOptions.dinein) serviceOptionBadges.push({ key: "dinein", label: t("service_options.dinein_label") });
    if (serviceOptions.delivery) serviceOptionBadges.push({ key: "delivery", label: t("service_options.delivery_label") });
    if (serviceOptions.booking) serviceOptionBadges.push({ key: "booking", label: t("service_options.booking_label") });
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

  // Build address line for the active branch (falls back to business defaults)
  const addressLine = [effectiveStreet, effectiveSuburb]
    .filter((p): p is string => Boolean(p && p.trim()))
    .join(", ");
  const cityForMaps = activeCity || locations[0] || business.location || "New Zealand";
  const mapsQuery = [addressLine, cityForMaps, "New Zealand"].filter(Boolean).join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

  // Banner image — use first photo as backdrop
  const bannerUrl = visiblePhotos[0]?.url ?? null;

  // Cities available for the hours tab switcher — union of branches + hour groups
  const hourCities = Array.from(
    new Set([
      ...branchList.map((b) => b.location),
      ...hoursGroups.map((g) => g.location),
    ]),
  );
  const currentHourGroup =
    hoursGroups.find((g) => g.location === activeCity) ?? hoursGroups[0];

  // Compute "Open now" + today key (in user's timezone — Pacific/Auckland)
  const now = new Date();
  const nzNow = new Date(now.toLocaleString("en-US", { timeZone: "Pacific/Auckland" }));
  const todayKey = DAY_ORDER[(nzNow.getDay() + 6) % 7]; // JS Sun=0 → make Mon=0
  const nowMinutes = nzNow.getHours() * 60 + nzNow.getMinutes();
  const isOpenNow = currentHourGroup
    ? (() => {
        const today = currentHourGroup.rows.find((r) => r.day_key === todayKey);
        if (!today || today.is_closed) return false;
        return today.slots.some((s) => {
          const [oh, om] = s.open.split(":").map(Number);
          const [ch, cm] = s.close.split(":").map(Number);
          return nowMinutes >= oh * 60 + om && nowMinutes <= ch * 60 + cm;
        });
      })()
    : false;

  const todayLabelMap: Record<string, string> = {
    mon: t("profile.day_mon"),
    tue: t("profile.day_tue"),
    wed: t("profile.day_wed"),
    thu: t("profile.day_thu"),
    fri: t("profile.day_fri"),
    sat: t("profile.day_sat"),
    sun: t("profile.day_sun"),
  };

  const contactBlock = (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">
        {t("business.contact_title")}
      </p>
      <div className="space-y-3 text-sm">
        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            className="flex items-center gap-3 text-neutral-200 hover:text-[#facc15] transition"
          >
            <span className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 shrink-0">
              <Phone size={14} />
            </span>
            <span>{business.phone}</span>
          </a>
        )}
        {addressLine && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3 text-neutral-200 hover:text-[#facc15] transition group"
          >
            <span className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 shrink-0 mt-0.5">
              <MapPin size={14} />
            </span>
            <span className="flex-1">
              {addressLine}
              {cityForMaps && <>, {cityForMaps}</>}
            </span>
            <ExternalLink
              size={12}
              className="text-neutral-500 group-hover:text-[#facc15] mt-1 shrink-0"
            />
          </a>
        )}
        {business.email && (
          <a
            href={`mailto:${business.email}`}
            className="flex items-center gap-3 text-neutral-200 hover:text-[#facc15] transition"
          >
            <span className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 shrink-0">
              <Mail size={14} />
            </span>
            <span className="truncate">{business.email}</span>
          </a>
        )}
        {business.facebookUrl && (
          <a
            href={business.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-neutral-200 hover:text-[#facc15] transition"
          >
            <span className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 shrink-0">
              <Facebook size={14} />
            </span>
            <span className="truncate">Facebook</span>
          </a>
        )}
        {business.instagramUrl && (
          <a
            href={business.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-neutral-200 hover:text-[#facc15] transition"
          >
            <span className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 shrink-0">
              <Instagram size={14} />
            </span>
            <span className="truncate">Instagram</span>
          </a>
        )}
      </div>
      {business.responseTime && (
        <p className="text-xs text-neutral-500 mt-3">{business.responseTime}</p>
      )}
    </div>
  );


  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10 bg-[#050505]">
        {/* backdrop */}
        <div className="absolute inset-0">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt=""
              aria-hidden
              className="w-full h-full object-cover opacity-30"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background:
                  "radial-gradient(ellipse at top left, rgba(250,204,21,0.18) 0%, transparent 55%), radial-gradient(circle at 85% 110%, rgba(250,204,21,0.12), transparent 50%)",
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#050505]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-8 pb-10 md:pt-10 md:pb-12">
          <Link
            to="/directory"
            className="inline-flex items-center text-sm text-white/60 hover:text-[#facc15] transition"
          >
            {t("business.back_to_directory")}
          </Link>

          {/* Spacer to push content below the banner area */}
          <div className="h-40 md:h-56" />

          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
            {/* Logo */}
            <div className="relative shrink-0 -mt-20 md:-mt-24">
              <div
                className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#facc15]/40 to-transparent blur-md"
                aria-hidden
              />
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="relative w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover bg-neutral-900 border-2 border-white/15 shadow-2xl"
                />
              ) : (
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-neutral-900 border-2 border-white/15 flex items-center justify-center text-5xl font-black text-[#facc15] shadow-2xl">
                  {(business.name || "?").trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <PlanBadge plan={business.plan} />
              </div>
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15 px-3 py-1 rounded-full backdrop-blur">
                  {displayType}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                  <Star size={14} className="fill-[#facc15] text-[#facc15]" />
                  {business.rating.toFixed(1)}
                  <span className="text-white/50 font-normal">
                    ({business.reviewCount} {t("business.reviews_label")})
                  </span>
                </span>
                {business.fastResponder && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#facc15] text-black px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                    {t("business.fast_responder")}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.05]">
                {business.name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5 text-white/80">
                  <MapPin size={14} className="text-[#facc15]" />
                  {locations.length > 0 ? locations.join(", ") : business.location}
                </span>
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-white/80 hover:text-[#facc15] transition"
                  >
                    <Globe size={14} />
                    {business.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                )}
                {categoryLabel && (
                  <span className="text-white/60">{categoryLabel}</span>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* MAIN */}
      <section className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-4 mb-5">
              <h2 className="text-2xl font-extrabold text-white whitespace-nowrap">
                {t("business.about_title")}
              </h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <p className="text-neutral-300 leading-relaxed whitespace-pre-line">
              {business.description}
            </p>
            {business.tags && business.tags.length > 0 && (
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

          {/* Contact (mobile only — between About and Gallery for visibility) */}
          <div className="lg:hidden">{contactBlock}</div>

          {/* Gallery */}

          {visiblePhotos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-extrabold text-white">
                  {t("business.gallery_title")}
                </h2>
                <span className="text-xs text-neutral-500">
                  {Number.isFinite(photoLimit)
                    ? `${visiblePhotos.length} / ${photoLimit}`
                    : `${visiblePhotos.length} ${t("business.photos_limit")}`}
                </span>
              </div>
              {(() => {
                const first = visiblePhotos[0];
                const rest = visiblePhotos.slice(1, 5);
                const hasMore = visiblePhotos.length > 3;
                return (
                  <div className="space-y-3">
                    {first && (
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(0)}
                        className="relative block w-full overflow-hidden rounded-2xl bg-white/5 group aspect-[16/9]"
                      >
                        <img
                          src={first.url}
                          alt={`${business.name} — 1`}
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                    {rest.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {rest.map((p: { id: string; url: string }, i: number) => {
                          const idx = i + 1;
                          const isLastTile = i === rest.length - 1 && hasMore;
                          return (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => setLightboxIndex(idx)}
                              className="relative block overflow-hidden rounded-xl bg-white/5 group aspect-square"
                            >
                              <img
                                src={p.url}
                                alt={`${business.name} — ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              {isLastTile && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 text-white">
                                  <ImageIcon size={20} className="text-[#facc15]" />
                                  <span className="text-xs font-bold">{t("business.view_all_photos")}</span>
                                  <span className="text-[10px] text-white/70">
                                    {visiblePhotos.length} {t("business.photos_limit")}
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          )}

          {/* Reviews */}
          <div>
            <div className="flex items-center gap-4 mb-5">
              <h2 className="text-2xl font-extrabold text-white whitespace-nowrap">
                {t("business.reviews_title")}
              </h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-neutral-400">{t("business.no_reviews")}</p>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  {reviews.slice(0, 4).map((r, i) => {
                    const initials = r.name
                      .split(" ")
                      .map((n) => n.charAt(0))
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const isLatest = i === 0;
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => googleReviewsUrl && openGooglePopup(googleReviewsUrl)}
                        disabled={!googleReviewsUrl}
                        className="text-left bg-neutral-900 border border-white/10 rounded-2xl p-5 hover:border-[#facc15]/40 transition disabled:cursor-default"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex items-center justify-center h-10 w-10 rounded-full bg-[#facc15] text-black text-sm font-extrabold shrink-0">
                              {initials || "?"}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{r.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, j) => (
                                    <Star
                                      key={j}
                                      size={12}
                                      className={
                                        j < r.rating
                                          ? "fill-[#facc15] text-[#facc15]"
                                          : "text-white/15"
                                      }
                                    />
                                  ))}
                                </div>
                                {r.publishedAt && (
                                  <span className="text-[11px] text-neutral-400">
                                    {reviewDateFmt.format(new Date(r.publishedAt))}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isLatest && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#facc15] text-black px-2 py-0.5 rounded-full shrink-0">
                              {t("business.latest_badge")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-300 mt-3 leading-relaxed line-clamp-5">
                          {r.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {reviews.length > 4 && googleReviewsUrl && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => openGooglePopup(googleReviewsUrl)}
                      className="inline-flex items-center gap-2 border border-[#facc15]/40 text-[#facc15] font-bold rounded-full px-5 py-2.5 text-sm hover:bg-[#facc15]/10 transition"
                    >
                      {t("business.read_all_reviews").replace("{n}", String(business.reviewCount))}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 sticky top-24 space-y-6">
            {/* Primary CTA */}
            <button
              onClick={() => {
                setLeadStatus("idle");
                setLeadError(null);
                setLeadOpen(true);
              }}
              className={`w-full inline-flex items-center justify-center gap-2 font-bold rounded-2xl py-3.5 text-sm transition shadow-lg ${
                wantsWhatsappFlow
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                  : "bg-[#facc15] hover:bg-[#facc15]/90 text-black shadow-[#facc15]/20"
              }`}
            >
              <MessageCircle size={16} />
              {wantsWhatsappFlow ? t("business.whatsapp_cta") : t("business.send_message")}
            </button>

            {/* Contact */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">
                {t("business.contact_title")}
              </p>
              <div className="space-y-3 text-sm">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-3 text-neutral-200 hover:text-[#facc15] transition"
                  >
                    <span className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 shrink-0">
                      <Phone size={14} />
                    </span>
                    <span>{business.phone}</span>
                  </a>
                )}
                {addressLine && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 text-neutral-200 hover:text-[#facc15] transition group"
                  >
                    <span className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 shrink-0 mt-0.5">
                      <MapPin size={14} />
                    </span>
                    <span className="flex-1">
                      {addressLine}
                      {cityForMaps && <>, {cityForMaps}</>}
                    </span>
                    <ExternalLink
                      size={12}
                      className="text-neutral-500 group-hover:text-[#facc15] mt-1 shrink-0"
                    />
                  </a>
                )}
                {business.email && (
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-3 text-neutral-200 hover:text-[#facc15] transition"
                  >
                    <span className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 shrink-0">
                      <Mail size={14} />
                    </span>
                    <span className="truncate">{business.email}</span>
                  </a>
                )}
                {business.facebookUrl && (
                  <a
                    href={business.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-neutral-200 hover:text-[#facc15] transition"
                  >
                    <span className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 shrink-0">
                      <Facebook size={14} />
                    </span>
                    <span className="truncate">Facebook</span>
                  </a>
                )}
                {business.instagramUrl && (
                  <a
                    href={business.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-neutral-200 hover:text-[#facc15] transition"
                  >
                    <span className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 shrink-0">
                      <Instagram size={14} />
                    </span>
                    <span className="truncate">Instagram</span>
                  </a>
                )}
              </div>
              {business.responseTime && (
                <p className="text-xs text-neutral-500 mt-3">{business.responseTime}</p>
              )}
            </div>

            {/* Service options — Premium+ */}
            {can(business.plan, "serviceOptions") &&
              (serviceOptionBadges.length > 0 || customItems.length > 0) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">
                    {t("business.service_options_title")}
                  </p>
                  {serviceOptionBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {serviceOptionBadges.map((b) => (
                        <span
                          key={b.key}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/5 text-neutral-200 border border-white/10 px-3 py-1.5 rounded-full"
                        >
                          <Check size={12} className="text-[#facc15]" />
                          {b.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {customItems.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {customItems.map((it) => {
                        const Icon = CUSTOM_ICON_MAP[it.icon_key] ?? Sparkles;
                        return (
                          <span
                            key={it.id}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/5 text-neutral-200 border border-white/10 px-3 py-1.5 rounded-full"
                          >
                            <Icon size={12} className="text-[#facc15]" />
                            {it.title}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            {/* Opening hours — Premium+ */}
            {can(business.plan, "businessHours") && totalHourRows > 0 && currentHourGroup && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    {t("business.hours_title")}
                  </p>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isOpenNow
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-red-500/10 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {isOpenNow ? t("business.open_now") : t("business.closed_now")}
                  </span>
                </div>

                {hourCities.length > 1 && (
                  <div className="flex bg-white/5 p-1 rounded-xl mb-3">
                    {hourCities.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setActiveCity(c)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                          activeCity === c
                            ? "bg-black text-[#facc15] shadow-sm"
                            : "text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  {currentHourGroup.rows.map((h) => {
                    const isToday = h.day_key === todayKey;
                    const closed = h.is_closed || h.slots.length === 0;
                    return (
                      <div
                        key={`${h.location}-${h.day_key}`}
                        className={`flex justify-between items-center ${
                          isToday ? "text-[#facc15] font-bold" : "text-neutral-300"
                        }`}
                      >
                        <span>
                          {todayLabelMap[h.day_key] ?? h.day_key}
                          {isToday && (
                            <span className="ml-1 text-[10px] uppercase tracking-wider opacity-70">
                              ({t("business.today_label")})
                            </span>
                          )}
                        </span>
                        <span className={closed ? "text-neutral-500 italic" : ""}>
                          {closed
                            ? t("business.closed_now")
                            : h.slots.map((s) => `${s.open} – ${s.close}`).join(", ")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <Link
                  to="/contato"
                  className="mt-4 block w-full text-center text-xs text-neutral-500 underline-offset-4 hover:underline hover:text-neutral-300 transition"
                >
                  {t("business.report_incorrect")}
                </Link>
              </div>
            )}

            {/* Coupons — Premium+ */}
            {can(business.plan, "coupons") && coupons.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
                  <Ticket size={12} /> {t("business.coupons_title")}
                </p>
                <div className="space-y-2">
                  {coupons.map(
                    (c: {
                      id: string;
                      code: string;
                      title: string;
                      expires_at: string | null;
                      discount_type?: string | null;
                      discount_value?: number | null;
                    }) => (
                      <div
                        key={c.id}
                        className="bg-[#facc15]/10 border border-[#facc15]/30 rounded-xl p-3 flex flex-col"
                      >
                        <div className="flex justify-between items-start mb-1.5 gap-2">
                          <p className="font-extrabold text-[#facc15] tracking-wider text-sm">
                            {c.code}
                          </p>
                          {c.discount_value ? (
                            <span className="bg-[#facc15] text-black text-[10px] font-black px-2 py-0.5 rounded-md shrink-0">
                              {c.discount_type === "percent" ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-neutral-200">{c.title}</p>
                        {c.expires_at && (
                          <p className="text-[10px] text-neutral-500 mt-1.5">
                            {t("business.coupon_valid_until")} {c.expires_at}
                          </p>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </section>


      {leadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
          onClick={() => setLeadOpen(false)}
        >
          <div className="bg-neutral-900 rounded-3xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-lg">{t("business.send_message")}</h3>
              <button
                onClick={() => setLeadOpen(false)}
                className="text-neutral-500 hover:text-neutral-200"
                aria-label={t("business.lead_modal.close")}
              >
                <X size={20} />
              </button>
            </div>
            {leadStatus === "success" ? (
              <div className="mt-6 text-center space-y-3">
                <p className="text-emerald-700 font-bold">{t("business.lead_modal.success_title")}</p>
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
                  {leadStatus === "submitting" ? t("business.lead_modal.submitting") : t("business.lead_modal.submit")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Photo lightbox / carousel */}
      {lightboxIndex !== null && visiblePhotos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            aria-label={t("business.lead_modal.close")}
          >
            <X size={20} />
          </button>
          {visiblePhotos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(
                  (lightboxIndex - 1 + visiblePhotos.length) % visiblePhotos.length,
                );
              }}
              className="absolute left-4 md:left-8 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              aria-label={t("cookie_consent.previous_label")}
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={visiblePhotos[lightboxIndex].url}
              alt={`${business.name} — ${lightboxIndex + 1}`}
              className="w-full max-h-[85vh] object-contain rounded-2xl"
            />
            <p className="mt-3 text-center text-xs text-white/70">
              {lightboxIndex + 1} / {visiblePhotos.length}
            </p>
          </div>
          {visiblePhotos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((lightboxIndex + 1) % visiblePhotos.length);
              }}
              className="absolute right-4 md:right-8 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              aria-label={t("cookie_consent.next_label")}
            >
              <ChevronRight size={24} />
            </button>
          )}
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
        <Link to="/directory" className="inline-flex mt-6 bg-black text-[#facc15] font-bold px-5 py-2.5 rounded-xl">
          {t("business.back_to_directory_btn")}
        </Link>
      </div>
    </SiteShell>
  );
}
