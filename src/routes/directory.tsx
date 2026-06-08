import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { SiteShell } from "@/components/site/SiteShell";
import { SearchBar, type SearchValue } from "@/components/directory/SearchBar";
import { MobileSearchBar } from "@/components/directory/MobileSearchBar";
import { BusinessCard } from "@/components/directory/BusinessCard";
import { getBusinesses } from "@/lib/business.functions";
import { logSearchQuery } from "@/lib/search.functions";
import { adaptBusiness } from "@/lib/business.adapter";
import { useCategories } from "@/hooks/useCategories";
import { useI18n, usePageMetadata } from "@/lib/i18n";

const directorySearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "").default(""),
  city: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/directory")({
  validateSearch: zodValidator(directorySearchSchema),
  head: () => ({
    meta: [
      { title: "Nossa Rede — Latino Connect" },
      {
        name: "description",
        content: "Explore negócios, profissionais e organizações latinas em toda a Nova Zelândia.",
      },
      { property: "og:title", content: "Nossa Rede — Latino Connect" },
      {
        property: "og:description",
        content: "Encontre a comunidade latina em Auckland, Wellington e toda NZ.",
      },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/directory" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/directory" }],
  }),
  component: DirectoryPage,
});

function DirectoryPage() {
  const { t } = useI18n();
  usePageMetadata("metadata.directory.title", "metadata.directory.description");
  const initial = Route.useSearch();
  const [search, setSearch] = useState<SearchValue>({
    q: initial.q,
    category: initial.category,
    city: initial.city,
  });
  const { groups } = useCategories();

  const fetchBusinesses = useServerFn(getBusinesses);
  const trackSearch = useServerFn(logSearchQuery);
  const { data } = useQuery({
    queryKey: ["businesses", "all"],
    queryFn: () => fetchBusinesses({ data: {} }),
  });

  // Debounce + dedupe search tracking so we record meaningful queries only
  const lastTrackedRef = useRef<string>("");
  useEffect(() => {
    const key = `${search.q.trim().toLowerCase()}|${search.category}|${search.city}`;
    if (!search.q.trim() && !search.category && !search.city) return;
    if (key === lastTrackedRef.current) return;
    const timer = setTimeout(() => {
      lastTrackedRef.current = key;
      trackSearch({
        data: { query: search.q, category: search.category, city: search.city },
      }).catch(() => {});
    }, 900);
    return () => clearTimeout(timer);
  }, [search.q, search.category, search.city, trackSearch]);

  const businesses = useMemo(
    () => (data?.ok ? data.rows.map((r) => adaptBusiness(r)) : []),
    [data],
  );
  const groupIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups]);

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const q = search.q.trim().toLowerCase();
      if (q && !b.name.toLowerCase().includes(q) && !b.description.toLowerCase().includes(q))
        return false;
      if (search.category) {
        if (groupIds.has(search.category)) {
          if (b.categoryGroup !== search.category) return false;
        } else if (b.macro !== search.category) {
          return false;
        }
      }
      if (search.city) {
        const cities = b.locations && b.locations.length > 0 ? b.locations : [b.location];
        if (!cities.includes(search.city)) return false;
      }
      return true;
    });
  }, [businesses, search, groupIds]);

  return (
    <SiteShell>
      {/* Desktop hero */}
      <section
        className="hidden md:block relative text-white overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(250,204,21,0.18) 0%, #0a0a0a 60%), radial-gradient(circle at 90% 100%, rgba(250,204,21,0.12), transparent 55%), #050505",
        }}
      >
        <div className="absolute inset-0 -z-0 opacity-[0.04] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 py-12 sm:py-20">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-sm text-white/90 text-[11px] font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-[0.18em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />
            {t("directory.home_badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight text-white">
            {t("directory.title")}
          </h1>
          <p className="mt-3 text-base text-white/60 max-w-2xl">{t("directory.subtitle")}</p>
          <div className="mt-8">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </section>

      {/* Mobile sticky search header */}
      <section className="md:hidden">
        <div className="px-5 pt-5 pb-2">
          <h1 className="text-2xl font-black text-white leading-tight">{t("directory.title")}</h1>
        </div>
        <MobileSearchBar value={search} onChange={setSearch} onSubmit={() => {}} variant="sticky" />
      </section>


      <section className="max-w-7xl mx-auto px-5 sm:px-6 py-8 sm:py-12">
        <h2 className="text-xs uppercase tracking-wider font-bold text-neutral-400">
          {t("directory.categories_label")}
        </h2>
        <div className="mt-4 flex gap-2 overflow-x-auto sm:flex-wrap pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory scroll-pl-5">
          <button
            onClick={() => setSearch({ ...search, category: "" })}
            className={`snap-start shrink-0 text-sm font-semibold px-4 py-2 rounded-full border whitespace-nowrap transition ${
              !search.category
                ? "bg-[#facc15] text-black border-[#facc15]"
                : "bg-neutral-900 border-white/10 hover:border-[#df991b] text-neutral-200"
            }`}
          >
            {t("directory.all_categories")}
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSearch({ ...search, category: g.id })}
              className={`snap-start shrink-0 text-sm font-semibold px-4 py-2 rounded-full border whitespace-nowrap transition ${
                search.category === g.id
                  ? "bg-[#facc15] text-black border-[#facc15]"
                  : "bg-neutral-900 border-white/10 hover:border-[#df991b] text-neutral-200"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-6 pb-16 sm:pb-20">
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <p className="text-sm text-neutral-400">
            <span className="font-bold text-white">{filtered.length}</span>{" "}
            {filtered.length === 1
              ? t("directory.results_singular")
              : t("directory.results_plural")}
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="bg-neutral-900 rounded-3xl border border-white/10 p-8 sm:p-12 text-center">
            <p className="font-extrabold text-white">{t("directory.empty_title")}</p>
            <p className="text-sm text-neutral-400 mt-1">{t("directory.empty_subtitle")}</p>
            <Link
              to="/cadastro"
              className="inline-flex mt-5 bg-[#df991b] hover:bg-[#c4861a] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
            >
              {t("directory.empty_cta")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
