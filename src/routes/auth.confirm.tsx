import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useI18n, usePageMetadata } from "@/lib/i18n";

export const Route = createFileRoute("/auth/confirm")({
  head: () => ({
    meta: [
      { title: "Activating account — Latino Connect" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ConfirmPage,
});

type Status = "loading" | "success" | "error";

function ConfirmPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  usePageMetadata(undefined, undefined, `${t("auth_confirm.title_loading")} — Latino Connect`);

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState(t("auth_confirm.loading_message"));

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = (params.get("type") ?? "signup") as "signup" | "email" | "recovery";

      if (!tokenHash) {
        setStatus("error");
        setMessage(t("auth_confirm.error_no_token"));
        return;
      }

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (error || !data.session) {
        console.error("verifyOtp error", error);
        setStatus("error");
        setMessage(
          error?.message?.includes("expired")
            ? t("auth_confirm.error_expired")
            : t("auth_confirm.error_generic"),
        );
        return;
      }

      setStatus("success");
      if (type === "recovery") {
        setMessage(t("auth_confirm.redirect_recovery"));
        setTimeout(() => {
          navigate({ to: "/reset-password" });
        }, 800);
      } else {
        setMessage(t("auth_confirm.redirect_dashboard"));
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 1200);
      }
    };

    run();
  }, [navigate, t]);

  return (
    <SiteShell>
      <section className="max-w-md mx-auto px-6 py-24">
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-10 text-center">
          {status === "loading" && (
            <Loader2 className="h-10 w-10 mx-auto text-[#df991b] animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
          )}
          {status === "error" && <XCircle className="h-12 w-12 mx-auto text-red-600" />}
          <h1 className="mt-5 text-xl font-black text-white">
            {status === "loading"
              ? t("auth_confirm.title_loading")
              : status === "success"
                ? t("auth_confirm.title_success")
                : t("auth_confirm.title_error")}
          </h1>
          <p className="mt-2 text-sm text-neutral-300">{message}</p>
          {status === "error" && (
            <a
              href="/cadastro"
              className="inline-block mt-6 text-sm font-bold text-[#df991b] underline"
            >
              {t("auth_confirm.back_to_register")}
            </a>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
