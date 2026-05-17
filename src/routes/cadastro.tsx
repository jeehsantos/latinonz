import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastrar — Latino Connect" },
      { name: "description", content: "Cadastre seu negócio ou organização na maior rede da comunidade latina em NZ." },
      { property: "og:title", content: "Cadastrar — Latino Connect" },
      { property: "og:description", content: "Cadastre seu negócio ou organização na maior rede da comunidade latina em NZ." },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/cadastro" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/cadastro" }],
  }),
  component: CadastroPage,
});

function CadastroPage() {
  const { t } = useI18n();
  return (
    <SiteShell>
      <section className="max-w-2xl mx-auto px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-wider text-[#1A5336]">{t("register.badge")}</p>
        <h1 className="mt-3 text-3xl md:text-4xl font-black text-gray-900">{t("register.title")}</h1>
        <p className="mt-3 text-gray-600">{t("register.subtitle")}</p>

        <form className="mt-10 bg-white border border-gray-200 rounded-3xl p-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">{t("register.business_name")}</label>
            <input className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">{t("register.owner_name")}</label>
            <input className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">{t("register.email")}</label>
              <input type="email" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">{t("register.whatsapp")}</label>
              <input className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">{t("register.password")}</label>
            <input type="password" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <Link to="/dashboard" className="block text-center bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl py-3 text-sm">
            {t("register.submit")}
          </Link>
          <p className="text-xs text-gray-500 text-center">
            {t("register.has_account")}{" "}
            <Link to="/login" className="font-bold text-[#1A5336]">{t("register.login_link")}</Link>
          </p>
        </form>
      </section>
    </SiteShell>
  );
}
