import { Search } from "lucide-react";
import { CATEGORIES, NZ_CITIES } from "@/lib/mock/categories";

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
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="bg-white rounded-3xl shadow-xl p-3 md:p-4 grid grid-cols-1 md:grid-cols-12 gap-2 items-stretch border border-gray-100"
    >
      <div className="md:col-span-5 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder="Ex: DJ, Mecânico, Psicólogo, Empregos..."
          className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#1A5336] text-slate-950"
        />
      </div>
      <select
        value={value.category}
        onChange={(e) => onChange({ ...value, category: e.target.value })}
        className="md:col-span-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#1A5336]"
      >
        <option value="">Todas as Áreas</option>
        {CATEGORIES.map((c) => (
          <option key={c.key} value={c.name}>{c.name}</option>
        ))}
      </select>
      <select
        value={value.city}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
        className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#1A5336]"
      >
        <option value="">Em toda NZ</option>
        {NZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <button
        type="submit"
        className="md:col-span-2 bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-2xl px-4 py-3 text-sm"
      >
        Buscar
      </button>
    </form>
  );
}
