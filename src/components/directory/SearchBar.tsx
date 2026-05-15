import { ChevronDown, MapPin, Search } from "lucide-react";
import { CATEGORIES, NZ_CITIES } from "@/lib/mock/categories";

export function SearchBar({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const dark = variant === "hero";
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className={`bg-white rounded-2xl p-2 flex flex-col md:flex-row shadow-2xl max-w-4xl w-full text-left border gap-2 md:gap-0 ${
        dark ? "border-white/20 shadow-black/20" : "border-gray-200"
      }`}
    >
      <div className="flex-[2] flex items-center px-4 py-3 md:py-0 border-b md:border-b-0 md:border-r border-gray-200/60">
        <Search className="text-[#1A5336] mr-3 shrink-0" size={20} />
        <input
          type="text"
          placeholder="Ex: DJ, Mecânico, Psicólogo, Empregos…"
          className="w-full text-gray-800 outline-none placeholder-gray-400 bg-transparent font-medium"
        />
      </div>

      <div className="flex-1 flex items-center px-4 py-3 md:py-0 border-b md:border-b-0 md:border-r border-gray-200/60">
        <select className="w-full text-gray-600 outline-none bg-transparent appearance-none cursor-pointer font-medium" defaultValue="">
          <option value="">Todas as áreas</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.name}</option>
          ))}
        </select>
        <ChevronDown className="text-gray-400 ml-2 shrink-0" size={16} />
      </div>

      <div className="flex-1 flex items-center px-4 py-3 md:py-0">
        <MapPin className="text-[#1A5336] mr-2 shrink-0" size={18} />
        <select className="w-full text-gray-600 outline-none bg-transparent appearance-none cursor-pointer font-medium" defaultValue="">
          <option value="">Em toda NZ</option>
          {NZ_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <ChevronDown className="text-gray-400 ml-2 shrink-0" size={16} />
      </div>

      <button
        type="submit"
        className="bg-[#1A5336] text-white px-8 py-4 md:py-3.5 rounded-xl font-bold hover:bg-[#123F27] hover:shadow-lg transition-all duration-300 w-full md:w-auto mt-2 md:mt-0 flex items-center justify-center"
      >
        Buscar
      </button>
    </form>
  );
}
