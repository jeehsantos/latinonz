import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type MouseEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Users, MapPin, Star, BadgeCheck, Tag } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { SearchBar, type SearchValue } from "@/components/directory/SearchBar";
import { MobileSearchBar } from "@/components/directory/MobileSearchBar";
import { getBusinesses } from "@/lib/business.functions";
import auckland from "@/assets/auckland-skyline.jpg.asset.json";
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
  const { groups, categories, isLoading: catsLoading } = useCategories();
  void catsLoading;
  const allBusinesses = useMemo(() => (data?.ok ? data.rows.map((r) => adaptBusiness(r)) : []), [data]);
  const businessCountByGroup = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of allBusinesses) {
      const groupId = b.categoryGroup ?? categories.find((c) => c.key === b.macro)?.group;
      if (!groupId) continue;
      counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
    }
    return counts;
  }, [allBusinesses, categories]);
  const featured = useMemo(() => allBusinesses.slice(0, 4), [allBusinesses]);

  const trustItems = [
    { icon: Users, value: "600+", label: t("directory.trust_businesses") },
    { icon: ShieldCheck, value: "100%", label: t("directory.trust_verified") },
    {
      icon: Sparkles,
      value: String(groups.length),
      label: t("directory.trust_categories"),
    },
  ];

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative text-white overflow-hidden w-full">
        {/* Background image — full bleed */}
        <img
          src={auckland.url}
          alt="Auckland skyline"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Yellow tint + dark vignette overlays */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(250,204,21,0.28) 0%, rgba(10,10,10,0.55) 55%, rgba(5,5,5,0.85) 100%), radial-gradient(circle at bottom right, rgba(250,204,21,0.18), transparent 60%)",
          }}
        />
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />

        {/* Desktop hero */}
        <div className="hidden md:block relative max-w-6xl mx-auto px-5 sm:px-6 py-14 md:py-20 text-center">
          <h1 className="font-['Barlow_Condensed'] font-black tracking-tight leading-[0.95] text-white uppercase text-5xl md:text-7xl whitespace-pre-line drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
            {t("directory.home_headline_before")}
            {"\n"}
            <span className="text-[#facc15]">{t("directory.home_headline_highlight")}</span>
          </h1>
          <div className="mt-10 max-w-4xl mx-auto">
            <SearchBar value={search} onChange={setSearch} onSubmit={handleSearchSubmit} />
          </div>
        </div>

        {/* Mobile hero — compact */}
        <div className="md:hidden relative px-5 pt-8 pb-7">
          <h1 className="font-['Barlow_Condensed'] text-[32px] font-black tracking-tight leading-[0.95] text-white uppercase whitespace-pre-line drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
            {t("directory.home_headline_before")}
            {"\n"}
            <span className="text-[#facc15]">{t("directory.home_headline_highlight")}</span>
          </h1>
          <div className="mt-5">
            <MobileSearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </section>

      {/* Trust strip — desktop */}
      <section className="hidden md:grid max-w-7xl mx-auto px-5 sm:px-6 -mt-6 sm:-mt-8 grid-cols-3 gap-2 sm:gap-4 relative z-10">
        {trustItems.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="bg-neutral-900 border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 shadow-sm text-center sm:text-left"
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

      {/* Trust strip — mobile (inline pill row) */}
      <section className="md:hidden mx-5 -mt-3 relative z-10 bg-neutral-900 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-around divide-x divide-white/10">
        {trustItems.map(({ value, label }) => (
          <div key={label} className="flex-1 px-2 text-center">
            <p className="text-base font-black text-white leading-tight">{value}</p>
            <p className="text-[9px] uppercase tracking-wider text-neutral-400 leading-tight mt-0.5">
              {label.split(" ")[0]}
            </p>
          </div>
        ))}
      </section>

      {/* Categories — desktop grid */}
      <section className="hidden md:block relative max-w-7xl mx-auto px-5 sm:px-6 py-10 sm:py-16">
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
            className="inline-flex text-sm font-bold text-[#FFC700] items-center gap-1 hover:gap-2 transition-all uppercase tracking-wider"
          >
            {t("directory.see_all")} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {groups.slice(0, 10).map((g) => {
            const Icon = getIcon(g.iconKey);
            const count = businessCountByGroup.get(g.id) ?? 0;
            return (
              <Link
                key={g.id}
                to="/directory"
                search={{ category: g.id }}
                onMouseMove={handleSpotlight}
                className="spotlight-card group rounded-2xl p-4 sm:p-5 transition-transform duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-11 h-11 rounded-xl bg-[#FFC700] text-black flex items-center justify-center shadow-[0_0_22px_-4px_rgba(255,199,0,0.6)]">
                    <Icon size={20} />
                  </div>
                  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFC700]/15 text-[#FFC700]">
                    {count}
                  </span>
                </div>
                <p className="mt-5 font-extrabold text-white text-[15px] leading-tight transition-colors group-hover:text-[#FFC700]">
                  {g.label}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Categories — mobile horizontal rail */}
      <section className="md:hidden mt-7">
        <div className="flex items-end justify-between px-5 mb-3">
          <h2 className="text-lg font-black text-white">{t("directory.categories_title")}</h2>
          <Link to="/directory" className="text-xs font-bold text-[#facc15] uppercase tracking-wider inline-flex items-center gap-0.5">
            {t("directory.see_all")} <ArrowRight size={12} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-1 snap-x snap-mandatory scrollbar-hide scroll-pl-5">
          {groups.slice(0, 10).map((g) => {
            const Icon = getIcon(g.iconKey);
            const count = businessCountByGroup.get(g.id) ?? 0;
            return (
              <Link
                key={g.id}
                to="/directory"
                search={{ category: g.id }}
                className="snap-start shrink-0 w-[120px] rounded-2xl bg-neutral-900 border border-white/10 p-3 flex flex-col gap-2 active:bg-neutral-800"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#FFC700] text-black flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-[#FFC700]/15 text-[#FFC700]">
                    {count}
                  </span>
                </div>
                <p className="font-extrabold text-white text-[13px] leading-tight line-clamp-2">{g.label}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured — desktop grid */}
      <section className="hidden md:block relative max-w-7xl mx-auto px-5 sm:px-6 pb-10 sm:pb-16">
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div className="flex items-start gap-3">
            <span className="mt-1 w-[3px] h-7 bg-[#FFC700] rounded-full shadow-[0_0_12px_rgba(255,199,0,0.6)]" />
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">{t("directory.featured_title")}</h2>
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

      {/* Featured — mobile horizontal swipe */}
      <section className="md:hidden mt-8">
        <div className="flex items-end justify-between px-5 mb-3">
          <h2 className="text-lg font-black text-white">{t("directory.featured_title")}</h2>
          <Link to="/directory" className="text-xs font-bold text-[#facc15] uppercase tracking-wider inline-flex items-center gap-0.5">
            {t("directory.see_more")} <ArrowRight size={12} />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto px-5 pb-2 snap-x snap-mandatory scrollbar-hide scroll-pl-5">
          {featured.map((b) => (
            <div key={b.id} className="snap-start shrink-0 w-[280px]">
              <FeaturedCard business={b} />
            </div>
          ))}
        </div>
      </section>


      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 pt-8 md:pt-0 pb-6 md:pb-20">
        <div className="rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#facc15] via-[#fbbf24] to-[#f59e0b] text-black p-6 sm:p-10 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-[#facc15]/10">
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
            style={{
              background:
                "radial-gradient(circle at 80% 20%, rgba(0,0,0,0.35), transparent 55%), radial-gradient(circle at 10% 90%, rgba(255,255,255,0.4), transparent 50%)",
            }}
          />
          <div className="relative">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">{t("directory.cta_title")}</h2>
            <p className="mt-2 sm:mt-3 text-[13px] sm:text-base text-black/75 max-w-xl mx-auto">{t("directory.cta_body")}</p>
            <Link
              to="/cadastro"
              className="inline-flex mt-4 sm:mt-6 bg-black text-[#facc15] font-bold px-6 sm:px-7 py-2.5 sm:py-3 rounded-full hover:bg-neutral-900 transition shadow-lg text-sm sm:text-base"
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
  const { t } = useI18n();
  const { getCategoryByKey } = useCategories();
  const categoryLabel = getCategoryByKey(business.macro)?.label ?? business.subcategory;
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
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="text-6xl font-black text-white/10">{business.name.charAt(0)}</div>
        )}

        {/* Plan badges top-left: BUSINESS */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-md bg-[#FFC700] text-black shadow-[0_4px_14px_-4px_rgba(255,199,0,0.6)]">
            {business.type === "Empresa" ? t("business.badges.business") : t("business.badges.pro")}
          </span>
        </div>

        {/* Rating top-right */}
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/15 text-white">
          <Star size={11} className="fill-[#FFC700] text-[#FFC700]" />
          {business.rating.toFixed(1)}
          <span className="text-neutral-400 font-normal">({business.reviewCount})</span>
        </span>

        {/* Bottom gradient fade for readability */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Footer content */}
      <div className="p-4 sm:p-5 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="font-extrabold text-white text-lg leading-tight truncate group-hover:text-[#FFC700] transition-colors">
            {business.name}
          </h3>
          <BadgeCheck size={16} className="text-sky-400 shrink-0 fill-sky-400/20" />
        </div>
        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed min-h-[2.4rem]">{business.description}</p>
        <div className="mt-2 pt-3 border-t border-white/5 flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 min-w-0">
            <MapPin size={12} className="shrink-0 text-[#FFC700]" />
            <span className="truncate">
              {business.locations && business.locations.length > 0 ? business.locations.join(", ") : business.location}
            </span>
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 min-w-0">
              <Tag size={12} className="shrink-0 text-[#FFC700]" />
              <span className="truncate">{categoryLabel}</span>
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFC700] shrink-0">{t("business.badges.active")}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
