import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Users } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { SearchBar, type SearchValue } from "@/components/directory/SearchBar";
import { BusinessCard } from "@/components/directory/BusinessCard";
import { getBusinesses } from "@/lib/business.functions";
import { adaptBusiness } from "@/lib/business.adapter";
import { useCategories } from "@/hooks/useCategories";
import { getIcon, getColor } from "@/lib/category-icons";
import { useI18n } from "@/lib/i18n";

export function DirectoryHome() {
  const { t } = useI18n();
  const [search, setSearch] = useState<SearchValue>({ q: "", category: "", city: "" });
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
          background: "radial-gradient(ellipse at top, #1A5336 0%, #0F3D24 50%, #0A2A19 100%)",
        }}
      >
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm text-white text-[11px] font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-[0.18em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EFC64E]" />
            {t("directory.home_badge")}
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
            {t("directory.home_headline_before")}
            <span className="text-[#EFC64E]">{t("directory.home_headline_highlight")}</span>
            {t("directory.home_headline_after")}
          </h1>
          <p className="mt-6 text-base md:text-lg text-white/70 max-w-2xl mx-auto">
            {t("directory.home_subheadline")}
          </p>
          <div className="mt-10 max-w-4xl mx-auto">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 grid sm:grid-cols-3 gap-4 relative z-10">
        {trustItems.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#1A5336]/10 text-[#1A5336] flex items-center justify-center">
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              {t("directory.categories_title")}
            </h2>
            <p className="text-gray-500 mt-1">{t("directory.categories_subtitle")}</p>
          </div>
          <Link
            to="/directory"
            className="hidden sm:inline-flex text-sm font-bold text-[#1A5336] items-center gap-1"
          >
            {t("directory.see_all")} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {catsLoading && categories.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-3xl p-5 animate-pulse"
                >
                  <div className="w-11 h-11 rounded-2xl bg-gray-100" />
                  <div className="mt-4 h-4 bg-gray-100 rounded w-3/4" />
                  <div className="mt-2 h-3 bg-gray-50 rounded w-1/2" />
                </div>
              ))
            : categories.slice(0, 10).map((c) => {
                const Icon = getIcon(c.iconKey);
                const color = getColor(c.colorKey);
                return (
                  <Link
                    key={c.id}
                    to="/directory"
                    className="group bg-white border border-gray-200 hover:border-[#1A5336]/40 hover:shadow-md transition rounded-3xl p-5"
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl ${color.bg} ${color.text} flex items-center justify-center`}
                    >
                      <Icon size={20} />
                    </div>
                    <p className="mt-4 font-extrabold text-gray-900 text-sm leading-tight group-hover:text-[#1A5336]">
                      {c.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {c.count} {t("directory.listings_count")}
                    </p>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              {t("directory.featured_title")}
            </h2>
            <p className="text-gray-500 mt-1">{t("directory.featured_subtitle")}</p>
          </div>
          <Link
            to="/directory"
            className="text-sm font-bold text-[#1A5336] inline-flex items-center gap-1"
          >
            {t("directory.see_more")} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#1A5336] to-[#0F3D24] text-white p-10 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-black">{t("directory.cta_title")}</h2>
          <p className="mt-3 text-white/80 max-w-xl mx-auto">{t("directory.cta_body")}</p>
          <Link
            to="/cadastro"
            className="inline-flex mt-6 bg-white text-[#1A5336] font-bold px-6 py-3 rounded-full"
          >
            {t("directory.cta_button")}
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
