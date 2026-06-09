import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Latino Connect" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  // Auth state lives in the browser's localStorage via supabase-js, so this
  // route must be client-only — an SSR pass has no session and would always
  // bounce signed-in users back to /login on hard reload.
  ssr: false,
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();
    if (profile?.role !== "admin" && profile?.role !== "manager") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <AdminLayout />,
});
