import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import type { Business } from "@/lib/mock/types";
import { PlanBadge } from "@/components/PlanBadge";

export function BusinessCard({ business }: { business: Business }) {
  return (
    <Link
      to="/business/$slug"
      params={{ slug: business.slug }}
      className="group block bg-white border border-gray-200 hover:border-[#1A5336]/40 hover:shadow-lg transition rounded-3xl overflow-hidden"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-100 relative">
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase bg-white/90 text-gray-700 px-2 py-0.5 rounded-full">
            {business.type}
          </span>
          <PlanBadge plan={business.plan} />
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-extrabold text-gray-900 group-hover:text-[#1A5336]">{business.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{business.subcategory}</p>
        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{business.description}</p>
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {business.location}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
            <Star size={12} className="fill-amber-500 text-amber-500" /> {business.rating.toFixed(1)}
            <span className="text-gray-400 font-normal">({business.reviewCount})</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
