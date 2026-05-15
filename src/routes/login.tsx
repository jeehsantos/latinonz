import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Latino Connect" },
      { name: "description", content: "Acesse o painel do seu negócio." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <SiteShell>
      <section className="max-w-md mx-auto px-6 py-20">
        <div className="bg-white border border-gray-200 rounded-3xl p-8">
          <h1 className="text-2xl font-black text-gray-900">Entrar</h1>
          <p className="text-sm text-gray-500 mt-1">Acesse o painel do seu negócio.</p>
          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">E-mail</label>
              <input type="email" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-500">Senha</label>
              <input type="password" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <Link to="/dashboard" className="block text-center bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl py-3 text-sm">
              Entrar
            </Link>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">
            Não tem conta? <Link to="/cadastro" className="font-bold text-[#1A5336]">Cadastre seu negócio</Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
