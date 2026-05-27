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
      className="group block bg-white border border-gray-200 hover:border-[#df991b]/60 hover:shadow-lg transition rounded-3xl overflow-hidden"
    >
      <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 via-[#df991b]/5 to-gray-100 relative flex items-center justify-center">
        {business.logoUrl ? (
          <img
            src={business.logoUrl}
            alt={business.name}
            className="max-h-[70%] max-w-[70%] object-contain"
            loading="lazy"
          />
        ) : null}
        <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase bg-white/90 text-gray-800 px-2 py-0.5 rounded-full">
            {displayType}
          </span>
          <PlanBadge plan={business.plan} />
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="font-extrabold text-gray-900 group-hover:text-[#000000] line-clamp-1">
          {business.name}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{business.subcategory}</p>
        <p className="text-sm text-gray-600 mt-2 sm:mt-3 line-clamp-2">{business.description}</p>
        <div className="flex items-center justify-between mt-3 sm:mt-4 text-xs text-gray-500 gap-2">
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
            <span className="text-gray-400 font-normal">({business.reviewCount})</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
