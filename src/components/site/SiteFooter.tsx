import { Link } from "@tanstack/react-router";
import logo from "@/assets/Latino_Connecthub_White.png";

export function SiteFooter() {
  return (
    <footer className="bg-[#0F3D24] text-white/80 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Latino Connect Hub" className="h-10 md:h-12 w-auto" />
          </Link>
          <p className="text-sm mt-2 text-white/60">
            A plataforma que conecta a comunidade latina aos melhores negócios e serviços na Nova Zelândia.
          </p>
        </div>
        <div>
          <p className="text-white font-bold mb-3">Plataforma</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/directory" className="hover:text-white">
                Diretório
              </Link>
            </li>
            <li>
              <Link to="/planos" className="hover:text-white">
                Planos
              </Link>
            </li>
            <li>
              <Link to="/cadastro" className="hover:text-white">
                Cadastrar negócio
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-white font-bold mb-3">Conteúdo</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/blog" className="hover:text-white">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="hover:text-white">
                Sobre nós
              </Link>
            </li>
            <li>
              <Link to="/contato" className="hover:text-white">
                Contato
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-white font-bold mb-3">Contato</p>
          <p className="text-sm">hello@latinoconnecthub.co.nz</p>
          <p className="text-sm">Auckland, Nova Zelândia</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-white/40 flex flex-col md:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} Latino Connect Hub. Todos os direitos reservados.</p>
          <p>Feito com ❤️ para a comunidade latina em NZ.</p>
        </div>
      </div>
    </footer>
  );
}
