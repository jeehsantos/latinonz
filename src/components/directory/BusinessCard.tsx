import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import type { Business } from "@/lib/mock/types";
import { PlanBadge } from "@/components/PlanBadge";

import { useI18n } from "@/lib/i18n";

export function BusinessCard({ business }: { business: Business }) {
  const { t } = useI18n();
  const displayType =
    business.type === "Empresa"
      ? t("business.type_business")
      : business.type === "Autônomo"
        ? t("business.type_freelancer_m")
        : business.type === "Autônoma"
          ? t("business.type_freelancer_f")
          : business.type;

  return (
    <Link
      to="/business/$slug"
      params={{ slug: business.slug }}
      className="group block bg-neutral-900 border border-white/10 hover:border-[#df991b]/60 hover:shadow-lg transition rounded-3xl overflow-hidden"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-neutral-900 via-[#df991b]/5 to-neutral-950 relative overflow-hidden">
        {business.logoUrl ? (
          <img
            src={business.logoUrl}
            alt={business.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl font-black text-white/10">
            {business.name.charAt(0)}
          </div>
        )}
        <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase bg-neutral-900/90 text-neutral-100 px-2 py-0.5 rounded-full">
            {displayType}
          </span>
          <PlanBadge plan={business.plan} />
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="font-extrabold text-white group-hover:text-[#facc15] line-clamp-1">
          {business.name}
        </h3>
        <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{business.subcategory}</p>
        <p className="text-sm text-neutral-300 mt-2 sm:mt-3 line-clamp-2">{business.description}</p>
        <div className="flex items-center justify-between mt-3 sm:mt-4 text-xs text-neutral-400 gap-2">
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">
              {business.locations && business.locations.length > 0
                ? business.locations.join(", ")
                : business.location}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-[#df991b] shrink-0">
            <Star size={12} className="fill-[#df991b] text-[#df991b]" />{" "}
            {business.rating.toFixed(1)}
            <span className="text-neutral-500 font-normal">({business.reviewCount})</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
