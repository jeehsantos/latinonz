import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useI18n, usePageMetadata } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Latino Connect" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  usePageMetadata(undefined, undefined, `${t("reset_password.title")} — Latino Connect`);

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setChecking(false);
    });
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("reset_password.error_min_length"));
      return;
    }
    if (password !== confirm) {
      setError(t("reset_password.error_mismatch"));
      return;
    }
    setLoading(true);
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) {
        setError(updErr.message);
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate({ to: "/dashboard" }), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <section className="max-w-md mx-auto px-6 py-12 md:py-20">
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <h1 className="text-2xl font-black text-white">{t("reset_password.title")}</h1>

          {checking ? (
            <div className="mt-8 flex justify-center">
              <Loader2 className="h-6 w-6 text-[#df991b] animate-spin" />
            </div>
          ) : !hasSession ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-neutral-300">
                {t("reset_password.invalid_link")}
              </p>
              <Link
                to="/forgot-password"
                className="block w-full text-center bg-[#df991b] hover:bg-yellow-300 text-black font-bold rounded-xl py-3 text-sm transition"
              >
                {t("reset_password.request_new_link")}
              </Link>
            </div>
          ) : success ? (
            <p className="mt-6 text-sm text-green-300">
              {t("reset_password.success_message")}
            </p>
          ) : (
            <form className="space-y-4 mt-6" onSubmit={onSubmit}>
              <p className="text-sm text-neutral-400">
                {t("reset_password.instructions")}
              </p>
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400">{t("reset_password.new_password_label")}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#df991b]/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400">
                  {t("reset_password.confirm_password_label")}
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#df991b]/50"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="block w-full text-center bg-[#df991b] hover:bg-yellow-300 disabled:opacity-60 text-black font-bold rounded-xl py-3 text-sm transition"
              >
                {loading ? t("reset_password.button_saving") : t("reset_password.button_save")}
              </button>
            </form>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
