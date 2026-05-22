import type { NewsItem } from "./types";

export const NEWS: NewsItem[] = [
  {
    slug: "renovar-visto-trabalho-2026",
    category: "Visto & Imigração",
    title: "Como renovar seu visto de trabalho na Nova Zelândia em 2026",
    date: "15 de abril, 2026",
    excerpt:
      "Tudo o que mudou nas regras de renovação e os documentos que você precisa preparar com antecedência.",
    category_es: "Visado e Inmigración",
    title_es: "Cómo renovar tu visado de trabajo en Nueva Zelanda en 2026",
    date_es: "15 de abril, 2026",
    excerpt_es:
      "Todo lo que cambió en las reglas de renovación y los documentos que necesitas preparar con anticipación.",
    category_en: "Visa & Immigration",
    title_en: "How to renew your work visa in New Zealand in 2026",
    date_en: "April 15, 2026",
    excerpt_en:
      "Everything that has changed in the renewal rules and the documents you need to prepare in advance.",
  },
  {
    slug: "tax-return-2026",
    category: "Finanças",
    title: "Tax return: tudo que você precisa saber para não perder dinheiro",
    date: "8 de abril, 2026",
    excerpt: "Datas, deduções comuns e como organizar seus comprovantes durante o ano.",
    category_es: "Finanzas",
    title_es: "Tax return: todo lo que necesitas saber para no perder dinero",
    date_es: "8 de abril, 2026",
    excerpt_es: "Fechas, deducciones comunes y cómo organizar tus recibos durante el año.",
    category_en: "Finance",
    title_en: "Tax return: everything you need to know to not lose money",
    date_en: "April 8, 2026",
    excerpt_en: "Dates, common deductions, and how to organize your receipts throughout the year.",
  },
  {
    slug: "produtos-latinos-auckland",
    category: "Comunidade",
    title: "Guia de adaptação: encontrando produtos latinos em Auckland",
    date: "2 de abril, 2026",
    excerpt: "Mercados, padarias e importadoras que matam a saudade do sabor de casa.",
    category_es: "Comunidad",
    title_es: "Guía de adaptación: encontrar productos latinos en Auckland",
    date_es: "2 de abril, 2026",
    excerpt_es: "Mercados, panaderías e importadoras que matan la nostalgia del sabor de casa.",
    category_en: "Community",
    title_en: "Settling-in guide: finding Latin products in Auckland",
    date_en: "April 2, 2026",
    excerpt_en:
      "Markets, bakeries, and importers that cure your homesickness with a taste of home.",
  },
];

export function getNewsBySlug(slug: string) {
  return NEWS.find((n) => n.slug === slug);
}

export function getLocalizedNewsItem(n: NewsItem, locale: string) {
  if (locale === "es") {
    return {
      category: n.category_es || n.category,
      title: n.title_es || n.title,
      excerpt: n.excerpt_es || n.excerpt,
      date: n.date_es || n.date,
    };
  }
  if (locale === "en") {
    return {
      category: n.category_en || n.category,
      title: n.title_en || n.title,
      excerpt: n.excerpt_en || n.excerpt,
      date: n.date_en || n.date,
    };
  }
  return {
    category: n.category,
    title: n.title,
    excerpt: n.excerpt,
    date: n.date,
  };
}
