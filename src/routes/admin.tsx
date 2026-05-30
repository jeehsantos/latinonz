import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Latino Connect" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  beforeLoad: async ({ location }) => {
    // Defense-in-depth: redirect on SSR too so the protected UI shell is
    // never delivered to unauthenticated requesters.
    if (typeof window === "undefined") {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
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
