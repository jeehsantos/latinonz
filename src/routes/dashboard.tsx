import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Latino Connect" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  beforeLoad: async ({ location }) => {
    // Defense-in-depth: redirect on SSR too so the protected UI shell is
    // never delivered to unauthenticated requesters.
    if (typeof window === "undefined") {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
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
