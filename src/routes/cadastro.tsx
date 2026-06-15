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
      { title: "Sign Up — Latino Connect" },
      {
        name: "description",
        content:
          "Register your business or organisation in the largest network for the Latin community in NZ.",
      },
      { property: "og:title", content: "Sign Up — Latino Connect" },
      {
        property: "og:description",
        content:
          "Register your business or organisation in the largest network for the Latin community in NZ.",
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
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacyError, setConsentPrivacyError] = useState<string | null>(null);
  const [consentTermsError, setConsentTermsError] = useState<string | null>(null);
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
    const missingPrivacy = !consentPrivacy;
    const missingTerms = !consentTerms;
    setConsentPrivacyError(missingPrivacy ? t("register.consent_privacy_error_checkbox") : null);
    setConsentTermsError(missingTerms ? t("register.consent_terms_error_checkbox") : null);
    if (Object.keys(errs).length > 0 || missingPrivacy || missingTerms) {
      const firstError =
        missingPrivacy || missingTerms
          ? t("register.consent_error_toast")
          : Object.values(errs)[0]!;
      toast.error(t("toasts.validation_error"), {
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
        toast.error(t("toasts.registration_error"), {
          description: res.error,
          icon: <AlertCircle className="h-4 w-4" />,
        });
        return;
      }
      setSent(email.trim());
      toast.success(t("toasts.activation_email_sent"), {
        description: t("register.confirm_email_desc").replace("{email}", email.trim()),
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    } catch (err) {
      toast.error(t("toasts.unexpected_error"), {
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
        toast.error(t("toasts.resend_error"), { description: res.error });
        return;
      }
      toast.success(t("toasts.resend_success"), {
        description: t("register.confirm_email_desc").replace("{email}", sent),
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
            <h1 className="mt-6 text-2xl font-black text-white">
              {t("register.confirm_email_title")}
            </h1>
            <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
              {t("register.confirm_email_desc").split("{email}")[0]}
              <span className="font-bold text-white">{sent}</span>
              {t("register.confirm_email_desc").split("{email}")[1]}
            </p>
            <button
              type="button"
              onClick={onResend}
              disabled={resending}
              className="mt-6 text-sm font-bold text-[#df991b] underline disabled:opacity-50"
            >
              {resending ? t("register.resending_email") : t("register.resend_email_button")}
            </button>
            <p className="mt-6 text-xs text-neutral-400">
              {t("register.already_activated")}{" "}
              <Link to="/login" className="font-bold text-white underline">
                {t("register.login_link")}
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
      <section className="max-w-2xl mx-auto px-6 py-10 md:py-20">
        <p className="text-xs font-bold uppercase tracking-wider text-[#facc15]">
          {t("register.badge")}
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-black text-white">{t("register.title")}</h1>
        <p className="mt-3 text-neutral-300">{t("register.subtitle")}</p>

        <div className="mt-8 md:mt-10 bg-neutral-900 border border-white/10 rounded-3xl p-5 md:p-8">
          <GoogleAuthButton
            label={t("auth.google_signup")}
            onError={(m) => toast.error(t("toasts.google_error"), { description: m })}
          />
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-neutral-500">
              {t("auth.or")}
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div>
              <label
                htmlFor="reg-business-name"
                className="text-xs font-bold uppercase text-neutral-400"
              >
                {t("register.business_name")}
              </label>
              <input
                id="reg-business-name"
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
              <label
                htmlFor="reg-owner-name"
                className="text-xs font-bold uppercase text-neutral-400"
              >
                {t("register.owner_name")}
              </label>
              <input
                id="reg-owner-name"
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
                <label htmlFor="reg-email" className="text-xs font-bold uppercase text-neutral-400">
                  {t("register.email")}
                </label>
                <input
                  id="reg-email"
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
                <label
                  htmlFor="reg-whatsapp"
                  className="text-xs font-bold uppercase text-neutral-400"
                >
                  {t("register.whatsapp")}
                </label>
                <input
                  id="reg-whatsapp"
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
              <label
                htmlFor="reg-password"
                className="text-xs font-bold uppercase text-neutral-400"
              >
                {t("register.password")}
              </label>
              <input
                id="reg-password"
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
            <div className="space-y-4">
              <div>
                <label
                  className={`flex items-start gap-2 text-xs leading-snug cursor-pointer ${
                    consentPrivacyError ? "text-red-600" : "text-neutral-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={consentPrivacy}
                    onChange={(e) => {
                      setConsentPrivacy(e.target.checked);
                      if (e.target.checked) setConsentPrivacyError(null);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-black shrink-0"
                  />
                  <span>
                    {t("register.consent_privacy").split("{privacy_link}")[0]}
                    <Link to="/privacy" target="_blank" className="underline font-semibold">
                      {t("footer_legal.privacy")}
                    </Link>
                    {t("register.consent_privacy").split("{privacy_link}")[1]}
                  </span>
                </label>
                {consentPrivacyError && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {consentPrivacyError}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={`flex items-start gap-2 text-xs leading-snug cursor-pointer ${
                    consentTermsError ? "text-red-600" : "text-neutral-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={consentTerms}
                    onChange={(e) => {
                      setConsentTerms(e.target.checked);
                      if (e.target.checked) setConsentTermsError(null);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-black shrink-0"
                  />
                  <span>
                    {t("register.consent_terms").split("{terms_link}")[0]}
                    <Link to="/terms" target="_blank" className="underline font-semibold">
                      {t("footer_legal.terms")}
                    </Link>
                    {t("register.consent_terms").split("{terms_link}")[1]}
                  </span>
                </label>
                {consentTermsError && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {consentTermsError}
                  </p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="block w-full text-center bg-[#df991b] hover:bg-[#c4861a] disabled:opacity-60 text-black font-bold rounded-xl py-3 text-sm transition"
            >
              {loading ? t("register.resending_email") : t("register.submit")}
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
