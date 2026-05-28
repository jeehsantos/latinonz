import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/auth/confirm")({
  head: () => ({
    meta: [
      { title: "Ativando conta — Latino Connect" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ConfirmPage,
});

type Status = "loading" | "success" | "error";

function ConfirmPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Validando seu link de ativação...");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = (params.get("type") ?? "signup") as "signup" | "email" | "recovery";

      if (!tokenHash) {
        setStatus("error");
        setMessage("Link inválido ou expirado.");
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
            ? "Este link expirou. Solicite um novo e-mail de ativação."
            : "Não foi possível ativar sua conta. O link pode ter expirado.",
        );
        return;
      }

      setStatus("success");
      setMessage("Conta ativada! Redirecionando para seu painel...");
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 1200);
    };

    run();
  }, [navigate]);

  return (
    <SiteShell>
      <section className="max-w-md mx-auto px-6 py-24">
        <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center">
          {status === "loading" && (
            <Loader2 className="h-10 w-10 mx-auto text-[#df991b] animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
          )}
          {status === "error" && <XCircle className="h-12 w-12 mx-auto text-red-600" />}
          <h1 className="mt-5 text-xl font-black text-gray-900">
            {status === "loading"
              ? "Ativando sua conta"
              : status === "success"
                ? "Tudo certo!"
                : "Algo deu errado"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
          {status === "error" && (
            <a
              href="/cadastro"
              className="inline-block mt-6 text-sm font-bold text-[#df991b] underline"
            >
              Voltar para o cadastro
            </a>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
