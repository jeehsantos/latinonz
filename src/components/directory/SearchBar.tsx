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
  const { categories } = useCategories();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-2.5 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-2 items-stretch border border-gray-100"
    >
      <div className="md:col-span-5 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder={t("directory.search_placeholder")}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#df991b] focus:ring-1 focus:ring-[#df991b]/40 text-gray-900"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 md:contents">
        <select
          value={value.category}
          onChange={(e) => onChange({ ...value, category: e.target.value })}
          className="md:col-span-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 text-sm outline-none focus:border-[#df991b] text-gray-900"
        >
          <option value="">{t("directory.all_areas")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.canonicalName}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 text-sm outline-none focus:border-[#df991b] text-gray-900"
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
        className="md:col-span-2 bg-white hover:bg-[#df991b] transition-colors text-[#000000] font-bold rounded-xl sm:rounded-2xl px-4 py-3 text-sm"
      >
        {t("directory.search_button")}
      </button>
    </form>
  );
}
