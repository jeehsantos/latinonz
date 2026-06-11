import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { requestPasswordReset } from "@/lib/auth.functions";
import { useI18n, usePageMetadata } from "@/lib/i18n";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recover password — Latino Connect" },
      { name: "description", content: "Receive a link to reset your password." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useI18n();
  usePageMetadata(undefined, undefined, `${t("forgot_password.title")} — Latino Connect`);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await requestPasswordReset({
        data: { email, siteOrigin: window.location.origin },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("toasts.unexpected_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <section className="max-w-md mx-auto px-6 py-12 md:py-20">
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <h1 className="text-2xl font-black text-white">{t("forgot_password.title")}</h1>
          <p className="text-sm text-neutral-400 mt-1">
            {t("forgot_password.subtitle")}
          </p>

          {sent ? (
            <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
              {t("forgot_password.success_message")}
            </div>
          ) : (
            <form className="space-y-4 mt-6" onSubmit={onSubmit}>
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400">{t("forgot_password.email_label")}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#facc15]/50"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="block w-full text-center bg-[#facc15] hover:bg-yellow-300 disabled:opacity-60 text-black font-bold rounded-xl py-3 text-sm transition"
              >
                {loading ? t("forgot_password.button_sending") : t("forgot_password.button_send")}
              </button>
            </form>
          )}

          <p className="text-xs text-neutral-400 text-center mt-4">
            {t("forgot_password.back_to_login")}{" "}
            <Link to="/login" className="font-bold text-[#facc15] hover:text-yellow-300">
              {t("forgot_password.back_to_login_action")}
            </Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
