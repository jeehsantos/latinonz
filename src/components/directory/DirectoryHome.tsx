import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type MouseEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Users, MapPin, Star, BadgeCheck, Tag } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { SearchBar, type SearchValue } from "@/components/directory/SearchBar";
import { getBusinesses } from "@/lib/business.functions";
import { adaptBusiness } from "@/lib/business.adapter";
import { useCategories } from "@/hooks/useCategories";
import { getIcon } from "@/lib/category-icons";
import { useI18n } from "@/lib/i18n";
import type { Business } from "@/lib/mock/types";
import { PLAN_LABELS } from "@/lib/plans";

function handleSpotlight(e: MouseEvent<HTMLElement>) {
  const target = e.currentTarget;
  const rect = target.getBoundingClientRect();
  target.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
  target.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
}

export function DirectoryHome() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [search, setSearch] = useState<SearchValue>({ q: "", category: "", city: "" });
  const handleSearchSubmit = () => {
    navigate({
      to: "/directory",
      search: {
        q: search.q || undefined,
        category: search.category || undefined,
        city: search.city || undefined,
      },
    });
  };
  const fetchBusinesses = useServerFn(getBusinesses);
  const { data } = useQuery({
    queryKey: ["businesses", "all"],
    queryFn: () => fetchBusinesses({ data: {} }),
  });
  const { categories, isLoading: catsLoading } = useCategories();
  const featured = useMemo(() => {
    if (!data?.ok) return [];
    return data.rows.slice(0, 4).map((r) => adaptBusiness(r));
  }, [data]);

  const trustItems = [
    { icon: Users, value: "600+", label: t("directory.trust_businesses") },
    { icon: ShieldCheck, value: "100%", label: t("directory.trust_verified") },
    {
      icon: Sparkles,
      value: String(categories.length || 0),
      label: t("directory.trust_categories"),
    },
  ];

  return (
    <SiteShell>
      {/* Hero */}
      <section
        className="relative text-white overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(250,204,21,0.18) 0%, #0a0a0a 60%), radial-gradient(circle at bottom right, rgba(250,204,21,0.12), transparent 60%), #050505",
        }}
      >
        <div className="absolute inset-0 -z-0 opacity-[0.04] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-sm text-white/90 text-[10px] sm:text-[11px] font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-5 sm:mb-8 uppercase tracking-[0.18em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />
            {t("directory.home_badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-white">
            {t("directory.home_headline_before")}
            <span className="text-[#facc15]">{t("directory.home_headline_highlight")}</span>
            {t("directory.home_headline_after")}
          </h1>
          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-white/60 max-w-2xl mx-auto">
            {t("directory.home_subheadline")}
          </p>
          <div className="mt-6 sm:mt-10 max-w-4xl mx-auto">
            <SearchBar value={search} onChange={setSearch} onSubmit={handleSearchSubmit} />
          </div>
        </div>
      </section>


      {/* Trust strip */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 -mt-6 sm:-mt-8 grid grid-cols-3 gap-2 sm:gap-4 relative z-10">
        {trustItems.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="bg-neutral-900 border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 shadow-sm text-center sm:text-left"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#df991b]/15 text-[#df991b] flex items-center justify-center shrink-0">
              <Icon size={18} />
            </div>
            <div>
              <p className="text-base sm:text-xl font-black text-white leading-tight">{value}</p>
              <p className="text-[10px] sm:text-xs text-neutral-400 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="relative max-w-7xl mx-auto px-5 sm:px-6 py-10 sm:py-16">
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div className="flex items-start gap-3">
            <span className="mt-1 w-[3px] h-7 bg-[#FFC700] rounded-full shadow-[0_0_12px_rgba(255,199,0,0.6)]" />
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                {t("directory.categories_title")}
              </h2>
              <p className="text-sm text-neutral-400 mt-1">{t("directory.categories_subtitle")}</p>
            </div>
          </div>
          <Link
            to="/directory"
            className="hidden sm:inline-flex text-sm font-bold text-[#FFC700] items-center gap-1 hover:gap-2 transition-all uppercase tracking-wider"
          >
            {t("directory.see_all")} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {catsLoading && categories.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="spotlight-card rounded-2xl p-4 sm:p-5 animate-pulse h-44"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/5" />
                  <div className="mt-4 h-4 bg-white/5 rounded w-3/4" />
                  <div className="mt-2 h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))
            : categories.slice(0, 10).map((c) => {
                const Icon = getIcon(c.iconKey);
                const active = c.count > 0;
                return (
                  <Link
                    key={c.id}
                    to="/directory"
                    onMouseMove={handleSpotlight}
                    className="spotlight-card group rounded-2xl p-4 sm:p-5 transition-transform duration-300 hover:-translate-y-1 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={
                          active
                            ? "w-11 h-11 rounded-xl bg-[#FFC700] text-black flex items-center justify-center shadow-[0_0_22px_-4px_rgba(255,199,0,0.6)]"
                            : "w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-400 flex items-center justify-center"
                        }
                      >
                        <Icon size={20} />
                      </div>
                      <span
                        className={
                          active
                            ? "inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFC700] text-black"
                            : "inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-400"
                        }
                      >
                        {c.count} {t("directory.listings_count")}
                      </span>
                    </div>
                    <p className="mt-5 font-extrabold text-white text-[15px] leading-tight transition-colors group-hover:text-[#FFC700]">
                      {c.name}
                    </p>
                    {c.blurb && (
                      <p className="mt-2 text-xs text-neutral-500 leading-relaxed line-clamp-2">
                        {c.blurb}
                      </p>
                    )}
                  </Link>
                );
              })}
        </div>
      </section>

      {/* Featured */}
      <section className="relative max-w-7xl mx-auto px-5 sm:px-6 pb-10 sm:pb-16">
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div className="flex items-start gap-3">
            <span className="mt-1 w-[3px] h-7 bg-[#FFC700] rounded-full shadow-[0_0_12px_rgba(255,199,0,0.6)]" />
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                {t("directory.featured_title")}
              </h2>
              <p className="text-sm text-neutral-400 mt-1">{t("directory.featured_subtitle")}</p>
            </div>
          </div>
          <Link
            to="/directory"
            className="text-sm font-bold text-[#FFC700] inline-flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-wider"
          >
            {t("directory.see_more")} <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {featured.map((b) => (
            <FeaturedCard key={b.id} business={b} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 pb-16 sm:pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#facc15] via-[#fbbf24] to-[#f59e0b] text-black p-8 sm:p-10 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-[#facc15]/10">
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
            style={{
              background:
                "radial-gradient(circle at 80% 20%, rgba(0,0,0,0.35), transparent 55%), radial-gradient(circle at 10% 90%, rgba(255,255,255,0.4), transparent 50%)",
            }}
          />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">{t("directory.cta_title")}</h2>
            <p className="mt-3 text-sm sm:text-base text-black/75 max-w-xl mx-auto">{t("directory.cta_body")}</p>
            <Link
              to="/cadastro"
              className="inline-flex mt-6 bg-black text-[#facc15] font-bold px-7 py-3 rounded-full hover:bg-neutral-900 transition shadow-lg"
            >
              {t("directory.cta_button")}
            </Link>
          </div>
        </div>
      </section>

    </SiteShell>
  );
}

function FeaturedCard({ business }: { business: Business }) {
  const planLabel = PLAN_LABELS[business.plan] ?? business.plan;
  return (
    <Link
      to="/business/$slug"
      params={{ slug: business.slug }}
      onMouseMove={handleSpotlight}
      className="spotlight-card group rounded-3xl overflow-hidden flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.015]"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-neutral-900 via-[#FFC700]/5 to-neutral-950 flex items-center justify-center overflow-hidden">
        {business.logoUrl ? (
          <img
            src={business.logoUrl}
            alt={business.name}
            className="max-h-[70%] max-w-[75%] object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="text-5xl font-black text-white/10">
            {business.name.charAt(0)}
          </div>
        )}

        {/* Plan tag top-left */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFC700]" />
          {planLabel}
        </span>

        {/* Rating top-right */}
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white">
          <Star size={11} className="fill-[#FFC700] text-[#FFC700]" />
          {business.rating.toFixed(1)}
          <span className="text-neutral-400 font-normal">({business.reviewCount})</span>
        </span>

        {/* View profile hover indicator */}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full bg-[#FFC700] text-black opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-[0_8px_24px_-6px_rgba(255,199,0,0.6)]">
          View profile <ArrowUpRight size={12} />
        </span>
      </div>

      {/* Footer content */}
      <div className="p-4 sm:p-5 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="font-extrabold text-white text-base leading-tight truncate group-hover:text-[#FFC700] transition-colors">
            {business.name}
          </h3>
          <BadgeCheck size={16} className="text-emerald-400 shrink-0 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
        </div>
        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
          {business.description}
        </p>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500">
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin size={11} className="shrink-0 text-[#FFC700]/70" />
            <span className="truncate">
              {business.locations && business.locations.length > 0
                ? business.locations.join(", ")
                : business.location}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 min-w-0">
            <Tag size={11} className="shrink-0 text-[#FFC700]/70" />
            <span className="truncate">{business.subcategory}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
