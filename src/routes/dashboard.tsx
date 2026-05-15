import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Latino Connect" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => <DashboardLayout />,
});
