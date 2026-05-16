import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastrar negócio — Latino Connect" },
      { name: "description", content: "Cadastre seu negócio latino na maior plataforma da comunidade em NZ." },
      { property: "og:title", content: "Cadastrar negócio — Latino Connect" },
      { property: "og:description", content: "Cadastre seu negócio latino na maior plataforma da comunidade em NZ." },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/cadastro" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/cadastro" }],
  }),
  component: CadastroPage,
});

function CadastroPage() {
  return (
    <SiteShell>
      <section className="max-w-2xl mx-auto px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-wider text-[#1A5336]">Cadastro</p>
        <h1 className="mt-3 text-3xl md:text-4xl font-black text-gray-900">Cadastre seu negócio</h1>
        <p className="mt-3 text-gray-600">Comece grátis no plano Starter. Faça upgrade quando quiser.</p>

        <form className="mt-10 bg-white border border-gray-200 rounded-3xl p-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Nome do negócio</label>
            <input className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Seu nome</label>
            <input className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">E-mail</label>
              <input type="email" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">WhatsApp (+64)</label>
              <input className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Senha</label>
            <input type="password" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <Link to="/dashboard" className="block text-center bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl py-3 text-sm">
            Criar conta
          </Link>
          <p className="text-xs text-gray-500 text-center">
            Já tem conta? <Link to="/login" className="font-bold text-[#1A5336]">Entrar</Link>
          </p>
        </form>
      </section>
    </SiteShell>
  );
}
