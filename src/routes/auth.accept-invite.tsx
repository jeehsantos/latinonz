import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, usePageMetadata } from "@/lib/i18n";

export const Route = createFileRoute("/auth/accept-invite")({
  head: () => ({
    meta: [
      { title: "Accept invitation — Latino Connect" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AcceptInvitePage,
});

type Status = "loading" | "ready" | "no-session" | "saving" | "done" | "error";

function AcceptInvitePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  usePageMetadata("metadata.accept_invite.title", "metadata.accept_invite.description");

  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [linkErrorMessage, setLinkErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const typeParam = url.searchParams.get("type");

      // Supabase returns auth errors in the URL hash, e.g.
      // #error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
      const hashError = hash.get("error") || hash.get("error_code");
      if (hashError) {
        const desc = hash.get("error_description")?.replace(/\+/g, " ");
        const isExpired =
          hash.get("error_code") === "otp_expired" || /expired|invalid/i.test(desc ?? "");
        setLinkErrorMessage(
          isExpired
            ? "This invitation link has expired or has already been used. Please ask an admin to send you a new invitation email."
            : desc || "This invitation link is invalid. Please request a new one.",
        );
        setStatus("no-session");
        return;
      }


      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (tokenHash && typeParam) {
          const normalizedType = typeParam === "signup" ? "email" : typeParam;
          const supportedTypes = new Set([
            "invite",
            "magiclink",
            "recovery",
            "email",
            "email_change",
          ]);

          if (supportedTypes.has(normalizedType)) {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: normalizedType as
                | "invite"
                | "magiclink"
                | "recovery"
                | "email"
                | "email_change",
            });
            if (verifyError) throw verifyError;
          }
        } else if (hash.get("access_token") && hash.get("refresh_token")) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: hash.get("access_token") ?? "",
            refresh_token: hash.get("refresh_token") ?? "",
          });
          if (sessionError) throw sessionError;
        } else {
          await new Promise((r) => setTimeout(r, 150));
        }
      } catch {
        if (!cancelled) setStatus("no-session");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user) {
        setStatus("no-session");
        return;
      }

      if (url.search || url.hash) {
        window.history.replaceState({}, document.title, "/auth/accept-invite");
      }

      setEmail(session.user.email ?? null);
      const meta = (session.user.user_metadata ?? {}) as { full_name?: string };
      if (meta.full_name) setFullName(meta.full_name);
      setStatus("ready");
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("auth.accept_invite.password_min_len"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.accept_invite.passwords_dont_match"));
      return;
    }
    setStatus("saving");
    const { error: updErr } = await supabase.auth.updateUser({
      password,
      data: fullName ? { full_name: fullName } : undefined,
    });
    if (updErr) {
      setError(updErr.message);
      setStatus("ready");
      return;
    }
    setStatus("done");

    // Route by role.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    let target: "/admin" | "/dashboard" = "/dashboard";
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (profile?.role === "admin" || profile?.role === "manager") target = "/admin";
    }
    navigate({ to: target });
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-[#facc15]/10 text-[#facc15] flex items-center justify-center mb-4">
          <ShieldCheck size={20} />
        </div>
        <h1 className="text-2xl font-black text-white">{t("auth.accept_invite.title")}</h1>
        <p className="text-sm text-neutral-400 mt-1">{t("auth.accept_invite.subtitle")}</p>

        {status === "loading" && (
          <div className="mt-8 flex items-center gap-2 text-sm text-neutral-400">
            <Loader2 className="animate-spin" size={16} /> {t("auth.accept_invite.validating")}
          </div>
        )}

        {status === "no-session" && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {linkErrorMessage ?? t("auth.accept_invite.invalid")}
          </div>
        )}


        {(status === "ready" || status === "saving" || status === "done") && (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {email && (
              <div className="text-xs text-neutral-400">
                {t("auth.accept_invite.account")}{" "}
                <span className="font-semibold text-white">{email}</span>
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase text-neutral-400">
                {t("auth.accept_invite.full_name")}
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#facc15]"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-neutral-400">
                {t("auth.accept_invite.new_password")}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#facc15]"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-neutral-400">
                {t("auth.accept_invite.confirm_password")}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#facc15]"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={status === "saving" || status === "done"}
              className="w-full bg-neutral-900 hover:bg-white/5 disabled:opacity-60 text-[#facc15] font-bold rounded-xl py-3 text-sm"
            >
              {status === "saving"
                ? t("auth.accept_invite.saving")
                : status === "done"
                  ? t("auth.accept_invite.redirecting")
                  : t("auth.accept_invite.submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
