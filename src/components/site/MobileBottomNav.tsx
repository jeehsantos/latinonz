import { Link } from "@tanstack/react-router";
import { Home, Compass, Newspaper, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export function MobileBottomNav() {
  const { t } = useI18n();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const accountTo = signedIn ? "/dashboard" : "/login";

  const items: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
    { to: "/", label: t("nav.home"), icon: Home, exact: true },
    { to: "/directory", label: t("nav.directory"), icon: Compass },
    { to: "/blog", label: t("nav.blog"), icon: Newspaper },
    { to: accountTo, label: signedIn ? t("nav.account") : t("nav.login"), icon: UserCircle2 },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to as "/"}
                activeOptions={it.exact ? { exact: true } : undefined}
                activeProps={{ className: "text-[#df991b]" }}
                inactiveProps={{ className: "text-neutral-500" }}
                className="flex flex-col items-center justify-center gap-1 py-3 min-h-[60px] text-[10px] font-semibold uppercase tracking-wider transition-colors"
              >
                <Icon size={20} />
                <span className="leading-none truncate max-w-[72px]">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
