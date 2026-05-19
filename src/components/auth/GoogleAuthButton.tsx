import { useState } from "react";
import { lovable } from "@/integrations/lovable";

type Props = {
  label: string;
  onError?: (message: string) => void;
};

export function GoogleAuthButton({ label, onError }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) {
        onError?.(
          result.error instanceof Error
            ? result.error.message
            : "Falha ao entrar com Google.",
        );
        setLoading(false);
        return;
      }
      if (result.redirected) {
        // Browser is redirecting to Google; keep button disabled.
        return;
      }
      // Tokens already set on the session — go to dashboard.
      window.location.assign("/dashboard");
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 rounded-xl py-2.5 text-sm font-bold text-gray-700 transition"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.4-4.6 2.3-7.6 2.3-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.5 5.5c-.5.4 7.2-5.2 7.2-15 0-1.3-.1-2.4-.4-3.5z"
        />
      </svg>
      {loading ? "..." : label}
    </button>
  );
}
