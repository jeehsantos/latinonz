import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3, Briefcase, FolderTree, UserCog, Inbox, Lock, Loader2, LogOut,
  Menu, X,
} from "lucide-react";
import logo from "@/assets/logo.png";

const STORAGE_KEY = "admin-authed";

type NavItem = { to: string; label: string; icon: typeof BarChart3; exact?: boolean };

const NAV: NavItem[] = [
  { to: "/admin", label: "Métricas", icon: BarChart3, exact: true },
  { to: "/admin/businesses", label: "Negócios", icon: Briefcase },
  { to: "/admin/categories", label: "Categorias", icon: FolderTree },
  { to: "/admin/managers", label: "Gerentes", icon: UserCog },
  { to: "/admin/waitlist", label: "Lista de espera", icon: Inbox },
];

export function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthed(sessionStorage.getItem(STORAGE_KEY) === "1");
    }
    setChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Same pattern as before — the password is validated server-side when
      // listing the waitlist. We optimistically accept it here and let any
      // protected server call surface real auth errors.
      sessionStorage.setItem(STORAGE_KEY, "1");
      sessionStorage.setItem("admin-pwd", password);
      setAuthed(true);
    } catch {
      setError("Erro ao conectar.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("admin-pwd");
    setAuthed(false);
  };

  if (checking) return null;

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#1A5336]/10 text-[#1A5336] flex items-center justify-center mx-auto mb-4">
            <Lock size={20} />
          </div>
          <h1 className="text-xl font-extrabold text-center text-gray-900 mb-1">Painel administrativo</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Digite a senha para acessar.</p>
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336] focus:ring-1 focus:ring-[#1A5336]"
          />
          {error && <p className="text-xs font-semibold text-red-600 mt-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#1A5336] hover:bg-[#123F27] disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </button>
          <Link to="/" className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-4">
            ← Voltar ao site
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-4 sticky top-0 z-30">
        <button className="lg:hidden text-gray-700" onClick={() => setMobileOpen(true)}>
          <Menu size={20} />
        </button>
        <Link to="/" className="flex items-center shrink-0">
          <img src={logo} alt="Latino Connect" className="h-9 w-auto" />
        </Link>
        <span className="hidden sm:inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[#1A5336]/10 text-[#1A5336] border-[#1A5336]/20">
          Admin
        </span>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={logout}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 inline-flex items-center gap-2"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0F3D24] border-r border-[#0a2d1a] flex flex-col transform transition-transform lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#0a2d1a]">
            <span className="text-white font-bold text-sm">Admin</span>
            <button className="text-white/80" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <nav className="px-3 pt-4 space-y-1 flex-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = n.exact ? path === n.to : path.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${
                    active
                      ? "bg-[#1A5336] text-white font-bold"
                      : "text-white/70 hover:bg-[#143d27] font-medium"
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1">{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 text-[11px] text-white/40">v1.0 · Latino Connect</div>
        </aside>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setMobileOpen(false)} />
        )}

        <main className="flex-1 p-6 lg:p-10 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
