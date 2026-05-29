import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n, usePageMetadata } from "@/lib/i18n";
import { signUp, resendActivation } from "@/lib/auth.functions";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastrar — Latino Connect" },
      {
        name: "description",
        content: "Cadastre seu negócio ou organização na maior rede da comunidade latina em NZ.",
      },
      { property: "og:title", content: "Cadastrar — Latino Connect" },
      {
        property: "og:description",
        content: "Cadastre seu negócio ou organização na maior rede da comunidade latina em NZ.",
      },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/cadastro" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/cadastro" }],
  }),
  component: CadastroPage,
});

const NZ_PHONE_REGEX = /^(?:\+?64|0)[\s\-()]*\d(?:[\s\-()]*\d){7,11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<
  Record<"businessName" | "ownerName" | "email" | "whatsapp" | "password", string>
>;

function CadastroPage() {
  const { t } = useI18n();
  usePageMetadata("metadata.cadastro.title", "metadata.cadastro.description");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!businessName.trim()) errs.businessName = "Informe o nome do negócio.";
    else if (businessName.trim().length > 200) errs.businessName = "Máximo 200 caracteres.";
    if (!ownerName.trim()) errs.ownerName = "Informe seu nome.";
    else if (ownerName.trim().length > 200) errs.ownerName = "Máximo 200 caracteres.";
    if (!email.trim()) errs.email = "Informe seu e-mail.";
    else if (!EMAIL_REGEX.test(email.trim())) errs.email = "E-mail inválido.";
    if (!whatsapp.trim()) errs.whatsapp = "Informe seu WhatsApp.";
    else if (!NZ_PHONE_REGEX.test(whatsapp.trim()))
      errs.whatsapp = "Número NZ inválido (ex: +64 21 000 0000).";
    if (!password) errs.password = "Crie uma senha.";
    else if (password.length < 8) errs.password = "Mínimo 8 caracteres.";
    else if (password.length > 128) errs.password = "Máximo 128 caracteres.";
    return errs;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    const missingConsent = !consent;
    setConsentError(missingConsent ? "Você precisa aceitar para continuar." : null);
    if (Object.keys(errs).length > 0 || missingConsent) {
      const firstError = missingConsent
        ? "Aceite a Política de Privacidade e Termos de Uso."
        : Object.values(errs)[0]!;
      toast.error("Preencha todos os campos corretamente", {
        description: firstError,
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }
    setLoading(true);
    try {
      const res = await signUp({
        data: {
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          password,
          siteOrigin: window.location.origin,
        },
      });
      if (!res.ok) {
        toast.error("Não foi possível cadastrar", {
          description: res.error,
          icon: <AlertCircle className="h-4 w-4" />,
        });
        return;
      }
      setSent(email.trim());
      toast.success("E-mail de ativação enviado!", {
        description: `Enviamos um link para ${email.trim()}.`,
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    } catch (err) {
      toast.error("Erro inesperado", {
        description: err instanceof Error ? err.message : t("auth.unexpected_error"),
      });
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!sent) return;
    setResending(true);
    try {
      const res = await resendActivation({
        data: { email: sent, siteOrigin: window.location.origin },
      });
      if (!res.ok) {
        toast.error("Não foi possível reenviar", { description: res.error });
        return;
      }
      toast.success("Link reenviado!", {
        description: `Verifique a caixa de entrada de ${sent}.`,
      });
    } finally {
      setResending(false);
    }
  };

  if (sent) {
    return (
      <SiteShell>
        <section className="max-w-md mx-auto px-6 py-20">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-10 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-[#df991b]/15 flex items-center justify-center">
              <Mail className="h-8 w-8 text-[#df991b]" />
            </div>
            <h1 className="mt-6 text-2xl font-black text-white">Confirme seu e-mail</h1>
            <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
              Enviamos um link de ativação para{" "}
              <span className="font-bold text-white">{sent}</span>. Clique no botão dentro do
              e-mail para ativar sua conta e acessar seu painel.
            </p>
            <button
              type="button"
              onClick={onResend}
              disabled={resending}
              className="mt-6 text-sm font-bold text-[#df991b] underline disabled:opacity-50"
            >
              {resending ? "Reenviando..." : "Não recebi o e-mail — reenviar"}
            </button>
            <p className="mt-6 text-xs text-neutral-400">
              Já ativou?{" "}
              <Link to="/login" className="font-bold text-white underline">
                Faça login
              </Link>
            </p>
          </div>
        </section>
      </SiteShell>
    );
  }

  const inputClass = (key: keyof FieldErrors) =>
    `mt-1 w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#df991b]/40 ${
      fieldErrors[key]
        ? "border-red-400 focus:border-red-500"
        : "border-white/10 focus:border-gray-400"
    }`;

  return (
    <SiteShell>
      <section className="max-w-2xl mx-auto px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-wider text-[#facc15]">
          {t("register.badge")}
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-black text-white">
          {t("register.title")}
        </h1>
        <p className="mt-3 text-neutral-300">{t("register.subtitle")}</p>

        <div className="mt-10 bg-neutral-900 border border-white/10 rounded-3xl p-8">
          <GoogleAuthButton
            label={t("auth.google_signup")}
            onError={(m) => toast.error("Erro no Google", { description: m })}
          />
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-neutral-500">{t("auth.or")}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div>
              <label className="text-xs font-bold uppercase text-neutral-400">
                {t("register.business_name")}
              </label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inputClass("businessName")}
                aria-invalid={!!fieldErrors.businessName}
              />
              {fieldErrors.businessName && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {fieldErrors.businessName}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-neutral-400">
                {t("register.owner_name")}
              </label>
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className={inputClass("ownerName")}
                aria-invalid={!!fieldErrors.ownerName}
              />
              {fieldErrors.ownerName && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {fieldErrors.ownerName}
                </p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400">
                  {t("register.email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass("email")}
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {fieldErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-neutral-400">
                  {t("register.whatsapp")}
                </label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+64 21 000 0000"
                  className={inputClass("whatsapp")}
                  aria-invalid={!!fieldErrors.whatsapp}
                />
                {fieldErrors.whatsapp && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {fieldErrors.whatsapp}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-neutral-400">
                {t("register.password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass("password")}
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {fieldErrors.password}
                </p>
              )}
            </div>
            <div>
              <label
                className={`flex items-start gap-2 text-xs leading-snug cursor-pointer ${
                  consentError ? "text-red-600" : "text-neutral-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (e.target.checked) setConsentError(null);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-black"
                />
                <span>
                  Li e concordo com a{" "}
                  <Link to="/privacy" target="_blank" className="underline font-semibold">
                    Política de Privacidade
                  </Link>{" "}
                  e os{" "}
                  <Link to="/terms" target="_blank" className="underline font-semibold">
                    Termos de Uso
                  </Link>
                  . Meus dados serão tratados conforme o Privacy Act 2020 (NZ).
                </span>
              </label>
              {consentError && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {consentError}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="block w-full text-center bg-[#df991b] hover:bg-[#c4861a] disabled:opacity-60 text-black font-bold rounded-xl py-3 text-sm transition"
            >
              {loading ? "Enviando..." : t("register.submit")}
            </button>
            <p className="text-xs text-neutral-400 text-center">
              {t("register.has_account")}{" "}
              <Link to="/login" className="font-bold text-[#facc15]">
                {t("register.login_link")}
              </Link>
            </p>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}
