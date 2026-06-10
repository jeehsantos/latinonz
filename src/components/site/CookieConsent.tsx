import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const STORAGE_KEY = "lch_cookie_consent_v1";

type ConsentValue = "accepted" | "essential";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (value: ConsentValue) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("cookie_consent.dialog_label")}
      className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-neutral-900 border border-white/10 shadow-2xl rounded-2xl p-5 relative">
        <button
          type="button"
          aria-label={t("cookie_consent.close_label")}
          onClick={() => save("essential")}
          className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-200"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-[#df991b]/15 text-[#df991b] flex items-center justify-center">
            <Cookie size={18} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">{t("cookie_consent.title")}</p>
            <p className="mt-1 text-xs text-neutral-300 leading-relaxed">
              {t("cookie_consent.body_prefix")}
              <Link to="/privacy" className="text-[#df991b] underline font-semibold">
                {t("cookie_consent.privacy_link")}
              </Link>
              {t("cookie_consent.body_suffix")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => save("accepted")}
                className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-black/85 transition-colors"
              >
                {t("cookie_consent.accept_all")}
              </button>
              <button
                type="button"
                onClick={() => save("essential")}
                className="bg-white/5 text-neutral-100 text-xs font-bold px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {t("cookie_consent.accept_essential")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
