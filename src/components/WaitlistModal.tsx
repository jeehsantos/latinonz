import { useState } from "react";
import { CheckCircle2, Lock, X, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { submitWaitlist } from "@/lib/waitlist.functions";
import { SERVICE_CATEGORIES } from "@/lib/categories";

interface WaitlistModalProps {
  onClose: () => void;
}

export function WaitlistModal({ onClose }: WaitlistModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    business_name: "",
    owner_name: "",
    whatsapp_number: "+64 ",
    email: "",
    service_category: "",
  });

  const submit = useServerFn(submitWaitlist);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await submit({ data: form });
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

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Nome do Negócio">
                <input
                  required
                  maxLength={200}
                  type="text"
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  className={inputCls}
                  placeholder="Ex: Sabor Latino Café"
                />
              </Field>
              <Field label="Nome do Responsável">
                <input
                  required
                  maxLength={200}
                  type="text"
                  value={form.owner_name}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                  className={inputCls}
                  placeholder="Seu nome completo"
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  required
                  type="tel"
                  maxLength={32}
                  value={form.whatsapp_number}
                  onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                  className={inputCls}
                  placeholder="+64 21 000 0000"
                />
              </Field>
              <Field label="E-mail">
                <input
                  required
                  type="email"
                  maxLength={320}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                  placeholder="seu@email.com"
                />
              </Field>
              <Field label="Categoria do Negócio">
                <select
                  required
                  value={form.service_category}
                  onChange={(e) => setForm({ ...form, service_category: e.target.value })}
                  className={inputCls}
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

              {error && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1A5336] hover:bg-[#123F27] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg mt-2 flex items-center justify-center gap-2"
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

const inputCls =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A5336] focus:ring-1 focus:ring-[#1A5336] transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
