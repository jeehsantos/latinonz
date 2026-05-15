import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Latino Connect" },
      { name: "description", content: "Fale com a equipe Latino Connect." },
      { property: "og:title", content: "Contato — Latino Connect" },
      { property: "og:description", content: "Envie sua mensagem para a equipe Latino Connect." },
    ],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  return (
    <SiteShell>
      <section className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1A5336]">Contato</p>
          <h1 className="mt-3 text-4xl font-black text-gray-900">Fale com a gente</h1>
          <p className="mt-4 text-gray-600">Tem dúvidas, sugestões ou parcerias? Envie sua mensagem.</p>
          <div className="mt-8 space-y-4 text-sm">
            <p className="flex items-center gap-3 text-gray-700"><Mail size={18} className="text-[#1A5336]" /> hello@latinoconnecthub.co.nz</p>
            <p className="flex items-center gap-3 text-gray-700"><MessageCircle size={18} className="text-[#1A5336]" /> WhatsApp em breve</p>
            <p className="flex items-center gap-3 text-gray-700"><MapPin size={18} className="text-[#1A5336]" /> Auckland, Nova Zelândia</p>
          </div>
        </div>
        <form className="bg-white border border-gray-200 rounded-3xl p-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Nome</label>
            <input className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">E-mail</label>
            <input type="email" className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Mensagem</label>
            <textarea rows={5} className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <button className="w-full bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl py-3 text-sm">Enviar</button>
        </form>
      </section>
    </SiteShell>
  );
}
