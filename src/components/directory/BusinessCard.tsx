import { Link } from "@tanstack/react-router";
import { Clock, MapPin, MessageCircle, Star } from "lucide-react";
import type { Business } from "@/lib/mock/types";
import { PlanBadge } from "@/components/site/PlanBadge";

export function BusinessCard({ business }: { business: Business }) {
  const isUltra = business.plan === "ultra";

  return (
    <Link
      to="/business/$slug"
      params={{ slug: business.slug }}
      className={`bg-white rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-300 group ${
        isUltra
          ? "border-2 border-[#EFC64E] shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(26,83,54,0.15)]"
          : "border border-gray-200 hover:border-[#1A5336]/30 hover:shadow-lg"
      }`}
    >
      {isUltra && (
        <div className="absolute z-10 -ml-2 mt-4">
          <div className="bg-[#1A5336] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-r-md shadow-md flex items-center gap-1">
            <Star size={12} className="fill-[#EFC64E] text-[#EFC64E]" /> Destaque
          </div>
        </div>
      )}

      <div className="h-32 bg-gradient-to-br from-emerald-50 to-[#EBF4ED] flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1A5336] to-transparent" />
        {business.fastResponder && (
          <span className="absolute bottom-3 left-4 bg-[#25D366] text-white text-[10px] font-bold px-2 py-0.5 rounded">
            Responde rápido
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-[#1A5336] transition-colors line-clamp-1">
            {business.name}
          </h3>
          <div className="flex items-center gap-1 text-sm font-bold shrink-0">
            <Star size={14} className="text-[#EFC64E] fill-[#EFC64E]" /> {business.rating.toFixed(1)}
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-4 flex justify-between gap-2">
          <span className="line-clamp-1">{business.macro} • {business.subcategory}</span>
          <span className="underline shrink-0">{business.reviewCount} avaliações</span>
        </div>

        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{business.description}</p>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center text-gray-600">
            <MapPin size={16} className="text-[#1A5336] mr-2 shrink-0" /> {business.location}
          </div>
          {business.responseTime && (
            <div className="flex items-center text-[#1A5336] font-medium">
              <Clock size={16} className="mr-2 shrink-0" /> {business.responseTime}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <PlanBadge plan={business.plan} />
          <div className="text-[#1A5336] font-bold text-sm flex items-center gap-1">
            <MessageCircle size={14} /> Contato
          </div>
        </div>
      </div>
    </Link>
  );
}
