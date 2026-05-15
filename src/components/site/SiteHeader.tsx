import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

const NAV = [
  { to: "/directory", label: "Diretório" },
  { to: "/planos", label: "Planos" },
  { to: "/blog", label: "Blog" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
] as const;

export function SiteHeader() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Latino Connect Hub" className="h-10 md:h-12 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full px-2 py-1.5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeProps={{ className: "px-4 py-1.5 rounded-full bg-white shadow-sm text-[#1A5336]" }}
              inactiveProps={{ className: "px-4 py-1.5 rounded-full hover:bg-white/60" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden md:inline-flex text-sm font-semibold text-gray-700 hover:text-[#1A5336] px-3 py-2"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="text-sm font-bold bg-[#1A5336] text-white px-4 py-2 rounded-full hover:bg-[#123F27]"
          >
            Cadastrar negócio
          </Link>
        </div>
      </div>
    </header>
  );
}
