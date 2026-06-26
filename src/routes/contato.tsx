import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Mail,
  MapPin,
  MessageSquare,
  Send,
  CheckCircle2,
  Instagram,
  Facebook,
  Linkedin,
} from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n, usePageMetadata } from "@/lib/i18n";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contact — Latino Connect" },
      {
        name: "description",
        content:
          "Contact the Latino Connect team — ask questions about packages, partnerships, and registration.",
      },
      { property: "og:title", content: "Contact — Latino Connect" },
      { property: "og:description", content: "Send your message to the Latino Connect team." },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/contato" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/contato" }],
  }),
  component: ContatoPage,
});

const FLAGS = [
  { name: "Argentina", emoji: "🇦🇷" },
  { name: "Bolivia", emoji: "🇧🇴" },
  { name: "Brasil", emoji: "🇧🇷" },
  { name: "Chile", emoji: "🇨🇱" },
  { name: "Colombia", emoji: "🇨🇴" },
  { name: "Costa Rica", emoji: "🇨🇷" },
  { name: "Cuba", emoji: "🇨🇺" },
  { name: "Ecuador", emoji: "🇪🇨" },
  { name: "El Salvador", emoji: "🇸🇻" },
  { name: "Guatemala", emoji: "🇬🇹" },
  { name: "Haiti", emoji: "🇭🇹" },
  { name: "Honduras", emoji: "🇭🇳" },
  { name: "México", emoji: "🇲🇽" },
  { name: "Nicarágua", emoji: "🇳🇮" },
  { name: "Panamá", emoji: "🇵🇦" },
  { name: "Paraguay", emoji: "🇵🇾" },
  { name: "Perú", emoji: "🇵🇪" },
  { name: "República Dominicana", emoji: "🇩🇴" },
  { name: "Uruguay", emoji: "🇺🇾" },
  { name: "Venezuela", emoji: "🇻🇪" },
];

