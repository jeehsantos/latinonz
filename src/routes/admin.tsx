import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Latino Connect" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => <AdminLayout />,
});
