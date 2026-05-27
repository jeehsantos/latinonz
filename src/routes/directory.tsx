import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { SearchBar, type SearchValue } from "@/components/directory/SearchBar";
import { BusinessCard } from "@/components/directory/BusinessCard";
import { getBusinesses } from "@/lib/business.functions";
import { adaptBusiness } from "@/lib/business.adapter";
import { useCategories } from "@/hooks/useCategories";
import { useI18n, usePageMetadata } from "@/lib/i18n";

export const Route = createFileRoute("/directory")({
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
  const [search, setSearch] = useState<SearchValue>({ q: "", category: "", city: "" });
  const { categories } = useCategories();

  const fetchBusinesses = useServerFn(getBusinesses);
  const { data } = useQuery({
    queryKey: ["businesses", "all"],
    queryFn: () => fetchBusinesses({ data: {} }),
  });
  const businesses = useMemo(
    () => (data?.ok ? data.rows.map((r) => adaptBusiness(r)) : []),
    [data],
  );

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const q = search.q.trim().toLowerCase();
      if (q && !b.name.toLowerCase().includes(q) && !b.description.toLowerCase().includes(q))
        return false;
      if (search.category && b.macro !== search.category) return false;
      if (search.city) {
        const cities = b.locations && b.locations.length > 0 ? b.locations : [b.location];
        if (!cities.includes(search.city)) return false;
      }
      return true;
    });
  }, [businesses, search]);

  return (
    <SiteShell>
      <section
        className="relative text-white overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at top, #1a1a1a 0%, #000000 60%), radial-gradient(circle at 90% 100%, rgba(223,153,27,0.22), transparent 55%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10 sm:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
            {t("directory.title")}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/70 max-w-2xl">{t("directory.subtitle")}</p>
          <div className="mt-6 sm:mt-8">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-6 py-8 sm:py-12">
        <h2 className="text-xs uppercase tracking-wider font-bold text-gray-500">
          {t("directory.categories_label")}
        </h2>
        <div className="mt-4 flex gap-2 overflow-x-auto sm:flex-wrap pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 scrollbar-hide">
          <button
            onClick={() => setSearch({ ...search, category: "" })}
            className={`shrink-0 text-sm font-semibold px-4 py-2 rounded-full border whitespace-nowrap transition ${
              !search.category
                ? "bg-[#000000] text-white border-[#000000]"
                : "bg-white border-gray-200 hover:border-[#df991b] text-gray-700"
            }`}
          >
            {t("directory.all_categories")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSearch({ ...search, category: c.canonicalName })}
              className={`shrink-0 text-sm font-semibold px-4 py-2 rounded-full border whitespace-nowrap transition ${
                search.category === c.canonicalName
                  ? "bg-[#000000] text-white border-[#000000]"
                  : "bg-white border-gray-200 hover:border-[#df991b] text-gray-700"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-6 pb-16 sm:pb-20">
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-900">{filtered.length}</span>{" "}
            {filtered.length === 1
              ? t("directory.results_singular")
              : t("directory.results_plural")}
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center">
            <p className="font-extrabold text-gray-900">{t("directory.empty_title")}</p>
            <p className="text-sm text-gray-500 mt-1">{t("directory.empty_subtitle")}</p>
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
