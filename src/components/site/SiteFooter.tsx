import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="bg-[#0B2C1A] text-emerald-100/80 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="text-2xl font-black tracking-tight text-white">
            Latino<span className="text-[#EFC64E] ml-1">NZ</span>
          </div>
          <p className="text-sm mt-3 text-emerald-100/60">
            Conectando a comunidade latina aos melhores negócios e serviços em Nova Zelândia.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase text-xs tracking-wider mb-4">Plataforma</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/directory" className="hover:text-white">Diretório</Link></li>
            <li><Link to="/planos" className="hover:text-white">Planos</Link></li>
            <li><Link to="/cadastro" className="hover:text-white">Anunciar negócio</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase text-xs tracking-wider mb-4">Comunidade</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link to="/sobre" className="hover:text-white">Sobre nós</Link></li>
            <li><Link to="/contato" className="hover:text-white">Contato</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase text-xs tracking-wider mb-4">Conta</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-white">Entrar</Link></li>
            <li><Link to="/cadastro" className="hover:text-white">Cadastrar</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-emerald-100/40">
        © {new Date().getFullYear()} Latino Connect Hub — Aotearoa New Zealand.
      </div>
    </footer>
  );
}
