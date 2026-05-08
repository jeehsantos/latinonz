import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import pt from "./pt.json";
import es from "./es.json";
import en from "./en.json";

export type Locale = "pt" | "es" | "en";

const translations = { pt, es, en } as const;

// Flatten nested keys: "modal.title" → value
type Translations = typeof pt;
type FlatKeys<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? FlatKeys<T[K], `${Prefix}${K & string}.`>
    : `${Prefix}${K & string}`;
}[keyof T];

export type TranslationKey = FlatKeys<Translations>;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj) as string ?? path;
}

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "pt";
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("en")) return "en";
  return "pt"; // default: Portuguese
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("pt");

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  const t = (key: TranslationKey): string =>
    getNestedValue(translations[locale] as Record<string, unknown>, key);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
