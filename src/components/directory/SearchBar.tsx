import { Search } from "lucide-react";
import { NZ_CITIES } from "@/lib/mock/categories";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/lib/i18n";

export type SearchValue = { q: string; category: string; city: string };

export function SearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: SearchValue;
  onChange: (v: SearchValue) => void;
  onSubmit?: () => void;
}) {
  const { t } = useI18n();
  const { groups, categories } = useCategories();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="bg-neutral-900 rounded-2xl sm:rounded-3xl shadow-xl p-2.5 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-2 items-stretch border border-white/10"
    >
      <div className="md:col-span-5 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
        <label htmlFor="directory-search" className="sr-only">{t("directory.search_placeholder")}</label>
        <input
          id="directory-search"
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder={t("directory.search_placeholder")}
          className="w-full bg-neutral-950 border border-white/10 rounded-xl sm:rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#df991b] focus:ring-1 focus:ring-[#df991b]/40 text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 md:contents">
        <label htmlFor="directory-category" className="sr-only">{t("directory.all_areas")}</label>
        <select
          id="directory-category"
          value={value.category}
          onChange={(e) => onChange({ ...value, category: e.target.value })}
          className="md:col-span-3 bg-neutral-950 border border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 text-sm outline-none focus:border-[#df991b] text-white"
        >
          <option value="">{t("directory.all_areas")}</option>
          {groups.map((group) => {
            const groupCats = categories.filter((c) => c.group === group.id);
            if (groupCats.length === 0) return null;
            return (
              <optgroup key={group.id} label={group.label}>
                {groupCats.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <label htmlFor="directory-city" className="sr-only">{t("directory.all_nz")}</label>
        <select
          id="directory-city"
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          className="md:col-span-2 bg-neutral-950 border border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 text-sm outline-none focus:border-[#df991b] text-white"
        >
          <option value="">{t("directory.all_nz")}</option>
          {NZ_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="md:col-span-2 bg-neutral-900 hover:bg-[#df991b] transition-colors text-[#facc15] font-bold rounded-xl sm:rounded-2xl px-4 py-3 text-sm"
      >
        {t("directory.search_button")}
      </button>
    </form>
  );
}
