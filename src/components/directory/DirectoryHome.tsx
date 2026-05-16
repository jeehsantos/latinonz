import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Sparkles, ShieldCheck, Users } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { SearchBar, type SearchValue } from "@/components/directory/SearchBar";
import { BusinessCard } from "@/components/directory/BusinessCard";
import { CATEGORIES } from "@/lib/mock/categories";
import { getFeaturedBusinesses } from "@/lib/mock/businesses";

export function DirectoryHome() {
  const [search, setSearch] = useState<SearchValue>({ q: "", category: "", city: "" });
  const featured = getFeaturedBusinesses(8);

  return (
    <SiteShell>
      {/* Hero */}
      <section
        className="relative text-white overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at top, #1A5336 0%, #0F3D24 50%, #0A2A19 100%)",
        }}
      >
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm text-white text-[11px] font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-[0.18em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EFC64E]" />
            Conectando a comunidade latina na NZ
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
            Encontre <span className="text-[#EFC64E]">qualquer negócio</span>
            <br />
            latino na Nova Zelândia
          </h1>
          <p className="mt-6 text-base md:text-lg text-white/70 max-w-2xl mx-auto">
            Do bolo com gosto de casa e do tempero que dá saudade, até o fotógrafo do seu casamento, eventos e serviços
            profissionais.
            <br className="hidden md:block" />
            Encontre tudo o que a nossa comunidade constrói e celebra na Nova Zelândia, em um só lugar.
          </p>
          <div className="mt-10 max-w-4xl mx-auto">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 grid sm:grid-cols-3 gap-4 relative z-10">
        {[
          { icon: Users, value: "600+", label: "Negócios cadastrados" },
          { icon: ShieldCheck, value: "100%", label: "Verificados pela equipe" },
          { icon: Sparkles, value: "10", label: "Categorias principais" },
        ].map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#1A5336]/10 text-[#1A5336] flex items-center justify-center">
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Explore por categoria</h2>
            <p className="text-gray-500 mt-1">Tudo que você precisa, perto de você.</p>
          </div>
          <Link to="/directory" className="hidden sm:inline-flex text-sm font-bold text-[#1A5336] items-center gap-1">
            Ver tudo <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.slice(0, 10).map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.key}
                to="/directory"
                className="group bg-white border border-gray-200 hover:border-[#1A5336]/40 hover:shadow-md transition rounded-3xl p-5"
              >
                <div className={`w-11 h-11 rounded-2xl ${c.bg} ${c.color} flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                <p className="mt-4 font-extrabold text-gray-900 text-sm leading-tight group-hover:text-[#1A5336]">
                  {c.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">{c.count} negócios</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured businesses */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Em destaque</h2>
            <p className="text-gray-500 mt-1">Negócios populares na comunidade.</p>
          </div>
          <Link to="/directory" className="text-sm font-bold text-[#1A5336] inline-flex items-center gap-1">
            Ver mais <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#1A5336] to-[#0F3D24] text-white p-10 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-black">Tem um negócio latino em NZ?</h2>
          <p className="mt-3 text-white/80 max-w-xl mx-auto">
            Cadastre-se grátis e comece a receber clientes da comunidade hoje mesmo.
          </p>
          <Link to="/cadastro" className="inline-flex mt-6 bg-white text-[#1A5336] font-bold px-6 py-3 rounded-full">
            Cadastrar meu negócio
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
