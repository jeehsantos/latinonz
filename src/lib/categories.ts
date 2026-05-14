// Canonical category keys (also the value stored in DB, in Portuguese for stability).
// Display labels are translated via i18n: modal.categories.<key>
export const SERVICE_CATEGORIES = [
  "Restaurante / Café",
  "Mercado Latino",
  "Beleza & Estética",
  "Saúde & Bem-estar",
  "Serviços Profissionais",
  "Construção & Reformas",
  "Transporte & Mudanças",
  "Limpeza",
  "Educação & Aulas",
  "Eventos & Entretenimento",
  "Imobiliária",
  "Turismo & Viagens",
  "Tecnologia",
  "Moda & Vestuário",
  "Automotivo",
  "Outro",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

// Stable i18n key per category (kept separate from human label so translations
// don't break if labels are tweaked).
export const CATEGORY_I18N_KEYS: Record<ServiceCategory, string> = {
  "Restaurante / Café": "restaurant",
  "Mercado Latino": "market",
  "Beleza & Estética": "beauty",
  "Saúde & Bem-estar": "health",
  "Serviços Profissionais": "professional",
  "Construção & Reformas": "construction",
  "Transporte & Mudanças": "transport",
  "Limpeza": "cleaning",
  "Educação & Aulas": "education",
  "Eventos & Entretenimento": "events",
  "Imobiliária": "realestate",
  "Turismo & Viagens": "tourism",
  "Tecnologia": "technology",
  "Moda & Vestuário": "fashion",
  "Automotivo": "automotive",
  "Outro": "other",
};
