import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "lch_cookie_consent_v1";

type ConsentValue = "accepted" | "essential";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

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
      aria-label="Aviso de cookies"
      className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl p-5 relative">
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => save("essential")}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-[#df991b]/15 text-[#df991b] flex items-center justify-center">
            <Cookie size={18} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">Sua privacidade importa</p>
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              Usamos cookies essenciais para que o site funcione e, com seu consentimento, cookies
              de análise para melhorar a experiência. Saiba mais na{" "}
              <Link to="/privacy" className="text-[#df991b] underline font-semibold">
                Política de Privacidade
              </Link>
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => save("accepted")}
                className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-black/85 transition-colors"
              >
                Aceitar todos
              </button>
              <button
                type="button"
                onClick={() => save("essential")}
                className="bg-gray-100 text-gray-800 text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Apenas essenciais
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