function ContatoPage() {
  const { t } = useI18n();
  usePageMetadata("metadata.contato.title", "metadata.contato.description");
  const [currentFlagIndex, setCurrentFlagIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    assunto: t("contact.subject_general"),
    mensagem: "",
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentFlagIndex((p) => (p + 1) % FLAGS.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({ nome: "", email: "", assunto: t("contact.subject_general"), mensagem: "" });
  };

  const subjects = [
    t("contact.subject_general"),
    t("contact.subject_support"),
    t("contact.subject_partnership"),
  ];

  const contactItems = [
    { Icon: Mail, title: t("contact.email_label"), text: "hello@latinoconnecthub.co.nz" },
    { Icon: MessageSquare, title: t("contact.whatsapp_label"), text: t("contact.whatsapp_value") },
    { Icon: MapPin, title: t("contact.location_label"), text: t("contact.location_value") },
  ];

  return (
    <SiteShell>
      <div className="relative pt-12 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-[#df991b]/10 rounded-full blur-3xl -mr-64 -mt-32" />
        <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-[#df991b]/5/50 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#df991b]/10 text-[#df991b] rounded-full text-xs font-bold tracking-wider uppercase">
              <span className="animate-pulse">●</span> {t("contact.badge")}
            </div>

            <h1 className="text-3xl md:text-6xl font-black text-white leading-tight">
              {(() => {
                const words = t("contact.title").split(" ");
                const mid = Math.ceil(words.length / 2);
                const first = words.slice(0, mid).join(" ");
                const second = words.slice(mid).join(" ");
                return (
                  <>
                    <span className="block">{first}</span>
                    {second && (
                      <span className="inline-block relative">
                        {second}
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 200 12"
                          preserveAspectRatio="none"
                          className="absolute left-0 right-0 -bottom-3 w-full h-3"
                        >
                          <path
                            d="M2 8 Q 100 -2 198 8"
                            stroke="#df991b"
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                      </span>
                    )}
                  </>
                );
              })()}
            </h1>

            <p className="text-xl text-white/80 max-w-lg leading-relaxed">
              {t("contact.subtitle")}
            </p>

            <div className="space-y-6 pt-4" aria-label="Contact methods">
              <h2 className="sr-only">{t("contact.email_label")}</h2>
              {contactItems.map(({ Icon, title, text }) => (
                <div key={title} className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-neutral-900 rounded-2xl shadow-sm border border-white/10 flex items-center justify-center text-[#df991b] group-hover:bg-[#df991b] group-hover:text-black transition-all">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{title}</h3>
                    <p className="text-white/70">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden"
                    >
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`}
                        alt=""
                      />
                    </div>
                  ))}
                </div>
                <div className="text-sm text-white/60 font-medium">
                  {t("contact.community_label")}{" "}
                  <span className="text-white font-bold">{t("contact.community_count")}</span>{" "}
                  {t("contact.community_suffix")}
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute -top-6 -right-6 z-20 bg-neutral-900 p-3 rounded-2xl shadow-xl border border-slate-50 transform rotate-6 hover:rotate-0 transition-transform">
              <div className="flex flex-col items-center gap-1">
                <span className="text-4xl transition-all duration-700 ease-in-out transform scale-110">
                  {FLAGS[currentFlagIndex].emoji}
                </span>
                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                  {FLAGS[currentFlagIndex].name}
                </span>
              </div>
            </div>

            <div className="bg-neutral-900 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-black/40 border border-white/10 relative z-10">
              {submitted ? (
                <div className="text-center py-12 space-y-6">
                  <div className="w-20 h-20 bg-[#df991b]/10 rounded-full flex items-center justify-center mx-auto text-[#df991b] animate-bounce">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {t("contact.success_title")}
                    </h2>
                    <p className="text-slate-500">{t("contact.success_body")}</p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-[#df991b] font-bold text-sm hover:underline"
                  >
                    {t("contact.success_resend")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="contact-name" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t("contact.field_name")}
                    </label>
                    <input
                      id="contact-name"
                      required
                      type="text"
                      placeholder={t("contact.field_name_placeholder")}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-4 focus:ring-[#df991b]/20 focus:border-[#df991b] outline-none transition-all placeholder:text-neutral-400"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contact-email" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t("contact.field_email")}
                    </label>
                    <input
                      id="contact-email"
                      required
                      type="email"
                      placeholder={t("contact.field_email_placeholder")}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-4 focus:ring-[#df991b]/20 focus:border-[#df991b] outline-none transition-all placeholder:text-neutral-400"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block">
                      {t("contact.field_subject")}
                    </span>
                    <div role="radiogroup" aria-label={t("contact.field_subject")} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {subjects.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          role="radio"
                          aria-checked={formData.assunto === opt}
                          onClick={() => setFormData({ ...formData, assunto: opt })}
                          className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                            formData.assunto === opt
                              ? "bg-[#df991b] text-black border-[#df991b]"
                              : "bg-neutral-900 text-slate-500 border-white/10 hover:border-slate-300"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contact-message" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t("contact.field_message")}
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      placeholder={t("contact.field_message_placeholder")}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-4 focus:ring-[#df991b]/20 focus:border-[#df991b] outline-none transition-all resize-none placeholder:text-neutral-400"
                      value={formData.mensagem}
                      onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                    />
                  </div>

                  <button
                    disabled={isSubmitting}
                    className="w-full bg-[#df991b] hover:bg-yellow-300 text-black font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-[#df991b]/20 group"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {t("contact.submit")}
                        <Send
                          size={18}
                          className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                        />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="absolute -bottom-6 -left-6 grid grid-cols-4 gap-2 opacity-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-[#df991b] rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="bg-black text-white py-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-bold">{t("contact.cta_title")}</h2>
            <p className="text-white/70 max-w-md">{t("contact.cta_body")}</p>
          </div>
          <div className="flex gap-4">
            {[Instagram, Facebook, Linkedin].map((Icon, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
              >
                <Icon size={20} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
