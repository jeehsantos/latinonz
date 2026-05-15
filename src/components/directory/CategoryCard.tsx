import type { Category } from "@/lib/mock/types";

export function CategoryCard({ category, onClick }: { category: Category; onClick?: () => void }) {
  const Icon = category.icon;
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_-4px_rgba(26,83,54,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col items-start"
    >
      <div className="flex w-full justify-between items-start mb-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${category.bg} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={category.color} size={28} strokeWidth={1.5} />
        </div>
        <span className="bg-gray-50 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">{category.count}</span>
      </div>
      <h3 className="font-extrabold text-gray-900 mb-2 text-xl group-hover:text-[#1A5336] transition-colors">
        {category.name}
      </h3>
      <p className="text-sm text-gray-500">{category.blurb}</p>
    </button>
  );
}
