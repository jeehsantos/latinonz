import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import pt from "./pt.json";
import es from "./es.json";
import en from "./en.json";
import { supabase } from "@/integrations/supabase/client";

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
  return (
    (path.split(".").reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
      return undefined;
    }, obj) as string) ?? path
  );
}

function detectLocale(): Locale {
  // 1. Check localStorage for a previously set preference
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored && ["pt", "es", "en"].includes(stored)) return stored;
  }
  // 2. Fall back to browser language
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.startsWith("pt")) return "pt";
  if (lang.startsWith("es")) return "es";
  return "en"; // default: English
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
  raw: <T = unknown>(path: string) => T;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("locale", l);
    }
  };

  const t = (key: TranslationKey): string =>
    getNestedValue(translations[locale] as Record<string, unknown>, key);

  const raw = <T,>(path: string): T => {
    return path.split(".").reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
      return undefined;
    }, translations[locale]) as T;
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  // Sync locale from signed-in business owner's saved language_preference.
  // This makes the user's saved preference win over browser detection and
  // persist across devices.
  useEffect(() => {
    let mounted = true;
    const applyFromBusiness = async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        const { data } = await supabase
          .from("businesses")
          .select("language_preference")
          .eq("owner_id", u.user.id)
          .maybeSingle();
        const pref = data?.language_preference as Locale | undefined;
        if (!mounted || !pref) return;
        if (pref === "pt" || pref === "es" || pref === "en") {
          setLocaleState(pref);
          if (typeof localStorage !== "undefined") localStorage.setItem("locale", pref);
        }
      } catch {
        /* no-op */
      }
    };
    applyFromBusiness();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") applyFromBusiness();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, raw }}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export function usePageMetadata(
  titleKey?: TranslationKey,
  descriptionKey?: TranslationKey,
  customTitle?: string,
  customDescription?: string,
) {
  const { t } = useI18n();

  useEffect(() => {
    const title = customTitle || (titleKey ? t(titleKey) : "");
    const description = customDescription || (descriptionKey ? t(descriptionKey) : "");

    if (title) {
      document.title = title;

      // Update og:title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute("content", title);
      } else {
        ogTitle = document.createElement("meta");
        ogTitle.setAttribute("property", "og:title");
        ogTitle.setAttribute("content", title);
        document.head.appendChild(ogTitle);
      }
    }

    if (description) {
      // Update description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", description);
      } else {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        metaDesc.setAttribute("content", description);
        document.head.appendChild(metaDesc);
      }

      // Update og:description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute("content", description);
      } else {
        ogDesc = document.createElement("meta");
        ogDesc.setAttribute("property", "og:description");
        ogDesc.setAttribute("content", description);
        document.head.appendChild(ogDesc);
      }
    }
  }, [t, titleKey, descriptionKey, customTitle, customDescription]);
}
