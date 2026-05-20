import {
  Briefcase, Car, Hammer, HeartPulse, Music, Scissors, ShoppingBag, Utensils,
  BookOpen, Users, Sparkles, GraduationCap, Home, Wrench, Camera, Plane, Laptop,
  Baby, PawPrint, Dumbbell, type LucideIcon,
} from "lucide-react";

export const ICON_KEYS = [
  "utensils","briefcase","hammer","car","music","heart-pulse","scissors",
  "shopping-bag","book-open","users","sparkles","graduation-cap","home",
  "wrench","camera","plane","laptop","baby","paw-print","dumbbell",
] as const;
export type IconKey = (typeof ICON_KEYS)[number];

export const ICON_MAP: Record<IconKey, LucideIcon> = {
  "utensils": Utensils, "briefcase": Briefcase, "hammer": Hammer, "car": Car,
  "music": Music, "heart-pulse": HeartPulse, "scissors": Scissors,
  "shopping-bag": ShoppingBag, "book-open": BookOpen, "users": Users,
  "sparkles": Sparkles, "graduation-cap": GraduationCap, "home": Home,
  "wrench": Wrench, "camera": Camera, "plane": Plane, "laptop": Laptop,
  "baby": Baby, "paw-print": PawPrint, "dumbbell": Dumbbell,
};

export const COLOR_KEYS = [
  "orange","blue","yellow","slate","purple","red","pink","teal","indigo","rose","emerald",
] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

export const COLOR_MAP: Record<ColorKey, { text: string; bg: string }> = {
  orange:  { text: "text-orange-600",  bg: "bg-orange-50" },
  blue:    { text: "text-blue-600",    bg: "bg-blue-50" },
  yellow:  { text: "text-yellow-600",  bg: "bg-yellow-50" },
  slate:   { text: "text-slate-600",   bg: "bg-slate-100" },
  purple:  { text: "text-purple-600",  bg: "bg-purple-50" },
  red:     { text: "text-red-600",     bg: "bg-red-50" },
  pink:    { text: "text-pink-600",    bg: "bg-pink-50" },
  teal:    { text: "text-teal-600",    bg: "bg-teal-50" },
  indigo:  { text: "text-indigo-600",  bg: "bg-indigo-50" },
  rose:    { text: "text-rose-600",    bg: "bg-rose-50" },
  emerald: { text: "text-emerald-600", bg: "bg-emerald-50" },
};

export function getIcon(key: string): LucideIcon {
  return ICON_MAP[(ICON_KEYS as readonly string[]).includes(key) ? (key as IconKey) : "briefcase"];
}
export function getColor(key: string): { text: string; bg: string } {
  return COLOR_MAP[(COLOR_KEYS as readonly string[]).includes(key) ? (key as ColorKey) : "slate"];
}
