import { useState } from "react";
import { CheckCircle2, Lock, X, Loader2, AlertCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { submitWaitlist } from "@/lib/waitlist.functions";
import { SERVICE_CATEGORIES } from "@/lib/categories";

interface WaitlistModalProps {
  onClose: () => void;
}

type FormState = {
  business_name: string;
  owner_name: string;
  whatsapp_number: string;
  email: string;
  service_category: string;
  service_category_other: string;
};

export function WaitlistModal({ onClose }: WaitlistModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [form, setForm] = useState<FormState>({
    business_name: "",
    owner_name: "",
    whatsapp_number: "+64 ",
    email: "",
    service_category: "",
    service_category_other: "",
  });

  const submit = useServerFn(submitWaitlist);

  const isOther = form.service_category === "Outro";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const whatsappValid = form.whatsapp_number.replace(/\D/g, "").length >= 8;

  const errors = {
    business_name: !form.business_name.trim(),
    owner_name: !form.owner_name.trim(),
    whatsapp_number: !form.whatsapp_number.trim() || !whatsappValid,
    email: !form.email.trim() || !emailValid,
    service_category: !form.service_category,
    service_category_other: isOther && !form.service_category_other.trim(),
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setAttempted(true);
    setError(null);
    if (hasErrors) {
      setError("Preencha todos os campos corretamente.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        business_name: form.business_name.trim(),
        owner_name: form.owner_name.trim(),
        whatsapp_number: form.whatsapp_number.trim(),
        email: form.email.trim(),
        service_category: isOther
          ? form.service_category_other.trim()
          : form.service_category,
      };
      const res = await submit({ data: payload });
      if (res?.ok) {
        setStep("success");
      } else {
        setError(res?.error ?? "Não foi possível enviar. Verifique os dados.");
      }
    } catch (err) {
      console.error("waitlist submit error", err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Verifique os dados e tente novamente.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = () => {
    if (submitting) return;
    onClose();
  };

  const showErr = (key: keyof typeof errors) => attempted && errors[key];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleBackdropClick} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 fade-in duration-300">
        <Link
          to="/admin"
          aria-label="Acesso administrativo"
          className="absolute top-4 left-4 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <Lock size={16} />
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
        >
          <X size={20} />
        </button>

        {step === "form" ? (
          <div className="animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <div className="inline-block bg-[#EFC64E]/20 text-[#8a6a16] text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                Acesso Antecipado
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                Junte-se à Lista de Espera
              </h2>
              <p className="text-sm text-gray-500">
                Cadastre seu negócio para ser um dos primeiros a acessar a plataforma LatinoNZ.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              <Field label="Nome do Negócio" invalid={showErr("business_name")} message="Informe o nome do negócio.">
                <input
                  maxLength={200}
                  type="text"
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  className={inputCls(showErr("business_name"))}
                  placeholder="Ex: Sabor Latino Café"
                />
              </Field>
              <Field label="Nome do Responsável" invalid={showErr("owner_name")} message="Informe o nome do responsável.">
                <input
                  maxLength={200}
                  type="text"
                  value={form.owner_name}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                  className={inputCls(showErr("owner_name"))}
                  placeholder="Seu nome completo"
                />
              </Field>
              <Field label="WhatsApp" invalid={showErr("whatsapp_number")} message="Informe um número de WhatsApp válido.">
                <input
                  type="tel"
                  maxLength={32}
                  value={form.whatsapp_number}
                  onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                  className={inputCls(showErr("whatsapp_number"))}
                  placeholder="+64 21 000 0000"
                />
              </Field>
              <Field label="E-mail" invalid={showErr("email")} message="Informe um e-mail válido.">
                <input
                  type="email"
                  maxLength={320}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls(showErr("email"))}
                  placeholder="seu@email.com"
                />
              </Field>
              <Field label="Categoria do Negócio" invalid={showErr("service_category")} message="Selecione uma categoria.">
                <select
                  value={form.service_category}
                  onChange={(e) => setForm({ ...form, service_category: e.target.value })}
                  className={inputCls(showErr("service_category"))}
                >
                  <option value="" disabled>
                    Selecione uma categoria
                  </option>
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              {isOther && (
                <Field
                  label="Qual categoria?"
                  invalid={showErr("service_category_other")}
                  message="Descreva a categoria do seu negócio."
                >
                  <input
                    maxLength={100}
                    type="text"
                    value={form.service_category_other}
                    onChange={(e) =>
                      setForm({ ...form, service_category_other: e.target.value })
                    }
                    className={inputCls(showErr("service_category_other"))}
                    placeholder="Descreva sua categoria"
                    autoFocus
                  />
                </Field>
              )}

              {error && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1A5336] hover:bg-[#123F27] disabled:opacity-60 disabled:cursor-not-allowed disabled:animate-none text-white font-bold py-3.5 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2 animate-inflate"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Entrar para a Lista de Espera
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-8 animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-50 duration-500">
              <CheckCircle2 size={44} className="text-[#1A5336]" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Tudo certo!</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Seu negócio foi adicionado à nossa lista. Avisaremos via WhatsApp e e-mail assim que a
              plataforma for lançada!
            </p>
            <button
              onClick={onClose}
              className="text-[#1A5336] font-bold text-sm hover:underline"
            >
              Voltar para a página inicial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = (invalid?: boolean) =>
  [
    "w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm outline-none transition-all",
    invalid
      ? "border-red-400 ring-1 ring-red-200 bg-red-50/40 focus:border-red-500 focus:ring-red-300 animate-shake"
      : "border-gray-200 focus:border-[#1A5336] focus:ring-1 focus:ring-[#1A5336]",
  ].join(" ");

function Field({
  label,
  children,
  invalid,
  message,
}: {
  label: string;
  children: React.ReactNode;
  invalid?: boolean;
  message?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>
      {children}
      {invalid && message && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={12} />
          {message}
        </p>
      )}
    </div>
  );
}
