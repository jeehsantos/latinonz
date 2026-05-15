// Wrap any platform route. While the site is in waitlist mode and there is
// no `?preview=platform` override, redirect to "/" (which renders the
// existing waitlist landing).
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSiteMode } from "@/lib/site-mode";

export function RequirePlatform({ children }: { children: React.ReactNode }) {
  const { mode } = useSiteMode();
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "waitlist") {
      navigate({ to: "/" });
    }
  }, [mode, navigate]);

  if (mode === "waitlist") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sm text-gray-500">
        Redirecionando…
      </div>
    );
  }

  return <>{children}</>;
}
