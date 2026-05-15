import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/directory", label: "Diretório" },
  { to: "/planos", label: "Planos" },
  { to: "/blog", label: "Blog" },
  { to: "/sobre", label: "Sobre" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Latino Connect">
          <img src={logo} alt="Latino Connect Hub" className="h-10 md:h-12 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  active ? "bg-[#EBF4ED] text-[#1A5336]" : "text-gray-600 hover:text-[#1A5336] hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-bold text-gray-700 hover:text-[#1A5336] px-3 py-2">
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="bg-[#1A5336] hover:bg-[#123F27] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors shadow-sm"
          >
            Anunciar
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 -mr-2 text-gray-700"
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {item.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-3 border-t border-gray-100 mt-2">
            <Link to="/login" onClick={() => setOpen(false)} className="flex-1 text-center text-sm font-bold text-gray-700 border border-gray-200 px-4 py-2.5 rounded-full">
              Entrar
            </Link>
            <Link to="/cadastro" onClick={() => setOpen(false)} className="flex-1 text-center bg-[#1A5336] text-white text-sm font-bold px-4 py-2.5 rounded-full">
              Anunciar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
