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
      if (search.city && b.location !== search.city) return false;
      return true;
    });
  }, [businesses, search]);

  return (
    <SiteShell>
      <section className="bg-[#0F3D24] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h1 className="text-3xl md:text-5xl font-black">{t("directory.title")}</h1>
          <p className="mt-3 text-white/70 max-w-2xl">{t("directory.subtitle")}</p>
          <div className="mt-8">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-xs uppercase tracking-wider font-bold text-gray-500">
          {t("directory.categories_label")}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSearch({ ...search, category: "" })}
            className={`text-sm font-semibold px-4 py-2 rounded-full border ${
              !search.category
                ? "bg-[#1A5336] text-white border-[#1A5336]"
                : "bg-white border-gray-200 hover:border-[#1A5336]"
            }`}
          >
            {t("directory.all_categories")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSearch({ ...search, category: c.canonicalName })}
              className={`text-sm font-semibold px-4 py-2 rounded-full border ${
                search.category === c.canonicalName
                  ? "bg-[#1A5336] text-white border-[#1A5336]"
                  : "bg-white border-gray-200 hover:border-[#1A5336]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-900">{filtered.length}</span>{" "}
            {filtered.length === 1
              ? t("directory.results_singular")
              : t("directory.results_plural")}
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
            <p className="font-extrabold text-gray-900">{t("directory.empty_title")}</p>
            <p className="text-sm text-gray-500 mt-1">{t("directory.empty_subtitle")}</p>
            <Link
              to="/cadastro"
              className="inline-flex mt-5 bg-[#1A5336] text-white font-bold px-5 py-2.5 rounded-xl text-sm"
            >
              {t("directory.empty_cta")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
