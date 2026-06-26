import { Link, useMatches } from "@tanstack/react-router";
import { Home, Compass, Newspaper, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export function MobileBottomNav() {
  const { t } = useI18n();
  const [signedIn, setSignedIn] = useState(false);
  const matches = useMatches();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const accountTo = signedIn ? "/dashboard" : "/login";

  const items: { to: string; label: string; icon: typeof Home; match?: string[] }[] = [
    { to: "/", label: t("nav.home"), icon: Home, match: ["/"] },
    { to: "/directory", label: t("nav.directory"), icon: Compass, match: ["/directory"] },
    { to: "/blog", label: t("nav.blog"), icon: Newspaper, match: ["/blog"] },
    {
      to: accountTo,
      label: signedIn ? t("nav.account") : t("nav.login"),
      icon: UserCircle2,
      match: ["/dashboard", "/login"],
    },
  ];

  // Determine the active path from current matches
  const currentPath = matches[matches.length - 1]?.pathname ?? "/";

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Floating bar container */}
      <div className="mx-1.5 mb-2 rounded-2xl bg-neutral-900/90 backdrop-blur-2xl border border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">
        <ul className="grid grid-cols-4 py-1">
          {items.map((it) => {
            const Icon = it.icon;
            const isActive = it.match
              ? it.match.some((m) =>
                  m === "/" ? currentPath === "/" : currentPath.startsWith(m)
                )
              : false;

            return (
              <li key={it.to} className="flex justify-center">
                <Link
                  to={it.to as "/"}
                  className="relative flex flex-col items-center justify-center gap-1 py-2.5 px-3 w-full transition-all duration-200"
                >
                  {/* Active indicator pill */}
                  {isActive && (
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#FFC700]" />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={`transition-colors duration-200 ${
                      isActive ? "text-[#FFC700]" : "text-neutral-400"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium tracking-wide transition-colors duration-200 text-center leading-tight ${
                      isActive
                        ? "text-[#FFC700]"
                        : "text-neutral-500"
                    }`}
                  >
                    {it.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
