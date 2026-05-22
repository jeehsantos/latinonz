import type { LucideIcon } from "lucide-react";
import type { PlanTier } from "@/lib/plans";

export type Category = {
  key: string;
  name: string;
  blurb: string;
  subcategories: string[];
  count: number;
  icon: LucideIcon;
  color: string;
  bg: string;
};

export type Business = {
  id: string;
  slug: string;
  type: "Empresa" | "Autônomo" | "Autônoma";
  name: string;
  description: string;
  macro: string;
  subcategory: string;
  location: string;
  rating: number;
  reviewCount: number;
  plan: PlanTier;
  contactKind: "website" | "whatsapp" | "instagram";
  hours?: { label: string; value: string }[];
  tags?: string[];
  phone?: string;
  email?: string;
  website?: string;
  responseTime?: string;
  fastResponder?: boolean;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  status: "Pendente" | "Contatado" | "Convertido";
  source: string;
  msg: string;
};

export type NewsItem = {
  slug: string;
  category: string;
  title: string;
  date: string;
  excerpt: string;
  category_es?: string;
  title_es?: string;
  date_es?: string;
  excerpt_es?: string;
  category_en?: string;
  title_en?: string;
  date_en?: string;
  excerpt_en?: string;
};

export type Review = {
  name: string;
  rating: number;
  text: string;
};

export type Coupon = {
  code: string;
  title: string;
  expiresAt: string;
};
