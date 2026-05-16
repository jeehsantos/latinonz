import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, MapPin, MessageSquare, Send, CheckCircle2, Instagram, Facebook, Linkedin } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Latino Connect" },
      { name: "description", content: "Fale com a equipe Latino Connect — tire dúvidas sobre planos, parcerias e cadastro do seu negócio latino na Nova Zelândia." },
      { property: "og:title", content: "Contato — Latino Connect" },
      { property: "og:description", content: "Envie sua mensagem para a equipe Latino Connect e tire dúvidas sobre planos e parcerias na Nova Zelândia." },
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
  const [currentFlagIndex, setCurrentFlagIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ nome: "", email: "", assunto: "Geral", mensagem: "" });

  useEffect(() => {
    const t = setInterval(() => setCurrentFlagIndex((p) => (p + 1) % FLAGS.length), 3000);
    return () => clearInterval(t);
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
    setFormData({ nome: "", email: "", assunto: "Geral", mensagem: "" });
  };

  return (
    <SiteShell>
      <div className="relative pt-12 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-yellow-100/50 rounded-full blur-3xl -mr-64 -mt-32" />
        <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-emerald-50/50 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold tracking-wider uppercase">
              <span className="animate-pulse">●</span> Nossa Comunidade
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight">
              Fale com <br />
              <span className="relative">
                a gente
                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                  <path d="M1 5.5C40 2 120 2 199 5.5" stroke="#14532d" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
              Tem dúvidas, sugestões ou quer fazer uma parceria? Nossa equipe está pronta para conectar você com a comunidade latina.
            </p>

            <div className="space-y-6 pt-4">
              {[
                { Icon: Mail, title: "E-mail", text: "hello@latinoconnecthub.co.nz" },
                { Icon: MessageSquare, title: "WhatsApp", text: "Em breve disponível para suporte" },
                { Icon: MapPin, title: "Localização", text: "Auckland, Nova Zelândia" },
              ].map(({ Icon, title, text }) => (
                <div key={title} className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-[#14532d] group-hover:bg-[#14532d] group-hover:text-white transition-all">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{title}</h4>
                    <p className="text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-500 font-medium">
                  Junte-se a <span className="text-slate-900 font-bold">+500 latinos</span> na NZ
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-6 -right-6 z-20 bg-white p-3 rounded-2xl shadow-xl border border-slate-50 transform rotate-6 hover:rotate-0 transition-transform">
              <div className="flex flex-col items-center gap-1">
                <span className="text-4xl transition-all duration-700 ease-in-out transform scale-110">
                  {FLAGS[currentFlagIndex].emoji}
                </span>
                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                  {FLAGS[currentFlagIndex].name}
                </span>
              </div>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 border border-slate-100 relative z-10">
              {submitted ? (
                <div className="text-center py-12 space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Mensagem Enviada!</h2>
                    <p className="text-slate-500">Obrigado por entrar em contato. Responderemos em até 24 horas úteis.</p>
                  </div>
                  <button onClick={handleReset} className="text-[#14532d] font-bold text-sm hover:underline">
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Juan Silva"
                      className="w-full px-5 py-4 bg-neutral-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#14532d] outline-none transition-all placeholder:text-slate-300"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                    <input
                      required
                      type="email"
                      placeholder="juan@exemplo.com"
                      className="w-full px-5 py-4 bg-neutral-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#14532d] outline-none transition-all placeholder:text-slate-300"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Assunto</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Geral", "Suporte", "Parceria"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormData({ ...formData, assunto: opt })}
                          className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                            formData.assunto === opt
                              ? "bg-[#14532d] text-white border-[#14532d]"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mensagem</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Como podemos ajudar você hoje?"
                      className="w-full px-5 py-4 bg-neutral-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-[#14532d] outline-none transition-all resize-none placeholder:text-slate-300"
                      value={formData.mensagem}
                      onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                    />
                  </div>

                  <button
                    disabled={isSubmitting}
                    className="w-full bg-[#14532d] hover:bg-emerald-900 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-emerald-900/10 group"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Enviar Mensagem
                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="absolute -bottom-6 -left-6 grid grid-cols-4 gap-2 opacity-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-[#14532d] rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="bg-[#14532d] text-white py-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-bold">Unindo os latinos na Nova Zelândia</h2>
            <p className="text-emerald-100 max-w-md">
              Somos a maior plataforma de conexão para empresários e profissionais sul-americanos no Pacífico.
            </p>
          </div>
          <div className="flex gap-4">
            {[Instagram, Facebook, Linkedin].map((Icon, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full bg-emerald-800/50 flex items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors"
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
