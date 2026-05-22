import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n, usePageMetadata } from "@/lib/i18n";
import { signIn } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Latino Connect" },
      { name: "description", content: "Acesse o painel do seu perfil Latino Connect." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  usePageMetadata("metadata.login.title", "metadata.login.description");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn({ data: { email, password } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: res.session.access_token,
        refresh_token: res.session.refresh_token,
      });
      if (sessionErr) {
        setError(sessionErr.message);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", res.user.id)
        .maybeSingle();
      const isStaff = profile?.role === "admin" || profile?.role === "manager";
      navigate({ to: isStaff ? "/admin" : "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.unexpected_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <section className="max-w-md mx-auto px-6 py-20">
        <div className="bg-white border border-gray-200 rounded-3xl p-8">
          <h1 className="text-2xl font-black text-gray-900">{t("login.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("login.subtitle")}</p>

          <div className="mt-6">
            <GoogleAuthButton label={t("auth.google_login")} onError={setError} />
          </div>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs uppercase tracking-wider text-gray-400">{t("auth.or")}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">
                {t("login.email")}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">
                {t("login.password")}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="block w-full text-center bg-[#1A5336] hover:bg-[#123F27] disabled:opacity-60 text-white font-bold rounded-xl py-3 text-sm"
            >
              {loading ? "..." : t("login.submit")}
            </button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">
            {t("login.no_account")}{" "}
            <Link to="/cadastro" className="font-bold text-[#1A5336]">
              {t("login.register_link")}
            </Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
