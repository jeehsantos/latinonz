import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type MouseEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Users, MapPin, Star, BadgeCheck, ArrowUpRight, Tag } from "lucide-react";
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
      <section className="max-w-7xl mx-auto px-5 sm:px-6 py-10 sm:py-16">
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
              {t("directory.categories_title")}
            </h2>
            <p className="text-sm text-neutral-400 mt-1">{t("directory.categories_subtitle")}</p>
          </div>
          <Link
            to="/directory"
            className="hidden sm:inline-flex text-sm font-bold text-[#df991b] items-center gap-1"
          >
            {t("directory.see_all")} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {catsLoading && categories.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-neutral-900 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 animate-pulse"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/5" />
                  <div className="mt-3 sm:mt-4 h-4 bg-white/5 rounded w-3/4" />
                  <div className="mt-2 h-3 bg-neutral-950 rounded w-1/2" />
                </div>
              ))
            : categories.slice(0, 10).map((c) => {
                const Icon = getIcon(c.iconKey);
                const color = getColor(c.colorKey);
                return (
                  <Link
                    key={c.id}
                    to="/directory"
                    className="group bg-neutral-900 border border-white/10 hover:border-[#df991b]/60 hover:shadow-md transition rounded-2xl sm:rounded-3xl p-4 sm:p-5"
                  >
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${color.bg} ${color.text} flex items-center justify-center`}
                    >
                      <Icon size={20} />
                    </div>
                    <p className="mt-3 sm:mt-4 font-extrabold text-white text-sm leading-tight group-hover:text-[#facc15]">
                      {c.name}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {c.count} {t("directory.listings_count")}
                    </p>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 pb-10 sm:pb-16">
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
              {t("directory.featured_title")}
            </h2>
            <p className="text-sm text-neutral-400 mt-1">{t("directory.featured_subtitle")}</p>
          </div>
          <Link
            to="/directory"
            className="text-sm font-bold text-[#df991b] inline-flex items-center gap-1"
          >
            {t("directory.see_more")} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {featured.map((b) => (
            <BusinessCard key={b.id} business={b} />
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
