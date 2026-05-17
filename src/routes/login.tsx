import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n } from "@/lib/i18n";

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
  return (
    <SiteShell>
      <section className="max-w-md mx-auto px-6 py-20">
        <div className="bg-white border border-gray-200 rounded-3xl p-8">
          <h1 className="text-2xl font-black text-gray-900">{t("login.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("login.subtitle")}</p>
          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">{t("login.email")}</label>
              <input type="email" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">{t("login.password")}</label>
              <input type="password" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <Link to="/dashboard" className="block text-center bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl py-3 text-sm">
              {t("login.submit")}
            </Link>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">
            {t("login.no_account")}{" "}
            <Link to="/cadastro" className="font-bold text-[#1A5336]">{t("login.register_link")}</Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
