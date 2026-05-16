import {
  Briefcase, Car, Hammer, HeartPulse, Music, Scissors, ShoppingBag, Utensils, BookOpen, Users,
} from "lucide-react";
import type { Category } from "./types";

export const NZ_CITIES = [
  "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Queenstown", "Outras regiões",
];

export const CATEGORIES: Category[] = [
  {
    key: "gastronomia", name: "Gastronomia & Alimentação", blurb: "Restaurantes, Catering, Doces…",
    subcategories: ["Todos", "Restaurantes", "Food Trucks", "Catering & Buffet", "Sobremesas & Doces", "Cafés & Padarias", "Produtos Latinos"],
    count: 142, icon: Utensils, color: "text-orange-600", bg: "bg-orange-50",
  },
  {
    key: "servicos", name: "Serviços Profissionais", blurb: "Marketing, Contabilidade, RH…",
    subcategories: ["Todos", "Marketing Digital", "Contabilidade & Finanças", "Agências de Emprego (RH)", "Vistos & Imigração", "Design & Web", "Advocacia"],
    count: 85, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50",
  },
  {
    key: "casa", name: "Casa & Construção", blurb: "Pedreiro, Encanador, Limpeza…",
    subcategories: ["Todos", "Construção & Reformas", "Encanadores", "Eletricistas", "Limpeza Residencial", "Jardinagem"],
    count: 110, icon: Hammer, color: "text-yellow-600", bg: "bg-yellow-50",
  },
  {
    key: "automotivo", name: "Automotivo & Transporte", blurb: "Mecânicos, Transfers, Fretes…",
    subcategories: ["Todos", "Mecânica & Oficina", "Transfers & Turismo", "Fretes & Mudanças", "Estética Automotiva"],
    count: 45, icon: Car, color: "text-slate-600", bg: "bg-slate-100",
  },
  {
    key: "eventos", name: "Eventos & Entretenimento", blurb: "DJs, Fotografia, Organização…",
    subcategories: ["Todos", "DJ & Música", "Fotografia & Vídeo", "Organização de Eventos", "Espaços para Festas", "Animação"],
    count: 54, icon: Music, color: "text-purple-600", bg: "bg-purple-50",
  },
  {
    key: "saude", name: "Saúde & Bem-estar", blurb: "Psicologia, Personal, Terapias…",
    subcategories: ["Todos", "Psicologia", "Personal Trainer", "Fisioterapia", "Nutrição", "Odontologia", "Terapias Holísticas"],
    count: 76, icon: HeartPulse, color: "text-red-600", bg: "bg-red-50",
  },
  {
    key: "beleza", name: "Beleza & Estética", blurb: "Salões, Barbeiros, Manicure…",
    subcategories: ["Todos", "Salões de Beleza", "Barbearias", "Manicure & Pedicure", "Estética Facial & Corporal", "Maquiagem"],
    count: 98, icon: Scissors, color: "text-pink-600", bg: "bg-pink-50",
  },
  {
    key: "moda", name: "Moda & Vestuário", blurb: "Costureiras, Lojas, Acessórios…",
    subcategories: ["Todos", "Costura & Reparos", "Lojas de Roupas", "Acessórios & Joias"],
    count: 24, icon: ShoppingBag, color: "text-teal-600", bg: "bg-teal-50",
  },
  {
    key: "aulas", name: "Aulas & Mentoria", blurb: "Inglês, Dança, Coaching…",
    subcategories: ["Todos", "Idiomas (Inglês)", "Dança", "Música", "Coaching & Carreira", "Apoio Escolar"],
    count: 32, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50",
  },
];

export function getCategoryByKey(key: string) {
  return CATEGORIES.find((c) => c.key === key);
}
