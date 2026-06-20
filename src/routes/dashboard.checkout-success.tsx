import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/checkout-success")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Finalizing your subscription — Latino Connect" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CheckoutSuccessPage,
});

function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"syncing" | "success" | "timeout">("syncing");
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const MAX_ATTEMPTS = 15;
    const INTERVAL = 1500;

    const poll = async () => {
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (cancelled) return;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData.session?.user?.id;
          if (userId) {
            const { data } = await supabase
              .from("profiles")
              .select("plan_tier, subscription_status")
              .eq("id", userId)
              .maybeSingle();
            const t = data?.plan_tier;
            if (t && t !== "starter") {
              if (cancelled) return;
              setTier(t);
              setStatus("success");
              setTimeout(() => {
                if (!cancelled) navigate({ to: "/dashboard" });
              }, 2000);
              return;
            }
          }
        } catch {
          // retry
        }
        await new Promise((r) => setTimeout(r, INTERVAL));
      }
      if (!cancelled) setStatus("timeout");
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-neutral-900 border border-white/10 rounded-3xl p-10 text-center">
        {status === "syncing" && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-[#facc15]/10 flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 text-[#facc15] animate-spin" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Finalizing your subscription</h1>
            <p className="text-neutral-400 text-sm">
              Payment received — we're activating your plan. This usually takes just a few seconds.
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">You're all set!</h1>
            <p className="text-neutral-400 text-sm">
              Welcome to the <span className="font-bold capitalize text-white">{tier}</span> plan.
              Redirecting you to your dashboard…
            </p>
          </>
        )}
        {status === "timeout" && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Almost there</h1>
            <p className="text-neutral-400 text-sm mb-6">
              Your payment was received but activation is taking a little longer than expected. It
              should appear in your dashboard shortly.
            </p>
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="w-full bg-[#facc15] hover:bg-[#eab308] text-black font-bold rounded-2xl py-3 text-sm"
            >
              Go to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
