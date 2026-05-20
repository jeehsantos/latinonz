import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3, Briefcase, FolderTree, UserCog, Inbox, ShieldAlert, LogOut,
  Loader2, Menu, X,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; icon: typeof BarChart3; exact?: boolean };

const NAV: NavItem[] = [
  { to: "/admin", label: "Métricas", icon: BarChart3, exact: true },
  { to: "/admin/businesses", label: "Negócios", icon: Briefcase },
  { to: "/admin/categories", label: "Categorias", icon: FolderTree },
  { to: "/admin/managers", label: "Gerentes", icon: UserCog },
  { to: "/admin/waitlist", label: "Lista de espera", icon: Inbox },
];

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "denied"; email: string | null }
  | { status: "ok"; email: string | null; role: "admin" | "manager" };

export function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (!cancelled) setAuth({ status: "anonymous" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      const role = profile?.role;
      if (role === "admin" || role === "manager") {
        setAuth({ status: "ok", email: session.user.email ?? null, role });
      } else {
        setAuth({ status: "denied", email: session.user.email ?? null });
      }
    };
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (auth.status === "anonymous") {
      navigate({ to: "/login", search: { redirect: "/admin" } as never });
    }
  }, [auth.status, navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (auth.status === "loading" || auth.status === "anonymous") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  if (auth.status === "denied") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={20} />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-1">Acesso negado</h1>
          <p className="text-sm text-gray-500 mb-1">
            Sua conta {auth.email ? <span className="font-semibold">{auth.email}</span> : null} não tem permissão para acessar o painel administrativo.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Solicite a um administrador para conceder acesso.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={logout}
              className="w-full bg-[#1A5336] hover:bg-[#123F27] text-white font-bold py-3 rounded-xl inline-flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Sair
            </button>
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
              ← Voltar ao site
            </Link>
          </div>
        </div>
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
          {auth.role === "admin" ? "Admin" : "Gerente"}
        </span>
        <div className="ml-auto flex items-center gap-3">
          {auth.email && (
            <span className="hidden sm:inline text-xs text-gray-500 font-semibold">{auth.email}</span>
          )}
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
