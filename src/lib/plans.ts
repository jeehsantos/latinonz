// Single source of truth for plan-tier feature gating.
// Used by: pricing page, business profile (public), and dashboard.

export type PlanTier = "starter" | "premium" | "ultra";

export const PLAN_LABELS: Record<PlanTier, string> = {
  starter: "Starter",
  premium: "Premium",
  ultra: "Ultra",
};

export const PLAN_PRICES_NZD: Record<PlanTier, number> = {
  starter: 0,
  premium: 49,
  ultra: 99,
};

// Boolean / quantitative capabilities, addressable by key.
export const PLAN_FEATURES = {
  // Profile level shown in the directory
  profileLevel: { starter: "basic", premium: "full", ultra: "full+highlight" },

  // Description / About section character limit
  aboutCharacterLimit: { starter: 1000, premium: 1500, ultra: 2000 },

  // Contact / lead channel shown on the public profile
  // Starter: form modal → email notification only
  // Premium: WhatsApp redirect → WhatsApp notification only
  // Ultra:   WhatsApp redirect → WhatsApp + email notification
  contactModal: { starter: true, premium: false, ultra: false },
  leadWhatsapp: { starter: false, premium: true, ultra: true },
  leadEmail: { starter: true, premium: false, ultra: true },

  // Gallery
  photoLimit: { starter: 3, premium: Infinity, ultra: Infinity },

  // Profile sections — Premium+ only
  businessHours: { starter: false, premium: true, ultra: true },
  serviceOptions: { starter: false, premium: true, ultra: true },
  coupons: { starter: false, premium: true, ultra: true },

  // Communication
  directMessages: { starter: false, premium: true, ultra: true },

  // Tools
  qrCode: { starter: false, premium: true, ultra: true },
  analytics: { starter: false, premium: true, ultra: true },

  // Ultra only
  events: { starter: false, premium: false, ultra: true },
  socialPosts: { starter: false, premium: false, ultra: true },
  whatsappCommunity: { starter: false, premium: false, ultra: true },
  topPlacement: { starter: false, premium: false, ultra: true },
  // Future feature — product catalogue with CSV import and proximity search
  productCatalogue: { starter: false, premium: false, ultra: true },
} as const;

export type PlanFeatureKey = keyof typeof PLAN_FEATURES;

export function can(plan: PlanTier, feature: PlanFeatureKey): boolean {
  const v = PLAN_FEATURES[feature][plan];
  if (typeof v === "number") return v > 0;
  if (typeof v === "boolean") return v;
  return Boolean(v);
}

export function getLimit(plan: PlanTier, feature: PlanFeatureKey): number {
  const v = PLAN_FEATURES[feature][plan];
  return typeof v === "number" ? v : 0;
}

/** Lowest plan that unlocks a given feature, or null if none does. */
export function requiredPlanFor(feature: PlanFeatureKey): PlanTier | null {
  const order: PlanTier[] = ["starter", "premium", "ultra"];
  for (const p of order) if (can(p, feature)) return p;
  return null;
}
