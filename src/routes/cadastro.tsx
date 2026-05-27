import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n, usePageMetadata } from "@/lib/i18n";
import { signUp } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastrar — Latino Connect" },
      {
        name: "description",
        content: "Cadastre seu negócio ou organização na maior rede da comunidade latina em NZ.",
      },
      { property: "og:title", content: "Cadastrar — Latino Connect" },
      {
        property: "og:description",
        content: "Cadastre seu negócio ou organização na maior rede da comunidade latina em NZ.",
      },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/cadastro" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/cadastro" }],
  }),
  component: CadastroPage,
});

function CadastroPage() {
  const { t } = useI18n();
  usePageMetadata("metadata.cadastro.title", "metadata.cadastro.description");
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signUp({
        data: { businessName, ownerName, email, whatsapp, password },
      });
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
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.unexpected_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell>
      <section className="max-w-2xl mx-auto px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-wider text-[#000000]">
          {t("register.badge")}
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-black text-gray-900">
          {t("register.title")}
        </h1>
        <p className="mt-3 text-gray-600">{t("register.subtitle")}</p>

        <div className="mt-10 bg-white border border-gray-200 rounded-3xl p-8">
          <GoogleAuthButton label={t("auth.google_signup")} onError={setError} />
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs uppercase tracking-wider text-gray-400">{t("auth.or")}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">
                {t("register.business_name")}
              </label>
              <input
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">
                {t("register.owner_name")}
              </label>
              <input
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500">
                  {t("register.email")}
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
                  {t("register.whatsapp")}
                </label>
                <input
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+64 21 000 0000"
                  className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">
                {t("register.password")}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="block w-full text-center bg-[#000000] hover:bg-[#1a1a1a] disabled:opacity-60 text-white font-bold rounded-xl py-3 text-sm"
            >
              {loading ? "..." : t("register.submit")}
            </button>
            <p className="text-xs text-gray-500 text-center">
              {t("register.has_account")}{" "}
              <Link to="/login" className="font-bold text-[#000000]">
                {t("register.login_link")}
              </Link>
            </p>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}
