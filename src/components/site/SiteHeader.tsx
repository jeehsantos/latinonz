import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { useI18n } from "@/lib/i18n";

export function SiteHeader() {
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV = [
    { to: "/", label: t("nav.home"), exact: true },
    { to: "/directory", label: t("nav.directory") },
    { to: "/planos", label: t("nav.plans") },
    { to: "/blog", label: t("nav.blog") },
    { to: "/sobre", label: t("nav.about") },
    { to: "/contato", label: t("nav.contact") },
  ] as const;

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center shrink-0">
          <img src={logo} alt="Latino Connect Hub" className="h-10 md:h-12 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full px-2 py-1.5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeProps={{
                className: "px-4 py-1.5 rounded-full bg-white shadow-sm text-[#1A5336]",
              }}
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
            {t("nav.login")}
          </Link>
          <Link
            to="/cadastro"
            className="hidden md:inline-flex text-sm font-bold bg-[#1A5336] text-white px-4 py-2 rounded-full hover:bg-[#123F27]"
          >
            {t("nav.register")}
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-700 p-2"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setMobileOpen(false)}
              activeProps={{
                className:
                  "block px-4 py-2.5 rounded-xl bg-[#1A5336]/10 text-[#1A5336] font-bold text-sm",
              }}
              inactiveProps={{
                className:
                  "block px-4 py-2.5 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50",
              }}
            >
              {n.label}
            </Link>
          ))}
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="block text-center px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50"
            >
              {t("nav.login")}
            </Link>
            <Link
              to="/cadastro"
              onClick={() => setMobileOpen(false)}
              className="block text-center px-4 py-2.5 rounded-xl bg-[#1A5336] text-white font-bold text-sm hover:bg-[#123F27]"
            >
              {t("nav.register")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
