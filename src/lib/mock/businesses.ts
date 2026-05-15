import type { Business, Review, Coupon } from "./types";

export const BUSINESSES: Business[] = [
  {
    id: "1", slug: "tacos-do-chef", type: "Empresa", name: "Tacos do Chef",
    description: "Autêntica comida mexicana com ingredientes frescos e locais. Os melhores tacos e burritos de Auckland.",
    macro: "Gastronomia & Alimentação", subcategory: "Restaurantes",
    location: "Auckland", rating: 4.8, reviewCount: 123, plan: "ultra",
    contactKind: "website", fastResponder: true, responseTime: "Em até 1 hora",
    phone: "(09) 9999-8888", email: "hello@tacosdochef.co.nz", website: "https://tacosdochef.co.nz",
    hours: [
      { label: "Seg - Sex", value: "11:00 - 22:00" },
      { label: "Sáb", value: "12:00 - 23:00" },
      { label: "Dom", value: "Fechado" },
    ],
    tags: ["Comer no local", "Retirada", "Entrega", "Opções vegetarianas"],
  },
  {
    id: "2", slug: "latino-tax-advisory", type: "Empresa", name: "Latino Tax & Advisory",
    description: "Contabilidade, tax returns e vistos para a comunidade latina em NZ. Atendimento em português e espanhol.",
    macro: "Serviços Profissionais", subcategory: "Contabilidade & Finanças",
    location: "Wellington", rating: 4.9, reviewCount: 87, plan: "premium",
    contactKind: "website", phone: "(04) 5555-1111",
  },
  {
    id: "3", slug: "dj-fiesta-nz", type: "Autônomo", name: "DJ Fiesta NZ",
    description: "O melhor do reggaeton, funk e salsa para sua festa, casamento ou evento corporativo.",
    macro: "Eventos & Entretenimento", subcategory: "DJ & Música",
    location: "Auckland", rating: 4.9, reviewCount: 210, plan: "premium",
    contactKind: "whatsapp", phone: "(09) 7777-2222",
  },
  {
    id: "4", slug: "sabor-latino-catering", type: "Empresa", name: "Sabor Latino Catering",
    description: "Buffet completo para eventos, casamentos e festas corporativas. Especialidade em carnes e salgados.",
    macro: "Gastronomia & Alimentação", subcategory: "Catering & Buffet",
    location: "Christchurch", rating: 4.7, reviewCount: 64, plan: "starter",
    contactKind: "instagram",
  },
  {
    id: "5", slug: "dra-camila-psicologa", type: "Autônoma", name: "Dra. Camila — Psicóloga",
    description: "Terapia online para expatriados. Ansiedade, adaptação cultural e carreira.",
    macro: "Saúde & Bem-estar", subcategory: "Psicologia",
    location: "Online / Toda NZ", rating: 5.0, reviewCount: 45, plan: "premium",
    contactKind: "whatsapp", phone: "(09) 9000-5555",
  },
  {
    id: "6", slug: "kiwis-latinos-auto", type: "Empresa", name: "Kiwis & Latinos Auto Repair",
    description: "Oficina mecânica completa. WOF, freios, motor e pneus. Falamos o seu idioma.",
    macro: "Automotivo & Transporte", subcategory: "Mecânica & Oficina",
    location: "Auckland", rating: 4.6, reviewCount: 92, plan: "premium",
    contactKind: "website",
  },
  {
    id: "7", slug: "maria-costureira", type: "Autônoma", name: "Maria Costureira",
    description: "Ajustes, bainhas, consertos rápidos e roupas sob medida com acabamento perfeito.",
    macro: "Moda & Vestuário", subcategory: "Costura & Reparos",
    location: "Hamilton", rating: 4.8, reviewCount: 31, plan: "starter",
    contactKind: "whatsapp",
  },
  {
    id: "8", slug: "agencia-digital-nz", type: "Empresa", name: "Agência Digital NZ",
    description: "Sites, redes sociais e Google Ads para alavancar seu negócio.",
    macro: "Serviços Profissionais", subcategory: "Marketing Digital",
    location: "Tauranga", rating: 4.7, reviewCount: 58, plan: "ultra",
    contactKind: "website",
  },
];

export const REVIEWS_BY_BUSINESS: Record<string, Review[]> = {
  "tacos-do-chef": [
    { name: "Lucas Alvarez", rating: 5, text: "Os melhores tacos que já comi na Nova Zelândia! Sabor super autêntico." },
    { name: "Sarah T.", rating: 4, text: "Ótimo serviço e ambiente agradável." },
    { name: "Pedro M.", rating: 5, text: "Atendimento em português faz toda a diferença." },
  ],
};

export const COUPONS_BY_BUSINESS: Record<string, Coupon[]> = {
  "tacos-do-chef": [
    { code: "TACOS10", title: "10% off no primeiro pedido", expiresAt: "31 Dez, 2026" },
  ],
};

export function getBusinesses() {
  return BUSINESSES;
}

export function getBusinessBySlug(slug: string) {
  return BUSINESSES.find((b) => b.slug === slug);
}

export function getFeaturedBusinesses(n = 4) {
  return [...BUSINESSES].sort((a, b) => (a.plan === "ultra" ? -1 : 1) - (b.plan === "ultra" ? -1 : 1)).slice(0, n);
}
