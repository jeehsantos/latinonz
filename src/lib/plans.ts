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
  profileLevel: { starter: "basic", premium: "full", ultra: "full+highlight" },
  leadEmail: { starter: true, premium: true, ultra: true },
  leadWhatsapp: { starter: false, premium: true, ultra: true },
  reviews: { starter: true, premium: true, ultra: true },
  directMessages: { starter: false, premium: true, ultra: true },
  photoLimit: { starter: 3, premium: Infinity, ultra: Infinity },
  qrCode: { starter: false, premium: true, ultra: true },
  coupons: { starter: false, premium: true, ultra: true },
  events: { starter: false, premium: false, ultra: true },
  socialPosts: { starter: false, premium: false, ultra: true },
  whatsappCommunity: { starter: false, premium: false, ultra: true },
  topPlacement: { starter: false, premium: false, ultra: true },
  analytics: { starter: false, premium: true, ultra: true },
  whatsappIntegration: { starter: false, premium: true, ultra: true },
} as const;

export type PlanFeatureKey = keyof typeof PLAN_FEATURES;

export function can(plan: PlanTier, feature: PlanFeatureKey): boolean {
  const v = PLAN_FEATURES[feature][plan];
  if (typeof v === "number") return v > 0;
  if (typeof v === "boolean") return v;
  // string capability levels are always truthy
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

// Comparison rows for the pricing page table — labels are i18n-able later.
export const PLAN_COMPARISON: Array<{
  feature: string;
  starter: string;
  premium: string;
  ultra: string;
  highlight?: boolean;
}> = [
  { feature: "Perfil personalizado", starter: "Básico", premium: "Completo", ultra: "Completo + Destaque" },
  { feature: "Notificação de leads", starter: "E-mail", premium: "WhatsApp", ultra: "E-mail & WhatsApp" },
  { feature: "Avaliações de clientes", starter: "✓", premium: "✓", ultra: "✓", highlight: true },
  { feature: "Mensagens diretas", starter: "—", premium: "✓", ultra: "✓" },
  { feature: "Fotos", starter: "3 fotos", premium: "Ilimitado", ultra: "Ilimitado", highlight: true },
  { feature: "QR Code do perfil", starter: "—", premium: "✓", ultra: "✓" },
  { feature: "Criação de cupons", starter: "—", premium: "✓", ultra: "✓", highlight: true },
  { feature: "Criação de eventos", starter: "—", premium: "—", ultra: "✓" },
  { feature: "Post no Instagram & Facebook", starter: "—", premium: "—", ultra: "✓", highlight: true },
  { feature: "Post no WhatsApp da comunidade", starter: "—", premium: "—", ultra: "✓" },
  { feature: "Destaque no topo do diretório", starter: "—", premium: "—", ultra: "✓", highlight: true },
];
