import type { NewsItem } from "./types";

export const NEWS: NewsItem[] = [
  {
    slug: "renovar-visto-trabalho-2026",
    category: "Visto & Imigração",
    title: "Como renovar seu visto de trabalho na Nova Zelândia em 2026",
    date: "15 de abril, 2026",
    excerpt: "Tudo o que mudou nas regras de renovação e os documentos que você precisa preparar com antecedência.",
  },
  {
    slug: "tax-return-2026",
    category: "Finanças",
    title: "Tax return: tudo que você precisa saber para não perder dinheiro",
    date: "8 de abril, 2026",
    excerpt: "Datas, deduções comuns e como organizar seus comprovantes durante o ano.",
  },
  {
    slug: "produtos-latinos-auckland",
    category: "Comunidade",
    title: "Guia de adaptação: encontrando produtos latinos em Auckland",
    date: "2 de abril, 2026",
    excerpt: "Mercados, padarias e importadoras que matam a saudade do sabor de casa.",
  },
];

export function getNewsBySlug(slug: string) {
  return NEWS.find((n) => n.slug === slug);
}
