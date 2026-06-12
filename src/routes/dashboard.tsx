import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Latino Connect" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  // Auth state lives in the browser's localStorage via supabase-js, so this
  // route must be client-only — SSR has no session and would always bounce
  // signed-in users back to /login on hard reload.
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.session.user.id)
      .maybeSingle();
    if (profile?.role === "admin" || profile?.role === "manager") {
      throw redirect({ to: "/admin" });
    }
  },
  component: () => <DashboardLayout />,
});
