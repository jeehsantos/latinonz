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
    { to: accountTo, label: signedIn ? "Account" : t("nav.login"), icon: UserCircle2 },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                activeOptions={it.exact ? { exact: true } : undefined}
                activeProps={{ className: "text-[#facc15]" }}
                inactiveProps={{ className: "text-neutral-400" }}
                className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[10px] font-semibold uppercase tracking-wider"
              >
                <Icon size={20} />
                <span className="leading-none truncate max-w-[64px]">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
